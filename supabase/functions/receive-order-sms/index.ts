// Supabase Edge Function — receive-order-sms
// The inbound leg of the Munchiz SMS ordering channel: Africa's Talking
// posts every SMS sent to your registered shortcode/virtual number here.
// This function is the ONLY place SMS orders are created, and it creates
// them into the exact same `orders` / `order_items` tables the website
// checkout writes to (CheckoutForm.tsx) — same pricing source (menu_items /
// zones), same status values, same admin/kitchen views. There is no
// second, separate ordering system.
//
// Setup:
//   1. supabase functions deploy receive-order-sms --no-verify-jwt
//      # Africa's Talking will not send a Supabase JWT, same reasoning as
//      # mpesa-stk-callback.
//   2. Reuses the AT_API_KEY / AT_ENV / AT_USERNAME / AT_SENDER_ID secrets
//      already set for send-order-sms. Set them if you haven't:
//        supabase secrets set AT_API_KEY=atsk_your_key_here
//        supabase secrets set AT_ENV=production AT_USERNAME=your_at_username   # production only
//        supabase secrets set AT_SENDER_ID=MUNCHIZ                            # optional
//   3. In the Africa's Talking dashboard, under SMS > Callback URLs, set
//      "Incoming Messages" to:
//        https://<project-ref>.supabase.co/functions/v1/receive-order-sms
//      Sandbox: https://account.africastalking.com/apps/sandbox/sms/inbox/callback
//      Two-way inbound SMS on a shared shortcode/sandbox is supported out of
//      the box; a dedicated shortcode/keyword requires an approved AT
//      application — see docs/SMS_INTEGRATION.md for the full checklist.
//
// Conversation model: one row per phone number in `sms_sessions` holds
// where the customer is in the ORDER flow (see SmsSessionState in
// database.types.ts). It is DB-backed (not in-memory) because Edge
// Functions are stateless between invocations. `sms_messages` is both the
// audit log and the idempotency guard — Africa's Talking retries webhook
// deliveries that don't ack fast enough, so every inbound message is
// deduped on its provider message id before anything else happens.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { normalizeKenyanPhone } from "../_shared/phone.ts";
import { sendSms } from "../_shared/at-client.ts";
import { priceLine, calculateTotals, formatKes, type PricedLine } from "../_shared/pricing.ts";
import { statusFriendlyLabel } from "../_shared/order-status.ts";
import {
  parseCommand,
  parseChoiceReply,
  matchMenuItem,
  type OrderLineRequest,
  type OrderLineError,
} from "../_shared/sms-parser.ts";

const BRAND = "Munchiz";
const CONTACT = "0728466665";
const SESSION_TTL_MINUTES = 15;
const MAX_LOCATION_ATTEMPTS = 3;
const MENU_PAGE_SIZE = 8;

// ------------------------------------------------------------------
// Types for what we read from / write to the shared Munchiz schema.
// ------------------------------------------------------------------

interface MenuItemRow {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

interface ZoneRow {
  id: string;
  name: string;
  delivery_fee: number;
  areas: string[];
  is_active: boolean;
}

interface BranchRow {
  id: string;
  name: string;
  is_active: boolean;
}

interface SessionDraft {
  name?: string;
  order_type?: "delivery" | "pickup";
  zone_id?: string;
  zone_name?: string;
  delivery_fee?: number;
  pickup_branch_id?: string;
  pickup_branch_name?: string;
  location_attempts?: number;
  branch_choices?: string[]; // ids, in the order they were presented
}

interface SessionRow {
  phone: string;
  state:
    | "idle"
    | "collecting_name"
    | "collecting_order_type"
    | "collecting_location"
    | "collecting_branch"
    | "confirming_order"
    | "completed"
    | "cancelled";
  cart: PricedLine[];
  draft: SessionDraft;
  last_message: string | null;
  expires_at: string;
}

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------

function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, 6)}***${phone.slice(-2)}` : "***";
}

function log(event: string, data: Record<string, unknown> = {}) {
  // Never log API keys/secrets, and mask phone numbers — this is a log
  // stream, not the audit-of-record (sms_messages holds the full number for
  // that, since STATUS/CANCEL ownership checks need it).
  const safe = { ...data };
  if (typeof safe.phone === "string") safe.phone = maskPhone(safe.phone);
  console.log(JSON.stringify({ event, ...safe, ts: new Date().toISOString() }));
}

function freshExpiry(): string {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60_000).toISOString();
}

function isExpired(session: { expires_at: string }): boolean {
  return new Date(session.expires_at).getTime() < Date.now();
}

function orderRef(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

function sanitizeFreeText(text: string, maxLen: number): string {
  return text.replace(/[^\p{L}\p{N}\s.,'-]/gu, "").trim().slice(0, maxLen);
}

async function loadSession(admin: SupabaseClient, phone: string): Promise<SessionRow> {
  const { data } = await admin.from("sms_sessions").select("*").eq("phone", phone).maybeSingle();
  if (!data || isExpired(data as any)) {
    return {
      phone,
      state: "idle",
      cart: [],
      draft: {},
      last_message: null,
      expires_at: freshExpiry(),
    };
  }
  return data as unknown as SessionRow;
}

async function saveSession(admin: SupabaseClient, session: SessionRow, text: string) {
  await admin.from("sms_sessions").upsert({
    phone: session.phone,
    state: session.state,
    cart: session.cart,
    draft: session.draft,
    last_message: text,
    expires_at: freshExpiry(),
  });
}

async function resetSession(admin: SupabaseClient, phone: string, state: SessionRow["state"] = "idle") {
  await admin.from("sms_sessions").upsert({
    phone,
    state,
    cart: [],
    draft: {},
    last_message: null,
    expires_at: freshExpiry(),
  });
}

async function logOutbound(
  admin: SupabaseClient,
  phone: string,
  message: string,
  relatedOrderId: string | null,
) {
  const result = await sendSms(`+${phone}`, message);
  await admin.from("sms_messages").insert({
    direction: "outbound",
    phone,
    message,
    status: result.ok ? "sent" : "failed",
    related_order_id: relatedOrderId,
    error_reason: result.ok ? null : (result.status ?? "unknown"),
    provider_message_id: result.messageId,
  });
  if (!result.ok) log("SMS_SEND_FAILED", { phone, status: result.status });
  else log("SMS_SENT", { phone, messageId: result.messageId });
  return result;
}

// ------------------------------------------------------------------
// Menu / zone / branch lookups (always DB truth — never trust the SMS body)
// ------------------------------------------------------------------

async function fetchAvailableMenuItems(admin: SupabaseClient): Promise<MenuItemRow[]> {
  const { data } = await admin
    .from("menu_items")
    .select("id, name, price, is_available")
    .eq("is_available", true)
    .order("sort_order");
  return (data || []) as MenuItemRow[];
}

async function fetchActiveZones(admin: SupabaseClient): Promise<ZoneRow[]> {
  const { data } = await admin
    .from("zones")
    .select("id, name, delivery_fee, areas, is_active")
    .eq("is_active", true);
  return (data || []) as ZoneRow[];
}

async function fetchActiveBranches(admin: SupabaseClient): Promise<BranchRow[]> {
  const { data } = await admin.from("branches").select("id, name, is_active").eq("is_active", true);
  return (data || []) as BranchRow[];
}

function matchZoneByLocation(location: string, zones: ZoneRow[]): ZoneRow | null {
  const q = location.toLowerCase().trim();
  if (!q) return null;
  const byArea = zones.filter((z) => z.areas.some((a) => a.toLowerCase().trim() === q));
  if (byArea.length === 1) return byArea[0];
  const byAreaContains = zones.filter((z) =>
    z.areas.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))
  );
  if (byAreaContains.length === 1) return byAreaContains[0];
  const byZoneName = zones.filter((z) => z.name.toLowerCase() === q);
  if (byZoneName.length === 1) return byZoneName[0];
  return null;
}

// ------------------------------------------------------------------
// Message builders — kept short for SMS length limits.
// ------------------------------------------------------------------

function buildMenuText(items: MenuItemRow[], page: number): string {
  const start = (page - 1) * MENU_PAGE_SIZE;
  const slice = items.slice(start, start + MENU_PAGE_SIZE);
  if (slice.length === 0) {
    return `${BRAND}: No more menu items. Reply ORDER <item> <qty> to order, or MENU to see page 1.`;
  }
  const lines = slice.map((m, i) => `${start + i + 1}. ${m.name} - KES ${formatKes(m.price)}`);
  const hasMore = start + MENU_PAGE_SIZE < items.length;
  const footer = hasMore
    ? `Reply MENU ${page + 1} for more, or ORDER <item> <qty> to order.`
    : `Reply ORDER <item> <qty> to order, e.g. ORDER ${slice[0].name} 1.`;
  return `${BRAND} Menu (${page}):\n${lines.join("\n")}\n${footer}`;
}

const HELP_TEXT =
  `${BRAND}: ORDER item qty - place order | MENU - view menu | ` +
  `STATUS ref - check order | CANCEL ref - cancel order | HELP - this message`;

function buildUnmatchedItemsText(unmatched: string[], ambiguous: string[]): string {
  const parts: string[] = [];
  if (unmatched.length) parts.push(`couldn't find: ${unmatched.join(", ")}`);
  if (ambiguous.length) parts.push(`too many matches for: ${ambiguous.join(", ")} — be more specific`);
  return `${BRAND}: We ${parts.join("; ")}. Reply MENU to see exact item names, then try ORDER again.`;
}

function buildLineErrorsText(errors: OrderLineError[]): string {
  const missing = errors.filter((e) => e.reason === "missing_quantity").map((e) => e.rawName);
  const invalid = errors.filter((e) => e.reason === "invalid_quantity").map((e) => e.rawName);
  const parts: string[] = [];
  if (missing.length) parts.push(`missing quantity for: ${missing.join(", ")}`);
  if (invalid.length) parts.push(`invalid quantity for: ${invalid.join(", ")}`);
  return `${BRAND}: We found a problem — ${parts.join("; ")}. Example: ORDER Burger 2. Reply MENU for item names.`;
}

function buildSummaryText(session: SessionRow): string {
  const lines = session.cart.map((l) => `${l.quantity}x ${l.item_name}`);
  const subtotal = session.cart.reduce((s, l) => s + l.subtotal, 0);
  const deliveryFee = session.draft.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;
  const destination = session.draft.order_type === "pickup"
    ? `Pickup: ${session.draft.pickup_branch_name}`
    : `Delivery: ${session.draft.zone_name}`;
  return (
    `${BRAND} ORDER\n${lines.join("\n")}\n` +
    `Subtotal: KES ${formatKes(subtotal)}\n` +
    (deliveryFee > 0 ? `Delivery: KES ${formatKes(deliveryFee)}\n` : "") +
    `Total: KES ${formatKes(total)}\n${destination}\n\nReply:\n1 - CONFIRM\n2 - CANCEL`
  );
}

// ------------------------------------------------------------------
// ORDER command: parse + match + price a fresh cart draft
// ------------------------------------------------------------------

interface BuildCartResult {
  cart: PricedLine[];
  unmatched: string[];
  ambiguous: string[];
  lineErrors: OrderLineError[];
}

function buildCartFromLines(lines: OrderLineRequest[], menu: MenuItemRow[]): BuildCartResult {
  const cart: PricedLine[] = [];
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  for (const line of lines) {
    const { matched, ambiguous: candidates } = matchMenuItem(line.rawName, menu);
    if (matched) {
      const item = menu.find((m) => m.id === matched.id)!;
      cart.push(priceLine(item, line.quantity));
    } else if (candidates.length > 0) {
      ambiguous.push(line.rawName);
    } else {
      unmatched.push(line.rawName);
    }
  }
  return { cart, unmatched, ambiguous, lineErrors: [] };
}

// ------------------------------------------------------------------
// Order creation — the one place SMS orders become real `orders` rows.
// Re-validates everything against fresh DB state at confirmation time
// (prices/availability may have drifted since the cart was first built).
// ------------------------------------------------------------------

async function createOrderFromSession(
  admin: SupabaseClient,
  phone: string,
  session: SessionRow,
  smsMessageRowId: string,
): Promise<{ ok: true; orderId: string; total: number } | { ok: false; reason: string }> {
  const menu = await fetchAvailableMenuItems(admin);
  const freshLines: PricedLine[] = [];
  for (const line of session.cart) {
    const current = menu.find((m) => m.id === line.menu_item_id);
    if (!current) return { ok: false, reason: `${line.item_name} is no longer available` };
    freshLines.push(priceLine(current, line.quantity));
  }
  if (freshLines.length === 0) return { ok: false, reason: "empty cart" };

  let deliveryFee = 0;
  if (session.draft.order_type === "delivery") {
    const zones = await fetchActiveZones(admin);
    const zone = zones.find((z) => z.id === session.draft.zone_id);
    if (!zone) return { ok: false, reason: "delivery zone no longer available" };
    deliveryFee = zone.delivery_fee;
  }

  const totals = calculateTotals(freshLines, deliveryFee);
  const itemsSummary = freshLines.map((l) => ({
    name: l.item_name,
    quantity: l.quantity,
    unit_price: l.unit_price,
    subtotal: l.subtotal,
  }));

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_name: session.draft.name || "SMS customer",
      customer_phone: phone,
      order_type: session.draft.order_type,
      delivery_address: session.draft.order_type === "delivery" ? session.draft.zone_name || null : null,
      pickup_branch_id: session.draft.order_type === "pickup" ? session.draft.pickup_branch_id : null,
      pickup_branch_name: session.draft.order_type === "pickup" ? session.draft.pickup_branch_name : null,
      zone_id: session.draft.order_type === "delivery" ? session.draft.zone_id : null,
      zone_name: session.draft.order_type === "delivery" ? session.draft.zone_name : null,
      items_summary: itemsSummary,
      subtotal: totals.subtotal,
      delivery_fee: totals.delivery_fee,
      total_amount: totals.total_amount,
      payment_method: "cash", // SMS orders default to pay-on-delivery/pickup; see docs
      payment_status: "pending",
      status: "pending",
      order_source: "sms",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    log("SMS_ORDER_CREATE_FAILED", { phone, error: orderError?.message });
    return { ok: false, reason: "order could not be saved" };
  }

  const orderItems = freshLines.map((l) => ({
    order_id: order.id,
    menu_item_id: l.menu_item_id,
    item_name: l.item_name,
    quantity: l.quantity,
    unit_price: l.unit_price,
    subtotal: l.subtotal,
  }));
  await admin.from("order_items").insert(orderItems);

  await admin.from("sms_messages").update({ related_order_id: order.id, status: "processed" }).eq(
    "id",
    smsMessageRowId,
  );

  log("SMS_ORDER_CREATED", { phone, orderId: order.id, total: totals.total_amount });
  return { ok: true, orderId: order.id, total: totals.total_amount };
}

// ------------------------------------------------------------------
// STATUS / CANCEL <ref> — order lookups scoped to the sender's own phone.
// ------------------------------------------------------------------

async function findOwnedOrderByRef(admin: SupabaseClient, phone: string, ref: string) {
  const { data } = await admin
    .from("orders")
    .select("id, status, total_amount, payment_status")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data || []).find((o: any) => orderRef(o.id) === ref) || null;
}

// ------------------------------------------------------------------
// Basic abuse guard: a phone spamming the webhook shouldn't be able to
// drive unbounded Africa's Talking spend (every reply we send costs
// money) or unbounded DB writes. No API-gateway-level rate limiting
// exists in front of Supabase Edge Functions, so this is enforced here
// against sms_messages itself.
// ------------------------------------------------------------------

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_MESSAGES = 10;

async function isRateLimited(admin: SupabaseClient, phone: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
  const { count } = await admin
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("direction", "inbound")
    .gte("created_at", since);
  return (count ?? 0) > RATE_LIMIT_MAX_MESSAGES;
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Africa's Talking expects a fast 200 ack; we always return one so it
  // never retries a message we've already handled (or partially handled).
  const ack = (extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ ok: true, ...extra }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return ack({ ignored: "method" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Africa's Talking posts inbound SMS as application/x-www-form-urlencoded
  // with fields: from, to, text, date, id, linkId, networkCode.
  let fields: Record<string, string>;
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      fields = await req.json();
    } else {
      const form = await req.formData();
      fields = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    log("SMS_WEBHOOK_ERROR", { reason: "invalid_payload" });
    return ack({ error: "invalid payload" });
  }

  const fromRaw = fields.from || fields.From || "";
  const textRaw = fields.text ?? fields.Text ?? "";
  const providerMessageId = fields.id || fields.Id || null;

  const phone = normalizeKenyanPhone(fromRaw);
  if (!phone) {
    log("SMS_WEBHOOK_ERROR", { reason: "invalid_phone", from: fromRaw });
    return ack({ error: "invalid phone" });
  }
  if (typeof textRaw !== "string" || textRaw.length === 0) {
    log("SMS_WEBHOOK_ERROR", { reason: "empty_text", phone });
    return ack({ error: "empty text" });
  }

  log("SMS_RECEIVED", { phone, providerMessageId });

  // --- Idempotency: record the inbound message first. If Africa's Talking
  // retries the same message id, this insert hits the unique index and we
  // ack without reprocessing — the single strongest guard against
  // duplicate orders from a retried webhook.
  const { data: inserted, error: insertErr } = await admin
    .from("sms_messages")
    .insert({
      direction: "inbound",
      phone,
      message: textRaw.slice(0, 1000),
      provider_message_id: providerMessageId,
      raw_payload: fields,
      status: "received",
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      log("SMS_ORDER_DUPLICATE", { phone, providerMessageId });
      return ack({ duplicate: true });
    }
    log("SMS_WEBHOOK_ERROR", { reason: "log_insert_failed", detail: insertErr.message });
    return ack({ error: "internal" });
  }
  const smsMessageRowId = inserted!.id as string;

  if (await isRateLimited(admin, phone)) {
    log("SMS_WEBHOOK_ERROR", { reason: "rate_limited", phone });
    await admin.from("sms_messages").update({ status: "invalid", error_reason: "rate_limited" }).eq(
      "id",
      smsMessageRowId,
    );
    // No reply sent — an attacker spamming the number shouldn't be able to
    // make Munchiz spend on outbound SMS in response.
    return ack({ rate_limited: true });
  }

  try {
    const session = await loadSession(admin, phone);
    const command = parseCommand(textRaw);

    // Global commands are honored in any state without disturbing an
    // in-progress order draft, except CANCEL with no ref (which cancels the
    // draft itself) and a bare numeric reply during a state that expects one.
    const numericReply = parseChoiceReply(textRaw);

    if (session.state === "confirming_order" && numericReply !== null) {
      if (numericReply === 1) {
        const result = await createOrderFromSession(admin, phone, session, smsMessageRowId);
        if (result.ok) {
          await resetSession(admin, phone, "completed");
          const ref = orderRef(result.orderId);
          const msg =
            `${BRAND}: Order #${ref} received. Total KES ${formatKes(result.total)}. ` +
            `We'll update you shortly. Reply STATUS ${ref} to check anytime.`;
          await logOutbound(admin, phone, msg, result.orderId);
        } else {
          await resetSession(admin, phone, "idle");
          await logOutbound(
            admin,
            phone,
            `${BRAND}: Sorry, we couldn't place that order (${result.reason}). Reply ORDER to try again.`,
            null,
          );
        }
      } else {
        await resetSession(admin, phone, "idle");
        await logOutbound(admin, phone, `${BRAND}: Order cancelled. Reply ORDER to start again.`, null);
      }
      await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
      return ack();
    }

    if (session.state === "collecting_order_type" && numericReply !== null) {
      if (numericReply === 1) {
        session.draft.order_type = "delivery";
        session.state = "collecting_location";
        session.draft.location_attempts = 0;
        await saveSession(admin, session, textRaw);
        await logOutbound(
          admin,
          phone,
          `${BRAND}: Please reply with your delivery area (e.g. Kasarani).`,
          null,
        );
      } else {
        const branches = await fetchActiveBranches(admin);
        if (branches.length === 0) {
          await resetSession(admin, phone, "idle");
          await logOutbound(admin, phone, `${BRAND}: Pickup isn't available right now. Reply ORDER to try delivery instead.`, null);
        } else if (branches.length === 1) {
          session.draft.order_type = "pickup";
          session.draft.pickup_branch_id = branches[0].id;
          session.draft.pickup_branch_name = branches[0].name;
          session.state = "confirming_order";
          await saveSession(admin, session, textRaw);
          await logOutbound(admin, phone, buildSummaryText(session), null);
        } else {
          session.draft.order_type = "pickup";
          session.draft.branch_choices = branches.map((b) => b.id);
          session.state = "collecting_branch";
          await saveSession(admin, session, textRaw);
          const list = branches.map((b, i) => `${i + 1}. ${b.name}`).join("\n");
          await logOutbound(admin, phone, `${BRAND}: Reply with a number for pickup location:\n${list}`, null);
        }
      }
      await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
      return ack();
    }

    if (session.state === "collecting_branch") {
      const choiceIdx = parseInt(textRaw.trim(), 10);
      const ids = session.draft.branch_choices || [];
      if (Number.isFinite(choiceIdx) && choiceIdx >= 1 && choiceIdx <= ids.length) {
        const branches = await fetchActiveBranches(admin);
        const branch = branches.find((b) => b.id === ids[choiceIdx - 1]);
        if (branch) {
          session.draft.pickup_branch_id = branch.id;
          session.draft.pickup_branch_name = branch.name;
          session.state = "confirming_order";
          await saveSession(admin, session, textRaw);
          await logOutbound(admin, phone, buildSummaryText(session), null);
          await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
          return ack();
        }
      }
      await logOutbound(admin, phone, `${BRAND}: Please reply with just the number of your pickup location.`, null);
      await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
      return ack();
    }

    if (session.state === "collecting_location" && command.type === "unknown") {
      const zones = await fetchActiveZones(admin);
      const zone = matchZoneByLocation(sanitizeFreeText(textRaw, 80), zones);
      if (zone) {
        session.draft.zone_id = zone.id;
        session.draft.zone_name = zone.name;
        session.draft.delivery_fee = zone.delivery_fee;
        session.state = "confirming_order";
        await saveSession(admin, session, textRaw);
        await logOutbound(admin, phone, buildSummaryText(session), null);
      } else {
        const attempts = (session.draft.location_attempts || 0) + 1;
        session.draft.location_attempts = attempts;
        if (attempts >= MAX_LOCATION_ATTEMPTS) {
          await resetSession(admin, phone, "idle");
          await logOutbound(
            admin,
            phone,
            `${BRAND}: We couldn't match that area. Please call ${CONTACT} or order on munchiz.ke instead.`,
            null,
          );
        } else {
          await saveSession(admin, session, textRaw);
          const areaList = zones.flatMap((z) => z.areas).slice(0, 12).join(", ");
          await logOutbound(
            admin,
            phone,
            `${BRAND}: We couldn't match that area. Try one of: ${areaList || "Kasarani, CBD, Westlands"}.`,
            null,
          );
        }
      }
      await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
      return ack();
    }

    if (session.state === "collecting_name" && command.type === "unknown") {
      const name = sanitizeFreeText(textRaw, 60);
      if (!name) {
        await logOutbound(admin, phone, `${BRAND}: Please reply with the name for your order.`, null);
        await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
        return ack();
      }
      session.draft.name = name;
      session.state = "collecting_order_type";
      await saveSession(admin, session, textRaw);
      await logOutbound(admin, phone, `${BRAND}: Thanks ${name}. Reply:\n1 - DELIVERY\n2 - PICKUP`, null);
      await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
      return ack();
    }

    // --- Global commands (available from any state) ---
    switch (command.type) {
      case "menu": {
        const menu = await fetchAvailableMenuItems(admin);
        await logOutbound(admin, phone, buildMenuText(menu, command.page), null);
        break;
      }

      case "help": {
        await logOutbound(admin, phone, HELP_TEXT, null);
        break;
      }

      case "status": {
        if (!command.ref) {
          await logOutbound(admin, phone, `${BRAND}: Reply STATUS <order ref>, e.g. STATUS MZ1234.`, null);
          break;
        }
        const order = await findOwnedOrderByRef(admin, phone, command.ref);
        log("SMS_STATUS_REQUESTED", { phone, ref: command.ref, found: !!order });
        if (!order) {
          await logOutbound(admin, phone, `${BRAND}: We couldn't find order #${command.ref} on this number.`, null);
        } else {
          await logOutbound(
            admin,
            phone,
            `${BRAND} order #${command.ref}:\nStatus: ${statusFriendlyLabel(order.status)}\nTotal: KES ${formatKes(order.total_amount)}`,
            order.id,
          );
        }
        break;
      }

      case "cancel": {
        if (!command.ref) {
          // Bare CANCEL with an in-progress draft cancels the draft itself.
          if (session.state !== "idle") {
            await resetSession(admin, phone, "idle");
            await logOutbound(admin, phone, `${BRAND}: Your in-progress order was cancelled. Reply ORDER to start again.`, null);
          } else {
            await logOutbound(admin, phone, `${BRAND}: Reply CANCEL <order ref> to cancel a placed order, e.g. CANCEL MZ1234.`, null);
          }
          break;
        }
        const order = await findOwnedOrderByRef(admin, phone, command.ref);
        if (!order) {
          await logOutbound(admin, phone, `${BRAND}: We couldn't find order #${command.ref} on this number.`, null);
        } else if (order.status !== "pending" && order.status !== "confirmed") {
          await logOutbound(
            admin,
            phone,
            `${BRAND}: Order #${command.ref} is already ${statusFriendlyLabel(order.status).toLowerCase()} and can no longer be cancelled. Call ${CONTACT} for help.`,
            order.id,
          );
        } else {
          await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
          await logOutbound(admin, phone, `${BRAND}: Order #${command.ref} has been cancelled.`, order.id);
        }
        break;
      }

      case "order": {
        const { lines, errors } = command.result;
        if (lines.length === 0 && errors.length === 0) {
          await logOutbound(
            admin,
            phone,
            `${BRAND}: Please tell us what to order, e.g. ORDER Cheesy Chicken Burger 2. Reply MENU to see items.`,
            null,
          );
          break;
        }
        if (errors.length > 0) {
          await logOutbound(admin, phone, buildLineErrorsText(errors), null);
          break;
        }
        const menu = await fetchAvailableMenuItems(admin);
        const built = buildCartFromLines(lines, menu);
        if (built.unmatched.length > 0 || built.ambiguous.length > 0) {
          await logOutbound(admin, phone, buildUnmatchedItemsText(built.unmatched, built.ambiguous), null);
          break;
        }
        // A new ORDER always starts a fresh draft — any prior in-progress
        // order for this phone (abandoned or otherwise) is discarded here.
        session.cart = built.cart;
        session.draft = {};
        session.state = "collecting_name";
        await saveSession(admin, session, textRaw);
        await logOutbound(admin, phone, `${BRAND}: Got it. What name should we put on the order?`, null);
        break;
      }

      case "unknown":
      default: {
        if (session.state !== "idle") {
          await logOutbound(
            admin,
            phone,
            `${BRAND}: We didn't understand that. ${session.last_message ? "" : ""}Reply HELP for options, or CANCEL to stop your current order.`,
            null,
          );
        } else {
          await logOutbound(admin, phone, `${BRAND}: We didn't understand that message. Reply HELP for available commands.`, null);
        }
        break;
      }
    }

    await admin.from("sms_messages").update({ status: "processed" }).eq("id", smsMessageRowId);
    return ack();
  } catch (err) {
    console.error("receive-order-sms: unhandled error", err);
    await admin
      .from("sms_messages")
      .update({ status: "invalid", error_reason: String(err).slice(0, 500) })
      .eq("id", smsMessageRowId);
    // Never send a false "order confirmed" message on an unexpected error —
    // just ack the webhook so AT doesn't retry-storm us, and log for review.
    return ack({ error: "internal" });
  }
});

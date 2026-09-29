// Supabase Edge Function — send-order-status-sms
// Sends a "your order is now X" SMS when an order's status changes, for
// BOTH web and SMS orders — this is a channel-agnostic order lifecycle
// notification, not part of the SMS *ordering* flow itself.
//
// Invoked (fire-and-forget, same pattern as send-order-sms at checkout)
// from AdminOrdersManager.tsx right after a status update succeeds.
//
// Setup:
//   supabase functions deploy send-order-status-sms
//   # Reuses the AT_API_KEY / AT_ENV / AT_USERNAME / AT_SENDER_ID secrets
//   # already configured for send-order-sms.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendSms } from "../_shared/at-client.ts";
import { buildStatusChangeMessage } from "../_shared/order-status.ts";
import { formatKes } from "../_shared/pricing.ts";
import { toE164 } from "../_shared/phone.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  if (!body?.order_id) return json(400, { error: "order_id is required" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Always read the CURRENT status/total from the DB — never trust
  // anything the caller says the status is, so this can't be used to send
  // a false "your order is ready" message.
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status, total_amount, customer_phone")
    .eq("id", body.order_id)
    .single();

  if (error || !order) return json(404, { error: "Order not found" });

  const to = toE164(order.customer_phone);
  if (!to) {
    console.error("send-order-status-sms: invalid stored phone", order.id);
    return json(200, { ok: false, reason: "invalid phone on file" });
  }

  const ref = String(order.id).slice(0, 8).toUpperCase();
  const message = buildStatusChangeMessage(ref, order.status, formatKes(order.total_amount));

  const result = await sendSms(to, message);

  await admin.from("sms_messages").insert({
    direction: "outbound",
    phone: to.replace("+", ""),
    message,
    status: result.ok ? "sent" : "failed",
    related_order_id: order.id,
    error_reason: result.ok ? null : (result.status ?? "unknown"),
    provider_message_id: result.messageId,
  });

  // Notification failure must never look like an application error to the
  // caller — the order/status change itself already succeeded.
  return json(200, { ok: result.ok, status: result.status });
});

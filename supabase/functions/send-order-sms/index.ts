// Supabase Edge Function — send-order-sms
// Sends an order confirmation SMS via Africa's Talking.
//
// Setup:
//   1. supabase functions deploy send-order-sms
//   2. supabase secrets set AT_API_KEY=atsk_your_key_here
//      # Defaults below suit the FREE Africa's Talking sandbox.
//      # In the sandbox, add the customer's number as a test contact at
//      # https://account.africastalking.com/apps/sandbox/sms/inbox or SMS
//      # will silently fail with "InvalidPhoneNumber".
//      # For production, override the env vars:
//      supabase secrets set AT_ENV=production AT_USERNAME=your_at_username
//      # Optional: register a sender id in the AT dashboard, then set:
//      supabase secrets set AT_SENDER_ID=MUNCHIZ
//
// Invoked from the browser via
//   supabase.functions.invoke("send-order-sms", { body: OrderPayload })
// after the order row + order_items rows are written.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface DrinkAddOn {
  name: string;
  quantity: number;
  subtotal: number;
}

interface OrderLine {
  name: string;
  quantity: number;
  subtotal: number;
  tomato_sachets?: number;
  drink_add_ons?: DrinkAddOn[];
}

interface OrderPayload {
  order_id: string;
  customer_name: string;
  customer_phone: string; // "2547..." or "+2547..."
  order_type: "delivery" | "pickup";
  items: OrderLine[];
  total_amount: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toE164(phone: string): string {
  const cleaned = String(phone || "").replace(/[\s-]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  return cleaned;
}

function summariseItems(items: OrderLine[]): string {
  const parts: string[] = [];
  for (const i of items) {
    parts.push(`${i.quantity}x ${i.name}`);
    if ((i.tomato_sachets || 0) > 0) parts.push(`+${i.tomato_sachets} tomato`);
    for (const d of i.drink_add_ons || []) parts.push(`+${d.quantity}x ${d.name}`);
  }
  return parts.join(", ");
}

function buildMessage(p: OrderPayload): string {
  const ref = p.order_id.slice(0, 8).toUpperCase();
  const summary = summariseItems(p.items);
  const type = p.order_type === "delivery" ? "delivery" : "pickup";
  // Africa's Talking counts SMS in 160-char parts. We're generous with a
  // ~320-char cap (2 parts). Trim gracefully if very long.
  const head = `Munchiz #${ref}: order received (${type}).`;
  const foot = `Total KES ${Number(p.total_amount || 0).toLocaleString()}. We'll call to confirm. — Munchiz 0728466665`;
  const room = 320 - head.length - foot.length - 4; // margins
  let body = ` ${summary}. `;
  if (body.length > room && room > 4) body = ` ${summary.slice(0, room - 4)}…. `;
  return `${head}${body}${foot}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("AT_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AT_API_KEY is not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const env = (Deno.env.get("AT_ENV") || "sandbox").toLowerCase();
  const username = Deno.env.get("AT_USERNAME") || (env === "production" ? "" : "sandbox");
  const senderId = Deno.env.get("AT_SENDER_ID") || "";
  if (env === "production" && !username) {
    return new Response(JSON.stringify({ error: "AT_USERNAME is required for production" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const host = env === "production"
    ? "https://api.africastalking.com"
    : "https://api.sandbox.africastalking.com";

  let payload: OrderPayload;
  try {
    payload = await req.json() as OrderPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!payload?.order_id || !payload?.customer_phone) {
    return new Response(JSON.stringify({ error: "order_id and customer_phone are required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const message = buildMessage(payload);
  const to = toE164(payload.customer_phone);

  const form = new URLSearchParams();
  form.set("username", username);
  form.set("to", to);
  form.set("message", message);
  if (senderId) form.set("from", senderId);

  const resp = await fetch(`${host}/version1/messaging`, {
    method: "POST",
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const body = await resp.json().catch(() => ({} as any));
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "Africa's Talking rejected the request", details: body }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const recipients = body?.SMSMessageData?.Recipients || [];
  const first = recipients[0] || {};
  const success = String(first.status || "").toLowerCase() === "success";

  return new Response(JSON.stringify({
    ok: success,
    env,
    to,
    status: first.status || null,
    message_id: first.messageId || null,
    cost: first.cost || null,
    raw: body,
  }), {
    status: success ? 200 : 502,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

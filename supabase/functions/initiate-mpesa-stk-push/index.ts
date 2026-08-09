// Supabase Edge Function — initiate-mpesa-stk-push
// Triggers a Safaricom Daraja STK Push (Lipa na M-Pesa Online) on the
// customer's phone, then records the CheckoutRequestID on the order.
//
// Setup:
//   supabase functions deploy initiate-mpesa-stk-push
//   supabase secrets set \
//     MPESA_CONSUMER_KEY=xxx \
//     MPESA_CONSUMER_SECRET=xxx
//   # Sandbox defaults below apply automatically if these are unset:
//   #   MPESA_ENV=sandbox
//   #   MPESA_SHORTCODE=174379
//   #   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
//   # For production, override:
//   supabase secrets set MPESA_ENV=production MPESA_SHORTCODE=<your paybill> MPESA_PASSKEY=<your passkey>
//   # Callback URL — defaults to <SUPABASE_URL>/functions/v1/mpesa-stk-callback
//   # Override if you want to point Safaricom elsewhere:
//   supabase secrets set MPESA_CALLBACK_URL=https://your.host/mpesa-stk-callback

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface Body {
  order_id: string;
  phone: string;   // Kenyan MSISDN, any format
  amount: number;  // KES, whole shillings
}

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

function toMsisdn(phone: string): string {
  const cleaned = String(phone || "").replace(/[\s+\-]/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) return `254${cleaned}`;
  return cleaned;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function base64(s: string): string {
  return btoa(s);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) {
    return json(500, { error: "MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET are not configured" });
  }

  const env = (Deno.env.get("MPESA_ENV") || "sandbox").toLowerCase();
  const shortcode = Deno.env.get("MPESA_SHORTCODE") || "174379";
  const passkey =
    Deno.env.get("MPESA_PASSKEY") ||
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const callbackUrl =
    Deno.env.get("MPESA_CALLBACK_URL") ||
    `${supabaseUrl}/functions/v1/mpesa-stk-callback`;

  const host =
    env === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  if (!body?.order_id || !body?.phone || !body?.amount) {
    return json(400, { error: "order_id, phone, and amount are required" });
  }
  const amount = Math.max(1, Math.round(Number(body.amount)));
  const msisdn = toMsisdn(body.phone);

  // 1) OAuth token
  const tokenResp = await fetch(`${host}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${base64(`${consumerKey}:${consumerSecret}`)}` },
  });
  const tokenBody = await tokenResp.json().catch(() => ({} as any));
  if (!tokenResp.ok || !tokenBody?.access_token) {
    return json(502, { error: "Daraja token request failed", details: tokenBody });
  }
  const accessToken: string = tokenBody.access_token;

  // 2) STK Push
  const ts = timestamp();
  const password = base64(`${shortcode}${passkey}${ts}`);
  const reference = body.order_id.slice(0, 8).toUpperCase();

  const stkResp = await fetch(`${host}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: Number(shortcode),
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: Number(msisdn),
      PartyB: Number(shortcode),
      PhoneNumber: Number(msisdn),
      CallBackURL: callbackUrl,
      AccountReference: `Munchiz-${reference}`,
      TransactionDesc: `Munchiz order #${reference}`,
    }),
  });
  const stkBody = await stkResp.json().catch(() => ({} as any));
  if (!stkResp.ok || stkBody?.ResponseCode !== "0") {
    return json(502, { error: "Daraja STK push failed", details: stkBody });
  }

  // 3) Save request ids on the order so the callback can find it.
  //    Use the service-role key so we can write regardless of RLS.
  const admin = createClient(supabaseUrl, serviceKey);
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      mpesa_checkout_request_id: stkBody.CheckoutRequestID,
      mpesa_merchant_request_id: stkBody.MerchantRequestID,
    })
    .eq("id", body.order_id);
  if (updateErr) {
    return json(500, {
      error: "STK push initiated but order update failed",
      details: updateErr.message,
      checkout_request_id: stkBody.CheckoutRequestID,
    });
  }

  return json(200, {
    ok: true,
    env,
    checkout_request_id: stkBody.CheckoutRequestID,
    merchant_request_id: stkBody.MerchantRequestID,
    customer_message: stkBody.CustomerMessage,
  });
});

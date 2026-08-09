// Supabase Edge Function — mpesa-stk-callback
// Receives Safaricom's STK Push callback and updates the corresponding
// order's payment_status + M-Pesa receipt fields.
//
// Deploy WITHOUT auth verification (Safaricom won't send a JWT):
//   supabase functions deploy mpesa-stk-callback --no-verify-jwt
//
// Full callback URL is:
//   https://<project-ref>.supabase.co/functions/v1/mpesa-stk-callback
// This is what initiate-mpesa-stk-push sends to Daraja by default.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface CallbackItem { Name: string; Value?: string | number }
interface StkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: { Item: CallbackItem[] };
}
interface CallbackBody { Body: { stkCallback: StkCallback } }

function pickItem(items: CallbackItem[], name: string): string | number | undefined {
  return items.find((i) => i.Name === name)?.Value;
}

Deno.serve(async (req: Request) => {
  // Safaricom expects a 200 OK even when we can't act on the payload.
  // We always return their canonical success shape.
  const ack = new Response(
    JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

  if (req.method !== "POST") return ack;

  let raw: CallbackBody;
  try {
    raw = (await req.json()) as CallbackBody;
  } catch {
    console.error("mpesa-stk-callback: invalid JSON body");
    return ack;
  }

  const cb = raw?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) {
    console.error("mpesa-stk-callback: missing stkCallback.CheckoutRequestID", raw);
    return ack;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const success = cb.ResultCode === 0;
  let receiptNumber: string | undefined;
  if (success && cb.CallbackMetadata?.Item) {
    const v = pickItem(cb.CallbackMetadata.Item, "MpesaReceiptNumber");
    if (typeof v === "string") receiptNumber = v;
  }

  const update: Record<string, unknown> = {
    payment_status: success ? "paid" : "failed",
    mpesa_result_desc: cb.ResultDesc || null,
  };
  if (receiptNumber) update.mpesa_receipt_number = receiptNumber;
  if (success) update.status = "confirmed";

  const { error } = await admin
    .from("orders")
    .update(update)
    .eq("mpesa_checkout_request_id", cb.CheckoutRequestID);

  if (error) {
    console.error("mpesa-stk-callback: order update failed", error.message, cb.CheckoutRequestID);
  }

  return ack;
});

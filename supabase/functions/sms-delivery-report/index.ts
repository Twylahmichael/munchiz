// Supabase Edge Function — sms-delivery-report
// Receives Africa's Talking's delivery report callback (sent/delivered/
// failed status for an SMS we sent) and updates the matching sms_messages
// row so admins can see what actually reached the customer's phone.
//
// Setup:
//   supabase functions deploy sms-delivery-report --no-verify-jwt
//   # Africa's Talking dashboard > SMS > Callback URLs > "Delivery Reports":
//   #   https://<project-ref>.supabase.co/functions/v1/sms-delivery-report
//
// This is optional — Munchiz works without it (outbound SMS success/failure
// is already recorded at send time in sms_messages.status). Delivery
// reports add a later "did it actually land on the handset" update.

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function mapAtStatus(atStatus: string): "sent" | "delivered" | "failed" {
  const s = (atStatus || "").toLowerCase();
  if (s === "success" || s === "delivered") return "delivered";
  if (s === "sent" || s === "submitted" || s === "buffered") return "sent";
  return "failed";
}

Deno.serve(async (req: Request) => {
  // Always ack 200 promptly — same reasoning as the M-Pesa and inbound-SMS
  // webhooks: the provider retries on anything else, and a report we can't
  // act on shouldn't turn into a retry storm.
  const ack = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  if (req.method !== "POST") return ack;

  let fields: Record<string, string>;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      fields = await req.json();
    } else {
      const form = await req.formData();
      fields = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    console.error("sms-delivery-report: invalid payload");
    return ack;
  }

  // Africa's Talking delivery report fields: id, status, phoneNumber,
  // networkCode, failureReason.
  const providerMessageId = fields.id || fields.messageId || null;
  const atStatus = fields.status || "";
  if (!providerMessageId) {
    console.error("sms-delivery-report: missing message id", fields);
    return ack;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const status = mapAtStatus(atStatus);
  const { error } = await admin
    .from("sms_messages")
    .update({
      status,
      error_reason: status === "failed" ? (fields.failureReason || atStatus || "delivery failed") : null,
    })
    .eq("provider_message_id", providerMessageId);

  if (error) {
    console.error("sms-delivery-report: update failed", error.message, providerMessageId);
  }

  return ack;
});

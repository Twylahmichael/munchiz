// Minimal Africa's Talking SMS client, shared by SMS Edge Functions.
//
// send-order-sms/index.ts (pre-existing) has its own inline copy of this
// call for outbound order-confirmation SMS; it is left untouched to avoid
// any risk to the working web checkout flow. This shared client is used by
// the new SMS-ordering functions (receive-order-sms) so *they* don't grow a
// third copy. Both talk to the same Africa's Talking account/credentials.
//
// Required secrets (same names as send-order-sms, set once):
//   supabase secrets set AT_API_KEY=atsk_...
//   # optional overrides:
//   supabase secrets set AT_ENV=production AT_USERNAME=your_at_username AT_SENDER_ID=MUNCHIZ

export interface SendSmsResult {
  ok: boolean;
  status: string | null;
  messageId: string | null;
  cost: string | null;
  raw: unknown;
}

export function atEnvironment(): "sandbox" | "production" {
  return (Deno.env.get("AT_ENV") || "sandbox").toLowerCase() === "production"
    ? "production"
    : "sandbox";
}

/**
 * Sends one SMS via Africa's Talking. Never throws — provider/network
 * failures are reported in the returned result so callers (order flows)
 * can log them without ever crashing or rolling back an order.
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const apiKey = Deno.env.get("AT_API_KEY");
  if (!apiKey) {
    return { ok: false, status: "config_error:AT_API_KEY missing", messageId: null, cost: null, raw: null };
  }

  const env = atEnvironment();
  const username = Deno.env.get("AT_USERNAME") || (env === "production" ? "" : "sandbox");
  const senderId = Deno.env.get("AT_SENDER_ID") || "";
  if (env === "production" && !username) {
    return { ok: false, status: "config_error:AT_USERNAME missing", messageId: null, cost: null, raw: null };
  }

  const host = env === "production"
    ? "https://api.africastalking.com"
    : "https://api.sandbox.africastalking.com";

  const form = new URLSearchParams();
  form.set("username", username);
  form.set("to", to);
  form.set("message", message);
  if (senderId) form.set("from", senderId);

  try {
    const resp = await fetch(`${host}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    // deno-lint-ignore no-explicit-any
    const body = await resp.json().catch(() => ({} as any));
    const recipients = body?.SMSMessageData?.Recipients || [];
    const first = recipients[0] || {};
    const success = resp.ok && String(first.status || "").toLowerCase() === "success";

    return {
      ok: success,
      status: first.status ?? (resp.ok ? null : `http_${resp.status}`),
      messageId: first.messageId ?? null,
      cost: first.cost ?? null,
      raw: body,
    };
  } catch (err) {
    // Network/DNS failure etc. Never let SMS delivery problems propagate.
    return { ok: false, status: "network_error", messageId: null, cost: null, raw: String(err) };
  }
}

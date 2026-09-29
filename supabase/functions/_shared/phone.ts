// Canonical Kenyan phone number utility, shared by every Edge Function that
// deals with SMS or M-Pesa numbers.
//
// Munchiz already had three slightly different, unshared implementations of
// this before the SMS integration (CheckoutForm.tsx, send-order-sms,
// initiate-mpesa-stk-push). This is the fourth-and-canonical one, used by
// the new SMS functions. It intentionally matches the "bare 254XXXXXXXXX,
// no plus" convention that orders.customer_phone is written in by
// CheckoutForm.tsx, so an SMS sender's number lines up with existing order
// rows without an extra conversion step.

const KENYA_MSISDN = /^254[17]\d{8}$/;

/**
 * Normalizes a Kenyan phone number to bare "254XXXXXXXXX" (no leading "+").
 * Accepts 07XXXXXXXX, 01XXXXXXXX, +254XXXXXXXXX, 254XXXXXXXXX, 00254XXXXXXXXX,
 * and bare 7XXXXXXXX / 1XXXXXXXX. Returns null if the result isn't a valid
 * Safaricom/Airtel-shaped Kenyan MSISDN (10 digits after 254, starting 7 or 1).
 */
export function normalizeKenyanPhone(input: string): string | null {
  let digits = String(input ?? "").trim().replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith("254")) {
    // already in canonical prefix form — fall through to validation below
  } else if (digits.startsWith("0")) {
    digits = `254${digits.slice(1)}`;
  } else if (/^[17]\d{8}$/.test(digits)) {
    digits = `254${digits}`;
  }

  return KENYA_MSISDN.test(digits) ? digits : null;
}

/** Same as normalizeKenyanPhone but returns E.164 with a leading "+", or null. */
export function toE164(input: string): string | null {
  const n = normalizeKenyanPhone(input);
  return n ? `+${n}` : null;
}

/** True if the input normalizes to a valid Kenyan MSISDN. */
export function isValidKenyanPhone(input: string): boolean {
  return normalizeKenyanPhone(input) !== null;
}

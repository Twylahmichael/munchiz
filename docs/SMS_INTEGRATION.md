# SMS Ordering (Africa's Talking)

Munchiz already used Africa's Talking to send order-confirmation SMS
(`supabase/functions/send-order-sms`). This adds the other direction:
customers can order, check status, and cancel **by texting Munchiz**, and
every SMS-originated order lands in the exact same `orders` table the
website checkout writes to — same admin dashboard, same kitchen board, same
pricing source. There is no second ordering system.

## Architecture

```
Customer phone
  │  SMS
  ▼
Africa's Talking
  │  webhook POST
  ▼
supabase/functions/receive-order-sms   (Deno Edge Function, service-role DB access)
  │
  ├─ supabase/functions/_shared/phone.ts        canonical Kenyan MSISDN normalization
  ├─ supabase/functions/_shared/sms-parser.ts   command parsing + menu-item matching (pure, unit-tested)
  ├─ supabase/functions/_shared/pricing.ts      quantity × DB price, delivery fee from `zones`
  ├─ supabase/functions/_shared/order-status.ts status → customer-friendly SMS copy
  ├─ supabase/functions/_shared/at-client.ts    Africa's Talking send call
  │
  ▼
public.orders / public.order_items   (order_source = 'sms')
  │
  ▼
Admin Orders (/admin/orders) & Kitchen (/admin/kitchen) — unchanged, just show an SMS badge
  │
  ▼
Africa's Talking SMS reply → customer phone
```

Conversation state (which step of a multi-message order a phone number is
on) lives in `public.sms_sessions`, one row per phone, because Edge
Functions are stateless between requests — nothing is held in memory.
Every inbound/outbound SMS is logged to `public.sms_messages`, which is
also how duplicate webhook deliveries are detected (see **Idempotency**
below) and how the **Admin → SMS Log** page gets its data.

Order lifecycle notifications (`send-order-status-sms`) are separate from
the ordering flow — they fire for **any** order (web or SMS) whenever an
admin changes its status in `/admin/orders`, using the same fire-and-forget
`supabase.functions.invoke(...)` pattern checkout already uses for
`send-order-sms`.

## What already existed vs. what's new

| | Before | After |
|---|---|---|
| Outbound order-confirmation SMS | `send-order-sms` (unchanged) | unchanged |
| Outbound status-change SMS | none | `send-order-status-sms` |
| Inbound SMS ordering | none | `receive-order-sms` |
| SMS delivery reports | none | `sms-delivery-report` (optional) |
| `orders.order_source` | did not exist (implicitly always "web") | `'web' \| 'sms' \| 'admin'`, defaults to `'web'` |
| `sms_messages`, `sms_sessions` tables | did not exist | new, see `supabase/migration-sms-orders.sql` |
| Admin "SMS" badge on orders | n/a | `AdminOrdersManager.tsx` |
| Admin SMS Log page | n/a | `/admin/sms-log` |

Nothing about the web checkout flow (`CheckoutForm.tsx`), M-Pesa
(`initiate-mpesa-stk-push` / `mpesa-stk-callback`), or existing order
statuses changed.

## Database changes

Run `supabase/migration-sms-orders.sql` (idempotent, safe to re-run) in the
Supabase SQL editor or via the CLI. It:

1. Adds `orders.order_source text not null default 'web'` (+ check
   constraint `web|sms|admin`). Existing rows are unaffected — they all
   default to `'web'`, which is correct (they were).
2. Creates `sms_messages` — the audit trail + the idempotency key
   (`provider_message_id`, unique where not null).
3. Creates `sms_sessions` — one row per phone, holding the in-progress SMS
   order draft, with a 15-minute rolling expiry.
4. Enables RLS on both new tables with an admin-only `select` policy (same
   posture as `orders`). All writes come from Edge Functions using the
   service-role key, which bypasses RLS — no public insert/update policy is
   needed or added.

`src/lib/database.types.ts` was updated to match (new `OrderSource`,
`SmsMessage`, `SmsSession` types, and `order_source` added to the `orders`
Row/Insert/Update shapes).

## Environment variables

All SMS secrets are **Supabase Edge Function secrets** (server-side only —
never exposed to the browser), set via `supabase secrets set`. They are
shared across all four SMS functions; you likely already have most of them
from `send-order-sms`:

| Variable | Required | Notes |
|---|---|---|
| `AT_API_KEY` | yes | Africa's Talking API key |
| `AT_ENV` | no (default `sandbox`) | `sandbox` or `production` |
| `AT_USERNAME` | required in production | defaults to `sandbox` in sandbox mode |
| `AT_SENDER_ID` | no | registered short code / alphanumeric sender ID |

```bash
supabase secrets set AT_API_KEY=atsk_your_key_here
# Production only:
supabase secrets set AT_ENV=production AT_USERNAME=your_at_username AT_SENDER_ID=MUNCHIZ
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into every
Edge Function by Supabase — nothing to configure there.

## Deploying the functions

```bash
supabase functions deploy receive-order-sms --no-verify-jwt
supabase functions deploy send-order-status-sms
supabase functions deploy sms-delivery-report --no-verify-jwt   # optional
```

`--no-verify-jwt` is required on the two functions Africa's Talking calls
directly (`receive-order-sms`, `sms-delivery-report`) — AT does not send a
Supabase JWT, the same reasoning `mpesa-stk-callback` already documents.
`send-order-status-sms` is invoked from the logged-in admin's browser
session, so it keeps normal JWT verification.

## Africa's Talking dashboard setup

1. Log in to Africa's Talking (sandbox: https://account.africastalking.com,
   or your production org).
2. **Sandbox**: SMS → Inbox → Callback URL. Set it to:
   `https://<project-ref>.supabase.co/functions/v1/receive-order-sms`
   Also add your test phone number as a sandbox contact
   (https://account.africastalking.com/apps/sandbox/sms/inbox) — the
   sandbox will otherwise silently reject SMS to numbers it doesn't know
   about, same caveat `send-order-sms`'s header comment already calls out.
3. **Production**: SMS → Callback URLs (or SMS → your dedicated
   application) → "Incoming Messages" URL, same path:
   `https://<project-ref>.supabase.co/functions/v1/receive-order-sms`
   Optionally set "Delivery Reports" to:
   `https://<project-ref>.supabase.co/functions/v1/sms-delivery-report`
4. **Two-way SMS on production requires either**: a shared shortcode (free,
   shared with other AT customers, keyword-routed) or a dedicated
   shortcode/sender ID (paid, requires an approved application with Africa's
   Talking — this is not automatic and can take days). A registered
   alphanumeric Sender ID (e.g. `MUNCHIZ`) is for **outbound** SMS only and
   does not by itself enable inbound — don't assume it does.
5. Test with a real Kenyan phone: text `MENU` to your configured
   number/shortcode, confirm you get a reply, then check **Admin → SMS
   Log** and **Admin → Orders** in the dashboard.

## SMS commands

```
ORDER <item> <qty>[, <item> <qty>...]   Start an order, e.g.
                                         ORDER Cheesy Chicken Burger 2, Chicken Combo 1
MENU [page]                             View available items (paginated)
STATUS <ref>                            Check an order you placed, e.g. STATUS MZ1234
CANCEL <ref>                            Cancel a placed order (only while pending/confirmed)
CANCEL                                  Cancel an order you're still composing
HELP                                    List commands
```

After `ORDER`, Munchiz asks (one message at a time): the name for the
order, delivery vs. pickup, then delivery area or pickup branch, then a
final summary with **1 CONFIRM / 2 CONFIRM** — only explicit `1`/`CONFIRM`
or `2`/`CANCEL` are accepted at that step; casual replies like "yes" or
"ok" are intentionally not interpreted as confirmation.

**Design decision — payment**: SMS orders are created with
`payment_method: "cash"` (pay on delivery/pickup). M-Pesa STK Push requires
its own confirmation round-trip (`initiate-mpesa-stk-push` /
`mpesa-stk-callback`) that's already fire-and-forget from a *logged-in
browser session*; wiring it into the SMS conversation would need another
multi-message state and was left out of this first pass to keep the SMS
flow short and reliable on basic phones. It can be added as a
`collecting_payment` session state later, re-using the same Edge Functions.
A customer texting "PAID" is never treated as proof of payment anywhere in
this flow.

## Idempotency / duplicate protection

1. Every inbound SMS is inserted into `sms_messages` keyed by Africa's
   Talking's `id` field **before** any processing happens. The column has a
   unique index (`sms_messages_provider_message_id_idx`); a retried webhook
   hits that constraint, the insert fails with Postgres error `23505`, and
   the function acks without reprocessing. This is the primary guard
   against a retried webhook creating two orders.
2. A confirmed order is only ever created from `state = 'confirming_order'`;
   right after creation the session is reset to `idle`/`completed`, so even
   if the dedup above were somehow bypassed, a second "1 CONFIRM" for the
   same phone would find no cart to confirm.
3. `receive-order-sms` and `sms-delivery-report` both always return HTTP
   200, even on internal errors — so Africa's Talking never retries a
   message we've already recorded, and a processing bug can't turn into a
   retry storm.

## Security notes

- All Africa's Talking secrets are Edge Function secrets — never sent to
  the browser, never logged.
- `receive-order-sms` treats every field of the inbound payload as
  untrusted: phone numbers are normalized and validated
  (`normalizeKenyanPhone`), message length is capped, and the command
  parser never throws on malformed/garbled/emoji input (see
  `_shared/__tests__/sms-parser.test.ts`).
- **Prices always come from the database.** The SMS parser only ever
  extracts a product *name* and *quantity* from the customer's text — never
  a price — and `createOrderFromSession` re-reads menu item prices and the
  delivery zone fee fresh from the database at confirmation time (not from
  whatever was cached when the cart was first built), so a stale or
  tampered client-side value can never become the charged amount.
- `STATUS`/`CANCEL <ref>` look up orders by `customer_phone = <sender's own
  number>` — a phone number can only see or cancel its own orders, never
  another customer's, regardless of what order ref is guessed/typed.
- `CANCEL <ref>` only works while the order is `pending` or `confirmed` —
  once the kitchen has started preparing it, self-service cancellation is
  blocked and the customer is told to call in.
- Order creation/cancellation writes use the Supabase **service-role** key
  inside the Edge Function (server-side only), the same pattern already
  used by `mpesa-stk-callback` — this is required because an inbound SMS
  has no Supabase Auth session to authorize against.
- A "PAID" SMS is never treated as payment confirmation — payment status is
  untouched by anything in the SMS flow; only the existing M-Pesa callback
  can mark an order `paid`.

## Troubleshooting

- **Webhook not receiving messages**: confirm the callback URL in the
  Africa's Talking dashboard exactly matches the deployed function URL, and
  that `receive-order-sms` was deployed with `--no-verify-jwt` (otherwise
  Supabase rejects the unauthenticated POST before your code ever runs).
  In sandbox, confirm the sending number is added as a sandbox test
  contact.
- **SMS not sending (outbound)**: check `AT_API_KEY` is set
  (`supabase secrets list`), and check **Admin → SMS Log** for the
  `error_reason` on the failed row — it echoes Africa's Talking's own
  status string (e.g. `InvalidPhoneNumber`, `UserInBlacklist`,
  `InsufficientBalance`).
- **Duplicate orders**: shouldn't happen — see **Idempotency** above. If
  you do see one, check whether the two `orders` rows share a
  `sms_messages.related_order_id`; if they don't, they were two genuinely
  different confirmations (e.g. the customer re-ordered), not a dedup bug.
- **Invalid phone number errors**: `_shared/phone.ts` only accepts
  Safaricom/Airtel-shaped Kenyan MSISDNs (`07...`, `01...`, `+2547...`,
  `+2541...`). Other formats are rejected by design, not silently
  mangled.
- **API authentication errors from Africa's Talking**: usually
  `AT_USERNAME` mismatched with `AT_ENV` (production requires your real AT
  username, not `sandbox`) — see the setup comment at the top of
  `send-order-sms/index.ts` / `receive-order-sms/index.ts`.
- **Provider timeout / network errors**: `_shared/at-client.ts` never
  throws — a timeout or DNS failure is returned as
  `{ ok: false, status: "network_error" }` and logged to `sms_messages`
  with `status: "failed"`, without ever crashing the function or leaving an
  order in a bad state.
- **Database errors during order creation**: the SMS session is reset to
  `idle` and the customer is told the order could not be placed — Munchiz
  never sends a false "order confirmed" SMS when the `orders` insert
  itself failed.

## Testing

Pure logic (phone normalization, command parsing, menu matching, pricing)
is covered by Deno's built-in test runner — no new dependency, matching
the fact the rest of this app has no existing test setup to follow:

```bash
deno test supabase/functions/_shared/__tests__/
```

42 tests, covering: all phone formats from the spec (`0712...`, `0112...`,
`+254712...`, `254712...`, `00254712...`, invalid numbers), ORDER parsing
(single/multi item, extra whitespace, zero/negative/missing quantity,
unknown command, unsupported characters, very long messages), the
explicit-only confirm/cancel reply rule (casual "yes"/"sure" rejected), and
menu-item matching (exact, unique-prefix, and the ambiguous case that must
never guess between multiple plausible products).

There is no way to exercise the live webhook end-to-end without a deployed
Supabase project and Africa's Talking credentials — that part needs manual
testing against the sandbox once deployed (see **Africa's Talking
dashboard setup** above).

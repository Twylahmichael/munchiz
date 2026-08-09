-- ============================================================
-- Munchiz — M-Pesa Daraja STK Push wiring
-- Adds columns for tracking a Safaricom STK Push transaction
-- on each order. Idempotent. Safe to re-run.
-- ============================================================

alter table public.orders
  add column if not exists mpesa_checkout_request_id text,
  add column if not exists mpesa_merchant_request_id text,
  add column if not exists mpesa_receipt_number text,
  add column if not exists mpesa_result_desc text;

create index if not exists orders_mpesa_checkout_request_id_idx
  on public.orders (mpesa_checkout_request_id);

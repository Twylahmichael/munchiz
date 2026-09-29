-- ============================================================
-- Munchiz — Africa's Talking SMS ordering channel
-- Adds:
--   1. orders.order_source — which channel created the order (web/sms/admin)
--   2. sms_messages — audit log of every inbound/outbound SMS, and the
--      dedup key that stops Africa's Talking webhook retries from
--      creating duplicate orders
--   3. sms_sessions — one row per customer phone number, holding the
--      in-progress SMS ordering conversation (cart, step, expiry)
-- Idempotent. Safe to re-run. Does not touch or remove existing data.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Order source / channel
-- ------------------------------------------------------------

alter table public.orders
  add column if not exists order_source text not null default 'web';

-- Backfill is a no-op (default already applies to existing rows), but the
-- check constraint is added separately so `add column ... default` above
-- never fails against existing rows even if constraint syntax changes.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_order_source_check'
  ) then
    alter table public.orders
      add constraint orders_order_source_check
      check (order_source in ('web', 'sms', 'admin'));
  end if;
end $$;

create index if not exists orders_order_source_idx on public.orders (order_source);

-- ------------------------------------------------------------
-- 2. sms_messages — audit trail + idempotency
-- ------------------------------------------------------------

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'africastalking',
  provider_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  phone text not null,
  message text not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'invalid', 'sent', 'delivered', 'failed')),
  related_order_id uuid references public.orders(id) on delete set null,
  error_reason text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- Provider message ids are the primary dedup key: Africa's Talking retries
-- webhook deliveries, and this stops the same inbound SMS being processed
-- twice (and therefore stops duplicate orders from a retried confirmation).
create unique index if not exists sms_messages_provider_message_id_idx
  on public.sms_messages (provider_message_id)
  where provider_message_id is not null;

create index if not exists sms_messages_phone_idx on public.sms_messages (phone);
create index if not exists sms_messages_related_order_idx on public.sms_messages (related_order_id);
create index if not exists sms_messages_created_at_idx on public.sms_messages (created_at desc);

-- ------------------------------------------------------------
-- 3. sms_sessions — one active conversation per phone number
-- ------------------------------------------------------------

create table if not exists public.sms_sessions (
  phone text primary key,
  state text not null default 'idle' check (state in (
    'idle',
    'collecting_name',
    'collecting_order_type',
    'collecting_location',
    'collecting_branch',
    'confirming_order',
    'completed',
    'cancelled'
  )),
  cart jsonb not null default '[]'::jsonb,
  draft jsonb not null default '{}'::jsonb,
  last_message text,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sms_sessions_expires_at_idx on public.sms_sessions (expires_at);

drop trigger if exists set_updated_at_sms_sessions on public.sms_sessions;
create trigger set_updated_at_sms_sessions before update on public.sms_sessions
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 4. RLS — same posture as orders: no public access, admin can read.
--    All writes happen from the receive-order-sms Edge Function using the
--    service-role key, which bypasses RLS entirely (same pattern as
--    mpesa-stk-callback writing to orders).
-- ------------------------------------------------------------

alter table public.sms_messages enable row level security;
alter table public.sms_sessions enable row level security;

drop policy if exists "sms_messages_admin_select" on public.sms_messages;
create policy "sms_messages_admin_select" on public.sms_messages
  for select using (public.is_admin());

drop policy if exists "sms_sessions_admin_select" on public.sms_sessions;
create policy "sms_sessions_admin_select" on public.sms_sessions
  for select using (public.is_admin());

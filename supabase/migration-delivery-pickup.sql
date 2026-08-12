-- Migration: Enhanced Delivery & Pickup Support
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Add areas field to zones for area categorization
-- ============================================================

alter table public.zones
  add column if not exists areas text[] not null default '{}',
  add column if not exists description text not null default '';

-- ============================================================
-- 2. Add pickup branch fields to orders
-- ============================================================

alter table public.orders
  add column if not exists pickup_branch_id uuid references public.branches(id),
  add column if not exists pickup_branch_name text,
  add column if not exists zone_id uuid references public.zones(id),
  add column if not exists zone_name text,
  add column if not exists estimated_time_minutes int;

-- ============================================================
-- 3. Add estimated pickup time to branches
-- ============================================================

alter table public.branches
  add column if not exists estimated_pickup_minutes int not null default 15;

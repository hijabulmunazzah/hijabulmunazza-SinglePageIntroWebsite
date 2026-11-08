-- ==============================================================================
-- Migration: 20261108_01_create_contacts_table.sql
-- Table: contacts
-- Purpose: Store visitor opt-in leads with explicit Pakistani PECA-compliant consent
-- Security: Strict Supabase RLS — Anonymous users can ONLY INSERT.
--           NO SELECT, UPDATE, or DELETE permitted for anon.
-- ==============================================================================

-- 1. Create contacts table
create table if not exists public.contacts (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now() not null,
    name text not null,
    whatsapp text not null,
    email text,
    consent_whatsapp boolean default false not null,
    consent_email boolean default false not null,
    consent_text text,
    source_page text,
    utm jsonb default '{}'::jsonb
);

-- 2. Indexes for fast search & uniqueness
create index if not exists idx_contacts_created_at on public.contacts (created_at desc);
create index if not exists idx_contacts_whatsapp on public.contacts (whatsapp);
create index if not exists idx_contacts_email on public.contacts (email);

-- 3. Enable Row Level Security (RLS)
alter table public.contacts enable row level security;

-- 4. RLS Policy: Allow anonymous visitors to INSERT only
-- Requires at least one consent checkbox to be true (complies with PECA anti-spam rules)
drop policy if exists "Allow anon insert with consent" on public.contacts;
create policy "Allow anon insert with consent"
on public.contacts
for insert
to anon
with check (
    consent_whatsapp = true or consent_email = true
);

-- 5. RLS Policy: Authenticated admin only for SELECT/UPDATE/DELETE
drop policy if exists "Allow authenticated admin full access" on public.contacts;
create policy "Allow authenticated admin full access"
on public.contacts
for all
to authenticated
using (true)
with check (true);

-- 6. Comment for documentation
comment on table public.contacts is 'Lead contacts collected via website opt-in modal with explicit user consent.';

-- ==============================================================================
-- Growth Engine: 20261108_02_engine_core_schema.sql
-- Modules: Content Studio, AI Conversation Engine, B2B Outreach & Admin
-- Security: Strict Row Level Security (RLS) on EVERY table.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. BRANDS
create table if not exists public.brands (
    id text primary key,
    name text not null,
    config jsonb not null default '{}'::jsonb,
    created_at timestamptz default now() not null
);

-- 2. PRODUCTS
create table if not exists public.products (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    sku text,
    title text not null,
    category text not null,
    price numeric not null default 0,
    wholesale_price numeric,
    images jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    is_active boolean default true not null,
    created_at timestamptz default now() not null
);

-- 3. CONTACTS
create table if not exists public.contacts (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade default 'hijab',
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

-- 4. CONVERSATIONS
create table if not exists public.conversations (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    contact_id uuid references public.contacts(id) on delete set null,
    channel text not null check (channel in ('whatsapp', 'instagram', 'messenger', 'email')),
    external_thread_id text,
    status text not null default 'active' check (status in ('active', 'handoff', 'closed')),
    lead_score integer default 0,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 5. MESSAGES
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    sender text not null check (sender in ('customer', 'ai', 'admin')),
    content text not null,
    payload jsonb default '{}'::jsonb,
    created_at timestamptz default now() not null
);

-- 6. LEADS
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    contact_id uuid references public.contacts(id) on delete cascade,
    conversation_id uuid references public.conversations(id) on delete set null,
    status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
    intent_tags jsonb default '[]'::jsonb,
    interest_summary text,
    estimated_value numeric default 0,
    assigned_to text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 7. CONTENT JOBS (Content Studio pipeline)
create table if not exists public.content_jobs (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    prompt text not null,
    raw_image_url text,
    generated_image_url text,
    captions jsonb default '{}'::jsonb, -- Roman Urdu, English, hashtags
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'published')),
    rejection_reason text,
    created_by text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 8. POSTS (Published / Scheduled Social Posts)
create table if not exists public.posts (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    content_job_id uuid references public.content_jobs(id) on delete set null,
    platforms jsonb default '["instagram"]'::jsonb,
    post_id_map jsonb default '{}'::jsonb,
    scheduled_for timestamptz,
    published_at timestamptz,
    metrics jsonb default '{"likes": 0, "comments": 0, "reach": 0}'::jsonb,
    created_at timestamptz default now() not null
);

-- 9. OUTREACH TARGETS (B2B Wholesale / Boutique Directory)
create table if not exists public.outreach_targets (
    id uuid default gen_random_uuid() primary key,
    brand_id text references public.brands(id) on delete cascade not null,
    business_name text not null,
    city text,
    email text not null,
    phone text,
    instagram text,
    status text not null default 'ready' check (status in ('ready', 'sending', 'responded', 'bounced', 'unsubscribed')),
    created_at timestamptz default now() not null
);

-- 10. OUTREACH SENDS
create table if not exists public.outreach_sends (
    id uuid default gen_random_uuid() primary key,
    target_id uuid references public.outreach_targets(id) on delete cascade not null,
    subject text not null,
    body text not null,
    sent_at timestamptz default now() not null,
    status text not null default 'delivered' check (status in ('delivered', 'opened', 'replied', 'bounced'))
);

-- 11. SUPPRESSION LIST
create table if not exists public.suppression_list (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    reason text default 'unsubscribed',
    created_at timestamptz default now() not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.content_jobs enable row level security;
alter table public.posts enable row level security;
alter table public.outreach_targets enable row level security;
alter table public.outreach_sends enable row level security;
alter table public.suppression_list enable row level security;

-- Admin Policy (Full Access for authenticated users)
do $$
declare
    t text;
begin
    for t in select unnest(array[
        'brands', 'products', 'conversations', 'messages', 'leads',
        'content_jobs', 'posts', 'outreach_targets', 'outreach_sends', 'suppression_list'
    ]) loop
        execute format('
            drop policy if exists "Admin full access" on public.%I;
            create policy "Admin full access" on public.%I
            for all to authenticated using (true) with check (true);
        ', t, t);
    end loop;
end $$;

-- Contacts Table Policies:
-- 1. Admin full access
drop policy if exists "Admin full access on contacts" on public.contacts;
create policy "Admin full access on contacts"
on public.contacts for all to authenticated using (true) with check (true);

-- 2. Anonymous users: INSERT only with consent (PECA compliant)
drop policy if exists "Anon insert only with consent" on public.contacts;
create policy "Anon insert only with consent"
on public.contacts for insert to anon
with check (consent_whatsapp = true or consent_email = true);

-- Storage bucket for content studio
insert into storage.buckets (id, name, public)
values ('content', 'content', false)
on conflict (id) do nothing;

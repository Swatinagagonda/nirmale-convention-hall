-- Nirmale Convention Hall – Supabase setup.
-- Run once: Supabase dashboard → SQL Editor → New query → paste this file → Run.

-- Site content ("content") and admin logins ("users"), one JSON document per row
create table if not exists public.kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Booking enquiries from the contact form
create table if not exists public.enquiries (
  id         text primary key,
  created_at timestamptz not null default now(),
  data       jsonb not null
);
create index if not exists enquiries_created_at on public.enquiries (created_at desc);

-- Lock both tables: only the website's secret key (used by Cloudflare) can read or write them
alter table public.kv enable row level security;
alter table public.enquiries enable row level security;

-- Public bucket for photos uploaded from the admin panel (max 8 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

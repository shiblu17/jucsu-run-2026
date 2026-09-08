// Supabase Configuration
// Live cloud database configuration for JUCSU RUN 2026
const SUPABASE_CONFIG = {
  url: "https://xvsmesiaxvlqzvaalarj.supabase.co",
  anonKey: "sb_publishable_TiNMuDMh2hA0Yw4EilPi5A_sEqvqWTv"
};

// BulkSMSBD Gateway Configuration for JUCSU RUN 2026
const BULKSMSBD_CONFIG = {
  apiKey: "UV0CvJmTqiboWjIL4N3E",
  defaultSenderId: "8809648910854",
  apiUrl: "https://bulksmsbd.net/api/smsapi",
  balanceUrl: "https://bulksmsbd.net/api/getBalanceApi"
};

/*
=====================================================
JUCSU RUN 2026 - RECOMMENDED DATABASE SECURITY SETUP
=====================================================

1. REGISTRATIONS TABLE & RLS POLICIES:

create table if not exists public.registrations (
  bib text primary key,
  name text not null,
  phone text not null,
  email text not null,
  category text not null,
  tshirt text not null,
  gender text not null,
  blood text,
  status text not null default 'Pending',
  type text not null,
  pickup text not null,
  kitpoint text,
  txnid text not null,
  created_at timestamp with time zone default now()
);

alter table public.registrations enable row level security;

-- Allow public runners to insert their registration
create policy "Allow public insert on registrations"
on public.registrations for insert
with check (true);

-- Allow public runners to search their status & e-bib
create policy "Allow public read on registrations"
on public.registrations for select
using (true);

-- Allow admin full update and delete access
create policy "Allow admin full access on registrations"
on public.registrations for all
using (true)
with check (true);


2. EVENT SETTINGS TABLE (Cloud Sync for Deadlines & Logistics):

create table if not exists public.event_settings (
  id text primary key,
  data jsonb,
  reg_close_date text,
  reg_status text,
  status_10k text,
  status_5k text,
  race_date text,
  updated_at timestamp with time zone default now()
);

alter table public.event_settings enable row level security;

create policy "Allow all access to event_settings"
on public.event_settings for all
using (true)
with check (true);
*/

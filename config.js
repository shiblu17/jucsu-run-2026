// Supabase Configuration
// Paste your Supabase project credentials below to enable live cloud database syncing.
// If left blank, the app will run in offline/local storage mock mode.
const SUPABASE_CONFIG = {
  url: "https://xvsmesiaxvlqzvaalarj.supabase.co",
  anonKey: "sb_publishable_TiNMuDMh2hA0Yw4EilPi5A_sEqvqWTv"
};

/*
Supabase SQL Query to set up your "registrations" table:

create table registrations (
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
  txnid text not null
);
*/

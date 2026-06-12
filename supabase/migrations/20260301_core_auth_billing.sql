-- ============================================================================
-- Hexastra Coach - socle Supabase auth, abonnements et bibliotheque
-- Doit etre execute avant les migrations Hexastra de mars 2026.
-- ============================================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Profils utilisateurs
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free'
    check (plan in ('free', 'essential', 'essentiel', 'premium', 'practitioner', 'praticien')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  language text not null default 'fr',
  first_name text,
  birth_date text,
  birth_time text,
  birth_location text,
  practitioner_usage text,
  birth_lat double precision,
  birth_lng double precision,
  birth_country_code text,
  birth_time_known boolean,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists stripe_subscription_status text;
alter table public.profiles add column if not exists language text not null default 'fr';
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists birth_date text;
alter table public.profiles add column if not exists birth_time text;
alter table public.profiles add column if not exists birth_location text;
alter table public.profiles add column if not exists practitioner_usage text;
alter table public.profiles add column if not exists birth_lat double precision;
alter table public.profiles add column if not exists birth_lng double precision;
alter table public.profiles add column if not exists birth_country_code text;
alter table public.profiles add column if not exists birth_time_known boolean;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_stripe_customer_id on public.profiles(stripe_customer_id);
create index if not exists idx_profiles_stripe_subscription_id on public.profiles(stripe_subscription_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creation automatique du profil a l'inscription Supabase.
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  meta jsonb;
  first text;
  last text;
  resolved_full_name text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first := nullif(trim(coalesce(meta->>'first_name', '')), '');
  last := nullif(trim(coalesce(meta->>'last_name', '')), '');
  resolved_full_name := nullif(trim(coalesce(
    meta->>'full_name',
    nullif(trim(coalesce(first, '') || ' ' || coalesce(last, '')), ''),
    meta->>'name',
    ''
  )), '');

  insert into public.profiles (id, email, full_name, first_name, plan)
  values (new.id, new.email, resolved_full_name, first, 'free')
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Quotas journaliers /api/chat
-- ----------------------------------------------------------------------------

create table if not exists public.daily_usage (
  usage_key text primary key,
  used integer not null default 0,
  window_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_usage add column if not exists used integer not null default 0;
alter table public.daily_usage add column if not exists window_started_at timestamptz not null default now();
alter table public.daily_usage add column if not exists created_at timestamptz not null default now();
alter table public.daily_usage add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_daily_usage_updated_at on public.daily_usage;
create trigger trg_daily_usage_updated_at
  before update on public.daily_usage
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Bibliotheque de lectures et fichiers
-- ----------------------------------------------------------------------------

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_type text not null default 'free',
  reading_text text,
  birth_date_iso text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.readings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.readings add column if not exists reading_type text not null default 'free';
alter table public.readings add column if not exists reading_text text;
alter table public.readings add column if not exists birth_date_iso text;
alter table public.readings add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.readings add column if not exists created_at timestamptz not null default now();
alter table public.readings add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_readings_user_created_at
  on public.readings(user_id, created_at desc);

drop trigger if exists trg_readings_updated_at on public.readings;
create trigger trg_readings_updated_at
  before update on public.readings
  for each row execute function public.set_updated_at();

create table if not exists public.file_refs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  reading_id uuid references public.readings(id) on delete cascade,
  file_type text not null,
  file_url text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.file_refs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.file_refs add column if not exists reading_id uuid references public.readings(id) on delete cascade;
alter table public.file_refs add column if not exists file_type text not null default 'file';
alter table public.file_refs add column if not exists file_url text;
alter table public.file_refs add column if not exists storage_path text;
alter table public.file_refs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.file_refs add column if not exists created_at timestamptz not null default now();
alter table public.file_refs add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_file_refs_reading_type
  on public.file_refs(reading_id, file_type);
create index if not exists idx_file_refs_user_id
  on public.file_refs(user_id);

drop trigger if exists trg_file_refs_updated_at on public.file_refs;
create trigger trg_file_refs_updated_at
  before update on public.file_refs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Commandes Stripe
-- ----------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reading_id uuid references public.readings(id) on delete set null,
  price_key text,
  status text not null default 'pending',
  stripe_session_id text unique,
  stripe_payment_id text,
  stripe_customer_id text,
  amount_total integer,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists reading_id uuid references public.readings(id) on delete set null;
alter table public.orders add column if not exists price_key text;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists stripe_session_id text;
alter table public.orders add column if not exists stripe_payment_id text;
alter table public.orders add column if not exists stripe_customer_id text;
alter table public.orders add column if not exists amount_total integer;
alter table public.orders add column if not exists currency text;
alter table public.orders add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_orders_stripe_session_id
  on public.orders(stripe_session_id)
  where stripe_session_id is not null;
create index if not exists idx_orders_user_created_at
  on public.orders(user_id, created_at desc);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS et privileges
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.file_refs enable row level security;
alter table public.orders enable row level security;
alter table public.daily_usage enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.readings to authenticated;
grant select, insert, update, delete on public.file_refs to authenticated;
grant select, insert, update, delete on public.orders to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists readings_select_own on public.readings;
create policy readings_select_own
  on public.readings for select
  using (auth.uid() = user_id);

drop policy if exists readings_insert_own on public.readings;
create policy readings_insert_own
  on public.readings for insert
  with check (auth.uid() = user_id);

drop policy if exists readings_update_own on public.readings;
create policy readings_update_own
  on public.readings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists readings_delete_own on public.readings;
create policy readings_delete_own
  on public.readings for delete
  using (auth.uid() = user_id);

drop policy if exists file_refs_select_own on public.file_refs;
create policy file_refs_select_own
  on public.file_refs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.readings r
      where r.id = file_refs.reading_id and r.user_id = auth.uid()
    )
  );

drop policy if exists file_refs_insert_own on public.file_refs;
create policy file_refs_insert_own
  on public.file_refs for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.readings r
      where r.id = file_refs.reading_id and r.user_id = auth.uid()
    )
  );

drop policy if exists file_refs_update_own on public.file_refs;
create policy file_refs_update_own
  on public.file_refs for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.readings r
      where r.id = file_refs.reading_id and r.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.readings r
      where r.id = file_refs.reading_id and r.user_id = auth.uid()
    )
  );

drop policy if exists file_refs_delete_own on public.file_refs;
create policy file_refs_delete_own
  on public.file_refs for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.readings r
      where r.id = file_refs.reading_id and r.user_id = auth.uid()
    )
  );

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists orders_update_own on public.orders;
create policy orders_update_own
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_usage reste reserve au service role : aucune policy utilisateur.

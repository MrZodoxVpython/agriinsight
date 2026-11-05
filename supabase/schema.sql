-- Skema AgriInsight untuk database PostgreSQL Supabase.
-- Jalankan melalui Supabase Dashboard > SQL Editor, atau `npm run db:setup`.
create extension if not exists pgcrypto;

-- Akun pengguna aplikasi (autentikasi ditangani backend, bukan Supabase Auth).
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.farm_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  commodity text not null check (char_length(commodity) between 2 and 80),
  location text not null check (char_length(location) between 3 and 180),
  planted_area_ha numeric(12,2) not null check (planted_area_ha > 0),
  planting_date date,
  expected_harvest_date date,
  estimated_yield_kg numeric(14,2) not null check (estimated_yield_kg > 0),
  production_cost numeric(16,2) not null default 0 check (production_cost >= 0),
  expected_price numeric(16,2) not null check (expected_price > 0),
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kompatibilitas untuk database yang dibuat sebelum kolom status ditambahkan.
alter table public.farm_plans add column if not exists status text not null default 'planned';
alter table public.farm_plans drop constraint if exists farm_plans_status_check;
alter table public.farm_plans
  add constraint farm_plans_status_check
  check (status in ('planned', 'planting', 'harvest', 'completed'));

create index if not exists farm_plans_user_created_idx
  on public.farm_plans(user_id, created_at desc);
create index if not exists farm_plans_user_status_idx
  on public.farm_plans(user_id, status);

-- Akses hanya lewat backend. RLS aktif tanpa policy agar anon key tidak bisa
-- membaca/menulis tabel secara langsung.
alter table public.farm_plans enable row level security;
alter table public.app_users enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_farm_plans_updated_at on public.farm_plans;
create trigger set_farm_plans_updated_at
  before update on public.farm_plans
  for each row execute function public.set_updated_at();

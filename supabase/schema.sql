-- Jalankan seluruh file ini melalui Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.farm_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  commodity text not null check (char_length(commodity) between 2 and 80),
  location text not null check (char_length(location) between 3 and 180),
  planted_area_ha numeric(12,2) not null check (planted_area_ha > 0),
  planting_date date,
  expected_harvest_date date,
  estimated_yield_kg numeric(14,2) not null check (estimated_yield_kg > 0),
  production_cost numeric(16,2) not null default 0 check (production_cost >= 0),
  expected_price numeric(16,2) not null check (expected_price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_plans_user_created_idx on public.farm_plans(user_id, created_at desc);
alter table public.farm_plans enable row level security;

drop policy if exists "Users can view own farm plans" on public.farm_plans;
create policy "Users can view own farm plans" on public.farm_plans for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own farm plans" on public.farm_plans;
create policy "Users can insert own farm plans" on public.farm_plans for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own farm plans" on public.farm_plans;
create policy "Users can update own farm plans" on public.farm_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own farm plans" on public.farm_plans;
create policy "Users can delete own farm plans" on public.farm_plans for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists set_farm_plans_updated_at on public.farm_plans;
create trigger set_farm_plans_updated_at before update on public.farm_plans for each row execute function public.set_updated_at();

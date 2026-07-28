-- Run this in the Supabase SQL Editor (same project as 0001_init.sql).

-- ---------- country/city on pins ----------
alter table public.pins add column if not exists country text;
alter table public.pins add column if not exists city text;

-- ---------- flights ----------
create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  airline text,
  flight_number text,
  from_airport text not null,
  to_airport text not null,
  date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.flights enable row level security;

create policy "Users can view flights on their own trips"
  on public.flights for select
  using (exists (
    select 1 from public.trips
    where trips.id = flights.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert flights on their own trips"
  on public.flights for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = flights.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update flights on their own trips"
  on public.flights for update
  using (exists (
    select 1 from public.trips
    where trips.id = flights.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete flights on their own trips"
  on public.flights for delete
  using (exists (
    select 1 from public.trips
    where trips.id = flights.trip_id and trips.user_id = auth.uid()
  ));

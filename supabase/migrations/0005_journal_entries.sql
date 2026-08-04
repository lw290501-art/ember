-- Run this in the Supabase SQL Editor (same project as 0001-0004).

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  entry_date date not null,
  title text,
  content text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can view journal entries on their own trips"
  on public.journal_entries for select
  using (exists (
    select 1 from public.trips
    where trips.id = journal_entries.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert journal entries on their own trips"
  on public.journal_entries for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = journal_entries.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update journal entries on their own trips"
  on public.journal_entries for update
  using (exists (
    select 1 from public.trips
    where trips.id = journal_entries.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete journal entries on their own trips"
  on public.journal_entries for delete
  using (exists (
    select 1 from public.trips
    where trips.id = journal_entries.trip_id and trips.user_id = auth.uid()
  ));

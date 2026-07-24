-- Run this whole file once in the Supabase SQL Editor for your project
-- (Project -> SQL Editor -> New query -> paste -> Run).

create extension if not exists "pgcrypto";

-- ---------- trips ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  cover_photo_url text,
  start_date date,
  end_date date,
  status text not null default 'planning' check (status in ('planning', 'ongoing', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Users can view their own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- ---------- bucket_list_items ----------
create table if not exists public.bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  place_name text not null,
  country text,
  notes text,
  is_done boolean not null default false,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.bucket_list_items enable row level security;

create policy "Users can view their own bucket list items"
  on public.bucket_list_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bucket list items"
  on public.bucket_list_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bucket list items"
  on public.bucket_list_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bucket list items"
  on public.bucket_list_items for delete
  using (auth.uid() = user_id);

-- ---------- pins ----------
create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  label text not null,
  notes text,
  visited_at date,
  created_at timestamptz not null default now()
);

alter table public.pins enable row level security;

create policy "Users can view pins on their own trips"
  on public.pins for select
  using (exists (
    select 1 from public.trips
    where trips.id = pins.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert pins on their own trips"
  on public.pins for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = pins.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update pins on their own trips"
  on public.pins for update
  using (exists (
    select 1 from public.trips
    where trips.id = pins.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete pins on their own trips"
  on public.pins for delete
  using (exists (
    select 1 from public.trips
    where trips.id = pins.trip_id and trips.user_id = auth.uid()
  ));

-- ---------- media ----------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pin_id uuid references public.pins(id) on delete set null,
  type text not null check (type in ('photo', 'video', 'voice', 'ticket')),
  storage_path text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Users can view media on their own trips"
  on public.media for select
  using (exists (
    select 1 from public.trips
    where trips.id = media.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert media on their own trips"
  on public.media for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = media.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update media on their own trips"
  on public.media for update
  using (exists (
    select 1 from public.trips
    where trips.id = media.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete media on their own trips"
  on public.media for delete
  using (exists (
    select 1 from public.trips
    where trips.id = media.trip_id and trips.user_id = auth.uid()
  ));

-- ---------- storage bucket for photos/videos/voice notes/tickets ----------
insert into storage.buckets (id, name, public)
values ('trip-media', 'trip-media', false)
on conflict (id) do nothing;

-- Files are stored at path: {user_id}/{trip_id}/{filename}
-- so ownership can be checked from the first path segment.
create policy "Users can view their own trip media files"
  on storage.objects for select
  using (bucket_id = 'trip-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own trip media files"
  on storage.objects for insert
  with check (bucket_id = 'trip-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own trip media files"
  on storage.objects for update
  using (bucket_id = 'trip-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own trip media files"
  on storage.objects for delete
  using (bucket_id = 'trip-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- Run this in the Supabase SQL Editor (same project as 0001-0003).

-- Freely-positioned photo/text elements on a trip's "collage" scrapbook page.
-- x/y/width are percentages (0-100) of the canvas so layout stays responsive.
create table if not exists public.scrapbook_blocks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null check (type in ('photo', 'text')),
  media_id uuid references public.media(id) on delete cascade,
  text_content text,
  font text,
  color text,
  x double precision not null default 30,
  y double precision not null default 30,
  width double precision not null default 35,
  rotation double precision not null default 0,
  z_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.scrapbook_blocks enable row level security;

create policy "Users can view blocks on their own trips"
  on public.scrapbook_blocks for select
  using (exists (
    select 1 from public.trips
    where trips.id = scrapbook_blocks.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can insert blocks on their own trips"
  on public.scrapbook_blocks for insert
  with check (exists (
    select 1 from public.trips
    where trips.id = scrapbook_blocks.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can update blocks on their own trips"
  on public.scrapbook_blocks for update
  using (exists (
    select 1 from public.trips
    where trips.id = scrapbook_blocks.trip_id and trips.user_id = auth.uid()
  ));

create policy "Users can delete blocks on their own trips"
  on public.scrapbook_blocks for delete
  using (exists (
    select 1 from public.trips
    where trips.id = scrapbook_blocks.trip_id and trips.user_id = auth.uid()
  ));

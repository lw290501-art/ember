-- Run this in the Supabase SQL Editor (same project as 0001-0005).

alter table public.trips add column if not exists share_token uuid unique;

-- A trip with a non-null share_token is publicly readable (read-only) at
-- /shared/:token, regardless of who is asking — these policies intentionally
-- have no auth.uid() check. Setting share_token back to null revokes access
-- immediately.

create policy "Anyone can view a shared trip"
  on public.trips for select
  using (share_token is not null);

create policy "Anyone can view pins on a shared trip"
  on public.pins for select
  using (exists (
    select 1 from public.trips
    where trips.id = pins.trip_id and trips.share_token is not null
  ));

create policy "Anyone can view media on a shared trip"
  on public.media for select
  using (exists (
    select 1 from public.trips
    where trips.id = media.trip_id and trips.share_token is not null
  ));

create policy "Anyone can view flights on a shared trip"
  on public.flights for select
  using (exists (
    select 1 from public.trips
    where trips.id = flights.trip_id and trips.share_token is not null
  ));

create policy "Anyone can view journal entries on a shared trip"
  on public.journal_entries for select
  using (exists (
    select 1 from public.trips
    where trips.id = journal_entries.trip_id and trips.share_token is not null
  ));

create policy "Anyone can view bucket list items on a shared trip"
  on public.bucket_list_items for select
  using (
    trip_id is not null
    and exists (
      select 1 from public.trips
      where trips.id = bucket_list_items.trip_id and trips.share_token is not null
    )
  );

create policy "Anyone can view media files for a shared trip"
  on storage.objects for select
  using (
    bucket_id = 'trip-media'
    and exists (
      select 1 from public.media
      join public.trips on trips.id = media.trip_id
      where media.storage_path = storage.objects.name and trips.share_token is not null
    )
  );

-- Run this in the Supabase SQL Editor (same project as 0001/0002).

alter table public.trips add column if not exists cover_stickers text[];
alter table public.media add column if not exists stickers text[];

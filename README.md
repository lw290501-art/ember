# Ember

*Every memory starts as a spark.*

Plan trips, keep a travel bucket list, pin places on a map, and upload photos,
videos, voice notes, and tickets for each trip.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project (free)

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Open **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
3. Open the **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it.
   This creates the `trips`, `bucket_list_items`, `pins`, and `media` tables
   (with row-level security so each user only sees their own data) and the
   `trip-media` storage bucket used for uploads.
4. Then paste and run [`supabase/migrations/0002_flights_and_geo.sql`](supabase/migrations/0002_flights_and_geo.sql),
   which adds the `flights` table and country/city columns on pins.
5. Then paste and run [`supabase/migrations/0003_scrapbook_customization.sql`](supabase/migrations/0003_scrapbook_customization.sql),
   which adds sticker/decoration columns for the scrapbook.
6. Then paste and run [`supabase/migrations/0004_scrapbook_canvas.sql`](supabase/migrations/0004_scrapbook_canvas.sql),
   which adds the `scrapbook_blocks` table backing the freeform design page.
7. By default new signups require email confirmation. For local testing you
   can disable that under **Authentication → Providers → Email → Confirm email**.

### 3. Create a Mapbox token (free)

1. Sign up at [mapbox.com](https://mapbox.com).
2. Copy the default public token from your [account page](https://account.mapbox.com).

Note: the maps themselves are a flat illustrated world SVG, not Mapbox tiles —
the token is only used for reverse geocoding (turning a clicked point into a
country/city name).

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with the values from steps 2 and 3:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=
```

### 5. Run the app

```bash
npm run dev
```

Without the keys above, the app still loads (auth/map calls just fail
gracefully) — you need them for sign-up, trips, pins, and uploads to work.

## What's here

- Email/password auth (Supabase Auth)
- Create/edit/delete trips
- Travel bucket list, optionally linked to a trip
- Flat illustrated world map per trip — click anywhere to drop a pin
  (auto-tagged with country/city via reverse geocoding), zooms to the trip's
  own pins once it has any, and visited countries highlight and pop on hover
- Photo/video/ticket upload and voice note recording per trip
- Flight logging per trip, shown as collectible passport stamps
- Daily journal entries per trip — date, title, free-text, and a mood picker
- Stats page: countries/cities/flights/trips totals across all trips
- Swipeable digital scrapbook per trip (drag/touch, arrows, dots, keyboard) —
  cover, a flat illustrated world map (visited countries highlight and pop on
  hover), places, photos, journal entries styled as handwritten diary pages,
  passport stamps, checked-off bucket list items — with editable photo
  captions, toggleable sticker decorations, a freeform "design this page"
  canvas (drag photos/custom-font text anywhere), adding photos directly from
  the scrapbook, and a "Save as PDF" export to send to friends
- "My Travels" — an overall scrapbook aggregating stats and an illustrated
  world map across your whole account, plus a card per trip linking into each
  trip's own scrapbook

## Not yet built

- Live public web link sharing (currently sharing is export-and-send only,
  by design — no backend changes needed, nothing about your trips is exposed
  publicly)

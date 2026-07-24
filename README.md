# Travel Journal

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
4. By default new signups require email confirmation. For local testing you
   can disable that under **Authentication → Providers → Email → Confirm email**.

### 3. Create a Mapbox token (free)

1. Sign up at [mapbox.com](https://mapbox.com).
2. Copy the default public token from your [account page](https://account.mapbox.com).

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

## What's here (MVP)

- Email/password auth (Supabase Auth)
- Create/edit/delete trips
- Travel bucket list, optionally linked to a trip
- Map with click-to-drop pins per trip (Mapbox)
- Photo/video/ticket upload and voice note recording per trip

## Not yet built

- Flight and country/city tracking
- Digital scrapbook generation/export
- Sharing trips or scrapbooks with friends

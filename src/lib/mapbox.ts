export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

if (!MAPBOX_TOKEN) {
  console.warn(
    'Missing Mapbox token. Copy .env.example to .env and fill in VITE_MAPBOX_TOKEN.',
  )
}

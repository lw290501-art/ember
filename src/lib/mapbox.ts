export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

if (!MAPBOX_TOKEN) {
  console.warn(
    'Missing Mapbox token. Copy .env.example to .env and fill in VITE_MAPBOX_TOKEN.',
  )
}

type ReverseGeocodeResult = {
  country: string | null
  city: string | null
}

/** Looks up the country/city for a dropped pin so users don't have to type them in. */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  if (!MAPBOX_TOKEN) return { country: null, city: null }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country,place&access_token=${MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return { country: null, city: null }

    const data: {
      features?: { place_name: string; text: string; place_type: string[] }[]
    } = await res.json()

    const features = data.features ?? []
    const country = features.find((f) => f.place_type.includes('country'))?.text ?? null
    const city = features.find((f) => f.place_type.includes('place'))?.text ?? null

    return { country, city }
  } catch {
    return { country: null, city: null }
  }
}

export type PlaceSuggestion = {
  id: string
  name: string
  placeName: string
}

/** Looks up place suggestions for a typed query (e.g. "Eiffel Tower") using Mapbox's
 * Search Box API — the only reliable way to drop a pin precisely on a landmark, since
 * the illustrated map has no street detail to click against, and the classic geocoder's
 * "poi" data doesn't cover most world landmarks. Suggestions don't include coordinates
 * yet; call retrievePlace() with the chosen suggestion's id to resolve them. */
export async function suggestPlaces(
  query: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  if (!MAPBOX_TOKEN || !query.trim()) return []

  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}&limit=5`
    const res = await fetch(url)
    if (!res.ok) return []

    const data: {
      suggestions?: { mapbox_id: string; name: string; full_address?: string; place_formatted?: string }[]
    } = await res.json()

    return (data.suggestions ?? []).map((s) => ({
      id: s.mapbox_id,
      name: s.name,
      placeName: s.full_address ?? s.place_formatted ?? s.name,
    }))
  } catch {
    return []
  }
}

/** Resolves the exact coordinates for a suggestion returned by suggestPlaces(). Must be
 * called with the same session_token used for the suggest request. */
export async function retrievePlace(
  mapboxId: string,
  sessionToken: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null

  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`
    const res = await fetch(url)
    if (!res.ok) return null

    const data: { features?: { geometry?: { coordinates?: [number, number] } }[] } = await res.json()
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords) return null

    return { lng: coords[0], lat: coords[1] }
  } catch {
    return null
  }
}

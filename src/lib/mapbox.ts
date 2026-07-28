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

import { useEffect, useState } from 'react'
import { feature } from 'topojson-client'

// Reconciles free-text country names (from Mapbox reverse geocoding) with the
// Natural Earth names baked into the bundled world topology.
const NAME_ALIASES: Record<string, string> = {
  'united states': 'united states of america',
  usa: 'united states of america',
  'u.s.a.': 'united states of america',
  'czech republic': 'czechia',
  'ivory coast': "cote d'ivoire",
  'democratic republic of the congo': 'dem. rep. congo',
  'republic of the congo': 'congo',
  'myanmar (burma)': 'myanmar',
  burma: 'myanmar',
  'bosnia and herzegovina': 'bosnia and herz.',
  'north macedonia': 'macedonia',
  'dominican republic': 'dominican rep.',
  'equatorial guinea': 'eq. guinea',
  uae: 'united arab emirates',
  uk: 'united kingdom',
  'great britain': 'united kingdom',
}

export function normalizeCountryName(name: string) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return NAME_ALIASES[cleaned] ?? cleaned
}

export type CountryFeature = {
  type: 'Feature'
  properties: { name: string }
  geometry: unknown
}

/** Loads the bundled Natural Earth world topology as GeoJSON country features. */
export function useWorldCountries(): CountryFeature[] | null {
  const [countries, setCountries] = useState<CountryFeature[] | null>(null)

  useEffect(() => {
    fetch('/data/countries-110m.json')
      .then((r) => r.json())
      .then((topology) => {
        const collection = feature(
          topology,
          topology.objects.countries as never,
        ) as unknown as { features: CountryFeature[] }
        setCountries(collection.features)
      })
      .catch(() => setCountries([]))
  }, [])

  return countries
}

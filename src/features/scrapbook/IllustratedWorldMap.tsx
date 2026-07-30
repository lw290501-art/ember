import { useEffect, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
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

function normalize(name: string) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return NAME_ALIASES[cleaned] ?? cleaned
}

type CountryFeature = {
  type: 'Feature'
  properties: { name: string }
  geometry: unknown
}

const WIDTH = 800
const HEIGHT = 420
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: 'Sphere' } as never)
const pathGenerator = geoPath(projection)

export function IllustratedWorldMap({ visitedCountries }: { visitedCountries: string[] }) {
  const [countries, setCountries] = useState<CountryFeature[] | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

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

  const visitedSet = new Set(visitedCountries.map(normalize))

  if (!countries) {
    return (
      <div className="flex aspect-[800/420] w-full items-center justify-center rounded-2xl border-4 border-white bg-lavender-50 dark:border-plum-800 dark:bg-plum-900">
        <p className="text-sm text-plum-400">Loading map…</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border-4 border-white bg-lavender-50 shadow-md dark:border-plum-800 dark:bg-plum-900">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
        {countries.map((c) => {
          const key = normalize(c.properties.name)
          const isVisited = visitedSet.has(key)
          const isHovered = hovered === c.properties.name
          return (
            <path
              key={c.properties.name}
              d={pathGenerator(c as never) ?? ''}
              onMouseEnter={() => setHovered(c.properties.name)}
              onMouseLeave={() => setHovered(null)}
              className={isVisited && isHovered ? 'country-pop' : ''}
              style={{
                fill: isVisited
                  ? isHovered
                    ? '#9e3559'
                    : '#e685a3'
                  : isHovered
                    ? '#d9c9f1'
                    : '#ede5f9',
                stroke: '#fdf6f2',
                strokeWidth: 0.6,
                transition: 'fill 250ms ease',
                cursor: isVisited ? 'pointer' : 'default',
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}

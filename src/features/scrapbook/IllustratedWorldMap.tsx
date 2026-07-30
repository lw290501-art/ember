import { useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { normalizeCountryName, useWorldCountries } from '../../lib/worldMap'

const WIDTH = 800
const HEIGHT = 420
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: 'Sphere' } as never)
const pathGenerator = geoPath(projection)

export function IllustratedWorldMap({ visitedCountries }: { visitedCountries: string[] }) {
  const countries = useWorldCountries()
  const [hovered, setHovered] = useState<string | null>(null)

  const visitedSet = new Set(visitedCountries.map(normalizeCountryName))

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
          const key = normalizeCountryName(c.properties.name)
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

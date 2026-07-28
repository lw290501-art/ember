import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Stats = {
  countries: string[]
  cities: string[]
  flightsCount: number
  tripsCount: number
}

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: pins }, { count: flightsCount }, { count: tripsCount }] = await Promise.all([
        supabase.from('pins').select('country, city'),
        supabase.from('flights').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
      ])

      const countries = [...new Set((pins ?? []).map((p) => p.country).filter((c): c is string => Boolean(c)))].sort()
      const cities = [...new Set((pins ?? []).map((p) => p.city).filter((c): c is string => Boolean(c)))].sort()

      setStats({
        countries,
        cities,
        flightsCount: flightsCount ?? 0,
        tripsCount: tripsCount ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !stats) {
    return <p className="text-plum-400">Loading…</p>
  }

  const tiles = [
    { label: 'Trips', value: stats.tripsCount },
    { label: 'Countries', value: stats.countries.length },
    { label: 'Cities', value: stats.cities.length },
    { label: 'Flights', value: stats.flightsCount },
  ]

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
        Your travel stats
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-blush-100 bg-white p-4 text-center dark:border-plum-800 dark:bg-plum-900"
          >
            <p className="font-display text-3xl font-semibold text-blush-600 dark:text-blush-300">
              {tile.value}
            </p>
            <p className="text-sm text-plum-500 dark:text-plum-300">{tile.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
          Countries visited
        </h2>
        {stats.countries.length === 0 ? (
          <p className="text-sm text-plum-400">
            Drop pins on your trip maps and their countries will show up here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.countries.map((country) => (
              <span
                key={country}
                className="rounded-full bg-lavender-100 px-3 py-1 text-sm text-plum-600 dark:bg-plum-800 dark:text-lavender-200"
              >
                {country}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
          Cities visited
        </h2>
        {stats.cities.length === 0 ? (
          <p className="text-sm text-plum-400">Cities from your pins will show up here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.cities.map((city) => (
              <span
                key={city}
                className="rounded-full bg-blush-100 px-3 py-1 text-sm text-blush-700 dark:bg-blush-800/40 dark:text-blush-200"
              >
                {city}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

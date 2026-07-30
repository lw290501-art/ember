import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Luggage } from 'lucide-react'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { buildStaticMapUrl } from '../../lib/mapbox'
import type { Pin, Trip } from '../../types/database'
import { ScrapbookSwiper } from './ScrapbookSwiper'

type TripCard = {
  trip: Trip
  pinCount: number
  thumbnailUrl: string | null
}

type OverviewData = {
  trips: TripCard[]
  allPins: Pin[]
  countries: string[]
  cities: string[]
  flightsCount: number
}

const statusColors: Record<Trip['status'], string> = {
  planning: 'bg-lavender-100 text-plum-600',
  ongoing: 'bg-blush-100 text-blush-700',
  completed: 'bg-plum-50 text-plum-400',
}

export function AllTripsScrapbookPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true })

      const tripList = trips ?? []

      const [{ data: allPins }, { count: flightsCount }] = await Promise.all([
        supabase.from('pins').select('*'),
        supabase.from('flights').select('*', { count: 'exact', head: true }),
      ])

      const pins = allPins ?? []
      const countries = [...new Set(pins.map((p) => p.country).filter((c): c is string => Boolean(c)))].sort()
      const cities = [...new Set(pins.map((p) => p.city).filter((c): c is string => Boolean(c)))].sort()

      const tripCards: TripCard[] = await Promise.all(
        tripList.map(async (trip) => {
          const pinCount = pins.filter((p) => p.trip_id === trip.id).length

          const { data: firstPhoto } = await supabase
            .from('media')
            .select('storage_path')
            .eq('trip_id', trip.id)
            .eq('type', 'photo')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

          let thumbnailUrl: string | null = null
          if (firstPhoto) {
            const { data: signed } = await supabase.storage
              .from(MEDIA_BUCKET)
              .createSignedUrl(firstPhoto.storage_path, 3600)
            thumbnailUrl = signed?.signedUrl ?? null
          }

          return { trip, pinCount, thumbnailUrl }
        }),
      )

      setData({ trips: tripCards, allPins: pins, countries, cities, flightsCount: flightsCount ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !data) return <p className="text-plum-400">Loading…</p>

  const mapUrl = buildStaticMapUrl(data.allPins)
  const slides: ReactNode[] = []

  // Cover
  slides.push(
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-2 font-display text-sm italic text-blush-600">every memory starts as a spark</p>
      <h1 className="font-display text-4xl font-semibold text-plum-800">My Travels</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 text-plum-800">
        <div className="rounded-xl bg-blush-50 px-4 py-3">
          <p className="font-display text-2xl font-semibold text-blush-600">{data.trips.length}</p>
          <p className="text-xs text-plum-400">Trips</p>
        </div>
        <div className="rounded-xl bg-blush-50 px-4 py-3">
          <p className="font-display text-2xl font-semibold text-blush-600">{data.countries.length}</p>
          <p className="text-xs text-plum-400">Countries</p>
        </div>
        <div className="rounded-xl bg-blush-50 px-4 py-3">
          <p className="font-display text-2xl font-semibold text-blush-600">{data.cities.length}</p>
          <p className="text-xs text-plum-400">Cities</p>
        </div>
        <div className="rounded-xl bg-blush-50 px-4 py-3">
          <p className="font-display text-2xl font-semibold text-blush-600">{data.flightsCount}</p>
          <p className="text-xs text-plum-400">Flights</p>
        </div>
      </div>
    </div>,
  )

  // Overall map
  if (mapUrl) {
    slides.push(
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-plum-800">Everywhere I've been</h2>
        <img
          src={mapUrl}
          alt="Map of all trip locations"
          crossOrigin="anonymous"
          className="w-full rounded-xl border-4 border-white shadow-md"
        />
        {data.countries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {data.countries.map((c) => (
              <span key={c} className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs text-plum-600">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>,
    )
  }

  // One slide per trip
  data.trips.forEach(({ trip, pinCount, thumbnailUrl }) => {
    slides.push(
      <div className="flex h-full flex-col items-center justify-center text-center">
        {thumbnailUrl ? (
          <div className="w-full rounded-sm bg-white p-3 pb-6 shadow-md">
            <img src={thumbnailUrl} alt="" crossOrigin="anonymous" className="h-40 w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-xl bg-blush-50 text-blush-300">
            <Luggage size={40} strokeWidth={1.5} />
          </div>
        )}
        <h2 className="mt-4 font-display text-2xl font-semibold text-plum-800">{trip.title}</h2>
        <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status]}`}>
          {trip.status}
        </span>
        {(trip.start_date || trip.end_date) && (
          <p className="mt-1 text-sm text-plum-500">
            {trip.start_date ?? '?'} — {trip.end_date ?? '?'}
          </p>
        )}
        {pinCount > 0 && <p className="text-xs text-plum-400">{pinCount} places pinned</p>}
        <Link
          to={`/trips/${trip.id}/scrapbook`}
          className="mt-4 rounded-full border border-blush-400 px-4 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50"
        >
          View full scrapbook →
        </Link>
      </div>,
    )
  })

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-plum-800 dark:text-blush-50">
        My Travels
      </h1>
      {data.trips.length === 0 ? (
        <p className="text-plum-400">Create a trip to start your scrapbook.</p>
      ) : (
        <ScrapbookSwiper slides={slides} />
      )}
    </div>
  )
}

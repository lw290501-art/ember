import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { buildStaticMapUrl } from '../../lib/mapbox'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BucketListItem, Flight, Media, Pin, Trip } from '../../types/database'

type ScrapbookData = {
  trip: Trip
  pins: Pin[]
  flights: Flight[]
  doneItems: BucketListItem[]
  photos: (Media & { url?: string })[]
}

const rotations = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1']

export function ScrapbookPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [data, setData] = useState<ScrapbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!tripId) return
      setLoading(true)

      const [{ data: trip }, { data: pins }, { data: flights }, { data: doneItems }, { data: media }] =
        await Promise.all([
          supabase.from('trips').select('*').eq('id', tripId).single(),
          supabase.from('pins').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
          supabase.from('flights').select('*').eq('trip_id', tripId).order('date', { ascending: true }),
          supabase
            .from('bucket_list_items')
            .select('*')
            .eq('trip_id', tripId)
            .eq('is_done', true),
          supabase
            .from('media')
            .select('*')
            .eq('trip_id', tripId)
            .in('type', ['photo', 'ticket'])
            .order('created_at', { ascending: true }),
        ])

      if (!trip) {
        setData(null)
        setLoading(false)
        return
      }

      const mediaRows = media ?? []
      let photos: (Media & { url?: string })[] = []
      if (mediaRows.length > 0) {
        const { data: signed } = await supabase.storage
          .from(MEDIA_BUCKET)
          .createSignedUrls(
            mediaRows.map((m) => m.storage_path),
            3600,
          )
        const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl ?? undefined]))
        photos = mediaRows.map((m) => ({ ...m, url: urlByPath.get(m.storage_path) }))
      }

      setData({
        trip,
        pins: pins ?? [],
        flights: flights ?? [],
        doneItems: doneItems ?? [],
        photos,
      })
      setLoading(false)
    }
    load()
  }, [tripId])

  const handleExport = async () => {
    if (!pageRef.current || !data) return
    setExporting(true)
    try {
      await exportElementToPdf(pageRef.current, `${data.trip.title.replace(/\s+/g, '-')}-scrapbook.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-plum-400">Loading…</p>
  if (!data) return <p className="text-plum-400">Trip not found.</p>

  const { trip, pins, flights, doneItems, photos } = data
  const mapUrl = buildStaticMapUrl(pins)
  const countries = [...new Set(pins.map((p) => p.country).filter((c): c is string => Boolean(c)))]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/trips/${trip.id}`}
          className="text-sm text-blush-600 hover:underline dark:text-blush-300"
        >
          ← Back to trip
        </Link>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-full bg-blush-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {exporting ? 'Preparing PDF…' : '⬇ Download as PDF'}
        </button>
      </div>

      <div
        ref={pageRef}
        className="mx-auto max-w-3xl rounded-2xl bg-cream p-10 text-plum-800 shadow-lg"
      >
        {/* Cover */}
        <div className="mb-10 text-center">
          <p className="mb-2 font-display text-sm italic text-blush-600">every memory starts as a spark</p>
          <h1 className="font-display text-5xl font-semibold">{trip.title}</h1>
          {(trip.start_date || trip.end_date) && (
            <p className="mt-2 text-plum-500">
              {trip.start_date ?? '?'} — {trip.end_date ?? '?'}
            </p>
          )}
          {trip.description && <p className="mt-3 text-plum-600">{trip.description}</p>}
          {countries.length > 0 && (
            <p className="mt-4 text-sm uppercase tracking-wide text-plum-400">
              {countries.join(' · ')}
            </p>
          )}
        </div>

        {/* Map */}
        {mapUrl && (
          <div className="mb-10">
            <img
              src={mapUrl}
              alt="Map of trip locations"
              crossOrigin="anonymous"
              className="w-full rounded-2xl border-4 border-white shadow-md"
            />
          </div>
        )}

        {/* Pins */}
        {pins.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 font-display text-2xl font-semibold">Places visited</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pins.map((pin) => (
                <li key={pin.id} className="rounded-xl bg-blush-50 px-3 py-2 text-sm">
                  <span className="font-medium">{pin.label}</span>
                  {(pin.city || pin.country) && (
                    <span className="text-plum-400">
                      {' '}
                      · {[pin.city, pin.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-6 font-display text-2xl font-semibold">Snapshots</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`w-40 rounded-sm bg-white p-2 pb-6 shadow-md ${rotations[i % rotations.length]}`}
                >
                  <img
                    src={photo.url}
                    alt=""
                    crossOrigin="anonymous"
                    className="h-36 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flights */}
        {flights.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 font-display text-2xl font-semibold">Flights</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {flights.map((flight) => (
                <li key={flight.id}>
                  <span className="font-medium">
                    {flight.from_airport} → {flight.to_airport}
                  </span>
                  {flight.airline && <span className="text-plum-400"> · {flight.airline}</span>}
                  {flight.date && <span className="text-plum-400"> · {flight.date}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bucket list */}
        {doneItems.length > 0 && (
          <div>
            <h2 className="mb-3 font-display text-2xl font-semibold">Bucket list, checked off</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {doneItems.map((item) => (
                <li key={item.id}>✓ {item.place_name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

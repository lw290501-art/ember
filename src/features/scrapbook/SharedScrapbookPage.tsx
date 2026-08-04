import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, Download, Film, Mic, Ticket } from 'lucide-react'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BucketListItem, Flight, JournalEntry, Media, Pin, Trip } from '../../types/database'
import { ScrapbookSwiper } from './ScrapbookSwiper'
import { StickerOverlay } from './Stickers'
import { PassportStamp } from '../flights/PassportStamp'
import { IllustratedWorldMap } from './IllustratedWorldMap'
import { formatDate, formatDateRange } from '../../lib/formatDate'

type SharedData = {
  trip: Trip
  pins: Pin[]
  flights: Flight[]
  doneItems: BucketListItem[]
  photos: (Media & { url?: string })[]
  journalEntries: JournalEntry[]
}

const typeMeta: Record<Media['type'], { icon: typeof Camera; label: string }> = {
  photo: { icon: Camera, label: '' },
  ticket: { icon: Ticket, label: 'Keepsake' },
  video: { icon: Film, label: '' },
  voice: { icon: Mic, label: '' },
}

export function SharedScrapbookPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<SharedData | null | undefined>(undefined)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return

      const { data: trip } = await supabase.from('trips').select('*').eq('share_token', token).maybeSingle()

      if (!trip) {
        setData(null)
        return
      }

      const [{ data: pins }, { data: flights }, { data: doneItems }, { data: media }, { data: journalEntries }] =
        await Promise.all([
          supabase.from('pins').select('*').eq('trip_id', trip.id).order('created_at', { ascending: true }),
          supabase.from('flights').select('*').eq('trip_id', trip.id).order('date', { ascending: true }),
          supabase.from('bucket_list_items').select('*').eq('trip_id', trip.id).eq('is_done', true),
          supabase
            .from('media')
            .select('*')
            .eq('trip_id', trip.id)
            .in('type', ['photo', 'ticket'])
            .order('created_at', { ascending: true }),
          supabase
            .from('journal_entries')
            .select('*')
            .eq('trip_id', trip.id)
            .order('entry_date', { ascending: true }),
        ])

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
        journalEntries: journalEntries ?? [],
      })
    }
    load()
  }, [token])

  const handleExport = async () => {
    if (!exportRef.current || !data) return
    setExporting(true)
    try {
      await exportElementToPdf(exportRef.current, `${data.trip.title.replace(/\s+/g, '-')}-scrapbook.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (data === undefined) return <p className="text-plum-400">Loading…</p>
  if (data === null) {
    return (
      <p className="text-plum-400">
        This scrapbook isn't shared, or the link has been revoked.
      </p>
    )
  }

  const { trip, pins, flights, doneItems, photos, journalEntries } = data
  const countries = [...new Set(pins.map((p) => p.country).filter((c): c is string => Boolean(c)))]

  // html2canvas (used for the PDF export) reliably chokes on the interactive
  // world map's ~180 SVG paths, so the export-only copy gets a plain badge
  // list instead — the live, on-screen version keeps the real map.
  const buildSlides = (forExport: boolean): ReactNode[] => {
    const built: ReactNode[] = []

    built.push(
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <StickerOverlay stickers={trip.cover_stickers} />
        <p className="mb-2 font-display text-sm italic text-blush-600">every memory starts as a spark</p>
        <h1 className="font-display text-4xl font-semibold text-plum-800">{trip.title}</h1>
        {(trip.start_date || trip.end_date) && (
          <p className="mt-2 text-plum-500">{formatDateRange(trip.start_date, trip.end_date)}</p>
        )}
        {trip.description && <p className="mt-3 text-plum-600">{trip.description}</p>}
        {countries.length > 0 && (
          <p className="mt-4 text-sm uppercase tracking-wide text-plum-400">{countries.join(' · ')}</p>
        )}
      </div>,
    )

    if (countries.length > 0 || pins.length > 0) {
      built.push(
        <div>
          {countries.length > 0 && (
            <div className="mb-4">
              {forExport ? (
                <div className="flex flex-wrap gap-1.5">
                  {countries.map((c) => (
                    <span key={c} className="rounded-full bg-lavender-100 px-2.5 py-1 text-xs text-plum-600">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <IllustratedWorldMap visitedCountries={countries} />
              )}
            </div>
          )}
          {pins.length > 0 && (
            <>
              <h2 className="mb-3 font-display text-xl font-semibold text-plum-800">Places visited</h2>
              <ul className="flex flex-col gap-2">
                {pins.map((pin) => (
                  <li key={pin.id} className="rounded-xl bg-blush-50 px-3 py-2 text-sm text-plum-800">
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
            </>
          )}
        </div>,
      )
    }

    photos.forEach((photo) => {
      built.push(
        <div className="flex h-full flex-col items-center justify-center">
          <div className="relative w-full rounded-sm bg-white p-3 pb-8 shadow-md">
            <StickerOverlay stickers={photo.stickers} />
            <img src={photo.url} alt="" crossOrigin="anonymous" className="max-h-64 w-full object-cover" />
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-plum-400">
            {(() => {
              const Icon = typeMeta[photo.type].icon
              return <Icon size={12} strokeWidth={2} />
            })()}
            {typeMeta[photo.type].label}
          </p>
          {photo.caption && <p className="mt-2 text-center text-sm italic text-plum-500">{photo.caption}</p>}
        </div>,
      )
    })

    journalEntries.forEach((entry) => {
      built.push(
        <div className="flex h-full flex-col justify-center">
          <div
            className="relative rounded-sm bg-white p-6 shadow-md dark:bg-plum-950"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(190, 24, 93, 0.08) 32px)',
            }}
          >
            <p className="font-display text-xs uppercase tracking-wide text-blush-500">
              {formatDate(entry.entry_date)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {entry.mood && <span className="text-xl leading-none">{entry.mood}</span>}
              {entry.title && (
                <h2 className="text-2xl font-semibold text-plum-800" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  {entry.title}
                </h2>
              )}
            </div>
            <p
              className="mt-3 whitespace-pre-wrap text-xl leading-8 text-plum-700"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {entry.content}
            </p>
          </div>
        </div>,
      )
    })

    if (flights.length > 0) {
      built.push(
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-plum-800">Passport</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {flights.map((flight, i) => (
              <PassportStamp key={flight.id} flight={flight} index={i} />
            ))}
          </div>
        </div>,
      )
    }

    if (doneItems.length > 0) {
      built.push(
        <div>
          <h2 className="mb-3 font-display text-xl font-semibold text-plum-800">Bucket list, checked off</h2>
          <ul className="flex flex-col gap-2 text-sm text-plum-800">
            {doneItems.map((item) => (
              <li key={item.id} className="rounded-xl bg-blush-50 px-3 py-2">
                ✓ {item.place_name}
              </li>
            ))}
          </ul>
        </div>,
      )
    }

    return built
  }

  const slides = buildSlides(false)
  const exportSlides = buildSlides(true)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-plum-400">Shared with you</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-full border border-blush-400 px-4 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 disabled:opacity-60 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          <Download size={16} strokeWidth={2} />
          {exporting ? 'Preparing PDF…' : 'Save as PDF'}
        </button>
      </div>

      <ScrapbookSwiper slides={slides} />

      {/* Off-screen full stack, used only to render the PDF export */}
      <div
        ref={exportRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] top-0 w-[700px] rounded-2xl bg-cream p-10"
      >
        {exportSlides.map((slide, i) => (
          <div key={i} className="relative mb-10 border-b border-blush-100 pb-10 last:border-0">
            {slide}
          </div>
        ))}
      </div>
    </div>
  )
}

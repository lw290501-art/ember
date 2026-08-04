import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Camera, Download, Film, Mic, Ticket } from 'lucide-react'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BucketListItem, Flight, Media, Pin, Trip } from '../../types/database'
import { ScrapbookSwiper } from './ScrapbookSwiper'
import { StickerOverlay, StickerPicker } from './Stickers'
import { PassportStamp } from '../flights/PassportStamp'
import { ScrapbookCanvas } from './canvas/ScrapbookCanvas'
import { IllustratedWorldMap } from './IllustratedWorldMap'
import { formatDateRange } from '../../lib/formatDate'

type ScrapbookData = {
  trip: Trip
  pins: Pin[]
  flights: Flight[]
  doneItems: BucketListItem[]
  photos: (Media & { url?: string })[]
}

const typeMeta: Record<Media['type'], { icon: typeof Camera; label: string }> = {
  photo: { icon: Camera, label: '' },
  ticket: { icon: Ticket, label: 'Keepsake' },
  video: { icon: Film, label: '' },
  voice: { icon: Mic, label: '' },
}

function EditableCaption({
  value,
  onSave,
  placeholder,
}: {
  value: string
  onSave: (next: string) => void
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  useEffect(() => setText(value), [value])

  if (editing) {
    return (
      <input
        autoFocus
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (text !== value) onSave(text)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className="mt-2 w-full rounded-lg border border-blush-200 bg-white px-2 py-1 text-center text-sm text-plum-700 focus:border-blush-400 focus:outline-none"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-2 w-full rounded-lg px-2 py-1 text-center text-sm italic text-plum-400 hover:bg-blush-50"
    >
      {value || placeholder}
    </button>
  )
}

export function ScrapbookPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuth()
  const [data, setData] = useState<ScrapbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!tripId) return
    setLoading(true)

    const [{ data: trip }, { data: pins }, { data: flights }, { data: doneItems }, { data: media }] =
      await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).single(),
        supabase.from('pins').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }),
        supabase.from('flights').select('*').eq('trip_id', tripId).order('date', { ascending: true }),
        supabase.from('bucket_list_items').select('*').eq('trip_id', tripId).eq('is_done', true),
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

    setData({ trip, pins: pins ?? [], flights: flights ?? [], doneItems: doneItems ?? [], photos })
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const updateTripStickers = async (next: string[]) => {
    if (!data) return
    setData({ ...data, trip: { ...data.trip, cover_stickers: next } })
    await supabase.from('trips').update({ cover_stickers: next }).eq('id', data.trip.id)
  }

  const updatePhoto = async (photoId: string, patch: Partial<Omit<Media, 'id' | 'trip_id'>>) => {
    if (!data) return
    setData({
      ...data,
      photos: data.photos.map((p) => (p.id === photoId ? { ...p, ...patch } : p)),
    })
    await supabase.from('media').update(patch).eq('id', photoId)
  }

  const handleAddPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user || !tripId) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const path = `${user.id}/${tripId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file)
      if (!uploadError) {
        await supabase.from('media').insert({
          trip_id: tripId,
          pin_id: null,
          type: 'photo',
          storage_path: path,
          caption: null,
          taken_at: null,
        })
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    load()
  }

  const handleExport = async () => {
    if (!exportRef.current || !data) return
    setExporting(true)
    try {
      await exportElementToPdf(exportRef.current, `${data.trip.title.replace(/\s+/g, '-')}-scrapbook.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-plum-400">Loading…</p>
  if (!data) return <p className="text-plum-400">Trip not found.</p>

  const { trip, pins, flights, doneItems, photos } = data
  const countries = [...new Set(pins.map((p) => p.country).filter((c): c is string => Boolean(c)))]

  // html2canvas (used for the PDF export) reliably chokes on the interactive
  // world map's ~180 SVG paths, so the export-only copy gets a plain badge
  // list instead — the live, on-screen version keeps the real map.
  const buildSlides = (forExport: boolean): ReactNode[] => {
    const built: ReactNode[] = []

    // Cover
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
        <div className="mt-6">
          <StickerPicker value={trip.cover_stickers ?? []} onChange={updateTripStickers} />
        </div>
      </div>,
    )

    // Freeform design-it-yourself page: drag photos and text anywhere.
    // Skipped in the export copy — it fetches its own data async and mutates
    // the DOM after mount, which breaks html2canvas mid-clone, and a
    // drag-anywhere canvas doesn't translate to a static PDF page anyway.
    if (!forExport) {
      built.push(
        <div className="flex h-full flex-col">
          <h2 className="mb-2 text-center font-display text-lg font-semibold text-plum-800">
            Design this page
          </h2>
          {tripId && <ScrapbookCanvas tripId={tripId} />}
        </div>,
      )
    }

    // Map + places
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

    // One slide per photo, editable
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
          <EditableCaption
            value={photo.caption ?? ''}
            placeholder="Add a caption…"
            onSave={(caption) => updatePhoto(photo.id, { caption })}
          />
          <div className="mt-3">
            <StickerPicker
              value={photo.stickers ?? []}
              onChange={(next) => updatePhoto(photo.id, { stickers: next })}
            />
          </div>
        </div>,
      )
    })

    // Add photo slide
    built.push(
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="mb-4 text-plum-500">Add another snapshot to this scrapbook</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-blush-400 px-4 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : '+ Add photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleAddPhoto(e.target.files)}
          className="hidden"
        />
      </div>,
    )

    // Flights, as passport stamps
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

    // Bucket list
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
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/trips/${trip.id}`}
          className="text-sm text-blush-600 hover:underline dark:text-blush-300"
        >
          ← Back to trip
        </Link>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-full border border-blush-400 px-4 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 disabled:opacity-60 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          <Download size={16} strokeWidth={2} />
          {exporting ? 'Preparing PDF…' : 'Save as PDF to send'}
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

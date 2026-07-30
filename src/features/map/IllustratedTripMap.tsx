import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { supabase } from '../../lib/supabase'
import { normalizeCountryName, useWorldCountries } from '../../lib/worldMap'
import type { Pin } from '../../types/database'
import { PinFormModal } from './PinFormModal'

const WIDTH = 800
const HEIGHT = 420

export function IllustratedTripMap({ tripId }: { tripId: string }) {
  const countries = useWorldCountries()
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [editingPin, setEditingPin] = useState<Pin | undefined>()
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  const loadPins = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pins')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
    setPins(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Zooms to the trip's own pins once it has any, otherwise shows the whole world.
  const projection = useMemo(() => {
    const proj = geoNaturalEarth1()

    if (pins.length === 0) {
      proj.fitSize([WIDTH, HEIGHT], { type: 'Sphere' } as never)
      return proj
    }

    const lngs = pins.map((p) => p.lng)
    const lats = pins.map((p) => p.lat)
    const spread = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats))

    if (spread < 0.5) {
      // A single pin (or a very tight cluster) has a near-zero bounding box,
      // which makes fitExtent's scale calculation degenerate (effectively
      // infinite), breaking both rendering and projection.invert(). Center
      // on the point with a fixed, sane "neighbourhood" zoom instead.
      const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2
      const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2
      proj
        .scale(2200)
        .translate([WIDTH / 2, HEIGHT / 2])
        .center([centerLng, centerLat])
    } else {
      const points = {
        type: 'FeatureCollection' as const,
        features: pins.map((p) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        })),
      }
      proj.fitExtent(
        [
          [50, 50],
          [WIDTH - 50, HEIGHT - 50],
        ],
        points as never,
      )
    }

    return proj
  }, [pins])

  const pathGenerator = useMemo(() => geoPath(projection), [projection])
  const visitedSet = useMemo(
    () => new Set(pins.map((p) => p.country).filter((c): c is string => Boolean(c)).map(normalizeCountryName)),
    [pins],
  )

  const deletePin = async (pin: Pin) => {
    if (!confirm(`Delete pin "${pin.label}"?`)) return
    setPins((prev) => prev.filter((p) => p.id !== pin.id))
    setSelectedPinId(null)
    await supabase.from('pins').delete().eq('id', pin.id)
  }

  const handleMapClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * HEIGHT
    const coords = projection.invert?.([x, y])
    if (!coords) return
    const [lng, lat] = coords
    setPendingCoords({ lat, lng })
  }

  if (!countries) {
    return (
      <div className="flex aspect-[800/420] w-full items-center justify-center rounded-2xl border-4 border-white bg-lavender-50 dark:border-plum-800 dark:bg-plum-900">
        <p className="text-sm text-plum-400">Loading map…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="map-frame mb-3 overflow-hidden rounded-2xl border-4 border-white bg-lavender-50 shadow-md dark:border-plum-800 dark:bg-plum-900">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full cursor-crosshair"
          onClick={handleMapClick}
        >
          {countries.map((c) => {
            const key = normalizeCountryName(c.properties.name)
            const isVisited = visitedSet.has(key)
            const isHovered = hoveredCountry === c.properties.name
            return (
              <path
                key={c.properties.name}
                d={pathGenerator(c as never) ?? ''}
                onMouseEnter={() => setHoveredCountry(c.properties.name)}
                onMouseLeave={() => setHoveredCountry(null)}
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
                }}
              />
            )
          })}
          {pins.map((pin) => {
            const pos = projection([pin.lng, pin.lat])
            if (!pos) return null
            const [x, y] = pos
            const isSelected = selectedPinId === pin.id
            return (
              <g
                key={pin.id}
                transform={`translate(${x}, ${y})`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPinId(isSelected ? null : pin.id)
                }}
                className="cursor-pointer"
              >
                <circle
                  r={isSelected ? 7 : 5}
                  fill="#c24770"
                  stroke="white"
                  strokeWidth={1.5}
                  style={{ transition: 'r 150ms ease' }}
                />
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mb-3 text-xs text-plum-400">Click anywhere on the map to drop a pin.</p>

      {loading ? (
        <p className="text-sm text-plum-400">Loading pins…</p>
      ) : pins.length === 0 ? (
        <p className="text-sm text-plum-400">No pins yet for this trip.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pins.map((pin) => (
            <li
              key={pin.id}
              className={`flex items-start gap-3 rounded-xl border bg-white p-3 dark:bg-plum-900 ${
                selectedPinId === pin.id
                  ? 'border-blush-400 dark:border-blush-500'
                  : 'border-blush-100 dark:border-plum-800'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-plum-800 dark:text-blush-50">
                  {pin.label}
                  {(pin.city || pin.country) && (
                    <span className="font-normal text-plum-400">
                      {' '}
                      · {[pin.city, pin.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </p>
                {pin.notes && <p className="text-sm text-plum-500 dark:text-plum-300">{pin.notes}</p>}
                {pin.visited_at && <p className="text-xs text-plum-400">Visited {pin.visited_at}</p>}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  onClick={() => setEditingPin(pin)}
                  className="text-plum-400 hover:text-plum-700 dark:hover:text-blush-200"
                >
                  Edit
                </button>
                <button onClick={() => deletePin(pin)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(pendingCoords || editingPin) && (
        <PinFormModal
          tripId={tripId}
          pin={editingPin}
          coords={pendingCoords ?? undefined}
          onClose={() => {
            setPendingCoords(null)
            setEditingPin(undefined)
          }}
          onSaved={() => {
            setPendingCoords(null)
            setEditingPin(undefined)
            loadPins()
          }}
        />
      )}
    </div>
  )
}

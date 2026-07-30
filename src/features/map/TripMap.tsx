import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import Map, { Marker, NavigationControl, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../../lib/supabase'
import { MAPBOX_TOKEN } from '../../lib/mapbox'
import type { Pin } from '../../types/database'
import { PinFormModal } from './PinFormModal'

export function TripMap({ tripId }: { tripId: string }) {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
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

  const deletePin = async (pin: Pin) => {
    if (!confirm(`Delete pin "${pin.label}"?`)) return
    setPins((prev) => prev.filter((p) => p.id !== pin.id))
    setSelectedPinId(null)
    await supabase.from('pins').delete().eq('id', pin.id)
  }

  const handleMapClick = (e: MapMouseEvent) => {
    setPendingCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })
  }

  if (!MAPBOX_TOKEN) {
    return (
      <p className="rounded-xl border border-lavender-200 bg-lavender-100 p-4 text-sm text-plum-600 dark:border-plum-700 dark:bg-plum-800 dark:text-lavender-200">
        Map disabled: add VITE_MAPBOX_TOKEN to your .env file to enable pinning
        places on the map.
      </p>
    )
  }

  const firstPin = pins[0]

  return (
    <div>
      <div className="map-frame mb-3 h-96 overflow-hidden rounded-2xl border-4 border-white shadow-md [&_.mapboxgl-canvas]:saturate-[1.35] [&_.mapboxgl-canvas]:contrast-[1.08] [&_.mapboxgl-canvas]:hue-rotate-[-3deg] dark:border-plum-800">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="mercator"
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          initialViewState={{
            longitude: firstPin?.lng ?? 0,
            latitude: firstPin?.lat ?? 20,
            zoom: firstPin ? 8 : 1.5,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
        >
          <NavigationControl position="top-left" showCompass={false} />
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              longitude={pin.lng}
              latitude={pin.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedPinId(pin.id === selectedPinId ? null : pin.id)
              }}
            >
              <div className="cursor-pointer text-blush-600 drop-shadow-md transition-transform hover:scale-125 dark:text-blush-400">
                <MapPin size={30} strokeWidth={2} fill="currentColor" stroke="white" />
              </div>
            </Marker>
          ))}
        </Map>
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

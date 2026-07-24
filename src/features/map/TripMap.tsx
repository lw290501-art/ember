import { useEffect, useState } from 'react'
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
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        Map disabled: add VITE_MAPBOX_TOKEN to your .env file to enable pinning
        places on the map.
      </p>
    )
  }

  const firstPin = pins[0]

  return (
    <div>
      <div className="mb-3 h-96 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: firstPin?.lng ?? 0,
            latitude: firstPin?.lat ?? 20,
            zoom: firstPin ? 8 : 1.5,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
        >
          <NavigationControl position="top-left" />
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
              <div className="cursor-pointer text-2xl leading-none drop-shadow">📍</div>
            </Marker>
          ))}
        </Map>
      </div>

      <p className="mb-3 text-xs text-gray-500">Click anywhere on the map to drop a pin.</p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading pins…</p>
      ) : pins.length === 0 ? (
        <p className="text-sm text-gray-500">No pins yet for this trip.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pins.map((pin) => (
            <li
              key={pin.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                selectedPinId === pin.id
                  ? 'border-teal-400 dark:border-teal-600'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">{pin.label}</p>
                {pin.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{pin.notes}</p>}
                {pin.visited_at && <p className="text-xs text-gray-500">Visited {pin.visited_at}</p>}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  onClick={() => setEditingPin(pin)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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

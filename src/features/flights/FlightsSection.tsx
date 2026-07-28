import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Flight } from '../../types/database'
import { FlightFormModal } from './FlightFormModal'

export function FlightsSection({ tripId }: { tripId: string }) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFlight, setEditingFlight] = useState<Flight | undefined>()

  const loadFlights = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
    setFlights(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadFlights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const deleteFlight = async (flight: Flight) => {
    if (!confirm(`Remove the ${flight.from_airport} → ${flight.to_airport} flight?`)) return
    setFlights((prev) => prev.filter((f) => f.id !== flight.id))
    await supabase.from('flights').delete().eq('id', flight.id)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
          Flights
        </h2>
        <button
          onClick={() => {
            setEditingFlight(undefined)
            setShowForm(true)
          }}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + Add
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-plum-400">Loading…</p>
      ) : flights.length === 0 ? (
        <p className="text-sm text-plum-400">No flights logged for this trip yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {flights.map((flight) => (
            <li
              key={flight.id}
              className="flex items-start gap-3 rounded-xl border border-blush-100 bg-white p-3 dark:border-plum-800 dark:bg-plum-900"
            >
              <div className="flex-1">
                <p className="font-medium text-plum-800 dark:text-blush-50">
                  {flight.from_airport} → {flight.to_airport}
                  {flight.airline && <span className="font-normal text-plum-400"> · {flight.airline}</span>}
                  {flight.flight_number && (
                    <span className="font-normal text-plum-400"> {flight.flight_number}</span>
                  )}
                </p>
                {flight.notes && (
                  <p className="text-sm text-plum-500 dark:text-plum-300">{flight.notes}</p>
                )}
                {flight.date && <p className="text-xs text-plum-400">{flight.date}</p>}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  onClick={() => {
                    setEditingFlight(flight)
                    setShowForm(true)
                  }}
                  className="text-plum-400 hover:text-plum-700 dark:hover:text-blush-200"
                >
                  Edit
                </button>
                <button onClick={() => deleteFlight(flight)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <FlightFormModal
          tripId={tripId}
          flight={editingFlight}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadFlights()
          }}
        />
      )}
    </section>
  )
}

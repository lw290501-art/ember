import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Flight } from '../../types/database'
import { FlightFormModal } from './FlightFormModal'
import { PassportStamp } from './PassportStamp'

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
          Passport
        </h2>
        <button
          onClick={() => {
            setEditingFlight(undefined)
            setShowForm(true)
          }}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + Add flight
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-plum-400">Loading…</p>
      ) : flights.length === 0 ? (
        <p className="text-sm text-plum-400">No flights logged for this trip yet — collect your first stamp.</p>
      ) : (
        <div className="rounded-2xl border border-blush-100 bg-cream p-5 dark:border-plum-800 dark:bg-plum-900">
          <div className="flex flex-wrap justify-center gap-4">
            {flights.map((flight, i) => (
              <div key={flight.id} className="group relative">
                <PassportStamp flight={flight} index={i} />
                <div className="absolute inset-x-0 -bottom-5 flex justify-center gap-2 text-xs opacity-0 transition group-hover:opacity-100">
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
              </div>
            ))}
          </div>
        </div>
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

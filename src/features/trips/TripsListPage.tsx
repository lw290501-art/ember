import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/database'
import { TripFormModal } from './TripFormModal'

const statusColors: Record<Trip['status'], string> = {
  planning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ongoing: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function TripsListPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadTrips = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
    setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadTrips()
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your trips</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
        >
          + New trip
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="text-gray-500">
          No trips yet. Create one to start pinning places, uploading media, and
          building your scrapbook.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="rounded-xl border border-gray-200 p-4 transition hover:border-teal-400 hover:shadow-sm dark:border-gray-800"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-medium">{trip.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status]}`}
                >
                  {trip.status}
                </span>
              </div>
              {trip.description && (
                <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {trip.description}
                </p>
              )}
              {(trip.start_date || trip.end_date) && (
                <p className="text-xs text-gray-500">
                  {trip.start_date ?? '?'} — {trip.end_date ?? '?'}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <TripFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadTrips()
          }}
        />
      )}
    </div>
  )
}

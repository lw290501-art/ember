import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/database'
import { TripFormModal } from './TripFormModal'

const statusColors: Record<Trip['status'], string> = {
  planning: 'bg-lavender-100 text-plum-600 dark:bg-plum-800 dark:text-lavender-200',
  ongoing: 'bg-blush-100 text-blush-700 dark:bg-blush-800/40 dark:text-blush-200',
  completed: 'bg-plum-50 text-plum-400 dark:bg-plum-800/60 dark:text-plum-300',
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
        <h1 className="font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
          Your trips
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-blush-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blush-700"
        >
          + New trip
        </button>
      </div>

      {loading ? (
        <p className="text-plum-400">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="text-plum-400">
          No trips yet. Create one to start pinning places, uploading media, and
          building your scrapbook.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="rounded-2xl border border-blush-100 bg-white p-4 shadow-sm transition hover:border-blush-300 hover:shadow-md dark:border-plum-800 dark:bg-plum-900"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-display font-medium text-plum-800 dark:text-blush-50">
                  {trip.title}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status]}`}
                >
                  {trip.status}
                </span>
              </div>
              {trip.description && (
                <p className="mb-2 line-clamp-2 text-sm text-plum-500 dark:text-plum-300">
                  {trip.description}
                </p>
              )}
              {(trip.start_date || trip.end_date) && (
                <p className="text-xs text-plum-400">
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

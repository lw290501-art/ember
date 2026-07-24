import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/database'
import { TripFormModal } from './TripFormModal'
import { BucketListSection } from '../bucketList/BucketListSection'
import { TripMap } from '../map/TripMap'
import { MediaSection } from '../media/MediaSection'

const statusColors: Record<Trip['status'], string> = {
  planning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ongoing: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const loadTrip = async () => {
    if (!tripId) return
    setLoading(true)
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    setTrip(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTrip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const deleteTrip = async () => {
    if (!trip || !confirm(`Delete "${trip.title}" and everything in it? This can't be undone.`))
      return
    await supabase.from('trips').delete().eq('id', trip.id)
    navigate('/trips')
  }

  if (loading) return <p className="text-gray-500">Loading…</p>
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link to="/trips" className="text-sm text-teal-600 hover:underline dark:text-teal-400">
          ← All trips
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{trip.title}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status]}`}>
                {trip.status}
              </span>
            </div>
            {trip.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{trip.description}</p>
            )}
            {(trip.start_date || trip.end_date) && (
              <p className="mt-1 text-sm text-gray-500">
                {trip.start_date ?? '?'} — {trip.end_date ?? '?'}
              </p>
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Edit
            </button>
            <button
              onClick={deleteTrip}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <BucketListSection tripId={trip.id} title="Bucket list for this trip" />
      <TripMap tripId={trip.id} />
      <MediaSection tripId={trip.id} />

      {showEdit && (
        <TripFormModal
          trip={trip}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShowEdit(false)
            setTrip(updated)
          }}
        />
      )}
    </div>
  )
}

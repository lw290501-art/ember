import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/database'
import { TripFormModal } from './TripFormModal'
import { BucketListSection } from '../bucketList/BucketListSection'
import { TripMap } from '../map/TripMap'
import { MediaSection } from '../media/MediaSection'
import { FlightsSection } from '../flights/FlightsSection'

const statusColors: Record<Trip['status'], string> = {
  planning: 'bg-lavender-100 text-plum-600 dark:bg-plum-800 dark:text-lavender-200',
  ongoing: 'bg-blush-100 text-blush-700 dark:bg-blush-800/40 dark:text-blush-200',
  completed: 'bg-plum-50 text-plum-400 dark:bg-plum-800/60 dark:text-plum-300',
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

  if (loading) return <p className="text-plum-400">Loading…</p>
  if (!trip) return <p className="text-plum-400">Trip not found.</p>

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link to="/trips" className="text-sm text-blush-600 hover:underline dark:text-blush-300">
          ← All trips
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
                {trip.title}
              </h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status]}`}>
                {trip.status}
              </span>
            </div>
            {trip.description && (
              <p className="mt-1 text-plum-500 dark:text-plum-300">{trip.description}</p>
            )}
            {(trip.start_date || trip.end_date) && (
              <p className="mt-1 text-sm text-plum-400">
                {trip.start_date ?? '?'} — {trip.end_date ?? '?'}
              </p>
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-full border border-blush-200 px-3 py-1.5 text-plum-600 hover:bg-blush-50 dark:border-plum-700 dark:text-blush-100 dark:hover:bg-plum-800"
            >
              Edit
            </button>
            <button
              onClick={deleteTrip}
              className="rounded-full border border-red-200 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <BucketListSection tripId={trip.id} title="Bucket list for this trip" />
      <TripMap tripId={trip.id} />
      <FlightsSection tripId={trip.id} />
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

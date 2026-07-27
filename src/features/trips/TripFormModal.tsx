import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Modal } from '../../components/Modal'
import type { Trip, TripStatus } from '../../types/database'

export function TripFormModal({
  trip,
  onClose,
  onSaved,
}: {
  trip?: Trip
  onClose: () => void
  onSaved: (trip: Trip) => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState(trip?.title ?? '')
  const [description, setDescription] = useState(trip?.description ?? '')
  const [startDate, setStartDate] = useState(trip?.start_date ?? '')
  const [endDate, setEndDate] = useState(trip?.end_date ?? '')
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? 'planning')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const payload = {
      title,
      description: description || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
    }

    const query = trip
      ? supabase.from('trips').update(payload).eq('id', trip.id).select().single()
      : supabase
          .from('trips')
          .insert({ ...payload, user_id: user.id, cover_photo_url: null })
          .select()
          .single()

    const { data, error } = await query
    setSubmitting(false)

    if (error || !data) {
      setError(error?.message ?? 'Something went wrong')
      return
    }
    onSaved(data)
  }

  return (
    <Modal title={trip ? 'Edit trip' : 'New trip'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Trip title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <div className="flex gap-3">
          <label className="flex-1 text-sm">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
            />
          </label>
          <label className="flex-1 text-sm">
            End date
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
            />
          </label>
        </div>
        <label className="text-sm">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TripStatus)}
            className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          >
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : trip ? 'Save changes' : 'Create trip'}
        </button>
      </form>
    </Modal>
  )
}

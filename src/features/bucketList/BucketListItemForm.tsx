import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Modal } from '../../components/Modal'
import type { BucketListItem, Trip } from '../../types/database'

export function BucketListItemForm({
  item,
  fixedTripId,
  trips,
  onClose,
  onSaved,
}: {
  item?: BucketListItem
  fixedTripId?: string
  trips?: Trip[]
  onClose: () => void
  onSaved: (item: BucketListItem) => void
}) {
  const { user } = useAuth()
  const [placeName, setPlaceName] = useState(item?.place_name ?? '')
  const [country, setCountry] = useState(item?.country ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [tripId, setTripId] = useState(fixedTripId ?? item?.trip_id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const payload = {
      place_name: placeName,
      country: country || null,
      notes: notes || null,
      trip_id: tripId || null,
    }

    const query = item
      ? supabase.from('bucket_list_items').update(payload).eq('id', item.id).select().single()
      : supabase
          .from('bucket_list_items')
          .insert({ ...payload, user_id: user.id, is_done: false, lat: null, lng: null })
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
    <Modal title={item ? 'Edit bucket list item' : 'Add to bucket list'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="Place name"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          placeholder="Country (optional)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        {!fixedTripId && trips && trips.length > 0 && (
          <label className="text-sm">
            Link to a trip (optional)
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">No trip (someday list)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : item ? 'Save changes' : 'Add item'}
        </button>
      </form>
    </Modal>
  )
}

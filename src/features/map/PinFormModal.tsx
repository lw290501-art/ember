import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/Modal'
import type { Pin } from '../../types/database'

export function PinFormModal({
  tripId,
  pin,
  coords,
  onClose,
  onSaved,
}: {
  tripId: string
  pin?: Pin
  coords?: { lat: number; lng: number }
  onClose: () => void
  onSaved: (pin: Pin) => void
}) {
  const [label, setLabel] = useState(pin?.label ?? '')
  const [notes, setNotes] = useState(pin?.notes ?? '')
  const [visitedAt, setVisitedAt] = useState(pin?.visited_at ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const lat = pin?.lat ?? coords?.lat
  const lng = pin?.lng ?? coords?.lng

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lat === undefined || lng === undefined) return
    setSubmitting(true)
    setError(null)

    const payload = { label, notes: notes || null, visited_at: visitedAt || null }

    const query = pin
      ? supabase.from('pins').update(payload).eq('id', pin.id).select().single()
      : supabase
          .from('pins')
          .insert({ ...payload, trip_id: tripId, lat, lng })
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
    <Modal title={pin ? 'Edit pin' : 'Add pin'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {lat !== undefined && lng !== undefined && (
          <p className="text-xs text-gray-500">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        )}
        <input
          required
          placeholder="Label (e.g. Eiffel Tower)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <label className="text-sm">
          Visited on
          <input
            type="date"
            value={visitedAt ?? ''}
            onChange={(e) => setVisitedAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : pin ? 'Save changes' : 'Add pin'}
        </button>
      </form>
    </Modal>
  )
}

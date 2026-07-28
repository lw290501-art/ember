import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { reverseGeocode } from '../../lib/mapbox'
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
  const [country, setCountry] = useState(pin?.country ?? '')
  const [city, setCity] = useState(pin?.city ?? '')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const lat = pin?.lat ?? coords?.lat
  const lng = pin?.lng ?? coords?.lng

  // Prefill country/city from the dropped coordinates so users don't have to
  // type them in — only for brand-new pins, never overwriting an edit.
  useEffect(() => {
    if (pin || lat === undefined || lng === undefined) return
    setLocating(true)
    reverseGeocode(lat, lng)
      .then(({ country, city }) => {
        if (country) setCountry(country)
        if (city) setCity(city)
      })
      .finally(() => setLocating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lat === undefined || lng === undefined) return
    setSubmitting(true)
    setError(null)

    const payload = {
      label,
      notes: notes || null,
      visited_at: visitedAt || null,
      country: country || null,
      city: city || null,
    }

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
          <p className="text-xs text-plum-400">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        )}
        <input
          required
          placeholder="Label (e.g. Eiffel Tower)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <div className="flex gap-3">
          <input
            placeholder={locating ? 'Finding country…' : 'Country'}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
          <input
            placeholder={locating ? 'Finding city…' : 'City'}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </div>
        <label className="text-sm">
          Visited on
          <input
            type="date"
            value={visitedAt ?? ''}
            onChange={(e) => setVisitedAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </label>
        {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : pin ? 'Save changes' : 'Add pin'}
        </button>
      </form>
    </Modal>
  )
}

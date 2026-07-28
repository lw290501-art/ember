import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/Modal'
import type { Flight } from '../../types/database'

export function FlightFormModal({
  tripId,
  flight,
  onClose,
  onSaved,
}: {
  tripId: string
  flight?: Flight
  onClose: () => void
  onSaved: (flight: Flight) => void
}) {
  const [airline, setAirline] = useState(flight?.airline ?? '')
  const [flightNumber, setFlightNumber] = useState(flight?.flight_number ?? '')
  const [fromAirport, setFromAirport] = useState(flight?.from_airport ?? '')
  const [toAirport, setToAirport] = useState(flight?.to_airport ?? '')
  const [date, setDate] = useState(flight?.date ?? '')
  const [notes, setNotes] = useState(flight?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      airline: airline || null,
      flight_number: flightNumber || null,
      from_airport: fromAirport,
      to_airport: toAirport,
      date: date || null,
      notes: notes || null,
    }

    const query = flight
      ? supabase.from('flights').update(payload).eq('id', flight.id).select().single()
      : supabase
          .from('flights')
          .insert({ ...payload, trip_id: tripId })
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
    <Modal title={flight ? 'Edit flight' : 'Add flight'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            required
            placeholder="From (e.g. LHR)"
            value={fromAirport}
            onChange={(e) => setFromAirport(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
          <input
            required
            placeholder="To (e.g. JFK)"
            value={toAirport}
            onChange={(e) => setToAirport(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Airline (optional)"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
          <input
            placeholder="Flight # (optional)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </div>
        <label className="text-sm">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </label>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : flight ? 'Save changes' : 'Add flight'}
        </button>
      </form>
    </Modal>
  )
}

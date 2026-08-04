import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/Modal'
import type { JournalEntry } from '../../types/database'

const MOODS = ['✨', '😊', '😍', '😌', '🥲', '😅', '😴', '🥳']

export function JournalEntryForm({
  tripId,
  entry,
  onClose,
  onSaved,
}: {
  tripId: string
  entry?: JournalEntry
  onClose: () => void
  onSaved: (entry: JournalEntry) => void
}) {
  const [entryDate, setEntryDate] = useState(entry?.entry_date ?? new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [mood, setMood] = useState(entry?.mood ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      entry_date: entryDate,
      title: title || null,
      content,
      mood: mood || null,
    }

    const query = entry
      ? supabase.from('journal_entries').update(payload).eq('id', entry.id).select().single()
      : supabase
          .from('journal_entries')
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
    <Modal title={entry ? 'Edit entry' : 'New journal entry'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm">
          Date
          <input
            required
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
          />
        </label>
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <textarea
          required
          placeholder="What happened today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <div>
          <p className="mb-1.5 text-sm text-plum-500 dark:text-plum-300">Mood</p>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? '' : m)}
                className={`rounded-full border px-2.5 py-1.5 text-lg leading-none transition ${
                  mood === m
                    ? 'border-blush-400 bg-blush-50 dark:border-blush-300 dark:bg-plum-800'
                    : 'border-blush-100 hover:bg-blush-50 dark:border-plum-700 dark:hover:bg-plum-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : entry ? 'Save changes' : 'Add entry'}
        </button>
      </form>
    </Modal>
  )
}

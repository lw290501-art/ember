import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { JournalEntry } from '../../types/database'
import { JournalEntryForm } from './JournalEntryForm'
import { formatDate } from '../../lib/formatDate'

export function JournalSection({ tripId }: { tripId: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>()

  const loadEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('trip_id', tripId)
      .order('entry_date', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const deleteEntry = async (entry: JournalEntry) => {
    if (!confirm(`Delete this journal entry${entry.title ? ` "${entry.title}"` : ''}?`)) return
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    await supabase.from('journal_entries').delete().eq('id', entry.id)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-plum-800 dark:text-blush-50">Journal</h2>
        <button
          onClick={() => {
            setEditingEntry(undefined)
            setShowForm(true)
          }}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + New entry
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-plum-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-plum-400">
          No journal entries yet — write down how today felt, not just where you went.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group relative rounded-2xl border border-blush-100 bg-cream p-4 dark:border-plum-800 dark:bg-plum-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-plum-400">{formatDate(entry.entry_date)}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {entry.mood && <span className="text-lg leading-none">{entry.mood}</span>}
                    {entry.title && (
                      <h3 className="font-display text-base font-semibold text-plum-800 dark:text-blush-50">
                        {entry.title}
                      </h3>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 text-xs opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditingEntry(entry)
                      setShowForm(true)
                    }}
                    className="text-plum-400 hover:text-plum-700 dark:hover:text-blush-200"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteEntry(entry)} className="text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-plum-600 dark:text-plum-300">{entry.content}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <JournalEntryForm
          tripId={tripId}
          entry={editingEntry}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadEntries()
          }}
        />
      )}
    </section>
  )
}

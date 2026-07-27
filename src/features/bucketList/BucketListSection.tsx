import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { BucketListItem, Trip } from '../../types/database'
import { BucketListItemForm } from './BucketListItemForm'

export function BucketListSection({
  tripId,
  trips,
  title = 'Bucket list',
}: {
  /** When set, only shows/creates items tied to this trip. */
  tripId?: string
  /** Trips available to assign an item to, only used when tripId isn't fixed. */
  trips?: Trip[]
  title?: string
}) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketListItem | undefined>()

  const loadItems = async () => {
    setLoading(true)
    let query = supabase.from('bucket_list_items').select('*').order('created_at', { ascending: false })
    if (tripId) query = query.eq('trip_id', tripId)
    const { data } = await query
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const toggleDone = async (item: BucketListItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)),
    )
    await supabase
      .from('bucket_list_items')
      .update({ is_done: !item.is_done })
      .eq('id', item.id)
  }

  const deleteItem = async (item: BucketListItem) => {
    if (!confirm(`Remove "${item.place_name}" from your bucket list?`)) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    await supabase.from('bucket_list_items').delete().eq('id', item.id)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
          {title}
        </h2>
        <button
          onClick={() => {
            setEditingItem(undefined)
            setShowForm(true)
          }}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + Add
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-plum-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-plum-400">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-blush-100 bg-white p-3 dark:border-plum-800 dark:bg-plum-900"
            >
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => toggleDone(item)}
                className="mt-1 h-4 w-4 accent-blush-500"
              />
              <div className="flex-1">
                <p className={item.is_done ? 'text-plum-300 line-through' : 'font-medium text-plum-800 dark:text-blush-50'}>
                  {item.place_name}
                  {item.country && <span className="text-plum-400"> · {item.country}</span>}
                </p>
                {item.notes && (
                  <p className="text-sm text-plum-500 dark:text-plum-300">{item.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setShowForm(true)
                  }}
                  className="text-plum-400 hover:text-plum-700 dark:hover:text-blush-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <BucketListItemForm
          item={editingItem}
          fixedTripId={tripId}
          trips={trips}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadItems()
          }}
        />
      )}
    </section>
  )
}

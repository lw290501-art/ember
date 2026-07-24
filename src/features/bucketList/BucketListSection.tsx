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
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={() => {
            setEditingItem(undefined)
            setShowForm(true)
          }}
          className="rounded-lg border border-teal-600 px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20"
        >
          + Add
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => toggleDone(item)}
                className="mt-1 h-4 w-4 accent-teal-600"
              />
              <div className="flex-1">
                <p className={item.is_done ? 'text-gray-400 line-through' : 'font-medium'}>
                  {item.place_name}
                  {item.country && <span className="text-gray-500"> · {item.country}</span>}
                </p>
                {item.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setShowForm(true)
                  }}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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

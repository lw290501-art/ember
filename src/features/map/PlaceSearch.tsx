import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { suggestPlaces, retrievePlace, type PlaceSuggestion } from '../../lib/mapbox'

export function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: { name: string; lat: number; lng: number }) => void
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionToken = useRef(crypto.randomUUID())

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await suggestPlaces(query, sessionToken.current)
      setSuggestions(results)
      setLoading(false)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handlePick = async (s: PlaceSuggestion) => {
    setResolving(s.id)
    const coords = await retrievePlace(s.id, sessionToken.current)
    setResolving(null)
    // Each suggest→retrieve pair is one billing session — start a fresh token
    // for the next search, per Mapbox's guidance.
    sessionToken.current = crypto.randomUUID()
    if (!coords) return
    onSelect({ name: s.name, lat: coords.lat, lng: coords.lng })
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative mb-3">
      <div className="flex items-center gap-2 rounded-full border border-blush-200 bg-white px-3 py-2 focus-within:border-blush-400 dark:border-plum-700 dark:bg-plum-800">
        <Search size={16} strokeWidth={2} className="shrink-0 text-plum-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for a place to pin exactly (e.g. Eiffel Tower)"
          className="w-full bg-transparent text-sm text-plum-800 placeholder:text-plum-300 focus:outline-none dark:text-blush-50 dark:placeholder:text-plum-400"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-blush-100 bg-white shadow-lg dark:border-plum-700 dark:bg-plum-800">
          {loading ? (
            <p className="px-3 py-2 text-sm text-plum-400">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-plum-400">No matches yet, keep typing…</p>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={resolving === s.id}
                onClick={() => handlePick(s)}
                className="block w-full px-3 py-2 text-left text-sm text-plum-700 hover:bg-blush-50 disabled:opacity-60 dark:text-blush-100 dark:hover:bg-plum-700"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-plum-400"> · {s.placeName}</span>
                {resolving === s.id && <span className="text-plum-400"> — locating…</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

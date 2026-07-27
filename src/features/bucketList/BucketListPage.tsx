import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/database'
import { BucketListSection } from './BucketListSection'

export function BucketListPage() {
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data ?? []))
  }, [])

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-plum-800 dark:text-blush-50">
        Travel bucket list
      </h1>
      <BucketListSection trips={trips} title="Everywhere you want to go" />
    </div>
  )
}

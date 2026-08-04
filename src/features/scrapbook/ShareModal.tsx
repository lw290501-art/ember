import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/Modal'
import type { Trip } from '../../types/database'

export function ShareModal({
  trip,
  onClose,
  onUpdated,
}: {
  trip: Trip
  onClose: () => void
  onUpdated: (trip: Trip) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = trip.share_token ? `${window.location.origin}/shared/${trip.share_token}` : null

  const enableSharing = async () => {
    setSubmitting(true)
    const { data } = await supabase
      .from('trips')
      .update({ share_token: crypto.randomUUID() })
      .eq('id', trip.id)
      .select()
      .single()
    setSubmitting(false)
    if (data) onUpdated(data)
  }

  const disableSharing = async () => {
    if (!confirm('Stop sharing this scrapbook? The current link will stop working.')) return
    setSubmitting(true)
    const { data } = await supabase
      .from('trips')
      .update({ share_token: null })
      .eq('id', trip.id)
      .select()
      .single()
    setSubmitting(false)
    if (data) onUpdated(data)
  }

  const copyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Share this scrapbook" onClose={onClose}>
      {shareUrl ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-plum-500 dark:text-plum-300">
            Anyone with this link can view a read-only version of this scrapbook — no account needed.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-xl border border-blush-200 bg-white px-3 py-2 text-sm text-plum-800 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50"
            />
            <button
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blush-400 px-3 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
            >
              {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={disableSharing}
            disabled={submitting}
            className="mt-2 self-start text-sm text-red-500 hover:text-red-700 disabled:opacity-60"
          >
            Stop sharing
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-plum-500 dark:text-plum-300">
            Create a link so friends can view this scrapbook without an account. You can stop sharing at any
            time.
          </p>
          <button
            onClick={enableSharing}
            disabled={submitting}
            className="rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create share link'}
          </button>
        </div>
      )}
    </Modal>
  )
}

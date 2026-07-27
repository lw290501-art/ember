import { useEffect, useRef, useState } from 'react'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Media, MediaType } from '../../types/database'
import { VoiceRecorder } from './VoiceRecorder'

const typeLabels: Record<MediaType, string> = {
  photo: '📷 Photo',
  video: '🎬 Video',
  voice: '🎙️ Voice note',
  ticket: '🎟️ Ticket',
}

export function MediaSection({ tripId }: { tripId: string }) {
  const { user } = useAuth()
  const [items, setItems] = useState<(Media & { url?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<Extract<MediaType, 'photo' | 'video' | 'ticket'>>(
    'photo',
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    const rows = data ?? []
    if (rows.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const { data: signed } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(
        rows.map((r) => r.storage_path),
        3600,
      )

    const urlByPath = new Map(
      (signed ?? []).map((s) => [s.path, s.signedUrl ?? undefined]),
    )
    setItems(rows.map((r) => ({ ...r, url: urlByPath.get(r.storage_path) })))
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const uploadFile = async (file: Blob, type: MediaType, filename: string) => {
    if (!user) return
    setUploading(true)
    setError(null)

    const path = `${user.id}/${tripId}/${crypto.randomUUID()}-${filename}`
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('media').insert({
      trip_id: tripId,
      pin_id: null,
      type,
      storage_path: path,
      caption: null,
      taken_at: null,
    })
    setUploading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    loadMedia()
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      await uploadFile(file, uploadType, file.name)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const deleteMedia = async (item: Media) => {
    if (!confirm('Delete this item?')) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path])
    await supabase.from('media').delete().eq('id', item.id)
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
        Photos, videos & mementos
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as typeof uploadType)}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-sm text-plum-800 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50"
        >
          <option value="photo">Photo</option>
          <option value="video">Video</option>
          <option value="ticket">Ticket / document</option>
        </select>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-blush-400 px-3 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 disabled:opacity-60 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          {uploading ? 'Uploading…' : '+ Upload files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={uploadType === 'video' ? 'video/*' : 'image/*'}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <VoiceRecorder
          onRecorded={(blob) => uploadFile(blob, 'voice', `voice-note-${Date.now()}.webm`)}
        />
      </div>

      {error && <p className="mb-3 text-sm text-blush-700 dark:text-blush-300">{error}</p>}

      {loading ? (
        <p className="text-sm text-plum-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-plum-400">Nothing uploaded yet for this trip.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-blush-100 dark:border-plum-800"
            >
              {item.type === 'photo' || item.type === 'ticket' ? (
                <img src={item.url} alt="" className="h-32 w-full object-cover" />
              ) : item.type === 'video' ? (
                <video src={item.url} controls className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-blush-50 p-2 dark:bg-plum-900">
                  <audio src={item.url} controls className="w-full" />
                </div>
              )}
              <div className="flex items-center justify-between bg-white/90 px-2 py-1 text-xs text-plum-600 dark:bg-plum-900/90 dark:text-plum-200">
                <span>{typeLabels[item.type]}</span>
                <button
                  onClick={() => deleteMedia(item)}
                  className="text-red-500 opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

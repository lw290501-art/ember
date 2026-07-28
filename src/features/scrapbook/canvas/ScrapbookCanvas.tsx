import { useEffect, useRef, useState } from 'react'
import { supabase, MEDIA_BUCKET } from '../../../lib/supabase'
import type { Media, ScrapbookBlock } from '../../../types/database'
import { DraggableBlock } from './DraggableBlock'
import { PhotoPickerModal } from './PhotoPickerModal'
import { TextBlockForm } from './TextBlockForm'

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

export function ScrapbookCanvas({ tripId }: { tripId: string }) {
  const [blocks, setBlocks] = useState<ScrapbookBlock[]>([])
  const [photos, setPhotos] = useState<(Media & { url?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [showTextForm, setShowTextForm] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    const [{ data: blockRows }, { data: mediaRows }] = await Promise.all([
      supabase
        .from('scrapbook_blocks')
        .select('*')
        .eq('trip_id', tripId)
        .order('z_index', { ascending: true }),
      supabase
        .from('media')
        .select('*')
        .eq('trip_id', tripId)
        .eq('type', 'photo')
        .order('created_at', { ascending: true }),
    ])

    const rows = mediaRows ?? []
    let withUrls: (Media & { url?: string })[] = []
    if (rows.length > 0) {
      const { data: signed } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrls(
          rows.map((r) => r.storage_path),
          3600,
        )
      const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl ?? undefined]))
      withUrls = rows.map((r) => ({ ...r, url: urlByPath.get(r.storage_path) }))
    }

    setBlocks(blockRows ?? [])
    setPhotos(withUrls)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const moveBlockLocal = (id: string, x: number, y: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, x, y } : b)))
  }

  const persistBlockPosition = async (id: string) => {
    const block = blocks.find((b) => b.id === id)
    if (!block) return
    await supabase.from('scrapbook_blocks').update({ x: block.x, y: block.y }).eq('id', id)
  }

  const bringToFront = async (id: string) => {
    const maxZ = blocks.reduce((max, b) => Math.max(max, b.z_index), 0)
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, z_index: maxZ + 1 } : b)))
    await supabase.from('scrapbook_blocks').update({ z_index: maxZ + 1 }).eq('id', id)
  }

  const deleteBlock = async (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('scrapbook_blocks').delete().eq('id', id)
  }

  const addPhotoBlock = async (mediaId: string) => {
    const maxZ = blocks.reduce((max, b) => Math.max(max, b.z_index), 0)
    const { data } = await supabase
      .from('scrapbook_blocks')
      .insert({
        trip_id: tripId,
        type: 'photo',
        media_id: mediaId,
        x: randomBetween(5, 55),
        y: randomBetween(5, 55),
        width: 35,
        rotation: randomBetween(-10, 10),
        z_index: maxZ + 1,
      })
      .select()
      .single()
    if (data) setBlocks((prev) => [...prev, data])
    setShowPhotoPicker(false)
  }

  const addTextBlock = async (text: string, font: string, color: string) => {
    const maxZ = blocks.reduce((max, b) => Math.max(max, b.z_index), 0)
    const { data } = await supabase
      .from('scrapbook_blocks')
      .insert({
        trip_id: tripId,
        type: 'text',
        text_content: text,
        font,
        color,
        x: randomBetween(10, 45),
        y: randomBetween(10, 45),
        width: 45,
        rotation: randomBetween(-6, 6),
        z_index: maxZ + 1,
      })
      .select()
      .single()
    if (data) setBlocks((prev) => [...prev, data])
    setShowTextForm(false)
  }

  if (loading) return <p className="text-sm text-plum-400">Loading…</p>

  return (
    <div className="flex h-full flex-col">
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden rounded-xl border-2 border-dashed border-blush-200 bg-blush-50/40"
      >
        {blocks.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-plum-400">
            Add photos and text, then drag them anywhere on the page
          </p>
        )}
        {blocks.map((block) => (
          <DraggableBlock
            key={block.id}
            x={block.x}
            y={block.y}
            width={block.width}
            rotation={block.rotation}
            zIndex={block.z_index}
            canvasRef={canvasRef}
            onMove={(x, y) => moveBlockLocal(block.id, x, y)}
            onMoveEnd={() => persistBlockPosition(block.id)}
            onDelete={() => deleteBlock(block.id)}
            onFocus={() => bringToFront(block.id)}
          >
            {block.type === 'photo' ? (
              <div className="rounded-sm bg-white p-1.5 pb-4 shadow-md">
                <img
                  src={photos.find((p) => p.id === block.media_id)?.url}
                  alt=""
                  crossOrigin="anonymous"
                  className="aspect-square w-full rounded-sm object-cover"
                  draggable={false}
                />
              </div>
            ) : (
              <p
                className="px-1 text-lg leading-snug"
                style={{ fontFamily: block.font ?? undefined, color: block.color ?? undefined }}
              >
                {block.text_content}
              </p>
            )}
          </DraggableBlock>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-3">
        <button
          onClick={() => setShowPhotoPicker(true)}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + Photo
        </button>
        <button
          onClick={() => setShowTextForm(true)}
          className="rounded-full border border-blush-400 px-3 py-1.5 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          + Text
        </button>
      </div>

      {showPhotoPicker && (
        <PhotoPickerModal
          photos={photos}
          onPick={addPhotoBlock}
          onClose={() => setShowPhotoPicker(false)}
        />
      )}
      {showTextForm && (
        <TextBlockForm onSave={addTextBlock} onClose={() => setShowTextForm(false)} />
      )}
    </div>
  )
}

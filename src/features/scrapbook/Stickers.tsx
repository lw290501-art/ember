export const STICKER_OPTIONS = ['🎀', '⭐', '💕', '🌸', '✨', '🧸', '🦋', '🍒']

const cornerPositions = ['-top-3 -left-3', '-top-3 -right-3', '-bottom-3 -left-3', '-bottom-3 -right-3']

/** Renders up to 4 stickers pinned to the corners of a `relative` parent. */
export function StickerOverlay({ stickers }: { stickers: string[] | null | undefined }) {
  if (!stickers || stickers.length === 0) return null
  return (
    <>
      {stickers.slice(0, 4).map((s, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute ${cornerPositions[i]} text-2xl drop-shadow`}
        >
          {s}
        </span>
      ))}
    </>
  )
}

export function StickerPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (sticker: string) => {
    const next = value.includes(sticker)
      ? value.filter((s) => s !== sticker)
      : [...value, sticker].slice(-4)
    onChange(next)
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {STICKER_OPTIONS.map((sticker) => (
        <button
          key={sticker}
          type="button"
          onClick={() => toggle(sticker)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition ${
            value.includes(sticker)
              ? 'bg-blush-200 dark:bg-blush-700'
              : 'bg-blush-50 hover:bg-blush-100 dark:bg-plum-800 dark:hover:bg-plum-700'
          }`}
        >
          {sticker}
        </button>
      ))}
    </div>
  )
}

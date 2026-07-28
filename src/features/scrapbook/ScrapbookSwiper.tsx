import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

export function ScrapbookSwiper({ slides }: { slides: ReactNode[] }) {
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const widthRef = useRef(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(slides.length - 1, i)))

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Let clicks on real controls (captions, sticker pickers, upload button)
    // behave normally — capturing the pointer here would swallow their click.
    if ((e.target as HTMLElement).closest('button, input, textarea, select, a')) return

    setDragging(true)
    startX.current = e.clientX
    widthRef.current = containerRef.current?.offsetWidth ?? 1
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragOffset(e.clientX - startX.current)
  }

  const endDrag = () => {
    if (!dragging) return
    const thresholdPx = widthRef.current * 0.18
    if (dragOffset < -thresholdPx) goTo(index + 1)
    else if (dragOffset > thresholdPx) goTo(index - 1)
    setDragOffset(0)
    setDragging(false)
  }

  const dragPercent = (dragOffset / widthRef.current) * 100

  return (
    <div>
      <div
        ref={containerRef}
        className="relative mx-auto aspect-[3/4] w-full max-w-md touch-pan-y select-none overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragging ? dragPercent : 0}%))`,
            transition: dragging ? 'none' : 'transform 350ms ease',
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="h-full w-full shrink-0 overflow-y-auto p-6">
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="rounded-full border border-blush-300 px-3 py-1.5 text-blush-600 hover:bg-blush-50 disabled:opacity-30 dark:border-plum-700 dark:text-blush-200 dark:hover:bg-plum-800"
          aria-label="Previous page"
        >
          ‹
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              className={`h-2 w-2 rounded-full transition ${
                i === index ? 'bg-blush-600 dark:bg-blush-300' : 'bg-blush-200 dark:bg-plum-700'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
          className="rounded-full border border-blush-300 px-3 py-1.5 text-blush-600 hover:bg-blush-50 disabled:opacity-30 dark:border-plum-700 dark:text-blush-200 dark:hover:bg-plum-800"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-plum-400">
        Swipe, drag, or use the arrows to flip through
      </p>
    </div>
  )
}

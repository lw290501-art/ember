import { useRef, type PointerEvent, type ReactNode, type RefObject } from 'react'

export function DraggableBlock({
  x,
  y,
  width,
  rotation,
  zIndex,
  canvasRef,
  onMove,
  onMoveEnd,
  onDelete,
  onFocus,
  children,
}: {
  x: number
  y: number
  width: number
  rotation: number
  zIndex: number
  canvasRef: RefObject<HTMLDivElement | null>
  onMove: (x: number, y: number) => void
  onMoveEnd: () => void
  onDelete: () => void
  onFocus: () => void
  children: ReactNode
}) {
  const draggingRef = useRef(false)
  const startPointer = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x, y })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    // Stop the swipeable scrapbook viewer from also treating this as a
    // page-turn drag — this element handles its own 2D dragging.
    e.stopPropagation()
    onFocus()
    draggingRef.current = true
    startPointer.current = { x: e.clientX, y: e.clientY }
    startPos.current = { x, y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const dxPct = ((e.clientX - startPointer.current.x) / rect.width) * 100
    const dyPct = ((e.clientY - startPointer.current.y) / rect.height) * 100
    const newX = Math.min(92, Math.max(0, startPos.current.x + dxPct))
    const newY = Math.min(92, Math.max(0, startPos.current.y + dyPct))
    onMove(newX, newY)
  }

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    e.stopPropagation()
    draggingRef.current = false
    onMoveEnd()
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        transform: `rotate(${rotation}deg)`,
        zIndex,
        touchAction: 'none',
      }}
      className="group cursor-grab active:cursor-grabbing"
    >
      {children}
      <button
        onClick={onDelete}
        className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs leading-none text-white group-hover:flex"
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  )
}

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl dark:bg-plum-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-plum-800 dark:text-blush-50">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-plum-300 hover:text-plum-600 dark:hover:text-blush-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

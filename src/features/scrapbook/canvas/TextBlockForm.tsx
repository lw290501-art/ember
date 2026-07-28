import { useState } from 'react'
import { Modal } from '../../../components/Modal'
import { FONT_OPTIONS, COLOR_OPTIONS } from './fonts'

export function TextBlockForm({
  onSave,
  onClose,
}: {
  onSave: (text: string, font: string, color: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [font, setFont] = useState(FONT_OPTIONS[0].value)
  const [color, setColor] = useState(COLOR_OPTIONS[0])

  return (
    <Modal title="Add text" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          onSave(text, font, color)
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          autoFocus
          required
          placeholder="Say something about this trip…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 placeholder:text-plum-300 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-100 dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50 dark:placeholder:text-plum-400"
        />
        <label className="text-sm text-plum-600 dark:text-plum-300">
          Font
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-plum-800 focus:border-blush-400 focus:outline-none dark:border-plum-700 dark:bg-plum-800 dark:text-blush-50"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="mb-1 text-sm text-plum-600 dark:text-plum-300">Color</p>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full border-2 ${
                  color === c ? 'border-blush-600' : 'border-transparent'
                }`}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>
        <p
          className="rounded-xl bg-blush-50 px-3 py-4 text-center text-lg dark:bg-plum-800"
          style={{ fontFamily: font, color }}
        >
          {text || 'Preview'}
        </p>
        <button
          type="submit"
          className="mt-2 rounded-full bg-blush-600 px-3 py-2.5 font-medium text-white shadow-sm hover:bg-blush-700"
        >
          Add to page
        </button>
      </form>
    </Modal>
  )
}

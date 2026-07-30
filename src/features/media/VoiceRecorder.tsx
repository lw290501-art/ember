import { useRef, useState } from 'react'
import { Mic } from 'lucide-react'

export function VoiceRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecorded(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      setError('Could not access the microphone. Check your browser permissions.')
    }
  }

  const stop = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <button
          onClick={stop}
          className="flex items-center gap-2 rounded-full bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Stop recording
        </button>
      ) : (
        <button
          onClick={start}
          className="flex items-center gap-2 rounded-full border border-blush-400 px-3 py-2 text-sm font-medium text-blush-600 hover:bg-blush-50 dark:border-blush-300 dark:text-blush-200 dark:hover:bg-plum-800"
        >
          <Mic size={16} strokeWidth={2} /> Record voice note
        </button>
      )}
      {error && <p className="text-sm text-blush-700 dark:text-blush-300">{error}</p>}
    </div>
  )
}

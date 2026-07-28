import { Modal } from '../../../components/Modal'
import type { Media } from '../../../types/database'

export function PhotoPickerModal({
  photos,
  onPick,
  onClose,
}: {
  photos: (Media & { url?: string })[]
  onPick: (mediaId: string) => void
  onClose: () => void
}) {
  return (
    <Modal title="Choose a photo" onClose={onClose}>
      {photos.length === 0 ? (
        <p className="text-sm text-plum-400">
          Upload a photo in the trip's media section first, then come back here to place it.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onPick(photo.id)}
              className="aspect-square overflow-hidden rounded-lg border border-blush-100 hover:ring-2 hover:ring-blush-400 dark:border-plum-700"
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

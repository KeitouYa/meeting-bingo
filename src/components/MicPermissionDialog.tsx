import { useEffect } from 'react'
import { Button } from './ui/Button'

interface MicPermissionDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

export function MicPermissionDialog({ onConfirm, onCancel }: MicPermissionDialogProps) {
  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-dialog-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
      >
        <div className="text-center">
          <span aria-hidden="true" className="text-4xl">🎤</span>
          <h2
            id="perm-dialog-title"
            className="mt-2 text-xl font-bold text-gray-900"
          >
            Before we start listening
          </h2>
        </div>

        <ul className="space-y-2.5 text-sm text-gray-700">
          <li className="flex gap-2">
            <span aria-hidden="true">🔒</span>
            <span>Audio is processed locally — nothing is recorded or sent anywhere</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">⏱</span>
            <span>Mic is only active while you tap "Stop Listening"</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">🔊</span>
            <span>Works best when your device can hear the room speakers</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">🎧</span>
            <span>Headphones block detection — the mic hears the room, not system audio</span>
          </li>
        </ul>

        <div className="flex flex-col gap-2 pt-1">
          <Button autoFocus onClick={onConfirm}>
            Enable Microphone
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Not now — I'll tap manually
          </Button>
        </div>
      </div>
    </div>
  )
}

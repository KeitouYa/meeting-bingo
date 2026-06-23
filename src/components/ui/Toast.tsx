import { useEffect } from 'react'
import type { Toast as ToastType } from '../../types'
import { cn } from '../../lib/utils'

const ICONS: Record<ToastType['type'], string> = {
  success: '✓',
  info: 'ℹ',
  error: '✕',
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-lg px-4 py-3 shadow-lg text-sm font-medium',
        'animate-in slide-in-from-bottom-2 duration-200',
        toast.type === 'success' && 'bg-green-50 text-green-800 border border-green-200',
        toast.type === 'error' && 'bg-red-50 text-red-800 border border-red-200',
        toast.type === 'info' && 'bg-gray-50 text-gray-800 border border-gray-200',
      )}
    >
      <span aria-hidden="true" className="shrink-0 font-bold">
        {ICONS[toast.type]}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

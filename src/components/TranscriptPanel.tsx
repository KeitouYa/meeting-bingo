import { cn } from '../lib/utils'

interface TranscriptPanelProps {
  transcript: string
  interimTranscript: string
  detectedWords: string[]
  isListening: boolean
  isSupported: boolean
  error: string | null
  permissionDenied: boolean
}

export function TranscriptPanel({
  transcript,
  interimTranscript,
  detectedWords,
  isListening,
  isSupported,
  error,
  permissionDenied,
}: TranscriptPanelProps) {
  if (!isSupported) return null

  // Show last ~100 chars for display
  const displayText = transcript.slice(-100)
  const hasContent = displayText.trim().length > 0 || interimTranscript.trim().length > 0

  return (
    <div className="w-full space-y-2 text-sm">
      {/* Listening indicator — non-red "Listening, not recording" (plan supersedes bg-red-500) */}
      {isListening && (
        <div className="flex items-center gap-2 text-brand-accent font-medium">
          <span aria-hidden="true" className="text-base leading-none">🎤</span>
          <span>Listening, not recording</span>
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full bg-brand-accent motion-safe:animate-bounce"
          />
        </div>
      )}

      {/* Error messages */}
      {permissionDenied && (
        <div role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
          <p className="font-semibold">Microphone access was denied.</p>
          <p>You can still play by tapping squares manually. To enable speech, allow mic access in your browser settings.</p>
        </div>
      )}
      {error && !permissionDenied && (
        <p className="text-amber-700 text-xs italic">{error}</p>
      )}

      {/* Live transcript */}
      {isListening && hasContent && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 min-h-[2.5rem] leading-relaxed">
          <span>{displayText}</span>
          {interimTranscript && (
            <span className="text-gray-400 italic">{interimTranscript}</span>
          )}
        </div>
      )}

      {/* Detected word chips */}
      {detectedWords.length > 0 && (
        <div
          aria-live="polite"
          aria-label="Detected buzzwords"
          className="flex flex-wrap gap-1"
        >
          {detectedWords.slice(-10).map(word => (
            <span
              key={word}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5',
                'rounded-full text-xs font-medium',
                'bg-brand-accent/10 text-brand-accent border border-brand-accent/20',
              )}
            >
              <span aria-hidden="true">✓</span>
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

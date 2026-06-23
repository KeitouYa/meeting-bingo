import { Button } from './ui/Button'

interface GameControlsProps {
  isListening: boolean
  isSupported: boolean
  onNewCard: () => void
  onToggleListening: () => void
  onBack: () => void
}

export function GameControls({
  isListening,
  isSupported,
  onNewCard,
  onToggleListening,
  onBack,
}: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={onNewCard}>
          <span aria-hidden="true" className="mr-1.5">🔄</span>
          New Card
        </Button>

        {isSupported ? (
          <Button
            variant={isListening ? 'ghost' : 'primary'}
            size="sm"
            onClick={onToggleListening}
            aria-pressed={isListening}
            className={isListening ? 'text-brand-accent border-brand-accent' : ''}
          >
            <span aria-hidden="true" className="mr-1.5">🎤</span>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Speech not supported — tap squares manually
          </p>
        )}
      </div>

      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
      >
        ← Change category
      </button>
    </div>
  )
}

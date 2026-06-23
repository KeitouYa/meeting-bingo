import { Button } from './ui/Button'

interface GameControlsProps {
  isListening: boolean
  isSupported: boolean
  onNewCard: () => void
  onToggleListening: () => void
}

export function GameControls({
  isListening,
  isSupported,
  onNewCard,
  onToggleListening,
}: GameControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
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
  )
}

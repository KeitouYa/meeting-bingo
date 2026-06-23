import { useEffect, useRef } from 'react'
import type { Category, GameState } from '../types'
import { cn } from '../lib/utils'
import { Button } from './ui/Button'

interface WinScreenProps {
  game: GameState
  category: Category
  onPlayAgain: () => void
  onHome: () => void
  onShare?: () => void
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec}s`
  return `${m}m ${sec}s`
}

export function WinScreen({ game, category, onPlayAgain, onHome, onShare }: WinScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const elapsed =
    game.startedAt && game.completedAt
      ? formatDuration(game.completedAt - game.startedAt)
      : '—'

  const filledNonFree = game.filledCount - 1

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8 gap-6">
      <div className="text-center">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-5xl font-extrabold text-brand-primary motion-safe:animate-bounce-in focus:outline-none"
        >
          🎉 BINGO!
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {category.icon} {category.name}
        </p>
      </div>

      {/* Screenshot-ready card — static display of final state */}
      {game.card && (
        <div
          aria-label="Your winning bingo card"
          className="w-full max-w-sm grid grid-cols-5 gap-1 bg-white rounded-xl border border-gray-200 p-2 shadow-md"
        >
          {game.card.squares.flat().map(square => (
            <div
              key={square.id}
              aria-label={
                square.isWinning
                  ? `${square.word}, winning square`
                  : square.isFree
                    ? 'Free space, filled'
                    : square.isFilled
                      ? `${square.word}, filled`
                      : square.word
              }
              className={cn(
                'aspect-square rounded-lg border-2 p-0.5',
                'flex flex-col items-center justify-center text-center',
                'text-[9px] sm:text-[10px] font-medium leading-tight',
                square.isWinning &&
                  'bg-square-winning border-green-700 text-white',
                !square.isWinning && square.isFilled && !square.isFree &&
                  'bg-square-filled border-blue-300 text-gray-800',
                square.isFree &&
                  'bg-square-free border-gray-200 text-gray-600',
                !square.isFilled &&
                  'bg-white border-gray-200 text-gray-400',
              )}
            >
              {square.isWinning && <span aria-hidden="true" className="text-[8px]">★</span>}
              <span className={cn(
                'break-words px-0.5',
                square.isFilled && !square.isWinning && !square.isFree && 'line-through opacity-70',
              )}>
                {square.isFree ? '⭐ FREE' : square.word}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 w-full max-w-sm grid grid-cols-2 gap-x-6 gap-y-3 text-sm shadow-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Time to BINGO</p>
          <p className="font-semibold text-gray-900">⏱ {elapsed}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Winning word</p>
          <p className="font-semibold text-gray-900 truncate">
            🏆 {game.winningWord ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Squares filled</p>
          <p className="font-semibold text-gray-900">📊 {filledNonFree}/24</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Category</p>
          <p className="font-semibold text-gray-900">
            {category.icon} {category.name}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          size="md"
          onClick={onShare ?? (() => {})}
          variant="secondary"
          className="flex-1"
          aria-label="Share result (coming soon)"
        >
          <span aria-hidden="true" className="mr-1.5">📤</span>
          Share Result
        </Button>
        <Button size="md" onClick={onPlayAgain} className="flex-1">
          <span aria-hidden="true" className="mr-1.5">🔄</span>
          Play Again
        </Button>
      </div>

      <button
        onClick={onHome}
        className="text-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
      >
        ← Back to Home
      </button>
    </main>
  )
}

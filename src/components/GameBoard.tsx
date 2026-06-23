import { useEffect, useMemo, useRef } from 'react'
import type { BingoSquare, GameState } from '../types'
import { CATEGORIES } from '../data/categories'
import { getClosestToWin } from '../lib/bingoChecker'
import { BingoCard } from './BingoCard'
import { GameControls } from './GameControls'

interface GameBoardProps {
  game: GameState
  isListening: boolean
  isSupported: boolean
  onSquareClick: (square: BingoSquare) => void
  onToggleListening: () => void
  onNewCard: () => void
}

export function GameBoard({
  game,
  isListening,
  isSupported,
  onSquareClick,
  onToggleListening,
  onNewCard,
}: GameBoardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const category = CATEGORIES.find(c => c.id === game.category)
  const filledNonFree = game.filledCount - 1  // exclude FREE space

  const closest = useMemo(
    () => game.card ? getClosestToWin(game.card.squares) : null,
    [game.card],
  )

  const nearBingo = closest?.needed === 1 ? closest : null
  const nearBingoWords = useMemo(
    () => nearBingo ? new Set(nearBingo.words) : undefined,
    [nearBingo],
  )

  const needText = nearBingo
    ? nearBingo.words.map(w => `"${w}"`).join(' or ')
    : null

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-brand-primary focus:outline-none shrink-0"
        >
          🎯 Meeting Bingo
        </h1>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          {category && (
            <span className="hidden sm:inline">
              <span aria-hidden="true">{category.icon}</span> {category.name}
            </span>
          )}
          <span className="font-semibold tabular-nums">
            {filledNonFree}<span className="text-gray-400">/24</span>
          </span>
          {/* Listening indicator — non-red per plan (supersedes bg-red-500 sample) */}
          <span
            aria-live="polite"
            aria-label={isListening ? 'Listening, not recording' : 'Not listening'}
            className={
              isListening
                ? 'flex items-center gap-1 text-brand-accent font-medium'
                : 'text-gray-400'
            }
          >
            <span aria-hidden="true">{isListening ? '🎤' : '○'}</span>
            <span className="hidden sm:inline text-xs">
              {isListening ? 'Listening, not recording' : 'Paused'}
            </span>
          </span>
        </div>
      </header>

      {/* Near-bingo banner */}
      {nearBingo && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center font-medium"
        >
          <span aria-hidden="true">⚡</span>{' '}
          One away! Need: {needText}
        </div>
      )}

      {/* Card */}
      <div className="flex-1 flex flex-col items-center px-3 py-4 gap-4 max-w-lg mx-auto w-full">
        {game.card && (
          <BingoCard
            card={game.card}
            nearBingoWords={nearBingoWords}
            onSquareClick={onSquareClick}
          />
        )}

        <GameControls
          isListening={isListening}
          isSupported={isSupported}
          onNewCard={onNewCard}
          onToggleListening={onToggleListening}
        />

        {isListening && (
          <p className="text-xs text-gray-400 text-center">
            <span aria-hidden="true">💡</span>{' '}
            Hold your device near the speaker. Headphones may reduce detection.
          </p>
        )}
      </div>
    </main>
  )
}

import { memo, useEffect, useState } from 'react'
import type { BingoSquare as BingoSquareType } from '../types'
import { cn } from '../lib/utils'

interface BingoSquareProps {
  square: BingoSquareType
  tabIndex: number
  isNearBingo?: boolean
}

function getAriaLabel(square: BingoSquareType): string {
  if (square.isFree) return 'Free space, filled'
  const state = square.isWinning
    ? 'winning square'
    : square.isAutoFilled
      ? 'auto-filled'
      : square.isFilled
        ? 'filled'
        : 'not filled'
  return `${square.word}, ${state}`
}

export const BingoSquare = memo(function BingoSquare({
  square,
  tabIndex,
  isNearBingo = false,
}: BingoSquareProps) {
  // One-shot auto-fill animation: triggers once when isAutoFilled becomes true,
  // then clears so it doesn't replay on future renders.
  const [showFillAnim, setShowFillAnim] = useState(false)

  useEffect(() => {
    if (square.isAutoFilled && square.isFilled) {
      setShowFillAnim(true)
      const t = setTimeout(() => setShowFillAnim(false), 600)
      return () => clearTimeout(t)
    }
  }, [square.isAutoFilled, square.isFilled, square.id])

  const isTogglable = !square.isFree
  const filledNotFree = square.isFilled && !square.isFree

  return (
    <button
      type="button"
      data-sqid={square.id}
      tabIndex={tabIndex}
      aria-pressed={isTogglable ? square.isFilled : undefined}
      aria-disabled={square.isFree ? true : undefined}
      aria-label={getAriaLabel(square)}
      disabled={square.isFree}
      className={cn(
        'relative w-full aspect-square rounded-lg border-2 p-1',
        'flex flex-col items-center justify-center text-center',
        'text-[10px] sm:text-xs font-medium leading-tight',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-primary',
        // default
        !square.isFilled && !square.isFree &&
          'bg-white border-gray-200 text-gray-800 hover:border-brand-primary hover:bg-blue-50 cursor-pointer',
        // filled (manual)
        filledNotFree && !square.isAutoFilled && !square.isWinning &&
          'bg-square-filled border-blue-300 text-gray-800 cursor-pointer',
        // auto-filled
        filledNotFree && square.isAutoFilled && !square.isWinning &&
          'bg-square-auto-filled border-blue-400 text-gray-800 cursor-pointer',
        // winning
        square.isWinning &&
          'bg-square-winning border-green-700 text-white cursor-default',
        // free space
        square.isFree &&
          'bg-square-free border-gray-200 text-gray-600 cursor-default',
        // near-bingo unfilled highlight
        isNearBingo && !square.isFilled &&
          'ring-2 ring-amber-400 ring-offset-1',
        // one-shot auto-fill animation (gated behind prefers-reduced-motion)
        showFillAnim && 'motion-safe:animate-fill-once',
      )}
    >
      {/* Non-color state marker (WCAG 1.4.1) */}
      {square.isWinning && (
        <span aria-hidden="true" className="absolute top-0.5 right-0.5 text-[8px]">★</span>
      )}
      {filledNotFree && !square.isWinning && (
        <span aria-hidden="true" className="absolute top-0.5 right-0.5 text-[8px]">
          {square.isAutoFilled ? '🎤' : '✓'}
        </span>
      )}

      <span className={cn(
        'break-words px-0.5 leading-tight',
        filledNotFree && !square.isWinning && 'line-through opacity-80',
      )}>
        {square.isFree ? (
          <>
            <span aria-hidden="true">⭐</span>
            <br />
            FREE
          </>
        ) : (
          square.word
        )}
      </span>
    </button>
  )
})

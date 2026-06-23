import { memo, useCallback, useRef, useState } from 'react'
import type { BingoCard as BingoCardType, BingoSquare } from '../types'
import { BingoSquare as BingoSquareComponent } from './BingoSquare'

interface BingoCardProps {
  card: BingoCardType
  nearBingoWords?: Set<string>
  onSquareClick: (square: BingoSquare) => void
}

export const BingoCard = memo(function BingoCard({
  card,
  nearBingoWords,
  onSquareClick,
}: BingoCardProps) {
  const [focusedId, setFocusedId] = useState<string>('0-0')
  const gridRef = useRef<HTMLDivElement>(null)

  const moveFocus = useCallback((id: string) => {
    setFocusedId(id)
    gridRef.current?.querySelector<HTMLElement>(`[data-sqid="${id}"]`)?.focus()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!arrows.includes(e.key)) return
    e.preventDefault()

    const sqid = (e.target as HTMLElement).getAttribute('data-sqid')
    if (!sqid) return
    const [r, c] = sqid.split('-').map(Number)

    const delta: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0],
      ArrowLeft: [0, -1], ArrowRight: [0, 1],
    }
    const [dr, dc] = delta[e.key]
    const nr = Math.max(0, Math.min(4, r + dr))
    const nc = Math.max(0, Math.min(4, c + dc))
    moveFocus(`${nr}-${nc}`)
  }, [moveFocus])

  // Event delegation: click bubbles up from button to grid
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-sqid]')
    if (!btn) return
    const sqid = btn.getAttribute('data-sqid')!
    const [row, col] = sqid.split('-').map(Number)
    onSquareClick(card.squares[row][col])
  }, [card, onSquareClick])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const sqid = (e.target as HTMLElement).getAttribute('data-sqid')
    if (sqid) setFocusedId(sqid)
  }, [])

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Bingo card"
      className="grid grid-cols-5 gap-1 w-full"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {card.squares.map((row, ri) =>
        row.map((square, ci) => (
          <div key={square.id} role="gridcell" aria-rowindex={ri + 1} aria-colindex={ci + 1}>
            <BingoSquareComponent
              square={square}
              tabIndex={focusedId === square.id || (focusedId === '0-0' && ri === 0 && ci === 0) ? 0 : -1}
              isNearBingo={nearBingoWords?.has(square.word)}
            />
          </div>
        ))
      )}
    </div>
  )
})

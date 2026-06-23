import { useCallback, useEffect, useState } from 'react'
import type { BingoSquare, Category, GameState, ScreenState, Toast } from './types'
import { CATEGORIES } from './data/categories'
import { generateCard } from './lib/cardGenerator'
import { checkForBingo, countFilled } from './lib/bingoChecker'
import { LandingPage } from './components/LandingPage'
import { CategorySelect } from './components/CategorySelect'
import { GameBoard } from './components/GameBoard'
import { WinScreen } from './components/WinScreen'
import { ToastContainer } from './components/ui/Toast'

const INITIAL_GAME: GameState = {
  card: null,
  category: null,
  filledCount: 0,
  alreadyFilled: new Set<string>(),
  winningLines: [],
  winningWord: null,
  startedAt: null,
  completedAt: null,
}

function freshGame(category: Category): GameState {
  const card = generateCard(category)
  return {
    ...INITIAL_GAME,
    card,
    category: category.id,
    filledCount: 1, // FREE space counts
  }
}

// addToast/makeToast wired back in M4 when speech detection fires toasts.
// Toast type kept for state shape; dismissToast still drives ToastContainer.
export default function App() {
  const [screen, setScreen] = useState<ScreenState>('landing')
  const [game, setGame] = useState<GameState>(INITIAL_GAME)
  const [toasts, setToasts] = useState<Toast[]>([])
  // Stub for M4: tracks intended-listening state
  const [isListening, setIsListening] = useState(false)

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleStart = useCallback(() => {
    setScreen('category')
  }, [])

  const handleCategorySelect = useCallback((category: Category) => {
    setGame(freshGame(category))
    setScreen('game')
  }, [])

  const handleNewCard = useCallback(() => {
    if (!game.category) return
    const category = CATEGORIES.find(c => c.id === game.category)
    if (!category) return
    setGame(freshGame(category))
    setIsListening(false)
  }, [game.category])

  const handleHome = useCallback(() => {
    setGame(INITIAL_GAME)
    setIsListening(false)
    setScreen('landing')
  }, [])

  const handlePlayAgain = useCallback(() => {
    setGame(INITIAL_GAME)
    setIsListening(false)
    setScreen('category')
  }, [])

  // US-3.1 decision (on record): toggle-free — manual taps toggle any square freely,
  // including auto-filled. alreadyFilled always mirrors actual isFilled state.
  const handleSquareClick = useCallback((square: BingoSquare) => {
    if (square.isFree) return

    setGame(prev => {
      if (!prev.card || prev.winningLines.length > 0) return prev

      // US-1.3 Option A: startedAt on first fill
      const startedAt = prev.startedAt ?? Date.now()
      const nowFilled = !square.isFilled

      const newSquares = prev.card.squares.map(row =>
        row.map(sq =>
          sq.id === square.id
            ? { ...sq, isFilled: nowFilled, isAutoFilled: false }
            : sq
        )
      )

      const newAlreadyFilled = new Set(prev.alreadyFilled)
      if (nowFilled) {
        newAlreadyFilled.add(square.word.toLowerCase())
      } else {
        newAlreadyFilled.delete(square.word.toLowerCase())
      }

      const winningLines = checkForBingo(newSquares)
      let finalSquares = newSquares
      let winningWord = prev.winningWord
      let completedAt = prev.completedAt

      if (winningLines.length > 0 && nowFilled) {
        // Mark winning squares
        const winIds = new Set(winningLines.flatMap(l => l.squares.map(s => s.id)))
        finalSquares = newSquares.map(row =>
          row.map(sq => winIds.has(sq.id) ? { ...sq, isWinning: true } : sq)
        )
        winningWord = square.word
        completedAt = Date.now()
      }

      return {
        ...prev,
        card: { ...prev.card, squares: finalSquares },
        filledCount: countFilled(finalSquares),
        alreadyFilled: newAlreadyFilled,
        winningLines,
        winningWord,
        completedAt,
        startedAt,
      }
    })
  }, [])

  // M4 stub: placeholder wired so GameBoard can render the toggle
  const handleToggleListening = useCallback(() => {
    setIsListening(prev => !prev)
  }, [])

  // Transition to win screen when bingo is detected
  useEffect(() => {
    if (game.winningLines.length > 0 && screen === 'game') {
      setScreen('win')
    }
  }, [game.winningLines.length, screen])

  const currentCategory = CATEGORIES.find(c => c.id === game.category)

  return (
    <>
      {screen === 'landing' && (
        <LandingPage onStart={handleStart} />
      )}

      {screen === 'category' && (
        <CategorySelect
          onSelect={handleCategorySelect}
          onBack={handleHome}
        />
      )}

      {screen === 'game' && game.card && (
        <GameBoard
          game={game}
          isListening={isListening}
          isSupported={false}  // M4 wires real speech support detection
          onSquareClick={handleSquareClick}
          onToggleListening={handleToggleListening}
          onNewCard={handleNewCard}
        />
      )}

      {screen === 'win' && game.card && currentCategory && (
        <WinScreen
          game={game}
          category={currentCategory}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

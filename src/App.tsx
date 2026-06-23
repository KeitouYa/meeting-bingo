import { useCallback, useState } from 'react'
import type { Category, GameState, ScreenState, Toast } from './types'
import { CATEGORIES } from './data/categories'
import { generateCard } from './lib/cardGenerator'
import { LandingPage } from './components/LandingPage'
import { CategorySelect } from './components/CategorySelect'
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

let toastCounter = 0
function makeToast(message: string, type: Toast['type'] = 'success'): Toast {
  return { id: String(++toastCounter), message, type, duration: 3000 }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('landing')
  const [game, setGame] = useState<GameState>(INITIAL_GAME)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToasts(prev => [...prev, makeToast(message, type)])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // US-1.3 resolution: Option A — startedAt set on first fill or first listen, not category-select.
  const handleStart = useCallback(() => {
    setScreen('category')
  }, [])

  const handleCategorySelect = useCallback((category: Category) => {
    const card = generateCard(category)
    setGame({
      ...INITIAL_GAME,
      card,
      category: category.id,
      alreadyFilled: new Set<string>(['free']),
      filledCount: 1,
    })
    setScreen('game')
  }, [])

  const handleNewCard = useCallback(() => {
    if (!game.category) return
    const category = CATEGORIES.find(c => c.id === game.category)
    if (!category) return
    const card = generateCard(category)
    setGame({
      ...INITIAL_GAME,
      card,
      category: game.category,
      alreadyFilled: new Set<string>(['free']),
      filledCount: 1,
    })
  }, [game.category])

  const handleHome = useCallback(() => {
    setGame(INITIAL_GAME)
    setScreen('landing')
  }, [])

  const handlePlayAgain = useCallback(() => {
    setGame(INITIAL_GAME)
    setScreen('category')
  }, [])

  // Exposed for M3 (GameBoard) and M4 (speech auto-fill) — wired in those milestones.
  const handleWin = useCallback((winningWord: string) => {
    setGame(prev => ({
      ...prev,
      winningWord,
      completedAt: Date.now(),
    }))
    setScreen('win')
    addToast('BINGO! 🎉', 'success')
  }, [addToast])

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
        // GameBoard placeholder — replaced in M3
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-gray-400 text-sm">GameBoard loads in M3</p>
          <p className="font-semibold text-gray-700">
            Category: {CATEGORIES.find(c => c.id === game.category)?.name}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleNewCard}
              className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm"
            >
              New Card
            </button>
            <button
              onClick={handleHome}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            >
              Home
            </button>
            <button
              onClick={() => handleWin('demo')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            >
              Simulate Win
            </button>
          </div>
        </div>
      )}

      {screen === 'win' && (
        // WinScreen placeholder — replaced in M3
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-4xl font-bold text-gray-900">🎉 BINGO!</h1>
          <p className="text-gray-500">WinScreen loads in M3</p>
          <div className="flex gap-3">
            <button
              onClick={handlePlayAgain}
              className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm"
            >
              Play Again
            </button>
            <button
              onClick={handleHome}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            >
              Home
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

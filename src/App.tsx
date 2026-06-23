import { useCallback, useEffect, useRef, useState } from 'react'
import type { BingoSquare, Category, GameState, ScreenState, Toast } from './types'
import { CATEGORIES } from './data/categories'
import { generateCard } from './lib/cardGenerator'
import { checkForBingo, countFilled } from './lib/bingoChecker'
import { detectWordsWithAliases } from './lib/wordDetector'
import { buildShareText, shareResult } from './lib/shareUtils'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { LandingPage } from './components/LandingPage'
import { CategorySelect } from './components/CategorySelect'
import { GameBoard } from './components/GameBoard'
import { WinScreen } from './components/WinScreen'
import { MicPermissionDialog } from './components/MicPermissionDialog'
import { ToastContainer } from './components/ui/Toast'

// ── Game state persistence (KEI-30) ──────────────────────────────────────────

const STORAGE_KEY = 'mbingo-state'

type PersistedState = {
  game: Omit<GameState, 'alreadyFilled'> & { alreadyFilled: string[] }
  screen: ScreenState
}

function loadState(): { game: GameState; screen: ScreenState } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { game, screen }: PersistedState = JSON.parse(raw)
    if (!game.card) return null
    return { game: { ...game, alreadyFilled: new Set(game.alreadyFilled) }, screen }
  } catch {
    return null
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

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
  return {
    ...INITIAL_GAME,
    card: generateCard(category),
    category: category.id,
    filledCount: 1,  // FREE space
  }
}

let toastCounter = 0
function makeToast(message: string, type: Toast['type']): Toast {
  return { id: String(++toastCounter), message, type, duration: 3000 }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>(() => loadState()?.screen ?? 'landing')
  const [game, setGame] = useState<GameState>(() => loadState()?.game ?? INITIAL_GAME)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [displayTranscript, setDisplayTranscript] = useState('')
  const [detectedWords, setDetectedWords] = useState<string[]>([])
  const [showPermDialog, setShowPermDialog] = useState(false)

  // Ref-driven state for detection (prevents stale closures in speech callbacks)
  const cardRef = useRef(game.card)
  const transientAlreadyFilledRef = useRef<Set<string>>(new Set())
  const finalBufferRef = useRef<string[]>([])
  // Whether the user has acknowledged the mic-permission explainer this session
  const permissionExplainedRef = useRef(false)

  // Keep refs in sync every render
  cardRef.current = game.card
  transientAlreadyFilledRef.current = new Set(game.alreadyFilled)

  // Reset detection buffer when a new card is generated
  useEffect(() => {
    finalBufferRef.current = []
  }, [game.card?.generatedAt])

  // ── Stable callbacks (no hook deps) ──────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToasts(prev => [...prev, makeToast(message, type)])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // US-3.1 on record: toggle-free — any square can be untapped (manual or auto-filled)
  const handleSquareClick = useCallback((square: BingoSquare) => {
    if (square.isFree) return

    setGame(prev => {
      if (!prev.card || prev.winningLines.length > 0) return prev

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

  // Auto-fill one or more words (speech detection path)
  const fillSquares = useCallback((words: string[]) => {
    if (words.length === 0) return

    setGame(prev => {
      if (!prev.card || prev.winningLines.length > 0) return prev

      const startedAt = prev.startedAt ?? Date.now()
      let squares = prev.card.squares
      const newAlreadyFilled = new Set(prev.alreadyFilled)
      let winningLines = prev.winningLines
      let winningWord = prev.winningWord
      let completedAt = prev.completedAt

      for (const word of words) {
        const wordLower = word.toLowerCase()
        // Skip if already filled (double-check against state, not just transient ref)
        if (newAlreadyFilled.has(wordLower)) continue

        const target = squares.flat().find(
          sq => !sq.isFree && !sq.isFilled && sq.word.toLowerCase() === wordLower
        )
        if (!target) continue

        squares = squares.map(row =>
          row.map(sq =>
            sq.id === target.id ? { ...sq, isFilled: true, isAutoFilled: true } : sq
          )
        )
        newAlreadyFilled.add(wordLower)

        // Check bingo after each fill; stop filling on first bingo
        const currentWins = checkForBingo(squares)
        if (currentWins.length > 0) {
          const winIds = new Set(currentWins.flatMap(l => l.squares.map(s => s.id)))
          squares = squares.map(row =>
            row.map(sq => winIds.has(sq.id) ? { ...sq, isWinning: true } : sq)
          )
          winningLines = currentWins
          winningWord = target.word
          completedAt = Date.now()
          break
        }
      }

      return {
        ...prev,
        card: { ...prev.card, squares },
        filledCount: countFilled(squares),
        alreadyFilled: newAlreadyFilled,
        winningLines,
        winningWord,
        completedAt,
        startedAt,
      }
    })
  }, [])

  // Ref-driven detection callback — reads current card/alreadyFilled via refs
  // so there's no stale closure even after many state updates.
  const onFinalResult = useCallback((text: string) => {
    const card = cardRef.current
    if (!card) return

    // Rolling 2-chunk buffer: catches phrases split across consecutive finals
    finalBufferRef.current = [...finalBufferRef.current, text].slice(-2)
    const combined = finalBufferRef.current.join(' ')

    const detected = detectWordsWithAliases(
      combined,
      card.words,
      transientAlreadyFilledRef.current,
    )
    if (detected.length === 0) return

    // Immediate dedup: update transient ref before React processes the state update
    for (const w of detected) transientAlreadyFilledRef.current.add(w.toLowerCase())

    setDisplayTranscript(prev => (prev + ' ' + text).trim().slice(-300))
    setDetectedWords(prev => [...new Set([...prev, ...detected])])

    const label =
      detected.length === 1
        ? `"${detected[0]}"`
        : detected.map(w => `"${w}"`).join(' and ')
    addToast(`🎤 ${label} detected!`, 'info')

    fillSquares(detected)
  }, [addToast, fillSquares])

  // ── Speech hook (must come AFTER fillSquares/onFinalResult are defined) ──
  const {
    isSupported,
    isListening,
    interimTranscript,
    error,
    permissionDenied,
    startListening,
    stopListening,
  } = useSpeechRecognition({ onFinalResult })

  // ── Handlers that depend on hook output ──────────────────────────────────

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      if (!permissionExplainedRef.current) {
        setShowPermDialog(true)
      } else {
        startListening()
      }
    }
  }, [isListening, startListening, stopListening])

  const handlePermissionConfirm = useCallback(() => {
    permissionExplainedRef.current = true
    setShowPermDialog(false)
    startListening()
  }, [startListening])

  const handlePermissionCancel = useCallback(() => {
    setShowPermDialog(false)
  }, [])

  const handleStart = useCallback(() => {
    setScreen('category')
  }, [])

  const handleCategorySelect = useCallback((category: Category) => {
    setGame(freshGame(category))
    setDisplayTranscript('')
    setDetectedWords([])
    finalBufferRef.current = []
    setScreen('game')
  }, [])

  const handleNewCard = useCallback(() => {
    if (!game.category) return
    const category = CATEGORIES.find(c => c.id === game.category)
    if (!category) return
    stopListening()
    setGame(freshGame(category))
    setDisplayTranscript('')
    setDetectedWords([])
    finalBufferRef.current = []
  }, [game.category, stopListening])

  const handleHome = useCallback(() => {
    stopListening()
    setGame(INITIAL_GAME)
    setDisplayTranscript('')
    setDetectedWords([])
    finalBufferRef.current = []
    setScreen('landing')
  }, [stopListening])

  const handlePlayAgain = useCallback(() => {
    stopListening()
    setGame(INITIAL_GAME)
    setDisplayTranscript('')
    setDetectedWords([])
    finalBufferRef.current = []
    setScreen('category')
  }, [stopListening])

  // Persist active game state (KEI-30); clear on landing/category
  useEffect(() => {
    if ((screen === 'game' || screen === 'win') && game.card) {
      try {
        const persisted: PersistedState = {
          game: { ...game, alreadyFilled: [...game.alreadyFilled] },
          screen,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      } catch {}
    } else {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }, [game, screen])

  // Share result (KEI-28)
  const handleShare = useCallback(async () => {
    const category = CATEGORIES.find(c => c.id === game.category)
    if (!game.card || !category) return
    const text = buildShareText(game, category)
    const result = await shareResult(text)
    if (result === 'copied') {
      addToast('📋 Result copied to clipboard!', 'success')
    } else if (result === 'native-shared') {
      addToast('📤 Shared!', 'success')
    } else {
      addToast('Could not share — try screenshotting instead', 'info')
    }
  }, [game, addToast])

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
          isSupported={isSupported}
          transcript={displayTranscript}
          interimTranscript={interimTranscript}
          detectedWords={detectedWords}
          error={error}
          permissionDenied={permissionDenied}
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
          onShare={handleShare}
        />
      )}

      {showPermDialog && (
        <MicPermissionDialog
          onConfirm={handlePermissionConfirm}
          onCancel={handlePermissionCancel}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

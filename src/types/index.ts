export type ScreenState = 'landing' | 'category' | 'game' | 'win'

export type CategoryId = 'agile' | 'corporate' | 'tech' | 'sports'

export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
  words: string[]
}

export interface BingoSquare {
  id: string         // 'row-col', e.g. '0-0', '2-2'
  word: string       // original-cased word from category list
  isFilled: boolean
  isAutoFilled: boolean
  isWinning: boolean
  isFree: boolean    // true only for center square [2][2]
  row: number
  col: number
}

export interface BingoCard {
  squares: BingoSquare[][]  // [row][col], 5×5
  words: string[]           // flat list of non-free words (for detection)
  category: CategoryId
  generatedAt: number
}

export interface WinningLine {
  type: 'row' | 'col' | 'diag'
  index: number
  squares: BingoSquare[]
}

export interface ClosestToWin {
  needed: number      // unfilled squares on the closest line(s)
  lines: string[]     // e.g. ['Row 1', 'Column 3'] for ties
  words: string[]     // completing word(s) across all tied lines — drives "Need: X or Y"
  squareIds: string[] // all square IDs on the closest line(s) — for near-bingo highlight
}

export interface GameState {
  card: BingoCard | null
  category: CategoryId | null
  filledCount: number
  alreadyFilled: Set<string>   // lowercased words; dedupe key
  winningLines: WinningLine[]
  winningWord: string | null   // word that completed the bingo
  startedAt: number | null     // set on first listen OR first fill
  completedAt: number | null
}

export interface SpeechRecognitionState {
  isSupported: boolean
  isListening: boolean
  transcript: string
  interimTranscript: string
  detectedWords: string[]
  error: string | null
  permissionDenied: boolean    // distinct from !isSupported
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'error'
  duration?: number
}

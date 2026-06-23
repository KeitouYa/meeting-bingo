import type { BingoSquare, ClosestToWin, WinningLine } from '../types'

function getLines(squares: BingoSquare[][]): { squares: BingoSquare[]; label: string }[] {
  const lines: { squares: BingoSquare[]; label: string }[] = []

  for (let r = 0; r < 5; r++) {
    lines.push({ squares: squares[r], label: `Row ${r + 1}` })
  }
  for (let c = 0; c < 5; c++) {
    lines.push({ squares: squares.map(row => row[c]), label: `Column ${c + 1}` })
  }
  lines.push({
    squares: [0, 1, 2, 3, 4].map(i => squares[i][i]),
    label: 'Diagonal ↘',
  })
  lines.push({
    squares: [0, 1, 2, 3, 4].map(i => squares[i][4 - i]),
    label: 'Diagonal ↙',
  })

  return lines
}

export function checkForBingo(squares: BingoSquare[][]): WinningLine[] {
  const winning: WinningLine[] = []

  for (let r = 0; r < 5; r++) {
    if (squares[r].every(sq => sq.isFilled)) {
      winning.push({ type: 'row', index: r, squares: squares[r] })
    }
  }
  for (let c = 0; c < 5; c++) {
    const col = squares.map(row => row[c])
    if (col.every(sq => sq.isFilled)) {
      winning.push({ type: 'col', index: c, squares: col })
    }
  }
  const diag1 = [0, 1, 2, 3, 4].map(i => squares[i][i])
  if (diag1.every(sq => sq.isFilled)) {
    winning.push({ type: 'diag', index: 0, squares: diag1 })
  }
  const diag2 = [0, 1, 2, 3, 4].map(i => squares[i][4 - i])
  if (diag2.every(sq => sq.isFilled)) {
    winning.push({ type: 'diag', index: 1, squares: diag2 })
  }

  return winning
}

export function countFilled(squares: BingoSquare[][]): number {
  return squares.flat().filter(sq => sq.isFilled).length
}

export function getClosestToWin(squares: BingoSquare[][]): ClosestToWin | null {
  if (checkForBingo(squares).length > 0) return null

  const lines = getLines(squares)
  let minNeeded = 6

  for (const line of lines) {
    const needed = line.squares.filter(sq => !sq.isFilled).length
    if (needed < minNeeded) minNeeded = needed
  }

  if (minNeeded >= 5) return null

  const tiedLines = lines.filter(
    line => line.squares.filter(sq => !sq.isFilled).length === minNeeded,
  )

  const lineNames = tiedLines.map(l => l.label)
  const wordSet = new Set<string>()
  const idSet = new Set<string>()
  for (const line of tiedLines) {
    for (const sq of line.squares) {
      idSet.add(sq.id)
      if (!sq.isFilled) wordSet.add(sq.word)
    }
  }

  return {
    needed: minNeeded,
    lines: lineNames,
    words: [...wordSet],
    squareIds: [...idSet],
  }
}

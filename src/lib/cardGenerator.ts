import type { BingoCard, BingoSquare, Category } from '../types'

function shuffle<T>(arr: T[], random = Math.random): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateCard(category: Category, random = Math.random): BingoCard {
  if (category.words.length < 24) {
    throw new Error(`Category "${category.id}" has only ${category.words.length} words; 24 required`)
  }

  const selected = shuffle(category.words, random).slice(0, 24)
  const squares: BingoSquare[][] = []
  let wordIndex = 0

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = []
    for (let col = 0; col < 5; col++) {
      const isFree = row === 2 && col === 2
      rowSquares.push({
        id: `${row}-${col}`,
        word: isFree ? 'FREE' : selected[wordIndex++],
        isFilled: isFree,
        isAutoFilled: false,
        isWinning: false,
        isFree,
        row,
        col,
      })
    }
    squares.push(rowSquares)
  }

  return {
    squares,
    words: selected,
    category: category.id,
    generatedAt: Date.now(),
  }
}

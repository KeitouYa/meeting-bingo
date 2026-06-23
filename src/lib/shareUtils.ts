import type { Category, GameState } from '../types'

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec}s`
  return `${m}m ${sec}s`
}

export function buildShareText(game: GameState, category: Category): string {
  const time =
    game.startedAt && game.completedAt
      ? formatDuration(game.completedAt - game.startedAt)
      : '—'
  const filled = game.filledCount - 1
  const url = window.location.href.split('?')[0].replace(/\/$/, '')

  return [
    `🎉 BINGO! I spotted "${game.winningWord ?? '…'}" in a ${category.name} meeting!`,
    `⏱ ${time} · 📊 ${filled}/24 squares filled`,
    `Play at: ${url}`,
  ].join('\n')
}

export async function shareResult(
  text: string,
): Promise<'native-shared' | 'copied' | 'failed'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text, title: 'Meeting Bingo' })
      return 'native-shared'
    } catch (err) {
      // User cancelled → don't fall through to clipboard
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
      // Other navigator.share errors → fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

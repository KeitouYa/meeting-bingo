import { useEffect, useRef } from 'react'
import { Button } from './ui/Button'

interface LandingPageProps {
  onStart: () => void
}

const HOW_IT_WORKS = [
  { step: '1', text: 'Pick a buzzword category — Agile, Corporate, or Tech' },
  { step: '2', text: 'Enable your mic for auto-detection, or tap squares manually' },
  { step: '3', text: 'Listen to your meeting and watch squares fill automatically' },
  { step: '4', text: 'Five in a row — BINGO!' },
]

export function LandingPage({ onStart }: LandingPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div aria-hidden="true" className="text-6xl mb-4">🎯</div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-4xl font-bold text-gray-900 mb-3 focus:outline-none"
        >
          Meeting Bingo
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Turn boring meetings into a game. Buzzwords fill your card automatically!
        </p>

        <Button size="lg" onClick={onStart} className="w-full sm:w-auto mb-6">
          <span aria-hidden="true" className="mr-2">🎮</span>
          New Game
        </Button>

        <p className="text-sm text-gray-500 mb-12 flex items-center justify-center gap-1.5">
          <span aria-hidden="true">🔒</span>
          Audio is processed locally and never recorded or transmitted.
        </p>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            How it works
          </h2>
          <ol className="space-y-3 text-left">
            {HOW_IT_WORKS.map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold"
                >
                  {step}
                </span>
                <span className="text-gray-700">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}

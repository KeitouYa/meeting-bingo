import { useEffect, useRef } from 'react'
import type { Category } from '../types'
import { CATEGORIES } from '../data/categories'
import { Card } from './ui/Card'

interface CategorySelectProps {
  onSelect: (category: Category) => void
  onBack: () => void
}

function CategoryCard({
  category,
  onSelect,
}: {
  category: Category
  onSelect: (cat: Category) => void
}) {
  const sampleWords = category.words.slice(0, 4)

  return (
    <Card className="flex flex-col gap-3 hover:border-brand-primary hover:shadow-md transition-all cursor-pointer group">
      <button
        className="text-left w-full focus-visible:outline-none"
        onClick={() => onSelect(category)}
        aria-label={`Select ${category.name}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <span aria-hidden="true" className="text-3xl">
            {category.icon}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sampleWords.map(word => (
            <span
              key={word}
              className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5"
            >
              {word}
            </span>
          ))}
          <span className="text-xs text-gray-400 self-center">
            +{category.words.length - sampleWords.length} more
          </span>
        </div>
      </button>
    </Card>
  )
}

export function CategorySelect({ onSelect, onBack }: CategorySelectProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-gray-900 mb-2 focus:outline-none"
        >
          Choose Your Category
        </h1>
        <p className="text-gray-500 mb-8">Pick the pack that matches your meeting.</p>

        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map(category => (
            <CategoryCard key={category.id} category={category} onSelect={onSelect} />
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 mt-8">
          Each card is randomly generated from {CATEGORIES[0].words.length}+ words per pack.
        </p>
      </div>
    </main>
  )
}

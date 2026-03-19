'use client'

type Props = {
  suggestions: string[]
  onSelect: (value: string) => void
}

export default function SuggestionChips({ suggestions, onSelect }: Props) {
  if (!suggestions.length) return null

  return (
    <div className="hx-suggestion-chips" role="list" aria-label="Suggestions">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          role="listitem"
          className="hx-suggestion-chip"
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

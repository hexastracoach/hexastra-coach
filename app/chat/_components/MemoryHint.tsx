'use client'

import { useState } from 'react'

type Props = {
  hint: string
  onPrompt: (value: string) => void
  suggestionPrompt?: string
  onDismiss?: () => void
}

export default function MemoryHint({ hint, onPrompt, suggestionPrompt, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  function handlePrompt() {
    if (suggestionPrompt) {
      onPrompt(suggestionPrompt)
      setDismissed(true)
    }
  }

  return (
    <div className="hx-memory-hint" role="status" aria-live="polite">
      <span className="hx-memory-hint-icon" aria-hidden="true">◈</span>
      <span className="hx-memory-hint-text">{hint}</span>
      {suggestionPrompt && (
        <button
          type="button"
          className="hx-memory-hint-cta"
          onClick={handlePrompt}
          aria-label="Explorer ce thème"
        >
          Explorer
        </button>
      )}
      <button
        type="button"
        className="hx-memory-hint-dismiss"
        onClick={handleDismiss}
        aria-label="Fermer la suggestion"
      >
        ✕
      </button>
    </div>
  )
}

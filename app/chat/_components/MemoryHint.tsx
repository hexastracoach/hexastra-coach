'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Props = {
  hint: string
  onPrompt: (value: string) => void
  suggestionPrompt?: string
  onDismiss?: () => void
}

export default function MemoryHint({ hint, onPrompt, suggestionPrompt, onDismiss }: Props) {
  const { lang } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  const ctaLabel = lang?.startsWith('en') ? 'Go deeper' : 'Approfondir'
  const ctaAriaLabel = lang?.startsWith('en') ? 'Go deeper on this theme' : 'Approfondir ce theme'
  const dismissLabel = lang?.startsWith('en') ? 'Close suggestion' : 'Fermer la suggestion'

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
      <span className="hx-memory-hint-icon" aria-hidden="true">
        ◈
      </span>
      <span className="hx-memory-hint-text">{hint}</span>
      {suggestionPrompt && (
        <button
          type="button"
          className="hx-memory-hint-cta"
          onClick={handlePrompt}
          aria-label={ctaAriaLabel}
        >
          {ctaLabel}
        </button>
      )}
      <button
        type="button"
        className="hx-memory-hint-dismiss"
        onClick={handleDismiss}
        aria-label={dismissLabel}
      >
        ✕
      </button>
    </div>
  )
}

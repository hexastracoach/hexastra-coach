'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import HexastraLogo from '@/app/components/HexastraLogo'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HexAstra] Global error boundary:', error)
  }, [error])

  return (
    <div className="hx-error-page">
      <div className="hx-error-bg" />

      <div className="hx-error-card">
        <Link href="/" className="hx-error-logo" aria-label="HexAstra Coach">
          <HexastraLogo size={32} variant="navbar" />
        </Link>

        <div className="hx-error-code">500</div>
        <h1 className="hx-error-title">Une erreur inattendue s&apos;est produite</h1>
        <p className="hx-error-lead">
          Quelque chose s&apos;est mal passé de notre côté. Nos équipes ont été notifiées.
        </p>

        <div className="hx-error-actions">
          <button type="button" className="hx-error-btn-primary" onClick={reset}>
            Réessayer
          </button>
          <Link href="/" className="hx-error-btn-secondary">
            Retour à l&apos;accueil
          </Link>
        </div>

        {error.digest && (
          <p className="hx-error-digest">Référence : {error.digest}</p>
        )}
      </div>
    </div>
  )
}

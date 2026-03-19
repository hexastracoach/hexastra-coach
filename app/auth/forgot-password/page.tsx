'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!email) { setError('Veuillez saisir votre adresse e-mail.'); return }
    setLoading(true)
    setError(null)

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })

    setLoading(false)

    if (supabaseError) {
      setError(supabaseError.message)
    } else {
      setSent(true)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleSubmit()
  }

  return (
    <div className="hx-auth-page">
      <video className="hx-auth-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/nebula/hexastra-nebula.mp4" type="video/mp4" />
      </video>
      <div className="hx-auth-overlay" aria-hidden="true" />

      <Link href="/auth" className="hx-auth-back">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </Link>

      <div className="hx-auth-card">
        <div className="hx-auth-logo">
          <Image
            src="/logo/hexastra_logo_white_petals_triangles.svg"
            alt="HexAstra"
            width={48}
            height={48}
            priority
          />
        </div>

        <p className="hx-auth-brand">HexAstra Coach</p>

        {sent ? (
          <div className="hx-auth-sent">
            <div className="hx-auth-sent-icon" aria-hidden="true">✓</div>
            <h2 className="hx-auth-sent-title">Lien envoyé</h2>
            <p className="hx-auth-sent-desc">
              Si un compte existe pour <strong>{email}</strong>, vous allez recevoir un lien de réinitialisation dans les prochaines minutes.
            </p>
            <Link href="/auth" className="hx-auth-submit" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h2 className="hx-auth-title">Mot de passe oublié</h2>
            <p className="hx-auth-subtitle">
              Saisissez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <div className="hx-auth-fields">
              <div className="hx-auth-field">
                <label htmlFor="fp-email" className="hx-auth-label">Adresse e-mail</label>
                <input
                  id="fp-email"
                  type="email"
                  className="hx-auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="hx-auth-error" role="alert">{error}</p>}

            <button
              className="hx-auth-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
            </button>

            <p className="hx-auth-switch">
              Vous avez retrouvé votre mot de passe ?{' '}
              <Link href="/auth" className="hx-auth-switch-link">Se connecter</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

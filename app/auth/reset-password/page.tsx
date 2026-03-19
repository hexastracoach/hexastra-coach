'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasDigit: /[0-9]/,
}

function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_RULES.minLength) return `Au moins ${PASSWORD_RULES.minLength} caractères requis.`
  if (!PASSWORD_RULES.hasUppercase.test(pw)) return 'Au moins une majuscule requise.'
  if (!PASSWORD_RULES.hasDigit.test(pw)) return 'Au moins un chiffre requis.'
  return null
}

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    const validationError = validatePassword(password)
    if (validationError) { setError(validationError); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    setError(null)

    const { error: supabaseError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (supabaseError) {
      setError(supabaseError.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/chat'), 2500)
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

        {done ? (
          <div className="hx-auth-sent">
            <div className="hx-auth-sent-icon" aria-hidden="true">✓</div>
            <h2 className="hx-auth-sent-title">Mot de passe mis à jour</h2>
            <p className="hx-auth-sent-desc">
              Votre mot de passe a été modifié. Redirection vers le coach…
            </p>
          </div>
        ) : (
          <>
            <h2 className="hx-auth-title">Nouveau mot de passe</h2>
            <p className="hx-auth-subtitle">Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>

            <div className="hx-auth-fields">
              <div className="hx-auth-field">
                <label htmlFor="rp-password" className="hx-auth-label">Nouveau mot de passe</label>
                <div className="hx-auth-pwd-wrap">
                  <input
                    id="rp-password"
                    type={showPwd ? 'text' : 'password'}
                    className="hx-auth-input"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError(validatePassword(e.target.value)) }}
                    onKeyDown={onKey}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="hx-auth-pwd-toggle"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
                {pwError && <p className="hx-auth-pw-hint is-error">{pwError}</p>}
              </div>

              <div className="hx-auth-field">
                <label htmlFor="rp-confirm" className="hx-auth-label">Confirmer le mot de passe</label>
                <input
                  id="rp-confirm"
                  type={showPwd ? 'text' : 'password'}
                  className="hx-auth-input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <p className="hx-auth-error" role="alert">{error}</p>}

            <button
              className="hx-auth-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Mise à jour…' : 'Enregistrer le mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

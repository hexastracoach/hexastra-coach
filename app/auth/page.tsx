'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import BackButton from '@/components/navigation/BackButton'

type AuthMode = 'login' | 'signup'

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

function sanitizeNextPath(value: string | null): string {
  if (!value || typeof value !== 'string') return '/chat'
  return value.startsWith('/') ? value : '/chat'
}

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  const [nextPath, setNextPath] = useState('/chat')

  const [mode, setMode] = useState<AuthMode>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setNextPath(sanitizeNextPath(params.get('next')))
  }, [])

  // Already logged in? go straight to chat
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(nextPath)
    })
  }, [nextPath, router, supabase])

  /* Sign out on tab/browser close when "rester connecté" is off */
  useEffect(() => {
    const stored = sessionStorage.getItem('hx.noremember')
    if (!stored) return
    const handleHide = () => { supabase.auth.signOut() }
    window.addEventListener('pagehide', handleHide)
    return () => window.removeEventListener('pagehide', handleHide)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function notify(msg: string, error = false) {
    setMessage(msg)
    setIsError(error)
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    })
    setLoading(false)
  }

  async function handleLogin() {
    if (!email || !password) return notify('Veuillez remplir tous les champs.', true)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      notify(error.message, true)
      setLoading(false)
      return
    }
    if (!rememberMe) {
      sessionStorage.setItem('hx.noremember', '1')
    } else {
      sessionStorage.removeItem('hx.noremember')
    }
    router.refresh()
    router.replace(nextPath)
  }

  async function handleSignup() {
    if (!firstName || !lastName || !email || !password)
      return notify('Veuillez remplir tous les champs.', true)
    const pwValidationError = validatePassword(password)
    if (pwValidationError) return notify(pwValidationError, true)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    if (error) {
      notify(error.message, true)
      setLoading(false)
      return
    }
    /* If email confirmation is disabled in Supabase, redirect immediately */
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session) {
    router.refresh()
    router.replace(nextPath)
  } else {
    notify('Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription.', false)
    setLoading(false)
  }
}

  function handlePasswordChange(val: string) {
    setPassword(val)
    if (mode === 'signup') setPwError(validatePassword(val))
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setMessage('')
    setIsError(false)
    setPwError(null)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    if (mode === 'login') void handleLogin()
    else void handleSignup()
  }

  return (
    <div className="hx-auth-page">
      {/* ── Video background ── */}
      <video
        className="hx-auth-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/nebula/hexastra-nebula.mp4" type="video/mp4" />
      </video>
      <div className="hx-auth-overlay" aria-hidden="true" />

      {/* ── Back to previous + Language switcher ── */}
      <BackButton fallbackHref="/" className="hx-auth-back" ariaLabel="Retour à l'accueil">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </BackButton>
      <div className="hx-auth-lang">
        <LanguageSwitcher />
      </div>

      {/* ── Card ── */}
      <div className="hx-auth-card">

        {/* Logo */}
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

        {/* Mode tabs */}
        <div className="hx-auth-tabs">
          <button
            type="button"
            className={`hx-auth-tab${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={`hx-auth-tab${mode === 'signup' ? ' is-active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            S&apos;inscrire
          </button>
        </div>

        {/* Google */}
        <button
          type="button"
          className="hx-auth-google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <div className="hx-auth-divider"><span>ou</span></div>

        {/* Signup extra fields */}
        {mode === 'signup' && (
          <div className="hx-auth-row">
            <input
              className="hx-auth-input"
              placeholder="Prénom"
              value={firstName}
              autoComplete="given-name"
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={onKey}
            />
            <input
              className="hx-auth-input"
              placeholder="Nom"
              value={lastName}
              autoComplete="family-name"
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        )}

        <input
          className="hx-auth-input"
          placeholder="Adresse e-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKey}
        />

        <div className="hx-auth-pw-wrap">
          <div className="hx-auth-pw-field">
            {mode === 'login' ? (
              <input
                key="login-pw"
                className="hx-auth-input"
                placeholder="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onKeyDown={onKey}
              />
            ) : (
              <input
                key="signup-pw"
                className="hx-auth-input"
                placeholder="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onKeyDown={onKey}
              />
            )}
            <button
              type="button"
              className="hx-auth-pw-toggle"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              tabIndex={-1}
            >
              {showPwd ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 2l12 12M6.5 6.7A2 2 0 0010 10M4.3 4.5C2.8 5.5 1.5 7 1.5 8c0 1.5 3 5 6.5 5 1.3 0 2.5-.4 3.5-1M6.5 3.1C7 3 7.5 3 8 3c3.5 0 6.5 3.5 6.5 5 0 .7-.3 1.4-.8 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M1.5 8C1.5 8 4.5 3 8 3s6.5 5 6.5 5-3 5-6.5 5S1.5 8 1.5 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
            </button>
          </div>
          {mode === 'signup' && (
            <p className={`hx-auth-pw-hint${pwError && password.length > 0 ? ' is-error' : ''}`}>
              8 caractères minimum · 1 majuscule · 1 chiffre
            </p>
          )}
        </div>

        {/* Rester connecté + mot de passe oublié — login only */}
        {mode === 'login' && (
          <div className="hx-auth-login-row">
            <label className="hx-auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Rester connecté</span>
            </label>
            <a href="/auth/forgot-password" className="hx-auth-forgot">
              Mot de passe oublié ?
            </a>
          </div>
        )}

        <button
          type="button"
          className="hx-auth-submit"
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        {message && (
          <p className={`hx-auth-message${isError ? ' is-error' : ' is-success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import HexastraLogo from '@/app/components/HexastraLogo'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [readingsCount, setReadingsCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth'); return }
      setEmail(data.user.email ?? '')
      fetchCount()
      setLoading(false)
    })
  }, [])

  async function fetchCount() {
    const { count } = await supabase.from('readings').select('*', { count: 'exact', head: true })
    if (typeof count === 'number') setReadingsCount(count)
  }

  async function handleDeleteAll() {
    setDeleting(true); setMessage(''); setError('')
    try {
      const res = await fetch('/api/readings', { method: 'DELETE' })
      if (res.ok) {
        setMessage('Lectures supprimées.')
        setReadingsCount(0)
      } else {
        setError('Suppression impossible pour le moment.')
      }
    } catch {
      setError('Suppression impossible pour le moment.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="hx-account-loading">
        <span>Chargement…</span>
      </div>
    )
  }

  return (
    <div className="hx-account-page">
      <div className="hx-account-bg" />

      <header className="hx-account-header">
        <Link href="/" className="hx-home-brand" aria-label="HexAstra Coach">
          <div className="hx-home-brand-badge">
            <HexastraLogo size={26} variant="navbar" priority />
          </div>
          <div className="hx-home-brand-text">
            <div className="hx-home-brand-title">HexAstra Coach</div>
          </div>
        </Link>
        <div className="hx-account-header-right">
          <LanguageSwitcher />
          <Link href="/chat" className="hx-account-nav-link">Chat</Link>
          <Link href="/account" className="hx-account-nav-link">Profil</Link>
        </div>
      </header>

      <main className="hx-account-main">
        <div className="hx-account-card">
          <div className="hx-account-hero">
            <div className="hx-home-kicker">Paramètres</div>
            <h1 className="hx-account-title">Mes lectures</h1>
            <p className="hx-account-subtitle">Gère ou supprime tes lectures sauvegardées.</p>
          </div>

          <div className="hx-account-row">
            <span className="hx-account-row-label">Adresse email</span>
            <span className="hx-account-row-value">{email}</span>
          </div>

          <div className="hx-account-row">
            <span className="hx-account-row-label">Lectures sauvegardées</span>
            <span className="hx-account-row-value">
              {readingsCount === null ? '—' : readingsCount}
            </span>
          </div>

          <div className="hx-account-actions">
            <Link href="/library" className="hx-account-btn hx-account-btn-primary">
              Ouvrir ma bibliothèque
            </Link>
            <button
              type="button"
              className="hx-account-btn hx-account-btn-ghost"
              onClick={handleDeleteAll}
              disabled={deleting}
            >
              {deleting ? 'Suppression…' : 'Supprimer toutes mes lectures'}
            </button>
            {(message || error) && (
              <p className={error ? 'hx-account-error' : 'hx-account-manage-desc'}>
                {error || message}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

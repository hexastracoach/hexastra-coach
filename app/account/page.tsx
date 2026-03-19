'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/lib/plans'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import HexastraLogo from '@/app/components/HexastraLogo'

const PLAN_COLORS: Record<PlanKey, string> = {
  free:         'hx-account-badge-free',
  essential:    'hx-account-badge-essential',
  premium:      'hx-account-badge-premium',
  practitioner: 'hx-account-badge-practitioner',
}

export default function AccountPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]     = useState('')
  const [plan, setPlan]       = useState<PlanKey>('free')
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError]     = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth'); return }
      setEmail(data.user.email ?? '')
      setPlan((data.user.user_metadata?.plan as PlanKey) ?? 'free')
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleDeleteReadings() {
    setDeleting(true)
    try {
      await fetch('/api/readings', { method: 'DELETE' }).catch(() => {})
    } finally {
      setDeleting(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError(t('account.portalError'))
      }
    } catch {
      setPortalError(t('account.portalError'))
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="hx-account-loading">
        <span>{t('account.loading')}</span>
      </div>
    )
  }

  const planLabel = t(`pricing.${plan}Label`) || plan

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
        </div>
      </header>

      <main className="hx-account-main">
        <div className="hx-account-card">

          <div className="hx-account-hero">
            <div className="hx-home-kicker">{t('account.kicker')}</div>
            <h1 className="hx-account-title">{t('account.title')}</h1>
          </div>

          {/* Email */}
          <div className="hx-account-row">
            <span className="hx-account-row-label">{t('account.emailLabel')}</span>
            <span className="hx-account-row-value">{email}</span>
          </div>

          {/* Plan */}
          <div className="hx-account-row">
            <span className="hx-account-row-label">{t('account.planLabel')}</span>
            <span className={`hx-account-badge ${PLAN_COLORS[plan]}`}>
              {planLabel}
            </span>
          </div>

          {/* Gérer abonnement */}
          <div className="hx-account-actions">
            {plan === 'free' ? (
              <Link href="/pricing" className="hx-account-btn hx-account-btn-primary">
                {t('account.upgradeBtn')}
              </Link>
            ) : (
              <div className="hx-account-manage">
                <button
                  type="button"
                  className="hx-account-btn hx-account-btn-primary"
                  onClick={handlePortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? t('account.loading') : t('account.manageBtn')}
                </button>
                <p className="hx-account-manage-desc">{t('account.manageDesc')}</p>
                {portalError && <p className="hx-account-error">{portalError}</p>}
              </div>
            )}

            <button
              type="button"
              className="hx-account-btn hx-account-btn-ghost"
              onClick={handleSignOut}
            >
              {t('account.signOut')}
            </button>

            <button
              type="button"
              className="hx-account-btn hx-account-btn-ghost"
              onClick={handleDeleteReadings}
              disabled={deleting}
            >
              {deleting ? t('account.loading') : 'Paramètres · gérer / supprimer mes lectures'}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

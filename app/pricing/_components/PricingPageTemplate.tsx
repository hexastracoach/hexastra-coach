'use client'

import Link from 'next/link'
import PremiumBackground from '@/app/components/PremiumBackground'
import HexastraLogo from '@/app/components/HexastraLogo'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePlansUI } from '@/lib/usePlansUI'
import type { PlanKey } from '@/types/subscription'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { priceKeyFromPlan } from '@/lib/billing/stripePlans'
import { useRouter } from 'next/navigation'
import { getPlanCheckoutAuthHref } from '@/lib/plans'

export default function PricingPageTemplate({ planKey }: { planKey: PlanKey }) {
  const { t } = useTranslation()
  const plans = usePlansUI()
  const plan = plans.find((p) => p.key === planKey)!
  const supabase = createClient()
  const [checkoutHref, setCheckoutHref] = useState<string>(getPlanCheckoutAuthHref(planKey))
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [shouldAutoCheckout, setShouldAutoCheckout] = useState(false)
  const router = useRouter()
  const autoCheckoutStartedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setShouldAutoCheckout(params.get('checkout') === '1')
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCheckoutHref('stripe')
      } else {
        setCheckoutHref(getPlanCheckoutAuthHref(planKey))
      }
    })
  }, [planKey, supabase])

  async function startCheckout() {
    const priceKey = priceKeyFromPlan(planKey)
    if (!priceKey) {
      router.push('/auth')
      return
    }
    setLoading(true)
    setCheckoutError(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceKey }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.url) {
        window.location.href = json.url
      } else if (res.status === 401) {
        router.push(getPlanCheckoutAuthHref(planKey))
      } else {
        setCheckoutError(json?.error ?? 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      setCheckoutError('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCta(e: React.MouseEvent) {
    if (checkoutHref !== 'stripe') return
    e.preventDefault()
    await startCheckout()
  }

  useEffect(() => {
    if (!shouldAutoCheckout || checkoutHref !== 'stripe' || loading || autoCheckoutStartedRef.current) {
      return
    }

    autoCheckoutStartedRef.current = true
    void startCheckout()
  }, [checkoutHref, loading, shouldAutoCheckout])

  return (
    <main className="hx-pricing-page">
      <PremiumBackground hero />
      <div className="hx-pricing-page-overlay" />

      <header className="hx-pricing-header">
        <Link href="/" className="hx-home-brand" aria-label="HexAstra Coach">
          <div className="hx-home-brand-badge">
            <HexastraLogo size={22} variant="navbar" priority />
          </div>
          <div className="hx-home-brand-text">
            <div className="hx-home-brand-title">HexAstra Coach</div>
            <div className="hx-home-brand-subtitle">{t('pricing.brandSub')}</div>
          </div>
        </Link>

        <Link href="/#offres" className="hx-pricing-back-link">
          {t('pricing.backLink')}
        </Link>
      </header>

      <div className="hx-pricing-content">
        <div className="hx-pricing-wrap">

          {plan.badge && (
            <div className="hx-pricing-badge">{plan.badge}</div>
          )}

          <div className="hx-home-kicker">{plan.label}</div>

          <div className="hx-pricing-price-row">
            <span className="hx-pricing-price-amount">{plan.price}</span>
            <span className="hx-pricing-price-period">{plan.period}</span>
          </div>

          <p className="hx-pricing-tagline">{plan.desc}</p>

          <div className="hx-pricing-divider" />

          <ul className="hx-pricing-feature-list">
            {plan.features.map((feature) => (
              <li key={feature} className="hx-pricing-feature-item">
                <span className="hx-pricing-feature-glyph">✦</span>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href={checkoutHref === 'stripe' ? '#' : checkoutHref}
            onClick={handleCta}
            className="hx-pricing-cta-btn"
          >
            {loading ? t('pricing.loading') ?? 'Redirection…' : plan.cta}
          </Link>

          {checkoutError && (
            <p className="hx-pricing-checkout-error" role="alert">{checkoutError}</p>
          )}

          <p className="hx-pricing-legal">
            {t('pricing.legal')}
          </p>
        </div>

        <Link href="/#offres" className="hx-pricing-compare-link">
          {t('pricing.compareLink')}
        </Link>
      </div>
    </main>
  )
}

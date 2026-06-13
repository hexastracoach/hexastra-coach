'use client'

import Link from 'next/link'
import HexastraLogo from '@/app/components/HexastraLogo'
import PremiumBackground from '@/app/components/PremiumBackground'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePlansUI } from '@/lib/usePlansUI'
import { getPlanCheckoutHref } from '@/lib/plans'

export default function PricingPage() {
  const { t, lang } = useTranslation()
  const plans = usePlansUI()
  const freePlan = plans.find((plan) => plan.key === 'free')
  const paidPlans = plans.filter((plan) => plan.key !== 'free')
  const getPricingPlanHref = (plan: (typeof plans)[number]) =>
    plan.key === 'free' ? plan.href : getPlanCheckoutHref(plan.key)
  const overviewTitle =
    lang === 'en'
      ? 'Start free. Go deeper only when you need more clarity.'
      : 'Commencez gratuitement. Montez en profondeur seulement quand vous en avez besoin.'
  const overviewCopy =
    lang === 'en'
      ? 'Free to try. Essential to continue without friction. Premium to get the clearest, deepest and most precise guidance when a situation really matters.'
      : 'Free pour essayer. Essential pour continuer sans friction. Premium pour obtenir la lecture la plus claire, precise et utile quand la situation compte vraiment.'

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
        <Link href="/" className="hx-pricing-back-link">
          {t('pricing.backLink')}
        </Link>
      </header>

      <div className="hx-pricing-content">
        <div className="hx-pricing-overview-wrap">
          <div className="hx-home-kicker">{t('home.pricingKicker')}</div>
          <h1 className="hx-pricing-overview-title">{overviewTitle}</h1>
          <p className="hx-pricing-overview-copy">{overviewCopy}</p>

          {freePlan && (
            <section className="hx-pricing-free-row" aria-label={freePlan.label}>
              <div className="hx-pricing-free-copy">
                <div className="hx-pricing-free-label">{freePlan.label}</div>
                <div className="hx-pricing-free-desc">{freePlan.desc}</div>
              </div>

              <div className="hx-pricing-free-side">
                <div className="hx-pricing-free-price">
                  <span className="hx-pricing-price-amount">{freePlan.price}</span>
                  <span className="hx-pricing-price-period">{freePlan.period}</span>
                </div>
                <Link href={freePlan.href} className="hx-pricing-cta-btn hx-pricing-cta-btn-secondary">
                  {freePlan.cta}
                </Link>
              </div>
            </section>
          )}

          <div className="hx-pricing-overview-grid">
            {paidPlans.map((plan) => (
              <article
                key={plan.key}
                className={`hx-pricing-overview-card${plan.highlighted ? ' is-highlighted' : ''}`}
              >
                {plan.badge && <div className="hx-pricing-badge">{plan.badge}</div>}

                <div className="hx-pricing-overview-card-label">{plan.label}</div>
                <div className="hx-pricing-price-row">
                  <span className="hx-pricing-price-amount">{plan.price}</span>
                  <span className="hx-pricing-price-period">{plan.period}</span>
                </div>
                <p className="hx-pricing-tagline">{plan.desc}</p>

                <div className="hx-pricing-divider" />

                <ul className="hx-pricing-feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature} className="hx-pricing-feature-item">
                      <span className="hx-pricing-feature-glyph">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={getPricingPlanHref(plan)} className={`hx-pricing-cta-btn${plan.highlighted ? ' is-primary' : ''}`}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>

          <p className="hx-pricing-legal">{t('pricing.legal')}</p>
        </div>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import HexastraLogo from './components/HexastraLogo'
import PremiumBackground from './components/PremiumBackground'
import LanguageSwitcher from './components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePlansUI } from '@/lib/usePlansUI'

export default function HomePage() {
  const haloRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { t } = useTranslation()
  const plansUI = usePlansUI()

  const MODULES_DATA = useMemo(() => [
    { title: 'Astrolex',  text: t('home.module1Text'), cases: t('home.module1Cases'), dimension: t('home.module1Dim') },
    { title: 'Porteum',   text: t('home.module2Text'), cases: t('home.module2Cases'), dimension: t('home.module2Dim') },
    { title: 'NeuroSoma', text: t('home.module3Text'), cases: t('home.module3Cases'), dimension: t('home.module3Dim') },
    { title: 'Fusion',    text: t('home.module4Text'), cases: t('home.module4Cases'), dimension: t('home.module4Dim') },
    { title: 'SpiritLex', text: t('home.module5Text'), cases: t('home.module5Cases'), dimension: t('home.module5Dim') },
    { title: 'Présence',  text: t('home.module6Text'), cases: t('home.module6Cases'), dimension: t('home.module6Dim') },
  ], [t])

  const [user, setUser] = useState<any>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const chatHref = user ? '/chat' : '/auth'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [supabase])

  /* Escape key + scroll lock for mobile nav */
  useEffect(() => {
    if (!mobileNavOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false) }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!haloRef.current) return
      haloRef.current.style.left = `${e.clientX}px`
      haloRef.current.style.top = `${e.clientY}px`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <main className="hx-home">
      <section className="hx-home-hero">
        <PremiumBackground hero />
        <div className="hx-home-hero-overlay" />

        {/* ── Mobile nav overlay (backdrop) ── */}
        <div
          className={`hx-mobile-nav-overlay${mobileNavOpen ? ' is-open' : ''}`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />

        {/* ── Mobile nav sheet ── */}
        <div
          className={`hx-mobile-nav-sheet${mobileNavOpen ? ' is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="hx-mobile-nav-close">
            <button type="button" onClick={closeMobileNav} aria-label="Fermer le menu">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="hx-mobile-nav-links">
            <a href="#modules" onClick={closeMobileNav}>{t('nav.howItWorks')}</a>
            <a href="#difference" onClick={closeMobileNav}>{t('nav.whyHexAstra')}</a>
            <a href="#offres" onClick={closeMobileNav}>{t('nav.pricing')}</a>
            {user ? (
              <Link href={chatHref} className="hx-mobile-nav-cta" onClick={closeMobileNav}>
                {t('nav.myAccount')}
              </Link>
            ) : (
              <Link href="/auth" className="hx-mobile-nav-cta" onClick={closeMobileNav}>
                {t('nav.signIn')}
              </Link>
            )}
          </nav>
          <div className="hx-mobile-nav-lang">
            <LanguageSwitcher variant="flag" />
          </div>
        </div>

        {/* ── Header / Navbar ── */}
        <header className="hx-home-header">
          <div ref={haloRef} className="hx-header-halo" />
          <div className="hx-header-stars" />

          <Link href="/" className="hx-home-brand" aria-label="HexAstra Coach">
            <div className="hx-home-brand-badge">
              <span className="hx-home-brand-halo" />
              <HexastraLogo
                size={25}
                variant="navbar"
                priority
              />
            </div>
            <div className="hx-home-brand-text">
              <div className="hx-home-brand-title">HexAstra Coach</div>
              <div className="hx-home-brand-subtitle">{t('home.brandSub')}</div>
            </div>
          </Link>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="hx-home-nav" aria-label="Navigation principale">
            <a href="#modules">{t('nav.howItWorks')}</a>
            <a href="#difference">{t('nav.whyHexAstra')}</a>
            <a href="#offres">{t('nav.pricing')}</a>
            {user ? (
              <Link href={chatHref} className="hx-home-login">{t('nav.myAccount')}</Link>
            ) : (
              <Link href="/auth" className="hx-home-login">{t('nav.signIn')}</Link>
            )}
            <LanguageSwitcher variant="flag" />
          </nav>

          {/* Mobile burger — hidden on desktop via CSS */}
          <button
            type="button"
            className="hx-mobile-nav-toggle"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileNavOpen ? 'true' : 'false'}
            aria-controls="mobile-nav"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <rect x="0" y="0" width="18" height="2" rx="1" fill="currentColor" />
              <rect x="0" y="6" width="13" height="2" rx="1" fill="currentColor" opacity="0.75" />
              <rect x="0" y="12" width="15" height="2" rx="1" fill="currentColor" opacity="0.88" />
            </svg>
          </button>
        </header>

        {/* ── Hero content ── */}
        <div className="hx-home-hero-inner">
          <div className="hx-home-hero-grid">
            <div className="hx-home-hero-left">
              <div className="hx-home-kicker">{t('home.heroKicker')}</div>
              <h1 className="hx-home-hero-title">{t('home.heroTitle')}</h1>
              <p className="hx-home-hero-text">{t('home.heroText')}</p>
              <div className="hx-home-microcopy">
                <p>{t('home.heroMicrocopy')}</p>
              </div>

              <div className="hx-home-hero-actions">
                <Link href={chatHref} className="hx-home-hero-secondary">{t('home.heroFree')}</Link>
              </div>
            </div>

            <div className="hx-home-preview-card">
              <div className="hx-home-kicker">{t('home.previewKicker')}</div>
              <div className="hx-home-preview-bubble is-user">{t('home.previewUser1')}</div>
              <div className="hx-home-preview-bubble is-assistant">{t('home.previewAI1')}</div>
              <div className="hx-home-preview-bubble is-assistant">{t('home.previewAI2')}</div>
              <div className="hx-home-preview-bubble is-user">{t('home.previewUser2')}</div>
              <div className="hx-home-preview-bubble is-assistant">{t('home.previewAI3')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="hx-home-section hx-home-section-darkfusion">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.modulesKicker')}</div>
          <h2 className="hx-home-title hx-home-title-light">{t('home.modulesTitle')}</h2>
          <p className="hx-home-copy">{t('home.modulesCopy')}</p>

          <div className="hx-home-dimension-grid">
            {MODULES_DATA.map((item) => (
              <article className="hx-home-dimension-card" key={item.title}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <p className="hx-home-module-meta">
                  <strong>{t('home.modulesCasesLabel')}</strong>
                  <br />
                  {item.cases}
                </p>
                <p className="hx-home-module-meta">
                  <strong>{t('home.modulesDimLabel')}</strong>
                  <br />
                  {item.dimension}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="hx-home-section hx-home-section-cream">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.useCasesKicker')}</div>
          <h2 className="hx-home-title">{t('home.useCasesTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.useCasesCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase1Title')}</h3>
              <p>{t('home.useCase1Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase2Title')}</h3>
              <p>{t('home.useCase2Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase3Title')}</h3>
              <p>{t('home.useCase3Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase4Title')}</h3>
              <p>{t('home.useCase4Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase5Title')}</h3>
              <p>{t('home.useCase5Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.useCase6Title')}</h3>
              <p>{t('home.useCase6Text')}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Différences ── */}
      <section id="difference" className="hx-home-section hx-home-section-light">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.diffKicker')}</div>
          <h2 className="hx-home-title">{t('home.diffTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.diffCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.diff1Title')}</h3>
              <p>{t('home.diff1Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.diff2Title')}</h3>
              <p>{t('home.diff2Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.diff3Title')}</h3>
              <p>{t('home.diff3Text')}</p>
            </article>
            <article className="hx-home-dimension-card hx-home-card-light">
              <div className="hx-home-dimension-dot" />
              <h3>{t('home.diff4Title')}</h3>
              <p>{t('home.diff4Text')}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="offres" className="hx-home-section hx-home-section-cream">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.pricingKicker')}</div>
          <h2 className="hx-home-title">{t('home.pricingTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.pricingCopy')}</p>

          <div className="hx-home-pricing-grid">
            {plansUI.map((plan) => (
              <article
                key={plan.key}
                className={`hx-home-pricing-card${plan.highlighted ? ' is-highlighted' : ''}`}
              >
                {plan.badge && (
                  <div className="hx-home-pricing-badge">{plan.badge}</div>
                )}
                <div className="hx-home-kicker">{plan.label}</div>
                <div className="hx-home-pricing-price">
                  {plan.price}
                  <span className="hx-home-pricing-unit">{plan.period}</span>
                </div>
                <p className="hx-home-pricing-desc">{plan.desc}</p>
                <div className="hx-home-pricing-list">
                  {plan.features.map((item) => (
                    <p className="hx-home-pricing-item" key={item}>
                      <span className="hx-home-pricing-check" aria-hidden="true">✦</span>
                      {item}
                    </p>
                  ))}
                </div>
                <Link href={plan.href} className="hx-home-pricing-cta">{plan.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="hx-home-section hx-home-section-finalcta">
        <div className="hx-home-section-wrap">
          <div className="hx-home-finalcta">
            <div className="hx-home-kicker">{t('home.ctaKicker')}</div>
            <h2>{t('home.ctaTitle')}</h2>
            <p className="hx-home-copy">{t('home.ctaCopy')}</p>
            <div className="hx-home-hero-actions is-centered">
              <Link href={chatHref} className="hx-home-hero-secondary is-prominent">{t('home.ctaAuth')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="hx-home-footer">
        <div className="hx-footer-inner">
          <div className="hx-footer-left">{t('home.footerCopyright')}</div>
          <div className="hx-footer-links">
            <Link href="/support">Support</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/politique-confidentialite">{t('home.footerPrivacy')}</Link>
            <Link href="/conditions-utilisation">{t('home.footerTerms')}</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

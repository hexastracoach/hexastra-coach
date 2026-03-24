'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import HexastraLogo from './components/HexastraLogo'
import PremiumBackground from './components/PremiumBackground'
import LanguageSwitcher from './components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePlansUI } from '@/lib/usePlansUI'
import { buildChatEntryHref } from '@/lib/chat/chatEntryHref'
import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'

export default function HomePage() {
  const haloRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { t } = useTranslation()
  const plansUI = usePlansUI()

  const problemCards = [
    { title: t('home.problemCard1Title'), text: t('home.problemCard1Text') },
    { title: t('home.problemCard2Title'), text: t('home.problemCard2Text') },
    { title: t('home.problemCard3Title'), text: t('home.problemCard3Text') },
  ]

  const stepCards = [
    { title: t('home.step1Title'), text: t('home.step1Text') },
    { title: t('home.step2Title'), text: t('home.step2Text') },
    { title: t('home.step3Title'), text: t('home.step3Text') },
  ]

  const benefitCards = [
    { title: t('home.benefit1Title'), text: t('home.benefit1Text') },
    { title: t('home.benefit2Title'), text: t('home.benefit2Text') },
    { title: t('home.benefit3Title'), text: t('home.benefit3Text') },
    { title: t('home.benefit4Title'), text: t('home.benefit4Text') },
    { title: t('home.benefit5Title'), text: t('home.benefit5Text') },
    { title: t('home.benefit6Title'), text: t('home.benefit6Text') },
  ]

  const differentiationCards = [
    { title: t('home.diffCard1Title'), text: t('home.diffCard1Text') },
    { title: t('home.diffCard2Title'), text: t('home.diffCard2Text') },
    { title: t('home.diffCard3Title'), text: t('home.diffCard3Text') },
  ]

  const testimonials = [
    { quote: t('home.testimonial1Quote'), author: t('home.testimonial1Author') },
    { quote: t('home.testimonial2Quote'), author: t('home.testimonial2Author') },
    { quote: t('home.testimonial3Quote'), author: t('home.testimonial3Author') },
  ]

  const [user, setUser] = useState<any>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const accountHref = user ? '/chat' : '/auth'
  const heroChatHref = buildChatEntryHref({ prompt: t('chat.suggestion1'), source: 'landing_hero' })
  const finalChatHref = buildChatEntryHref({ prompt: t('chat.suggestion4'), source: 'landing_final' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [supabase])

  useEffect(() => {
    if (!mobileNavOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }

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

        <div
          className={`hx-mobile-nav-overlay${mobileNavOpen ? ' is-open' : ''}`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />

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
            <a href="#how-it-works" onClick={closeMobileNav}>{t('nav.howItWorks')}</a>
            <a href="#difference" onClick={closeMobileNav}>{t('nav.whyHexAstra')}</a>
            <a href="#offres" onClick={closeMobileNav}>{t('nav.pricing')}</a>
            {user ? (
              <Link href={accountHref} className="hx-mobile-nav-cta" onClick={closeMobileNav}>
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

        <header className="hx-home-header">
          <div ref={haloRef} className="hx-header-halo" />
          <div className="hx-header-stars" />

          <Link href="/" className="hx-home-brand" aria-label="HexAstra Coach">
            <div className="hx-home-brand-badge">
              <span className="hx-home-brand-halo" />
              <HexastraLogo size={25} variant="navbar" priority />
            </div>
            <div className="hx-home-brand-text">
              <div className="hx-home-brand-title">HexAstra Coach</div>
              <div className="hx-home-brand-subtitle">{t('home.brandSub')}</div>
            </div>
          </Link>

          <nav className="hx-home-nav" aria-label="Navigation principale">
            <a href="#how-it-works">{t('nav.howItWorks')}</a>
            <a href="#difference">{t('nav.whyHexAstra')}</a>
            <a href="#offres">{t('nav.pricing')}</a>
            {user ? (
              <Link href={accountHref} className="hx-home-login">{t('nav.myAccount')}</Link>
            ) : (
              <Link href="/auth" className="hx-home-login">{t('nav.signIn')}</Link>
            )}
            <LanguageSwitcher variant="flag" />
          </nav>

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
                <Link
                  href={heroChatHref}
                  className="hx-home-hero-primary"
                  onClick={() => trackHexastraFunnel('landing_chat_cta_clicked', { location: 'hero' })}
                >
                  {t('home.heroPrimary')}
                </Link>
                <a href="#how-it-works" className="hx-home-hero-secondary">{t('home.heroSecondary')}</a>
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

      <section className="hx-home-section hx-home-section-darkfusion">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.problemKicker')}</div>
          <h2 className="hx-home-title hx-home-title-light">{t('home.problemTitle')}</h2>
          <p className="hx-home-copy">{t('home.problemCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            {problemCards.map((item) => (
              <article className="hx-home-dimension-card" key={item.title}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="hx-home-section hx-home-section-cream">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.solutionKicker')}</div>
          <h2 className="hx-home-title">{t('home.solutionTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.solutionCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            {stepCards.map((item) => (
              <article className="hx-home-dimension-card hx-home-card-light" key={item.title}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-home-section hx-home-section-light">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.valueKicker')}</div>
          <h2 className="hx-home-title">{t('home.valueTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.valueCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            {benefitCards.map((item) => (
              <article className="hx-home-dimension-card hx-home-card-light" key={item.title}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="difference" className="hx-home-section hx-home-section-darkfusion">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.diffKicker')}</div>
          <h2 className="hx-home-title hx-home-title-light">{t('home.diffTitle')}</h2>
          <p className="hx-home-copy">{t('home.diffCopy')}</p>
          <p className="hx-home-emphasis">{t('home.diffQuote')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            {differentiationCards.map((item) => (
              <article className="hx-home-dimension-card" key={item.title}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-home-section hx-home-section-cream">
        <div className="hx-home-section-wrap">
          <div className="hx-home-kicker">{t('home.socialKicker')}</div>
          <h2 className="hx-home-title">{t('home.socialTitle')}</h2>
          <p className="hx-home-copy hx-home-copy-dark">{t('home.socialCopy')}</p>

          <div className="hx-home-dimension-grid hx-home-grid-compact">
            {testimonials.map((item) => (
              <article className="hx-home-dimension-card hx-home-card-light" key={item.author}>
                <div className="hx-home-dimension-dot" />
                <h3>{item.quote}</h3>
                <p className="hx-home-testimonial-meta">{item.author}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

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
                {plan.badge ? <div className="hx-home-pricing-badge">{plan.badge}</div> : null}
                <div className="hx-home-kicker">{plan.label}</div>
                <div className="hx-home-pricing-price">
                  {plan.price}
                  <span className="hx-home-pricing-unit">{plan.period}</span>
                </div>
                <p className="hx-home-pricing-desc">{plan.desc}</p>
                <div className="hx-home-pricing-list">
                  {plan.features.map((item) => (
                    <p className="hx-home-pricing-item" key={item}>
                      <span className="hx-home-pricing-check" aria-hidden="true">*</span>
                      {item}
                    </p>
                  ))}
                </div>
                <Link
                  href={plan.href}
                  className="hx-home-pricing-cta"
                  onClick={() => {
                    if (plan.key === 'free') {
                      trackHexastraFunnel('landing_chat_cta_clicked', { location: 'pricing_free' })
                      return
                    }

                    trackHexastraFunnel('chat_upgrade_clicked', {
                      location: 'pricing_card',
                      targetPlan: plan.key,
                    })
                  }}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-home-section hx-home-section-finalcta">
        <div className="hx-home-section-wrap">
          <div className="hx-home-finalcta">
            <div className="hx-home-kicker">{t('home.ctaKicker')}</div>
            <h2>{t('home.ctaTitle')}</h2>
            <p className="hx-home-copy">{t('home.ctaCopy')}</p>
            <div className="hx-home-hero-actions is-centered">
              <Link
                href={finalChatHref}
                className="hx-home-hero-secondary is-prominent"
                onClick={() => trackHexastraFunnel('landing_chat_cta_clicked', { location: 'final_cta' })}
              >
                {t('home.ctaAuth')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="hx-home-footer">
        <div className="hx-footer-inner">
          <div className="hx-footer-left">
            <div className="hx-footer-tagline">{t('home.footerTagline')}</div>
            <div>{t('home.footerCopyright')}</div>
          </div>
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

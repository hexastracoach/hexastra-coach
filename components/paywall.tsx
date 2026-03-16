'use client'

import { useRouter } from 'next/navigation'
import BackButton from './navigation/BackButton'

type Plan = 'free' | 'premium' | 'praticien'

interface PaywallProps {
  userPlan: Plan
  onUpgrade?: () => void
  variant?: 'inline' | 'full'
}

export function PaywallInline({ userPlan, onUpgrade }: PaywallProps) {
  const router = useRouter()

  if (userPlan !== 'free') return null

  return (
    <div style={p.wrap}>
      <div style={p.blurPreview}>
        <div style={p.blurLine} />
        <div style={{ ...p.blurLine, width: '80%' }} />
        <div style={{ ...p.blurLine, width: '90%' }} />
        <div style={{ ...p.blurLine, width: '65%' }} />
      </div>

      <div style={p.gate}>
        <div style={p.gateIconRow}>
          <div style={p.lockIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <div style={p.gateTitle}>Lecture complete disponible</div>
            <div style={p.gateSubtitle}>Debloquez votre analyse Premium</div>
          </div>
        </div>

        <div style={p.gateFeatures}>
          {[
            { icon: 'PDF', label: "L'analyse detaillee" },
            { icon: '*', label: 'Les conseils personnalises' },
            { icon: 'MP3', label: 'La version audio' },
            { icon: 'DL', label: 'Le PDF telechargeable' },
          ].map((f, i) => (
            <div key={i} style={p.gateFeature}>
              <span style={p.gateFeatureIcon}>{f.icon}</span>
              <span style={p.gateFeatureTxt}>{f.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade || (() => router.push('/pricing'))}
          style={p.upgradeBtn}
        >
          Debloquer ma lecture
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

        <p style={p.upgradeNote}>
          Premium - 19 EUR/mois - Sans engagement
        </p>
      </div>
    </div>
  )
}

export function DailyLimitReached({ onUpgrade }: { onUpgrade?: () => void }) {
  const router = useRouter()

  return (
    <div style={d.wrap}>
      <div style={d.icon}></div>
      <div style={d.title}>Limite quotidienne atteinte</div>
      <p style={d.desc}>
        Vous avez utilise votre lecture gratuite du jour. Revenez demain - ou passez en Premium pour des lectures illimitees.
      </p>
      <button
        onClick={onUpgrade || (() => router.push('/pricing'))}
        style={d.btn}
      >
        Lectures illimitees - 19 EUR/mois
      </button>
      <p style={d.note}>Ou revenez demain pour votre prochaine lecture gratuite</p>
    </div>
  )
}

export function StorageLimitReached({ onUpgrade }: { onUpgrade?: () => void }) {
  const router = useRouter()

  return (
    <div style={d.wrap}>
      <div style={d.icon}></div>
      <div style={d.title}>Bibliotheque pleine</div>
      <p style={d.desc}>
        Vous avez atteint la limite de 3 lectures sauvegardees. Supprimez une ancienne lecture ou passez en Premium pour un historique illimite.
      </p>
      <button
        onClick={onUpgrade || (() => router.push('/pricing'))}
        style={d.btn}
      >
        Historique illimite - 19 EUR/mois
      </button>
    </div>
  )
}

export function UpgradeBanner({ userPlan, readingsToday, maxReadings = 1 }: {
  userPlan: Plan
  readingsToday: number
  maxReadings?: number
}) {
  const router = useRouter()

  if (userPlan !== 'free') return null

  const remaining = maxReadings - readingsToday
  const isLow = remaining <= 0

  return (
    <div style={b.wrap}>
      <div style={b.left}>
        <div style={{ ...b.dot, background: isLow ? '#ff6b6b' : 'var(--emerald)' }} />
        <span style={b.txt}>
          {isLow
            ? 'Limite quotidienne atteinte'
            : remaining + (remaining > 1 ? ' lectures gratuites restantes' : ' lecture gratuite restante') + " aujourd'hui"
          }
        </span>
      </div>
      <button onClick={() => router.push('/pricing')} style={b.btn}>
        Passer Premium
      </button>
    </div>
  )
}

export function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      tag: 'Freemium',
      name: 'Gratuit',
      price: '0',
      per: '',
      desc: 'Pour decouvrir HexAstra sans engagement.',
      features: [
        { text: '1 lecture gratuite par jour', ok: true },
        { text: 'Analyse courte', ok: true },
        { text: 'Texte uniquement', ok: true },
        { text: 'Acces au chat HexAstra', ok: true },
        { text: 'Sauvegarde limitee (3 lectures)', ok: true },
        { text: 'PDF telechargeable', ok: false },
        { text: 'Version audio', ok: false },
        { text: 'Analyses avancees', ok: false },
      ],
      cta: 'Commencer gratuitement',
      ctaStyle: 'ghost' as const,
      featured: false,
      priceKey: null,
    },
    {
      tag: 'Premium',
      name: 'Premium',
      price: '19',
      per: '/mois',
      desc: 'Pour aller en profondeur, sans limite.',
      features: [
        { text: 'Lectures illimitees', ok: true },
        { text: 'Analyses completes et detaillees', ok: true },
        { text: 'PDF telechargeable', ok: true },
        { text: 'Audio personnalise', ok: true },
        { text: 'Historique complet', ok: true },
        { text: 'Themes avances', ok: true },
        { text: 'Support prioritaire', ok: true },
      ],
      cta: 'Demarrer Premium',
      ctaStyle: 'primary' as const,
      featured: true,
      priceKey: 'premium_monthly',
    },
    {
      tag: 'Pro',
      name: 'Praticien',
      price: '49',
      per: '/mois',
      desc: 'Pour les coachs et therapeutes.',
      features: [
        { text: 'Lectures illimitees', ok: true },
        { text: 'PDF + Audio pour chaque lecture', ok: true },
        { text: 'Usage pour vos clients', ok: true },
        { text: 'Export des analyses', ok: true },
        { text: 'Generation prioritaire', ok: true },
        { text: 'Support dedie', ok: true },
      ],
      cta: 'Demarrer Praticien',
      ctaStyle: 'secondary' as const,
      featured: false,
      priceKey: 'praticien_monthly',
    },
  ]

  const handleCta = async (plan: typeof plans[0]) => {
    if (!plan.priceKey) { router.push('/login'); return }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceKey: plan.priceKey }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else router.push('/login')
  }

  return (
    <div style={pr.root}>
      <div style={pr.bgGlow} />

      <nav style={pr.nav}>
        <a href="/" style={pr.navLogo}>
          <span style={pr.navLogoTxt}>
            Hex<span style={{ color: 'var(--emerald)' }}>Astra</span>
          </span>
        </a>
        <BackButton fallbackHref="/pricing" className="" >
          <span style={pr.navBack}>Retour</span>
        </BackButton>
      </nav>

      <div style={pr.container}>
        <div style={pr.header}>
          <div style={pr.headerTag}>Tarifs</div>
          <h1 style={pr.headerTitle}>Choisissez votre formule</h1>
          <p style={pr.headerDesc}>Commencez gratuitement. Evoluez selon vos besoins. Sans engagement.</p>
        </div>

        <div style={pr.grid}>
          {plans.map((plan, i) => (
            <div key={i} style={{ ...pr.card, ...(plan.featured ? pr.cardFeatured : {}) }}>
              {plan.featured && (
                <div style={pr.featuredBadge}>Le plus populaire</div>
              )}

              <div style={pr.cardTop}>
                <div style={{ ...pr.planTag, color: plan.featured ? 'var(--emerald)' : 'var(--tx3)' }}>
                  {plan.tag}
                </div>
                <div style={pr.planName}>{plan.name}</div>
                <div style={pr.planPrice}>
                  <span style={pr.planAmt}>{plan.price}</span>
                  <span style={pr.planCur}>EUR</span>
                  {plan.per && <span style={pr.planPer}>{plan.per}</span>}
                </div>
                <p style={pr.planDesc}>{plan.desc}</p>
              </div>

              <div style={pr.divider} />

              <ul style={pr.features}>
                {plan.features.map((f, j) => (
                  <li key={j} style={f.ok ? pr.feature : pr.featureLocked}>
                    <span style={f.ok ? pr.check : pr.cross}>{f.ok ? 'v' : 'x'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCta(plan)}
                style={
                  plan.ctaStyle === 'primary' ? pr.btnPrimary
                  : plan.ctaStyle === 'secondary' ? pr.btnSecondary
                  : pr.btnGhost
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={pr.faq}>
          <div style={pr.faqTag}>Questions frequentes</div>
          {[
            {
              q: "Puis-je annuler a tout moment ?",
              a: "Oui, sans engagement ni frais. Votre acces reste actif jusqu'a la fin de la periode payee.",
            },
            {
              q: "Que contient la lecture gratuite ?",
              a: "Une analyse courte en texte uniquement, basee sur vos donnees de naissance. Pas de PDF ni audio.",
            },
            {
              q: "La formule Praticien inclut-elle plusieurs comptes ?",
              a: "Non, il s'agit d'un compte individuel avec des droits d'usage pour vos clients.",
            },
          ].map((item, i) => (
            <div key={i} style={pr.faqItem}>
              <div style={pr.faqQ}>{item.q}</div>
              <div style={pr.faqA}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const p: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column' as const, gap: '0', marginTop: '8px' },
  blurPreview: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--b1)', borderRadius: '8px 8px 0 0', padding: '12px 14px', display: 'flex', flexDirection: 'column' as const, gap: '8px', filter: 'blur(3px)', userSelect: 'none' as const },
  blurLine: { height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '100%' },
  gate: { background: 'rgba(31,175,140,0.05)', border: '1px solid rgba(31,175,140,0.2)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px' },
  gateIconRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  lockIcon: { width: '32px', height: '32px', background: 'rgba(31,175,140,0.1)', border: '1px solid rgba(31,175,140,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)', flexShrink: 0 },
  gateTitle: { fontFamily: 'var(--f-display)', fontSize: '16px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--chrome)', lineHeight: 1 },
  gateSubtitle: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', color: 'var(--tx3)', letterSpacing: '0.1em', marginTop: '3px' },
  gateFeatures: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '14px' },
  gateFeature: { display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '7px 10px' },
  gateFeatureIcon: { fontSize: '13px', flexShrink: 0 },
  gateFeatureTxt: { fontFamily: 'var(--f-ui)', fontSize: '12px', color: 'var(--tx2)' },
  upgradeBtn: { width: '100%', padding: '12px', background: 'var(--emerald)', color: 'var(--void)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(31,175,140,0.3)' },
  upgradeNote: { fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--tx3)', textAlign: 'center' as const, marginTop: '8px', letterSpacing: '0.06em' },
}

const d: Record<string, React.CSSProperties> = {
  wrap: { background: 'rgba(31,175,140,0.04)', border: '1px solid rgba(31,175,140,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px', textAlign: 'center' as const },
  icon: { fontSize: '28px' },
  title: { fontFamily: 'var(--f-display)', fontSize: '18px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--chrome)' },
  desc: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '14px', color: 'var(--tx2)', lineHeight: 1.7, maxWidth: '320px' },
  btn: { padding: '11px 22px', background: 'var(--emerald)', color: 'var(--void)', fontFamily: 'var(--f-mono)', fontSize: '10.5px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(31,175,140,0.3)', marginTop: '4px' },
  note: { fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--tx3)', letterSpacing: '0.06em' },
}

const b: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(31,175,140,0.04)', borderTop: '1px solid rgba(31,175,140,0.1)' },
  left: { display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  txt: { fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--tx3)', letterSpacing: '0.08em' },
  btn: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', letterSpacing: '0.1em', color: 'var(--emerald)', background: 'transparent', border: '1px solid rgba(31,175,140,0.25)', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', textTransform: 'uppercase' as const },
}

const pr: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: 'var(--pitch)', position: 'relative', fontFamily: 'var(--f-ui)' },
  bgGlow: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(31,175,140,0.07),transparent)' },
  nav: { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid var(--b1)', background: 'rgba(44,31,26,0.7)', backdropFilter: 'blur(20px)' },
  navLogo: { textDecoration: 'none' },
  navLogoTxt: { fontFamily: 'var(--f-display)', fontSize: '20px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--chrome)' },
  navBack: { fontFamily: 'var(--f-mono)', fontSize: '10.5px', letterSpacing: '0.1em', color: 'var(--tx3)', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase' as const },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '64px 24px 100px', position: 'relative', zIndex: 1 },
  header: { textAlign: 'center' as const, marginBottom: '56px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  headerTag: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--emerald)', textTransform: 'uppercase' as const },
  headerTitle: { fontFamily: 'var(--f-display)', fontSize: 'clamp(32px,4vw,52px)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--chrome)', margin: 0 },
  headerDesc: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '17px', color: 'var(--tx2)', lineHeight: 1.75 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px', alignItems: 'start' },
  card: { background: 'var(--panel)', border: '1px solid var(--b2)', borderRadius: '14px', padding: '28px', display: 'flex', flexDirection: 'column' as const, gap: '0', position: 'relative' as const },
  cardFeatured: { border: '1px solid rgba(31,175,140,0.4)', boxShadow: '0 0 0 1px rgba(31,175,140,0.1), 0 24px 60px rgba(0,0,0,0.4)', background: 'rgba(31,175,140,0.03)' },
  featuredBadge: { position: 'absolute' as const, top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--emerald)', color: 'var(--void)', fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.12em', padding: '4px 14px', borderRadius: '100px', whiteSpace: 'nowrap' as const, fontWeight: 600 },
  cardTop: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '20px' },
  planTag: { fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' as const },
  planName: { fontFamily: 'var(--f-display)', fontSize: '28px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--chrome)', lineHeight: 1 },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' },
  planAmt: { fontFamily: 'var(--f-display)', fontSize: '52px', color: 'var(--chrome)', lineHeight: 1 },
  planCur: { fontFamily: 'var(--f-mono)', fontSize: '14px', color: 'var(--tx2)' },
  planPer: { fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--tx3)', letterSpacing: '0.06em' },
  planDesc: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '13.5px', color: 'var(--tx2)', lineHeight: 1.6 },
  divider: { height: '1px', background: 'var(--b1)', margin: '0 0 18px' },
  features: { listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '24px', flex: 1 },
  feature: { display: 'flex', alignItems: 'flex-start', gap: '9px', fontFamily: 'var(--f-ui)', fontSize: '13.5px', color: 'var(--tx2)', lineHeight: 1.5 },
  featureLocked: { display: 'flex', alignItems: 'flex-start', gap: '9px', fontFamily: 'var(--f-ui)', fontSize: '13.5px', color: 'var(--tx3)', opacity: 0.45, lineHeight: 1.5 },
  check: { color: 'var(--emerald)', fontWeight: 700, flexShrink: 0 },
  cross: { color: 'var(--tx3)', flexShrink: 0 },
  btnPrimary: { padding: '13px', background: 'var(--emerald)', color: 'var(--void)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 8px 24px rgba(31,175,140,0.3)' },
  btnSecondary: { padding: '12px', background: 'rgba(31,175,140,0.08)', border: '1px solid rgba(31,175,140,0.2)', color: 'var(--emerald)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer', width: '100%' },
  btnGhost: { padding: '12px', background: 'transparent', border: '1px solid var(--b2)', color: 'var(--tx2)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer', width: '100%' },
  faq: { marginTop: '64px', display: 'flex', flexDirection: 'column' as const, gap: '0', borderTop: '1px solid var(--b1)' },
  faqTag: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--emerald)', textTransform: 'uppercase' as const, padding: '28px 0 20px' },
  faqItem: { borderBottom: '1px solid var(--b1)', padding: '20px 0', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  faqQ: { fontFamily: 'var(--f-display)', fontSize: '17px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--chrome)' },
  faqA: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '14px', color: 'var(--tx2)', lineHeight: 1.75 },
}

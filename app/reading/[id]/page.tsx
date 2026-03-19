'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'

export default function ReadingPage() {
  const [reading, setReading] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const supabase = createClient()

  useEffect(() => {
    if (!params.id) return
    supabase.from('readings').select('*').eq('id', params.id).single()
      .then(({ data }) => { setReading(data); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const download = async (type: 'pdf' | 'audio') => {
    const { data } = await supabase.from('file_refs')
      .select('id').eq('reading_id', params.id).eq('file_type', type).single()
    if (data) window.open(`/api/download/${data.id}`)
    else alert('Fichier non disponible.')
  }

  const handlePremium = async () => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceKey: 'premium_reading', readingId: params.id }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url)
  }

  // ③ Bouton Partager
  const handleShare = async () => {
    const url = window.location.href
    const text = `Mon analyse HexAstra — ${new Date(reading?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mon analyse HexAstra', text, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--pitch)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={s.spinner} />
    </div>
  )

  if (!reading) return (
    <div style={{ minHeight: '100vh', background: 'var(--pitch)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--f-mono)', fontSize: '12px', color: 'var(--tx3)' }}>Analyse introuvable.</p>
    </div>
  )

  return (
    <div style={s.root}>
      <div style={s.bgGlow} />
      <div style={s.bgGrid} />

      <div style={s.container}>
        {/* Top nav */}
        <div style={s.topNav}>
          <a href="/" style={s.logoLink} aria-label="HexAstra — Accueil">
            <Image src="/logo/hexastra.png" alt="HexAstra" width={32} height={32} style={s.logoImg} />
            <span style={s.logoTxt}>Hex<span style={s.logoAccent}>Astra</span></span>
          </a>
          <div style={s.navActions}>
            {/* ③ Bouton Partager */}
            <button onClick={handleShare} style={s.shareBtn}>
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Lien copié !
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Partager
                </>
              )}
            </button>
            <button onClick={() => router.push('/library')} style={s.back}>
              ← Mes lectures
            </button>
          </div>
        </div>

        {/* Payment success banner */}
        {paymentStatus === 'success' && (
          <div style={s.successBanner}>
            <div style={s.bannerDot} />
            Paiement confirmé. Votre lecture complète est en cours de génération — revenez dans quelques instants.
          </div>
        )}

        <div style={s.card}>
          {/* Header */}
          <div style={s.cardHdr}>
            <div style={s.cardTopLine}>
              <div style={s.dateTag}>
                {new Date(reading.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <span style={{
                ...s.badge,
                background: reading.reading_type === 'premium' ? 'rgba(31,175,140,0.08)' : 'rgba(255,255,255,0.04)',
                color: reading.reading_type === 'premium' ? 'var(--emerald)' : 'var(--tx3)',
                borderColor: reading.reading_type === 'premium' ? 'rgba(31,175,140,0.25)' : 'var(--b2)',
              }}>
                {reading.reading_type === 'premium' ? '◆ Lecture complète' : 'Aperçu gratuit'}
              </span>
            </div>
            <h1 style={s.title}>VOTRE ANALYSE</h1>
            <p style={s.subtitle}>Naissance · {new Date(reading.birth_date_iso).toLocaleDateString('fr-FR')}</p>
          </div>

          <div style={s.divider} />

          {/* Content */}
          {reading.reading_text ? (
            <div style={s.readingBody}>
              {reading.reading_text.split('\n').map((p: string, i: number) =>
                p.trim() ? <p key={i} style={s.para}>{p}</p> : <br key={i} />
              )}
            </div>
          ) : (
            <div style={s.genRow}>
              <span style={s.spinner} />
              <p style={s.genTxt}>Votre analyse est en cours de génération...</p>
            </div>
          )}

          {/* Premium downloads */}
          {reading.reading_type === 'premium' && (
            <>
              <div style={s.divider} />
              <div style={s.dlSection}>
                <div style={s.dlSectionHdr}>// Vos fichiers</div>
                <div style={s.dlRow}>
                  <button onClick={() => download('pdf')} style={s.dlBtn}>
                    <span style={s.dlIcon}>PDF</span>
                    Télécharger le PDF
                  </button>
                  <button onClick={() => download('audio')} style={{ ...s.dlBtn, ...s.dlAudio }}>
                    <span style={{ ...s.dlIcon, background: 'rgba(0,212,255,0.08)', color: '#00d4ff' }}>MP3</span>
                    Écouter l'Audio
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Free → Premium upsell */}
          {reading.reading_type === 'free' && (
            <>
              <div style={s.divider} />
              <div style={s.upsellSection}>
                <div style={s.upsellTag}>// Votre analyse est prête</div>
                <h2 style={s.upsellTitle}>DÉBLOQUER LA VERSION COMPLÈTE</h2>
                <p style={s.upsellDesc}>
                  Débloquez la version complète pour accéder à la lecture détaillée, au PDF téléchargeable et à la version audio personnalisée.
                </p>
                <ul style={s.upsellList}>
                  {['Lecture détaillée et personnalisée', 'PDF téléchargeable (6 pages)', 'Version audio MP3 (7 minutes)', 'Accès illimité à vie'].map((item, i) => (
                    <li key={i} style={s.upsellItem}>
                      <span style={s.upsellCheck}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={s.priceRow}>
                  <span style={s.priceNum}>19</span>
                  <span style={s.priceCur}>EUR</span>
                  <span style={s.priceNote}>· achat unique, sans abonnement</span>
                </div>
                <button onClick={handlePremium} style={s.upgradeBtn}>
                  Débloquer ma lecture complète
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: 'var(--pitch)', position: 'relative' },
  bgGlow: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 50% at 50% 0%,rgba(31,175,140,0.06),transparent)' },
  bgGrid: { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(232,232,240,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(232,232,240,0.02) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,black,transparent)' } as React.CSSProperties,
  container: { maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1 },
  topNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  logoLink: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  logoImg: { width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(31,175,140,0.5))', borderRadius: '50%' },
  logoTxt: { fontFamily: 'var(--f-display)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--chrome)', textTransform: 'uppercase' },
  logoAccent: { color: 'var(--emerald)' },
  navActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  shareBtn: { display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--emerald)', background: 'rgba(31,175,140,0.08)', border: '1px solid rgba(31,175,140,0.2)', borderRadius: '4px', padding: '7px 14px', cursor: 'pointer', textTransform: 'uppercase' as const, transition: 'all 0.2s' },
  back: { fontFamily: 'var(--f-mono)', fontSize: '10.5px', letterSpacing: '0.1em', color: 'var(--tx3)', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase' as const },
  successBanner: { display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--f-mono)', fontSize: '11px', color: '#80ffaa', lineHeight: 1.6, padding: '14px 18px', background: 'rgba(60,255,100,0.07)', border: '1px solid rgba(60,255,100,0.18)', borderRadius: '8px', marginBottom: '20px' },
  bannerDot: { width: '5px', height: '5px', borderRadius: '50%', background: '#80ffaa', flexShrink: 0, animation: 'pulse 2s ease infinite' },
  card: { background: 'var(--panel)', border: '1px solid var(--b2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.5)', animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' },
  cardHdr: { padding: '32px 36px' },
  cardTopLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  dateTag: { fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--tx3)', textTransform: 'uppercase' as const },
  badge: { fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: '100px', border: '1px solid', textTransform: 'uppercase' as const },
  title: { fontFamily: 'var(--f-display)', fontSize: '32px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--chrome)', marginBottom: '8px' },
  subtitle: { fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--tx3)', textTransform: 'uppercase' as const },
  divider: { height: '1px', background: 'var(--b1)', marginLeft: '36px', marginRight: '36px' },
  readingBody: { padding: '28px 36px', display: 'flex', flexDirection: 'column' as const, gap: '18px' },
  para: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '16px', lineHeight: 1.88, color: 'var(--tx2)' },
  genRow: { padding: '36px', display: 'flex', alignItems: 'center', gap: '12px' },
  genTxt: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '15px', color: 'var(--tx2)' },
  dlSection: { padding: '24px 36px' },
  dlSectionHdr: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--emerald)', textTransform: 'uppercase' as const, marginBottom: '14px' },
  dlRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  dlBtn: { flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(31,175,140,0.07)', border: '1px solid rgba(31,175,140,0.12)', borderRadius: '6px', color: 'var(--emerald)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.08em', padding: '12px 16px', cursor: 'pointer', textTransform: 'uppercase' as const },
  dlAudio: { background: 'rgba(0,212,255,0.05)', borderColor: 'rgba(0,212,255,0.14)', color: '#00d4ff' },
  dlIcon: { fontFamily: 'var(--f-mono)', fontSize: '8.5px', letterSpacing: '0.1em', padding: '3px 7px', background: 'rgba(31,175,140,0.1)', borderRadius: '3px', color: 'var(--emerald)', fontWeight: 600 },
  upsellSection: { padding: '28px 36px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  upsellTag: { fontFamily: 'var(--f-mono)', fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--emerald)', textTransform: 'uppercase' as const },
  upsellTitle: { fontFamily: 'var(--f-display)', fontSize: '26px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--chrome)' },
  upsellDesc: { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.75, color: 'var(--tx2)', maxWidth: '480px' },
  upsellList: { listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  upsellItem: { display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--f-ui)', fontSize: '13px', color: 'var(--tx2)' },
  upsellCheck: { color: 'var(--emerald)', fontWeight: 600, fontSize: '13px', flexShrink: 0 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  priceNum: { fontFamily: 'var(--f-display)', fontSize: '52px', color: 'var(--emerald)', lineHeight: 1 },
  priceCur: { fontFamily: 'var(--f-mono)', fontSize: '14px', color: 'var(--emerald)', opacity: 0.7 },
  priceNote: { fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--tx3)', letterSpacing: '0.06em' },
  upgradeBtn: { alignSelf: 'flex-start' as const, padding: '14px 28px', background: 'var(--emerald)', color: 'var(--void)', fontFamily: 'var(--f-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontWeight: 600, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 28px rgba(31,175,140,0.3)', border: 'none', cursor: 'pointer' },
  spinner: { display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--b2)', borderTop: '2px solid var(--emerald)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}

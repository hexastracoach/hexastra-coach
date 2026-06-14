'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import HexastraLogo from '@/app/components/HexastraLogo'

export default function ReadingPage() {
  const [reading, setReading] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
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

  const showDownloadError = (msg: string) => {
    setDownloadError(msg)
    setTimeout(() => setDownloadError(null), 4000)
  }

  const download = async (type: 'pdf' | 'audio') => {
    const { data } = await supabase.from('file_refs')
      .select('id').eq('reading_id', params.id).eq('file_type', type).single()
    if (data) window.open(`/api/download/${data.id}`)
    else showDownloadError('Fichier non disponible pour cette lecture.')
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

  const handleShare = async () => {
    const url = window.location.href
    const text = `Mon analyse HexAstra — ${new Date(String(reading?.created_at ?? '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

    if (navigator.share) {
      try { await navigator.share({ title: 'Mon analyse HexAstra', text, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div className="hx-reading-fullscreen-center">
      <span className="hx-reading-spinner" aria-label="Chargement…" />
    </div>
  )

  if (!reading) return (
    <div className="hx-reading-fullscreen-center">
      <p className="hx-reading-not-found">Analyse introuvable.</p>
      <Link href="/library" className="hx-reading-back-link">← Mes lectures</Link>
    </div>
  )

  const readingType = String(reading.reading_type ?? 'free')
  const createdAt = String(reading.created_at ?? '')
  const birthDateIso = String(reading.birth_date_iso ?? '')
  const readingText = reading.reading_text ? String(reading.reading_text) : null

  return (
    <div className="hx-reading-root">
      <div className="hx-reading-bg" />
      <div className="hx-reading-grid" />

      <div className="hx-reading-container">
        {/* Top nav */}
        <div className="hx-reading-topnav">
          <Link href="/" className="hx-reading-logo-link" aria-label="HexAstra — Accueil">
            <HexastraLogo size={28} variant="navbar" />
            <span className="hx-reading-logo-txt">
              Hex<span className="hx-reading-logo-accent">Astra</span>
            </span>
          </Link>
          <div className="hx-reading-nav-actions">
            <button onClick={handleShare} className="hx-reading-share-btn">
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Lien copié !
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Partager
                </>
              )}
            </button>
            <button onClick={() => router.push('/library')} className="hx-reading-back-btn">
              ← Mes lectures
            </button>
          </div>
        </div>

        {paymentStatus === 'success' && (
          <div className="hx-reading-success-banner" role="status">
            <div className="hx-reading-banner-dot" />
            Paiement confirmé. Votre lecture complète est en cours de génération — revenez dans quelques instants.
          </div>
        )}

        {downloadError && (
          <div className="hx-reading-error-toast" role="alert">{downloadError}</div>
        )}

        <div className="hx-reading-card">
          <div className="hx-reading-card-header">
            <div className="hx-reading-card-top-line">
              <div className="hx-reading-date-tag">
                {new Date(createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <span className={`hx-reading-badge ${readingType === 'premium' ? 'is-premium' : ''}`}>
                {readingType === 'premium' ? '◆ Lecture complète' : 'Aperçu gratuit'}
              </span>
            </div>
            <h1 className="hx-reading-title">Votre Analyse</h1>
            <p className="hx-reading-subtitle">Naissance · {new Date(birthDateIso).toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="hx-reading-divider" />

          {readingText ? (
            <div className="hx-reading-body">
              {readingText.split('\n').map((p: string, i: number) =>
                p.trim() ? <p key={i} className="hx-reading-para">{p}</p> : <br key={i} />
              )}
            </div>
          ) : (
            <div className="hx-reading-gen-row">
              <span className="hx-reading-spinner" />
              <p className="hx-reading-gen-txt">Votre analyse est en cours de génération…</p>
            </div>
          )}

          {readingType === 'premium' && (
            <>
              <div className="hx-reading-divider" />
              <div className="hx-reading-dl-section">
                <div className="hx-reading-dl-label">// Vos fichiers</div>
                <div className="hx-reading-dl-row">
                  <button onClick={() => download('pdf')} className="hx-reading-dl-btn">
                    <span className="hx-reading-dl-icon">PDF</span>
                    Télécharger le PDF
                  </button>
                  <button onClick={() => download('audio')} className="hx-reading-dl-btn is-audio">
                    <span className="hx-reading-dl-icon is-audio">MP3</span>
                    Écouter l&apos;Audio
                  </button>
                </div>
              </div>
            </>
          )}

          {readingType === 'free' && (
            <>
              <div className="hx-reading-divider" />
              <div className="hx-reading-upsell">
                <div className="hx-reading-upsell-tag">// Votre analyse est prête</div>
                <h2 className="hx-reading-upsell-title">Débloquer la version complète</h2>
                <p className="hx-reading-upsell-desc">
                  Débloquez la version complète pour accéder à la lecture détaillée, au PDF téléchargeable et à la version audio personnalisée.
                </p>
                <ul className="hx-reading-upsell-list">
                  {['Lecture détaillée et personnalisée', 'PDF téléchargeable (6 pages)', 'Version audio MP3 (7 minutes)', 'Accès illimité à vie'].map((item, i) => (
                    <li key={i} className="hx-reading-upsell-item">
                      <span className="hx-reading-upsell-check">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="hx-reading-price-row">
                  <span className="hx-reading-price-num">19</span>
                  <span className="hx-reading-price-cur">€</span>
                  <span className="hx-reading-price-note">· achat unique, sans abonnement</span>
                </div>
                <button onClick={handlePremium} className="hx-reading-upgrade-btn">
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

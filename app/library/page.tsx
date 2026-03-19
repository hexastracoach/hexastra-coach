'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import HexastraLogo from '@/app/components/HexastraLogo'

type Reading = {
  id: string
  created_at: string
  reading_type: 'free' | 'premium'
  reading_text: string | null
  birth_date_iso: string
}

export default function LibraryPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth'); return }
      supabase.from('readings').select('*').order('created_at', { ascending: false })
        .then(({ data: rows }) => { setReadings(rows || []); setLoading(false) })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showDownloadError = (msg: string) => {
    setDownloadError(msg)
    setTimeout(() => setDownloadError(null), 4000)
  }

  const download = async (readingId: string, type: 'pdf' | 'audio') => {
    const { data } = await supabase.from('file_refs')
      .select('id').eq('reading_id', readingId).eq('file_type', type).single()
    if (data) window.open(`/api/download/${data.id}`)
    else showDownloadError('Fichier non disponible pour cette lecture.')
  }

  return (
    <div className="hx-lib-root">
      <div className="hx-lib-bg" />

      <aside className="hx-lib-sidebar">
        <div className="hx-lib-sidebar-top">
          <HexastraLogo size={20} variant="navbar" />
          <span className="hx-lib-sidebar-name">
            Hex<span className="hx-lib-sidebar-accent">Astra</span>
          </span>
        </div>
        <div className="hx-lib-sidebar-section-label">Navigation</div>
        <nav className="hx-lib-nav">
          <button className="hx-lib-nav-item" onClick={() => router.push('/chat')}>
            <svg className="hx-lib-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Chat IA
          </button>
          <button className="hx-lib-nav-item is-active">
            <svg className="hx-lib-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            Mes Lectures
          </button>
        </nav>
      </aside>

      <main className="hx-lib-main">
        <header className="hx-lib-header">
          <div>
            <div className="hx-lib-header-tag">// Bibliothèque</div>
            <h1 className="hx-lib-header-title">Mes Lectures</h1>
          </div>
          <button onClick={() => router.push('/chat')} className="hx-lib-new-btn">
            + Nouvelle lecture
          </button>
        </header>

        {downloadError && (
          <div className="hx-lib-error-toast" role="alert">{downloadError}</div>
        )}

        <div className="hx-lib-content">
          {loading ? (
            <div className="hx-lib-center">
              <span className="hx-lib-spinner" aria-label="Chargement…" />
            </div>
          ) : readings.length === 0 ? (
            <div className="hx-lib-center">
              <div className="hx-lib-empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <p className="hx-lib-empty-txt">Aucune lecture pour l&apos;instant.</p>
              <button onClick={() => router.push('/chat')} className="hx-lib-start-btn">
                Commencer ma première lecture →
              </button>
            </div>
          ) : (
            <div className="hx-lib-grid">
              {readings.map(r => (
                <div key={r.id} className="hx-lib-card" onClick={() => router.push(`/reading/${r.id}`)}>
                  <div className="hx-lib-card-top">
                    <div className="hx-lib-card-date">
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <span className={`hx-lib-badge ${r.reading_type === 'premium' ? 'is-premium' : ''}`}>
                      {r.reading_type === 'premium' ? '◆ Premium' : 'Gratuit'}
                    </span>
                  </div>

                  <p className="hx-lib-card-birth">
                    Naissance · {new Date(r.birth_date_iso).toLocaleDateString('fr-FR')}
                  </p>

                  {r.reading_text && (
                    <p className="hx-lib-excerpt">{r.reading_text.slice(0, 150)}…</p>
                  )}

                  {r.reading_type === 'premium' && (
                    <div className="hx-lib-dl-row" onClick={e => e.stopPropagation()}>
                      <button onClick={() => download(r.id, 'pdf')} className="hx-lib-dl-btn">
                        ↓ PDF
                      </button>
                      <button onClick={() => download(r.id, 'audio')} className="hx-lib-dl-btn is-audio">
                        ↓ Audio MP3
                      </button>
                    </div>
                  )}

                  {r.reading_type === 'free' && (
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/reading/${r.id}`) }}
                      className="hx-lib-upgrade-btn"
                    >
                      Obtenir PDF + Audio — 19 EUR →
                    </button>
                  )}

                  <div className="hx-lib-card-arrow" aria-hidden="true">→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

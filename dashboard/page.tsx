// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/* ── Types ── */
type Mode = 'libre' | 'praticien'
type Conv  = { id: string; title: string; updatedAtISO: string }
type Deliv = { id: string; type: 'pdf'|'mp3'; title: string; status: 'ready'|'processing'|'failed'; url?: string; createdAtISO: string }
type Gauge = { key: string; label: string; score: number; hint: string }
type State = {
  userId: string; mode: Mode;
  profile: { firstName?: string; birthDate?: string; birthTime?: string; birthPlace?: string; livingSummary?: string; tags?: string[]; priorities?: string[] }
  conversations: Conv[]; deliverables: Deliv[]
  analysis?: { summary: string; gauges: Gauge[]; levers: string[]; risks: string[]; plan: string[]; updatedAtISO: string }
  nextStep?: { text: string; updatedAtISO: string }
}

/* ── Helpers ── */
function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}
function clamp(n: number) { return Math.max(0, Math.min(100, n)) }

/* ── Logo ── */
function HexLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <polygon points="32,3 59,18 59,46 32,61 5,46 5,18" fill="none" stroke="#C6A35F" strokeWidth="1.8"/>
      <circle cx="32" cy="32" r="4.5" fill="#C6A35F" opacity="0.9"/>
      <line x1="32" y1="13" x2="32" y2="27" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
      <line x1="32" y1="37" x2="32" y2="51" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
      <line x1="13" y1="23" x2="27" y2="29" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
      <line x1="37" y1="35" x2="51" y2="43" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
      <line x1="51" y1="23" x2="37" y2="29" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
      <line x1="27" y1="35" x2="13" y2="43" stroke="#C6A35F" strokeWidth="1.2" opacity="0.55"/>
    </svg>
  )
}

/* ── Card ── */
function Card({ children, className = '', highlight = false }: any) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.78)',
      border: `1px solid ${highlight ? 'rgba(198,163,95,0.35)' : 'rgba(198,163,95,0.20)'}`,
      borderRadius: 'clamp(18px, 5vw, 24px)',
      overflow: 'hidden',
      boxShadow: highlight ? '0 0 0 1px rgba(198,163,95,0.14), 0 18px 45px rgba(46,42,38,0.10)' : '0 14px 34px rgba(46,42,38,0.08)',
    }} className={className}>
      {children}
    </div>
  )
}
function CardH({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: 'clamp(16px, 5vw, 22px) clamp(16px, 5vw, 22px) 0' }}>
      <div style={{ color: '#2E2A26', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(16px, 4.8vw, 17px)', fontWeight: 500 }}>{title}</div>
      {sub && <div style={{ color: 'rgba(111,103,95,0.78)', fontFamily: "'Inter', sans-serif", fontSize: '12px', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}
function CardB({ children }: any) {
  return <div style={{ padding: '14px clamp(16px, 5vw, 22px) clamp(18px, 5vw, 22px)' }}>{children}</div>
}
function Sep() {
  return <div style={{ height: '1px', background: 'rgba(200,169,119,0.18)', margin: '12px 0' }} />
}

/* ── Gauge ── */
function Gauge({ label, score, hint }: Gauge) {
  const s = clamp(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#2E2A26', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>{label}</span>
        <span style={{ color: 'rgba(111,103,95,0.72)', fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{s}/100</span>
      </div>
      <div style={{ height: '6px', borderRadius: '100px', background: 'rgba(200,169,119,0.18)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${s}%`, borderRadius: '100px', background: 'linear-gradient(90deg, rgba(198,163,95,0.4), rgba(198,163,95,0.9))', transition: 'width 1s ease' }} />
      </div>
      <div style={{ color: 'rgba(111,103,95,0.78)', fontFamily: "'Inter', sans-serif", fontSize: '12px', lineHeight: 1.5 }}>{hint}</div>
    </div>
  )
}

/* ══════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════ */
export default function DashboardPage() {
  const [state, setState] = useState<State | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(d => { setState(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const s = state
  const a = s?.analysis
  const p = s?.profile ?? {}

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 14% 0%, rgba(233,215,190,0.58), transparent 30%), radial-gradient(circle at 86% 12%, rgba(154,184,200,0.22), transparent 32%), linear-gradient(180deg,#F8F6F1 0%,#EFE9DF 100%)',
      color: '#2E2A26',
      padding: '0'
    }}>
      <style>{DASH_CSS}</style>

      {/* ── Nav ── */}
      <nav className="db-nav">
        <Link href="/" className="db-logo">
          <HexLogo size={24} />
          <span>HexAstra <em>Coach</em></span>
        </Link>
        <div className="db-nav-links">
          <Link href="/dashboard" className="db-nl db-nl-on">Dashboard</Link>
          <Link href="/analysis" className="db-nl">Analyse</Link>
          <Link href="/profile" className="db-nl">Profil</Link>
          <Link href="/" className="db-nl">Chat</Link>
        </div>
      </nav>

      <div className="db-page">
        {/* Header */}
        <header className="db-header">
          <div>
            <h1 className="db-h1">Votre espace HexAstra</h1>
            <p className="db-sub">Clarté, décisions, direction — au même endroit.</p>
          </div>
          <Link href="/" className="btn-gold-sm">Reprendre avec HexAstra →</Link>
        </header>

        {loading ? (
          <div className="db-loading"><div className="db-spinner" /> Chargement…</div>
        ) : (
          <div className="db-grid">
            {/* LEFT — 2/3 */}
            <div className="db-main">

              {/* Prochaine étape */}
              <Card highlight>
                <CardH title="Votre prochaine étape" sub="Une action simple pour avancer." />
                <CardB>
                  <p className="db-text">{s?.nextStep?.text ?? 'Choisis une seule priorité pour les 7 prochains jours, puis demande à HexAstra un plan d\'action en 3 étapes.'}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <Link href="/" className="btn-gold-sm">Parler avec HexAstra</Link>
                    <Link href="/analysis" className="btn-ghost-sm">Voir l'analyse</Link>
                  </div>
                </CardB>
              </Card>

              {/* Résumé du moment */}
              <Card>
                <CardH title="Résumé du moment" sub="Court, utile, sans jargon." />
                <CardB>
                  <p className="db-text">{p.livingSummary ?? 'Pas encore de résumé. Lance une conversation pour générer ton premier scan.'}</p>
                  {p.tags?.length ? (
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '14px' }}>
                      {p.tags.map((tag: string, i: number) => (
                        <span key={i} className="db-tag">{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </CardB>
              </Card>

              {/* Jauges */}
              {a?.gauges?.length ? (
                <Card>
                  <CardH title="Indicateurs actuels" sub="Une vue rapide de tes dynamiques du moment." />
                  <CardB>
                    <div className="db-gauges">
                      {a.gauges.map((g: Gauge) => <Gauge key={g.key} {...g} />)}
                    </div>
                    <Sep />
                    <Link href="/analysis" className="db-link">Voir l'analyse complète →</Link>
                  </CardB>
                </Card>
              ) : null}

              {/* Historique conversations */}
              <Card>
                <CardH title="Historique" sub="Tes dernières conversations." />
                <CardB>
                  {!s?.conversations?.length ? (
                    <p className="db-muted">Aucune conversation enregistrée.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {s.conversations.slice(0, 5).map((cv: Conv) => (
                        <div key={cv.id} className="db-row">
                          <div>
                            <div className="db-row-title">{cv.title}</div>
                            <div className="db-row-sub">{fmt(cv.updatedAtISO)}</div>
                          </div>
                          <Link href={`/?thread=${encodeURIComponent(cv.id)}`} className="db-link">Reprendre</Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardB>
              </Card>
            </div>

            {/* RIGHT — 1/3 */}
            <div className="db-side">

              {/* Profil */}
              <Card>
                <CardH title="Profil" sub="Ce qu'HexAstra utilise pour personnaliser." />
                <CardB>
                  <div className="db-profile-name">{p.firstName ?? 'Profil non renseigné'}</div>
                  {(p.birthDate || p.birthPlace) && (
                    <div className="db-muted" style={{ marginTop: '4px' }}>
                      {[p.birthDate, p.birthTime ? `à ${p.birthTime}` : null, p.birthPlace ? `· ${p.birthPlace}` : null].filter(Boolean).join(' ')}
                    </div>
                  )}
                  {!p.birthDate && <p className="db-muted" style={{ marginTop: '6px' }}>Ajoute tes infos de naissance dans le chat pour activer la personnalisation.</p>}
                  <Sep />
                  <Link href="/profile" className="db-link">Gérer mon profil →</Link>
                </CardB>
              </Card>

              {/* Livrables */}
              <Card>
                <CardH title="Livrables" sub="PDF / Audio générés." />
                <CardB>
                  {!s?.deliverables?.length ? (
                    <p className="db-muted">Aucun livrable pour le moment.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {s.deliverables.slice(0, 6).map((d: Deliv) => (
                        <div key={d.id} className="db-row">
                          <div>
                            <div className="db-row-title">{d.type.toUpperCase()} — {d.title}</div>
                            <div className="db-row-sub">{d.status === 'ready' ? 'Disponible' : d.status === 'processing' ? 'En cours…' : 'Erreur'} · {fmt(d.createdAtISO)}</div>
                          </div>
                          {d.status === 'ready' && d.url ? (
                            <a href={d.url} className="db-link" target="_blank" rel="noreferrer">Télécharger</a>
                          ) : <span className="db-muted">—</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardB>
              </Card>

              {/* Plan d'action rapide */}
              {a?.plan?.length ? (
                <Card>
                  <CardH title="Plan d'action" sub="Simple, concret, en 3 étapes." />
                  <CardB>
                    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0 }}>
                      {a.plan.map((item: string, i: number) => (
                        <li key={i} className="db-text" style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ color: '#C6A35F', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </CardB>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const DASH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box}
a{text-decoration:none;color:inherit}
.db-nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px clamp(14px,4vw,40px);background:rgba(255,255,255,.78);backdrop-filter:blur(20px);border-bottom:1px solid rgba(198,163,95,.20);box-shadow:0 14px 34px rgba(46,42,38,.06)}
.db-logo{display:flex;align-items:center;gap:9px;font-family:'Playfair Display',serif;font-size:17px;color:#2E2A26}
.db-logo em{font-style:italic;color:#C6A35F}
.db-nav-links{display:flex;gap:clamp(12px,2vw,24px);flex-wrap:wrap;justify-content:flex-end}
.db-nl{font-family:'Inter',sans-serif;font-size:13px;color:rgba(111,103,95,.78);transition:color .2s}
.db-nl:hover,.db-nl-on{color:#C6A35F}
.db-page{width:min(100%,1200px);margin:0 auto;padding:clamp(18px,5vw,40px) clamp(14px,5vw,40px) clamp(56px,10vw,80px)}
.db-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:32px;flex-wrap:wrap}
.db-h1{font-family:'Playfair Display',serif;font-size:clamp(24px,7vw,32px);line-height:1.08;font-weight:500;color:#2E2A26;margin-bottom:6px}
.db-sub{font-family:'Inter',sans-serif;font-size:14px;color:rgba(111,103,95,.78)}
.db-loading{display:flex;align-items:center;gap:12px;color:rgba(111,103,95,.78);font-family:'Inter',sans-serif;font-size:14px;padding:60px 0}
.db-spinner{width:18px;height:18px;border:2px solid rgba(198,163,95,.2);border-top-color:#C6A35F;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.db-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,380px);gap:20px;align-items:start}
.db-main,.db-side{display:flex;flex-direction:column;gap:18px}
.db-text{font-family:'Inter',sans-serif;font-size:13.5px;font-weight:300;color:rgba(46,42,38,.84);line-height:1.8}
.db-muted{font-family:'Inter',sans-serif;font-size:12.5px;color:rgba(111,103,95,.72);line-height:1.65}
.db-link{font-family:'Inter',sans-serif;font-size:13px;color:#C6A35F;transition:opacity .2s;overflow-wrap:anywhere}
.db-link:hover{opacity:.75}
.db-tag{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:#C6A35F;background:rgba(198,163,95,.1);border:1px solid rgba(198,163,95,.22);border-radius:100px;padding:3px 11px}
.db-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.db-row>div{min-width:0}
.db-row-title{font-family:'Inter',sans-serif;font-size:13px;color:#2E2A26;line-height:1.4;overflow-wrap:anywhere}
.db-row-sub{font-family:'DM Mono',monospace;font-size:10px;color:rgba(111,103,95,.70);margin-top:2px;letter-spacing:.05em}
.db-profile-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:500;color:#2E2A26}
.db-gauges{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.btn-gold-sm{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:10px 20px;background:#C6A35F;color:#2E2A26;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border:none;border-radius:50px;cursor:pointer;text-decoration:none;box-shadow:0 10px 24px rgba(198,163,95,.22);transition:all .2s;white-space:normal;text-align:center}
.btn-gold-sm:hover{background:#d4b26e;transform:translateY(-1px)}
.btn-ghost-sm{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:10px 20px;background:rgba(255,255,255,.58);color:rgba(46,42,38,.78);font-family:'Inter',sans-serif;font-size:13px;font-weight:400;border:1px solid rgba(198,163,95,.25);border-radius:50px;cursor:pointer;text-decoration:none;transition:all .2s;white-space:normal;text-align:center}
.btn-ghost-sm:hover{border-color:rgba(198,163,95,.42);color:#2E2A26}
@media(max-width:900px){
  .db-nav{padding:12px 18px}.db-nav-links{display:none}
  .db-page{padding:24px 18px 60px}
  .db-grid{grid-template-columns:1fr}
  .db-gauges{grid-template-columns:1fr}
}
@media(max-width:560px){
  .db-nav{padding:12px 14px}
  .db-logo{font-size:15px}
  .db-page{padding:20px 14px 56px}
  .db-header{gap:14px;margin-bottom:22px}
  .db-header .btn-gold-sm{width:100%}
  .db-row{align-items:flex-start;flex-direction:column}
  .db-row .db-link{min-height:36px;display:inline-flex;align-items:center}
  .btn-gold-sm,.btn-ghost-sm{width:100%}
}
`

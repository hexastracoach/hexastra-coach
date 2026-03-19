// app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(243,239,234,0.07)' }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '.1em', color: 'rgba(243,239,234,0.5)', textTransform: 'uppercase', flexShrink: 0, marginTop: '1px' }}>{label}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: value ? '#F3EFEA' : 'rgba(243,239,234,0.35)', fontStyle: value ? 'normal' : 'italic' }}>{value ?? 'Non renseigné'}</span>
    </div>
  )
}

export default function ProfilePage() {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(d => { setState(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const p = state?.profile ?? {}

  return (
    <main style={{ minHeight: '100vh', background: '#0E0B08' }}>
      <style>{PROF_CSS}</style>

      {/* Nav */}
      <nav className="db-nav">
        <Link href="/" className="db-logo"><HexLogo size={22}/><span>HexAstra <em>Coach</em></span></Link>
        <div className="db-nav-links">
          <Link href="/dashboard" className="db-nl">Dashboard</Link>
          <Link href="/analysis" className="db-nl">Analyse</Link>
          <Link href="/profile" className="db-nl db-nl-on">Profil</Link>
          <Link href="/" className="db-nl">Chat</Link>
        </div>
      </nav>

      <div className="prof-page">
        <header className="prof-header">
          <h1 className="prof-h1">Profil</h1>
          <p className="prof-sub">Gérer tes infos et ce que HexAstra retient pour personnaliser l'analyse.</p>
        </header>

        {loading ? <div className="db-loading"><div className="db-spinner"/>Chargement…</div> : (
          <div className="prof-cols">
            <div className="prof-main">

              {/* Infos de base */}
              <div className="prof-card">
                <div className="prof-card-head">
                  <div className="prof-card-title">Infos de base</div>
                  <div className="prof-card-sub">Ces données servent à personnaliser les lectures.</div>
                </div>
                <div className="prof-card-body">
                  <Row label="Prénom"      value={p.firstName}  />
                  <Row label="Date"        value={p.birthDate}  />
                  <Row label="Heure"       value={p.birthTime}  />
                  <Row label="Lieu"        value={p.birthPlace} />
                  <Row label="Mode"        value={p.modePreferred ?? state?.mode} />
                  <Row label="Langue"      value={p.language}   />
                  <div style={{ height: '12px' }} />
                  <div className="prof-note">
                    Pour modifier ces infos, le plus simple est de le faire via le chat.<br/>
                    HexAstra te les redemandera si nécessaire et les mettra à jour automatiquement ici.
                  </div>
                  <Link href="/" className="prof-link" style={{ marginTop: '14px', display: 'inline-block' }}>→ Ouvrir le chat</Link>
                </div>
              </div>

              {/* Mémoire vivante */}
              <div className="prof-card">
                <div className="prof-card-head">
                  <div className="prof-card-title">Mémoire vivante</div>
                  <div className="prof-card-sub">Résumé évolutif de ton contexte — lisible et non intrusif.</div>
                </div>
                <div className="prof-card-body">
                  <p className="prof-body-text">
                    {p.livingSummary ?? 'Pas encore de résumé vivant. Lance une conversation et demande une synthèse.'}
                  </p>
                  <div style={{ height: '1px', background: 'rgba(243,239,234,0.08)', margin: '16px 0' }} />
                  {p.tags?.length ? (
                    <div className="prof-meta-row">
                      <span className="prof-meta-label">Tags</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {p.tags.map((t: string, i: number) => <span key={i} className="prof-tag">{t}</span>)}
                      </div>
                    </div>
                  ) : (
                    <div className="prof-meta-row">
                      <span className="prof-meta-label">Tags</span>
                      <span className="prof-muted">—</span>
                    </div>
                  )}
                  {p.priorities?.length ? (
                    <div className="prof-meta-row" style={{ marginTop: '10px' }}>
                      <span className="prof-meta-label">Priorités</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {p.priorities.map((pr: string, i: number) => <span key={i} className="prof-tag prof-tag-rose">{pr}</span>)}
                      </div>
                    </div>
                  ) : (
                    <div className="prof-meta-row" style={{ marginTop: '10px' }}>
                      <span className="prof-meta-label">Priorités</span>
                      <span className="prof-muted">—</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="prof-side">
              <div className="prof-card">
                <div className="prof-card-head">
                  <div className="prof-card-title">Gouvernance</div>
                  <div className="prof-card-sub">Contrôle de tes données.</div>
                </div>
                <div className="prof-card-body">
                  <p className="prof-body-text">HexAstra ne conserve que les données que tu partages dans le chat. Rien n'est vendu ou partagé avec des tiers.</p>
                  <div style={{ height: '1px', background: 'rgba(243,239,234,0.08)', margin: '16px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href="/" className="prof-link">→ Modifier via le chat</Link>
                    <button className="prof-delete" onClick={() => alert('Fonctionnalité en cours de déploiement.')}>
                      Supprimer mes données
                    </button>
                  </div>
                </div>
              </div>

              <div className="prof-card" style={{ borderColor: 'rgba(198,163,95,0.35)' }}>
                <div className="prof-card-head">
                  <div className="prof-card-title">Prochaines étapes</div>
                </div>
                <div className="prof-card-body">
                  <p className="prof-body-text">Pour activer la personnalisation complète :</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {[
                      { done: !!p.firstName, label: 'Donner ton prénom' },
                      { done: !!p.birthDate, label: 'Date de naissance' },
                      { done: !!p.birthTime, label: 'Heure de naissance' },
                      { done: !!p.birthPlace, label: 'Lieu de naissance' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: item.done ? 'rgba(243,239,234,0.55)' : 'rgba(243,239,234,0.85)' }}>
                        <span style={{ fontSize: '13px', color: item.done ? '#C6A35F' : 'rgba(243,239,234,0.25)' }}>{item.done ? '✓' : '○'}</span>
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Link href="/" className="btn-gold-sm" style={{ fontSize: '12px', padding: '8px 18px' }}>Compléter dans le chat</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const PROF_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box} a{text-decoration:none;color:inherit}
.db-nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:14px 40px;background:rgba(14,11,8,.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(198,163,95,.18)}
.db-logo{display:flex;align-items:center;gap:9px;font-family:'Playfair Display',serif;font-size:17px;color:#F3EFEA}
.db-logo em{font-style:italic;color:#C6A35F}
.db-nav-links{display:flex;gap:24px}
.db-nl{font-family:'Inter',sans-serif;font-size:13px;color:rgba(243,239,234,.6);transition:color .2s}
.db-nl:hover,.db-nl-on{color:#C6A35F}
.db-loading{display:flex;align-items:center;gap:12px;color:rgba(243,239,234,.6);font-family:'Inter',sans-serif;font-size:14px;padding:60px 0}
.db-spinner{width:18px;height:18px;border:2px solid rgba(198,163,95,.2);border-top-color:#C6A35F;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.prof-page{max-width:960px;margin:0 auto;padding:40px 40px 80px}
.prof-header{margin-bottom:32px}
.prof-h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:500;color:#F3EFEA;margin-bottom:6px}
.prof-sub{font-family:'Inter',sans-serif;font-size:14px;color:rgba(243,239,234,.6)}
.prof-cols{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
.prof-main,.prof-side{display:flex;flex-direction:column;gap:18px}
.prof-card{background:#14100C;border:1px solid rgba(198,163,95,.20);border-radius:18px;overflow:hidden}
.prof-card-head{padding:18px 22px 0}
.prof-card-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:500;color:#F3EFEA}
.prof-card-sub{font-family:'Inter',sans-serif;font-size:12px;color:rgba(243,239,234,.55);margin-top:3px}
.prof-card-body{padding:14px 22px 20px}
.prof-body-text{font-family:'Inter',sans-serif;font-size:13.5px;font-weight:300;color:rgba(243,239,234,.78);line-height:1.8}
.prof-note{font-family:'Inter',sans-serif;font-size:12px;color:rgba(243,239,234,.55);line-height:1.7}
.prof-link{font-family:'Inter',sans-serif;font-size:13px;color:#C6A35F;transition:opacity .2s}
.prof-link:hover{opacity:.7}
.prof-muted{font-family:'Inter',sans-serif;font-size:13px;color:rgba(243,239,234,.35)}
.prof-meta-row{display:flex;align-items:flex-start;gap:14px}
.prof-meta-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.12em;color:rgba(243,239,234,.45);text-transform:uppercase;flex-shrink:0;margin-top:4px;min-width:60px}
.prof-tag{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:#C6A35F;background:rgba(198,163,95,.1);border:1px solid rgba(198,163,95,.22);border-radius:100px;padding:3px 11px}
.prof-tag-rose{color:#b89d96;background:rgba(184,157,150,.1);border-color:rgba(184,157,150,.22)}
.prof-delete{background:transparent;border:1px solid rgba(243,239,234,.12);border-radius:50px;padding:7px 16px;font-family:'Inter',sans-serif;font-size:12px;color:rgba(243,239,234,.45);cursor:pointer;transition:all .2s;text-align:left}
.prof-delete:hover{border-color:rgba(255,100,100,.3);color:rgba(255,120,120,.7)}
.btn-gold-sm{display:inline-flex;align-items:center;padding:9px 20px;background:#C6A35F;color:#0E0B08;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border:none;border-radius:50px;cursor:pointer;text-decoration:none;box-shadow:0 4px 18px rgba(198,163,95,.28);transition:all .2s;white-space:nowrap}
.btn-gold-sm:hover{background:#d4b26e;transform:translateY(-1px)}
@media(max-width:800px){
  .db-nav{padding:12px 20px}.db-nav-links{display:none}
  .prof-page{padding:24px 20px 60px}
  .prof-cols{grid-template-columns:1fr}
}
`

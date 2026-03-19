// app/analysis/page.tsx
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

function Gauge({ label, score, hint }: { label: string; score: number; hint: string }) {
  const s = Math.max(0, Math.min(100, score))
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(s), 200)
    return () => clearTimeout(t)
  }, [s])
  const color = s >= 70 ? 'rgba(198,163,95,0.9)' : s >= 50 ? 'rgba(198,163,95,0.7)' : 'rgba(184,157,150,0.7)'
  return (
    <div className="gauge-wrap">
      <div className="gauge-top">
        <span className="gauge-label">{label}</span>
        <span className="gauge-score" style={{ color }}>{s}</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${animated}%`, background: `linear-gradient(90deg, rgba(198,163,95,0.3), ${color})` }} />
      </div>
      <div className="gauge-hint">{hint}</div>
    </div>
  )
}

const DEFAULT_GAUGES = [
  { key: 'clarity',   label: 'Clarté mentale',        score: 60, hint: 'Tu vois mieux, mais évite la dispersion.' },
  { key: 'energy',    label: 'Élan / Énergie',         score: 50, hint: 'Avance par petits pas, constance > intensité.' },
  { key: 'stability', label: 'Stabilité émotionnelle', score: 62, hint: 'Ok, mais protège ton sommeil.' },
  { key: 'direction', label: 'Direction',              score: 70, hint: 'Une piste se confirme. Engage-toi dessus.' },
]

export default function AnalysisPage() {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(d => { setState(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const a = state?.analysis
  const gauges = a?.gauges ?? DEFAULT_GAUGES
  const levers = a?.levers ?? ['Simplifier', 'Dire non', 'Structurer une priorité']
  const risks  = a?.risks  ?? ['Sur-analyse', 'Dispersion', 'Réactivité émotionnelle']
  const plan   = a?.plan   ?? ['Choisis 1 priorité unique pour 7 jours', 'Pose 1 action simple par jour', 'Reviens en fin de semaine pour une synthèse']

  return (
    <main style={{ minHeight: '100vh', background: '#0E0B08' }}>
      <style>{AN_CSS}</style>

      {/* Nav */}
      <nav className="db-nav">
        <Link href="/" className="db-logo"><HexLogo size={22}/><span>HexAstra <em>Coach</em></span></Link>
        <div className="db-nav-links">
          <Link href="/dashboard" className="db-nl">Dashboard</Link>
          <Link href="/analysis" className="db-nl db-nl-on">Analyse</Link>
          <Link href="/profile" className="db-nl">Profil</Link>
          <Link href="/" className="db-nl">Chat</Link>
        </div>
      </nav>

      <div className="an-page">
        <header className="an-header">
          <div>
            <h1 className="an-h1">Analyse</h1>
            <p className="an-sub">Une vue lisible, sans graphiques compliqués.</p>
          </div>
          <Link href="/" className="btn-gold-sm">Affiner avec HexAstra →</Link>
        </header>

        {loading ? (
          <div className="db-loading"><div className="db-spinner"/>Chargement…</div>
        ) : (
          <div className="an-layout">

            {/* Synthèse */}
            <div className="an-card">
              <div className="an-card-head">
                <div className="an-card-title">Synthèse</div>
                <div className="an-card-sub">Une vue claire de ton moment actuel.</div>
              </div>
              <div className="an-card-body">
                <p className="an-text">
                  {a?.summary ?? 'Aucune analyse enregistrée. Lance une conversation puis demande une synthèse du moment.'}
                </p>
                {a?.updatedAtISO && (
                  <div className="an-updated">Mis à jour le {new Date(a.updatedAtISO).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</div>
                )}
              </div>
            </div>

            {/* Jauges */}
            <div className="an-card">
              <div className="an-card-head">
                <div className="an-card-title">Indicateurs</div>
                <div className="an-card-sub">Jauges sobres, faciles à lire. Scores de 0 à 100.</div>
              </div>
              <div className="an-card-body">
                <div className="an-gauges">
                  {gauges.map((g: any) => <Gauge key={g.key} label={g.label} score={g.score} hint={g.hint} />)}
                </div>
              </div>
            </div>

            {/* Leviers + Risques */}
            <div className="an-two-col">
              <div className="an-card">
                <div className="an-card-head">
                  <div className="an-card-title">✦ Leviers</div>
                  <div className="an-card-sub">Ce qui aide maintenant.</div>
                </div>
                <div className="an-card-body">
                  <ul className="an-list">
                    {levers.map((l: string, i: number) => (
                      <li key={i} className="an-list-item">
                        <span className="an-bullet">→</span>{l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="an-card">
                <div className="an-card-head">
                  <div className="an-card-title">⚠ Risques</div>
                  <div className="an-card-sub">Ce qui bloque si mal géré.</div>
                </div>
                <div className="an-card-body">
                  <ul className="an-list">
                    {risks.map((r: string, i: number) => (
                      <li key={i} className="an-list-item an-risk">
                        <span className="an-bullet">·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Plan d'action */}
            <div className="an-card an-card-hl">
              <div className="an-card-head">
                <div className="an-card-title">Plan d'action</div>
                <div className="an-card-sub">Simple, concret, en 3 étapes.</div>
              </div>
              <div className="an-card-body">
                <ol className="an-plan">
                  {plan.map((item: string, i: number) => (
                    <li key={i} className="an-plan-item">
                      <span className="an-plan-n">{i + 1}.</span>
                      <span className="an-text">{item}</span>
                    </li>
                  ))}
                </ol>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/" className="btn-gold-sm">Affiner avec HexAstra</Link>
                  <Link href="/dashboard" className="btn-ghost-sm">← Retour au dashboard</Link>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}

const AN_CSS = `
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
.an-page{max-width:900px;margin:0 auto;padding:40px 40px 80px}
.an-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:28px;flex-wrap:wrap}
.an-h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:500;color:#F3EFEA;margin-bottom:6px}
.an-sub{font-family:'Inter',sans-serif;font-size:14px;color:rgba(243,239,234,.6)}
.an-layout{display:flex;flex-direction:column;gap:18px}
.an-card{background:#14100C;border:1px solid rgba(198,163,95,.20);border-radius:18px;overflow:hidden}
.an-card-hl{border-color:rgba(198,163,95,.38);box-shadow:0 0 0 1px rgba(198,163,95,.08),0 20px 50px rgba(0,0,0,.4)}
.an-card-head{padding:18px 22px 0}
.an-card-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:500;color:#F3EFEA}
.an-card-sub{font-family:'Inter',sans-serif;font-size:12px;color:rgba(243,239,234,.55);margin-top:3px}
.an-card-body{padding:16px 22px 22px}
.an-text{font-family:'Inter',sans-serif;font-size:14px;font-weight:300;color:rgba(243,239,234,.82);line-height:1.82}
.an-updated{font-family:'DM Mono',monospace;font-size:10px;color:rgba(243,239,234,.4);letter-spacing:.08em;margin-top:10px}
.an-gauges{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.gauge-wrap{display:flex;flex-direction:column;gap:6px}
.gauge-top{display:flex;justify-content:space-between;align-items:baseline}
.gauge-label{font-family:'Inter',sans-serif;font-size:13px;color:#F3EFEA}
.gauge-score{font-family:'DM Mono',monospace;font-size:22px;font-weight:500;line-height:1}
.gauge-track{height:6px;border-radius:100px;background:rgba(243,239,234,.08);overflow:hidden}
.gauge-fill{height:100%;border-radius:100px;transition:width 1s ease}
.gauge-hint{font-family:'Inter',sans-serif;font-size:12px;color:rgba(243,239,234,.55);line-height:1.55}
.an-two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.an-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:10px}
.an-list-item{display:flex;align-items:flex-start;gap:10px;font-family:'Inter',sans-serif;font-size:13.5px;font-weight:300;color:rgba(243,239,234,.82);line-height:1.6}
.an-risk{color:rgba(243,239,234,.65)}
.an-bullet{color:#C6A35F;flex-shrink:0;font-weight:600;margin-top:1px}
.an-risk .an-bullet{color:rgba(184,157,150,.6)}
.an-plan{list-style:none;padding:0;display:flex;flex-direction:column;gap:14px}
.an-plan-item{display:flex;gap:12px;align-items:flex-start}
.an-plan-n{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;font-style:italic;color:#C6A35F;line-height:1;flex-shrink:0;min-width:22px}
.btn-gold-sm{display:inline-flex;align-items:center;padding:9px 20px;background:#C6A35F;color:#0E0B08;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;border:none;border-radius:50px;cursor:pointer;text-decoration:none;box-shadow:0 4px 18px rgba(198,163,95,.28);transition:all .2s;white-space:nowrap}
.btn-gold-sm:hover{background:#d4b26e;transform:translateY(-1px)}
.btn-ghost-sm{display:inline-flex;align-items:center;padding:9px 20px;background:transparent;color:rgba(243,239,234,.7);font-family:'Inter',sans-serif;font-size:13px;font-weight:400;border:1px solid rgba(243,239,234,.2);border-radius:50px;cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap}
.btn-ghost-sm:hover{border-color:rgba(243,239,234,.4);color:#F3EFEA}
@media(max-width:800px){
  .db-nav{padding:12px 20px}.db-nav-links{display:none}
  .an-page{padding:24px 20px 60px}
  .an-gauges{grid-template-columns:1fr}
  .an-two-col{grid-template-columns:1fr}
}
`

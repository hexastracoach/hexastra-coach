'use client'

import { DS, cardStyle, type Mode, type Reading } from '../_lib/chat'

type RightPanelProps = {
  mode: Mode
  readings: Reading[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onPrompt: (value: string) => void
  onOpenReading: (reading: Reading) => void
}

const personalDataItems = [
  { title: 'Date de naissance', value: 'À compléter' },
  { title: 'Heure de naissance', value: 'À compléter' },
  { title: 'Lieu de naissance', value: 'À compléter' },
  { title: 'Profil actuel', value: 'Mode Essentiel' },
]

const categories = [
  {
    title: 'État intérieur',
    subtitle: 'Lire ce qui pèse ou s’ouvre',
    prompt: 'Analyse mon état intérieur du moment avec HexAstra.',
  },
  {
    title: 'Énergie du moment',
    subtitle: 'Tendance de fond et timing',
    prompt: 'Quelle est mon énergie dominante en ce moment ?',
  },
  {
    title: 'Amour / Relations',
    subtitle: 'Comprendre la dynamique affective',
    prompt: 'Aide-moi à comprendre ma dynamique relationnelle actuelle.',
  },
  {
    title: 'Travail / Argent',
    subtitle: 'Stabilité, mouvement, clarté',
    prompt: 'Analyse ma zone travail et argent en ce moment.',
  },
  {
    title: 'Lecture générale',
    subtitle: 'Vue synthétique de la situation',
    prompt: 'Fais-moi une lecture générale claire de ma situation actuelle.',
  },
]

export default function RightPanel({
  mode,
  readings,
  collapsed,
  onToggleCollapse,
  onPrompt,
  onOpenReading,
}: RightPanelProps) {
  if (collapsed) {
    return (
      <aside style={{ width: 72, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onToggleCollapse} style={collapseBtn}>
          ›
        </button>
      </aside>
    )
  }

  return (
    <aside style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={sectionLabel}>Outils</div>
        <button onClick={onToggleCollapse} style={collapseBtn}>
          ‹
        </button>
      </div>

      <section style={cardStyle({ padding: 18, borderRadius: 30 })}>
        <div style={sectionLabel}>Données personnelles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {personalDataItems.map((item) => (
            <div key={item.title} style={infoCard}>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{item.title}</div>
              <div style={{ color: DS.textFaint, fontSize: 13, marginTop: 4 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle({ padding: 18, borderRadius: 30, flex: 1 })}>
        <div style={sectionLabel}>Raccourcis</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map((item) => (
            <button key={item.title} onClick={() => onPrompt(item.prompt)} style={promptBtn}>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{item.title}</div>
              <div style={{ color: DS.textMuted, fontSize: 13, marginTop: 4 }}>{item.subtitle}</div>
            </button>
          ))}
        </div>

        {readings.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={sectionLabel}>Dernières lectures</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {readings.slice(0, 3).map((reading) => (
                <button key={reading.id} onClick={() => onOpenReading(reading)} style={lastReadingBtn}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{reading.title}</div>
                  <div style={{ fontSize: 12, color: DS.textFaint, marginTop: 4 }}>
                    {mode} · {new Date(reading.date).toLocaleDateString('fr-FR')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </aside>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: DS.textFaint,
  marginBottom: 14,
  fontFamily: DS.monoFont,
}
const collapseBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: `1px solid ${DS.line}`,
  background: 'rgba(226,233,192,0.055)',
  color: DS.text,
  boxShadow: DS.shadowSoft,
}
const infoCard: React.CSSProperties = {
  border: `1px solid ${DS.line}`,
  borderRadius: 18,
  padding: '12px 14px',
  background: 'rgba(226,233,192,0.055)',
}
const promptBtn: React.CSSProperties = {
  border: `1px solid ${DS.line}`,
  borderRadius: 18,
  padding: '14px 14px',
  background: 'rgba(226,233,192,0.055)',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
}
const lastReadingBtn: React.CSSProperties = {
  border: '1px solid rgba(122,169,92,0.24)',
  borderRadius: 16,
  padding: '12px 14px',
  background: 'rgba(122,169,92,0.095)',
  color: DS.textSoft,
  textAlign: 'left',
  cursor: 'pointer',
}

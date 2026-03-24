'use client'

import type { CSSProperties, ReactNode } from 'react'
import { DS, cardStyle } from '../_lib/chat'

type WelcomeHeroProps = {
  onPrompt: (value: string) => void
}

const quickPrompts = [
  'Je tourne en rond dans une situation importante.',
  "Je sens qu'il faut bouger, mais je ne vois pas comment.",
  'Pourquoi cette situation me touche autant ?',
  'Aide-moi à y voir clair avant de décider.',
]

const entryCards = [
  {
    title: 'Tu poses la situation.',
    text: 'Dis ce qui pèse, ce qui bloque ou ce qui revient. Pas besoin de tout expliquer.',
  },
  {
    title: 'Hexastra clarifie.',
    text: 'Je vais au nœud du sujet. Pas au bruit autour.',
  },
  {
    title: 'Tu repars avec un appui.',
    text: 'Une direction plus nette. Un point clair. Une action utile.',
  },
]

export default function WelcomeHero({ onPrompt }: WelcomeHeroProps) {
  return (
    <section
      className="hx-welcome-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.14fr) minmax(340px, 0.86fr)',
        gap: 18,
        alignItems: 'stretch',
      }}
    >
      <div
        style={cardStyle({
          padding: '34px 32px 28px',
          borderRadius: 34,
          minHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        })}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: DS.textFaint,
              marginBottom: 18,
              fontFamily: DS.monoFont,
            }}
          >
            Hexastra Coach · clarté directe
          </div>

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: 'linear-gradient(135deg,#19C37D,#0E8F5B)',
              marginBottom: 18,
              boxShadow: '0 12px 30px rgba(25,195,125,0.24)',
            }}
          />

          <h1
            style={{
              margin: 0,
              color: DS.text,
              fontSize: 'clamp(3rem, 6.2vw, 5.25rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.065em',
              maxWidth: 760,
              fontWeight: 700,
              fontFamily: DS.titleFont,
            }}
          >
            Tu n&apos;as pas besoin
            <br />
            de tout porter
            <br />
            dans ta tête.
          </h1>

          <p
            style={{
              margin: '24px 0 0',
              color: DS.textSoft,
              fontSize: 18,
              lineHeight: 1.85,
              maxWidth: 720,
            }}
          >
            Dis simplement ce qui te travaille. Un doute. Une tension. Une décision.
            <br />
            Hexastra t&apos;aide à comprendre ce qui se joue, puis à voir la direction la plus juste.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            <button
              onClick={() => onPrompt('Je veux une réponse claire sur ma situation actuelle.')}
              style={primaryButton}
            >
              Explorer votre situation
            </button>

            <button
              onClick={() => onPrompt('Je veux une analyse Hexastra claire et directe.')}
              style={secondaryButton}
            >
              Analyse Hexastra
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            {quickPrompts.map((item) => (
              <button key={item} onClick={() => onPrompt(item)} className="hx-chip">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div
          className="hx-welcome-points"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginTop: 28,
          }}
        >
          {entryCards.map((item) => (
            <div
              key={item.title}
              style={{
                border: `1px solid ${DS.line}`,
                borderRadius: 22,
                padding: '18px 16px',
                background: 'rgba(255,255,255,0.66)',
              }}
            >
              <div style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{item.title}</div>
              <div style={{ color: DS.textMuted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle({ padding: 0, borderRadius: 34, minHeight: 560, overflow: 'hidden' })}>
        <div
          style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${DS.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: DS.textFaint,
                fontFamily: DS.monoFont,
              }}
            >
              Aperçu du chat
            </div>
            <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginTop: 4 }}>
              Conversation en direct
            </div>
          </div>

          <div style={{ color: DS.emerald, fontSize: 13, fontWeight: 700 }}>En ligne</div>
        </div>

        <div
          style={{
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 470,
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(241,246,241,0.20), rgba(255,255,255,0.45))',
          }}
        >
          <PreviewBubble>
            Parle-moi de ta situation.
            <br />
            Même en quelques phrases.
          </PreviewBubble>

          <PreviewBubble user>
            J&apos;hésite entre continuer mon activité actuelle ou lancer autre chose.
          </PreviewBubble>

          <PreviewBubble>
            Tu n&apos;essaies pas seulement de choisir.
            <br />
            Tu essaies aussi de te rassurer.
            <br />
            <br />
            Le vrai sujet, c&apos;est ce qui a déjà changé en toi.
            <br />
            <br />
            Commence par regarder ce que tu ne veux plus porter.
          </PreviewBubble>
        </div>
      </div>
    </section>
  )
}

function PreviewBubble({ children, user = false }: { children: ReactNode; user?: boolean }) {
  return (
    <div
      style={{
        alignSelf: user ? 'flex-end' : 'flex-start',
        maxWidth: user ? '72%' : '78%',
        borderRadius: 20,
        padding: '14px 16px',
        background: user ? 'rgba(25,195,125,0.12)' : 'rgba(255,255,255,0.84)',
        border: `1px solid ${user ? 'rgba(25,195,125,0.18)' : DS.line}`,
        color: DS.text,
        lineHeight: 1.75,
        fontSize: 14,
        boxShadow: user ? '0 10px 24px rgba(25,195,125,0.08)' : DS.shadowSoft,
      }}
    >
      {children}
    </div>
  )
}

const primaryButton: CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  padding: '14px 22px',
  borderRadius: 18,
  background: 'linear-gradient(135deg,#19C37D,#0E8F5B)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 14,
  boxShadow: '0 12px 30px rgba(25,195,125,0.18)',
}

const secondaryButton: CSSProperties = {
  border: `1px solid ${DS.line}`,
  cursor: 'pointer',
  padding: '14px 22px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.72)',
  color: DS.text,
  fontWeight: 600,
  fontSize: 14,
}

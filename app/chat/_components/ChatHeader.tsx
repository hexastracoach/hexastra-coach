'use client'

import { DS } from '../_lib/chat'

type Props = {
  mode: 'essentiel' | 'premium' | 'praticien'
  onModeChange: (mode: 'essentiel' | 'premium' | 'praticien') => void
  onOpenLeft: () => void
  onOpenRight: () => void
  desktopLeft: boolean
  desktopRight: boolean
}

const MODES: Array<{ key: Props['mode']; label: string }> = [
  { key: 'essentiel', label: 'Essentiel' },
  { key: 'premium', label: 'Premium' },
  { key: 'praticien', label: 'Praticien' },
]

export default function ChatHeader({
  mode,
  onModeChange,
  onOpenLeft,
  onOpenRight,
  desktopLeft,
  desktopRight,
}: Props) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 18,
        padding: '16px 28px 12px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'linear-gradient(180deg, rgba(30,15,28,0.88), rgba(18,9,17,0.66))',
        borderBottom: `1px solid ${DS.line}`,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!desktopLeft && (
            <button onClick={onOpenLeft} style={ghostButtonStyle}>
              Menu
            </button>
          )}

          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: DS.textFaint,
                fontFamily: DS.monoFont,
              }}
            >
              HexAstra Coach
            </div>
            <div
              style={{
                color: DS.text,
                fontFamily: DS.titleFont,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 0,
                marginTop: 4,
              }}
            >
              Chat de clarté
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            gap: 6,
            padding: 6,
            borderRadius: 999,
            background: 'rgba(226,233,192,0.055)',
            border: `1px solid ${DS.line}`,
            boxShadow: DS.shadowSoft,
          }}
        >
          {MODES.map((item) => {
            const active = item.key === mode
            return (
              <button
                key={item.key}
                onClick={() => onModeChange(item.key)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: active ? DS.gradient : 'transparent',
                  color: active ? '#E2E9C0' : DS.textSoft,
                  fontWeight: active ? 700 : 600,
                  fontSize: 13,
                  boxShadow: active ? '0 10px 26px rgba(167,0,30,0.24)' : 'none',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {!desktopRight && (
          <button onClick={onOpenRight} style={ghostButtonStyle}>
            Outils
          </button>
        )}
      </div>
    </header>
  )
}

const ghostButtonStyle: React.CSSProperties = {
  border: `1px solid ${DS.line}`,
  background: 'rgba(226,233,192,0.055)',
  color: DS.text,
  borderRadius: 999,
  padding: '10px 14px',
  fontWeight: 600,
  boxShadow: DS.shadowSoft,
}

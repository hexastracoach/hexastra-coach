'use client'

import { type Msg } from '../_lib/chat'

type Props = {
  message: Msg
}

function formatTime(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const timeLabel = formatTime(message.created_at)

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 820,
        margin: '0 auto',
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* nom du locuteur + heure */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isUser ? 'rgba(80,120,255,0.85)' : 'rgba(25,195,125,0.9)',
        }}
      >
        <span>{isUser ? 'Vous' : 'HexAstra'}</span>
        {timeLabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {timeLabel}
          </span>
        )}
      </div>

      {/* contenu */}
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: '#ffffff',
          whiteSpace: 'pre-wrap',
          opacity: 0.95,
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

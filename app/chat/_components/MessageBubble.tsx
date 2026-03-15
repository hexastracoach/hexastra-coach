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
        maxWidth: 920,
        margin: '0 auto',
        padding: '6px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
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
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isUser ? 'rgba(132, 198, 255, 0.95)' : 'rgba(117, 246, 216, 0.95)',
          textAlign: isUser ? 'right' : 'left',
        }}
      >
        <span>{isUser ? 'Vous' : 'HexAstra'}</span>
        {timeLabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            {timeLabel}
          </span>
        )}
      </div>

      {/* contenu */}
      <div
        className={`hx-chat-message hx-chat-bubble ${isUser ? 'is-user' : 'is-assistant'}`}
        style={{
          fontSize: 15.5,
          lineHeight: 1.72,
          color: '#fefefefe',
          whiteSpace: 'pre-wrap',
          maxWidth: 'min(780px, 92vw)',
          textAlign: isUser ? 'right' : 'left',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

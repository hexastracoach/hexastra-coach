'use client'

import { DS, type Msg } from '../_lib/chat'

type Props = {
  message: Msg
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

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
      {/* nom du locuteur */}

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isUser ? 'rgba(80,120,255,0.75)' : 'rgba(25,195,125,0.8)',
        }}
      >
        {isUser ? 'Vous' : 'HexAstra'}
      </div>

      {/* contenu */}

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: DS.text,
          whiteSpace: 'pre-wrap',
          opacity: isUser ? 0.95 : 0.92,
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
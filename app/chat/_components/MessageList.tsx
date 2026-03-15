'use client'

import type { Msg } from '../_lib/chat'
import MessageBubble from './MessageBubble'

type Props = {
  messages: Msg[]
  isTyping: boolean
}

export default function MessageList({ messages, isTyping }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 980,
        margin: '0 auto',
        paddingBottom: 18,
        width: '100%',
      }}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            width: '100%',
          }}
        >
          <MessageBubble message={message} />
        </div>
      ))}

      {isTyping && (
        <div
          style={{
            width: '100%',
            maxWidth: 820,
            margin: '0 auto',
            padding: '6px 0 2px',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgba(16, 32, 42, 0.55)',
            letterSpacing: '0.01em',
            fontStyle: 'italic',
          }}
        >
          HexAstra écrit…
        </div>
      )}
    </div>
  )
}
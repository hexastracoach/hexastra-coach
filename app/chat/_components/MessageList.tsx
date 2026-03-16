'use client'

import { useEffect, useRef } from 'react'
import type { Msg } from '../_lib/chat'
import MessageBubble from './MessageBubble'

type Props = {
  messages: Msg[]
  isTyping: boolean
  lastUserMessage?: string
  onRetry?: (fallbackMessage?: string) => void
}

export default function MessageList({ messages, isTyping, lastUserMessage, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isTyping])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 980,
        margin: '0 auto',
        paddingBottom: 24,
        width: '100%',
      }}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          lastUserMessage={lastUserMessage}
          onRetry={onRetry}
        />
      ))}

      {isTyping && (
        <div
          style={{
            width: '100%',
            maxWidth: 820,
            margin: '0 auto',
            padding: '4px 0',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#fefefefe',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            textAlign: 'left',
          }}
        >
          HexAstra écrit...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

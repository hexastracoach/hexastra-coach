'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Msg } from '../_lib/chat'
import MessageBubble from './MessageBubble'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getLoadingMessages, LOADING_MESSAGE_ROTATION_MS } from '@/lib/chat/loadingMessages'

type Props = {
  messages: Msg[]
  isTyping: boolean
  lastUserMessage?: string
  onRetry?: (fallbackMessage?: string) => void
}

export default function MessageList({ messages, isTyping, lastUserMessage, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const { lang } = useTranslation()
  const visibleMessages = messages.filter((message) => message.content !== '__loading_micro__')
  const loadingMessages = useMemo(() => getLoadingMessages(lang), [lang])
  const [loadingIndex, setLoadingIndex] = useState(0)

  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [visibleMessages, isTyping])

  useEffect(() => {
    if (!isTyping) {
      setLoadingIndex(0)
      return
    }

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingMessages.length)
    }, LOADING_MESSAGE_ROTATION_MS)

    return () => window.clearInterval(timer)
  }, [isTyping, loadingMessages])

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
      {visibleMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          lastUserMessage={lastUserMessage}
          onRetry={onRetry}
        />
      ))}

      {isTyping && (
        <div
          role="status"
          aria-live="polite"
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
          {loadingMessages[loadingIndex]}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

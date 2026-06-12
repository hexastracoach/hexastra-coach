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
  const typingText = lang.startsWith('en')
    ? 'Coach is reading what is moving'
    : 'Coach regarde ce qui se joue'

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
    <div className="hx-message-stack">
      {visibleMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          lastUserMessage={lastUserMessage}
          onRetry={onRetry}
        />
      ))}

      {isTyping && (
        <div className="hx-chat-typing-shell" role="status" aria-live="polite">
          <div className="hx-chat-typing-orb" aria-hidden="true">
            <span />
          </div>
          <div className="hx-chat-typing-copy">
            <div className="hx-chat-typing-label">Hexastra</div>
            <div className="hx-chat-typing-text" title={loadingMessages[loadingIndex]}>
              {typingText}
            </div>
          </div>
          <div className="hx-chat-typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

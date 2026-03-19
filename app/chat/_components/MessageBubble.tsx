'use client'

import { useMemo, useState } from 'react'
import { type Msg } from '../_lib/chat'

type Props = {
  message: Msg
  lastUserMessage?: string
  onRetry?: (fallbackMessage?: string) => void
}

function formatTime(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function splitReadingSections(content: string) {
  const segments = content.split('\n────────────────────\n')
  if (segments.length < 2) return null

  const main = segments[0].trim()
  const closure = segments[1]?.trim()
  const suggestions = segments.slice(2).join('\n').trim()

  return { main, closure, suggestions }
}

export default function MessageBubble({ message, lastUserMessage, onRetry }: Props) {
  const isUser = message.role === 'user'
  const isStatusCard =
    !isUser &&
    !message.isReading &&
    (message.id.includes('birth-saved') || message.id.includes('journey'))
  const timeLabel = formatTime(message.created_at)
  const readingSections = useMemo(
    () => (message.isReading ? splitReadingSections(message.content) : null),
    [message.content, message.isReading]
  )
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: message.content })
      } else {
        await navigator.clipboard.writeText(message.content)
      }
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {
      setShared(false)
    }
  }

  const handleRetry = () => {
    if (onRetry) onRetry(lastUserMessage)
  }

  const renderContent = () => {
    if (!readingSections) {
      return <div className="hx-bubble-text">{message.content}</div>
    }

    return (
      <div className="hx-bubble-sections">
        <div className="hx-bubble-text">{readingSections.main}</div>
        <div className="hx-bubble-divider" />
        <div className="hx-bubble-text hx-bubble-closure">{readingSections.closure}</div>
        {readingSections.suggestions && (
          <>
            <div className="hx-bubble-divider" />
            <div className="hx-bubble-text hx-bubble-suggestions">{readingSections.suggestions}</div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`hx-bubble-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div className={`hx-bubble-sender ${isUser ? 'is-user' : 'is-assistant'}`}>
        <span>{isUser ? 'Vous' : 'HexAstra'}</span>
        {timeLabel && <span className="hx-bubble-time">{timeLabel}</span>}
      </div>

      <div
        className={`hx-chat-message hx-chat-bubble ${isUser ? 'is-user' : 'is-assistant'}${isStatusCard ? ' is-status-card' : ''} hx-bubble-content`}
      >
        {renderContent()}
      </div>

      {!isUser && message.isReading && (
        <div className="hx-bubble-actions">
          <button
            className="hx-action-btn"
            onClick={handleCopy}
            type="button"
            aria-label="Copier la lecture"
          >
            {copied ? '✓' : '📋'}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleShare}
            type="button"
            aria-label="Partager la lecture"
          >
            {shared ? '✓' : '↗'}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleRetry}
            type="button"
            disabled={!onRetry}
            aria-label="Relancer la lecture"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  )
}

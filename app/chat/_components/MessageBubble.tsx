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
      return <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{readingSections.main}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>
          {readingSections.closure}
        </div>
        {readingSections.suggestions && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.86)' }}>
              {readingSections.suggestions}
            </div>
          </>
        )}
      </div>
    )
  }

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

      <div
        className={`hx-chat-message hx-chat-bubble ${isUser ? 'is-user' : 'is-assistant'}${isStatusCard ? ' is-status-card' : ''}`}
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
        {renderContent()}
      </div>

      {!isUser && message.isReading && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 4,
            color: 'rgba(255,255,255,0.82)',
            fontSize: 13,
            width: '100%',
          }}
        >
          <button
            className="hx-action-btn"
            onClick={handleCopy}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
              color: '#fefefe',
              cursor: 'pointer',
              opacity: 0.85,
            }}
            aria-label="Copier la lecture"
          >
            {copied ? '✓' : '📋'}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleShare}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
              color: '#fefefe',
              cursor: 'pointer',
              opacity: 0.85,
            }}
            aria-label="Partager la lecture"
          >
            {shared ? '✓' : '↗'}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleRetry}
            type="button"
            disabled={!onRetry}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
              color: onRetry ? '#fefefe' : 'rgba(255,255,255,0.4)',
              cursor: onRetry ? 'pointer' : 'not-allowed',
              opacity: 0.85,
            }}
            aria-label="Relancer la lecture"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  )
}

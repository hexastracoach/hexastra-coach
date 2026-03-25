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
  const segments = content.split(/\n[─—-]{6,}\n/g)
  if (segments.length < 2) return null

  const main = segments[0].trim()
  const closure = segments[1]?.trim()
  const suggestions = segments.slice(2).join('\n').trim()

  return { main, closure, suggestions }
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="6.5" y="4.5" width="9" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.5 12.5V6.5C4.5 5.39543 5.39543 4.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 10.25L12.75 5.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.75 5.25H12.75V8.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5H6.75C5.64543 6.5 4.75 7.39543 4.75 8.5V12.75C4.75 13.8546 5.64543 14.75 6.75 14.75H11.5C12.6046 14.75 13.5 13.8546 13.5 12.75V11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M15.25 10A5.25 5.25 0 1 1 13.4 6.03"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M13.25 3.75V6.25H15.75"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5.5 10.25L8.5 13.25L14.5 6.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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

  const renderBlocks = (text: string) => {
    const blocks = text.split(/\n{2,}/).filter((b) => b.trim())
    if (blocks.length <= 1) {
      return <div className="hx-bubble-text">{text}</div>
    }
    return (
      <div className="hx-bubble-blocks">
        {blocks.map((block, i) => {
          const trimmed = block.trim()
          const lines = trimmed.split('\n')
          return (
            <p key={i} className="hx-bubble-block">
              {lines.map((line, j) => (
                <span key={j} className={line.startsWith('\u2192 ') ? 'hx-bubble-arrow-label' : ''}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          )
        })}
      </div>
    )
  }

  const renderContent = () => {
    if (!readingSections) {
      return renderBlocks(message.content)
    }

    return (
      <div className="hx-bubble-sections">
        {renderBlocks(readingSections.main)}
        <div className="hx-bubble-divider" />
        <div className="hx-bubble-closure">{readingSections.closure}</div>
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
        <span className="hx-bubble-sender-mark" aria-hidden="true" />
        <span className="hx-bubble-sender-label">{isUser ? 'Vous' : 'Hexastra'}</span>
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
            title="Copier la lecture"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleShare}
            type="button"
            aria-label="Partager la lecture"
            title="Partager la lecture"
          >
            {shared ? <CheckIcon /> : <ShareIcon />}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleRetry}
            type="button"
            disabled={!onRetry}
            aria-label="Relancer la lecture"
            title="Relancer la lecture"
          >
            <RetryIcon />
          </button>
        </div>
      )}
    </div>
  )
}

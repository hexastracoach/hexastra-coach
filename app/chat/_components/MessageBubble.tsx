'use client'

import { useState } from 'react'
import { Check, Files, Share2, Sparkles } from 'lucide-react'
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

function getParagraphBlocks(text: string) {
  const lines = text.split('\n')
  const paragraphs: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) {
        paragraphs.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }

  if (current.length > 0) paragraphs.push(current)

  return paragraphs.length > 1
    ? paragraphs
    : lines.filter((line) => line.trim()).map((line) => [line])
}

export default function MessageBubble({ message, lastUserMessage, onRetry }: Props) {
  const isUser = message.role === 'user'
  const isStatusCard =
    !isUser &&
    !message.isReading &&
    (message.id.includes('birth-saved') || message.id.includes('journey'))
  const timeLabel = formatTime(message.created_at)
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
      const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
      if (navigator.share) {
        await navigator.share({
          title: 'Guidance Hexastra',
          text: message.content,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl || message.content)
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
    const blocks = getParagraphBlocks(text)

    if (blocks.length <= 1 && blocks[0]?.length <= 1) {
      return <div className="hx-bubble-text">{text}</div>
    }

    return (
      <div className="hx-bubble-blocks">
        {blocks.map((block, blockIndex) => (
          <p key={blockIndex} className="hx-bubble-block">
            {block.map((line, lineIndex) => (
              <span
                key={lineIndex}
                className={line.trimStart().startsWith('\u2192 ') ? 'hx-bubble-arrow-label' : ''}
              >
                {lineIndex > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
    )
  }

  const renderGuidanceCard = (text: string) => (
    <div className="hx-guidance-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        className="hx-guidance-watermark-layer"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/hexastra_logo_white_petals_triangles(3).svg"
          alt=""
          className="hx-guidance-watermark"
          draggable={false}
          style={{
            position: 'static',
            width: '62%',
            maxWidth: 420,
            height: 'auto',
            opacity: 0.07,
            mixBlendMode: 'screen',
            filter: 'blur(0.2px) drop-shadow(0 0 28px rgba(216, 181, 109, 0.16))',
            transform: 'none',
          }}
        />
      </div>

      <div className="hx-guidance-content-layer" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hx-guidance-card-header">
          <span className="hx-guidance-card-icon" aria-hidden="true">
            <img src="/hexastra_logo_white_petals_triangles(2).svg" alt="" draggable={false} />
          </span>
          <span>GUIDANCE HEXASTRA</span>
        </div>

        <div className="hx-guidance-free-content">{renderBlocks(text)}</div>
      </div>
    </div>
  )

  const renderContent = () => {
    return isUser || isStatusCard ? renderBlocks(message.content) : renderGuidanceCard(message.content)
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
            aria-label="Conserver cette guidance"
            title="Conserver cette guidance"
          >
            {copied ? <Check size={19} strokeWidth={1.9} /> : <Files size={19} strokeWidth={1.8} />}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleShare}
            type="button"
            aria-label="Partager cette lecture"
            title="Partager cette lecture"
          >
            {shared ? <Check size={19} strokeWidth={1.9} /> : <Share2 size={19} strokeWidth={1.8} />}
          </button>
          <button
            className="hx-action-btn"
            onClick={handleRetry}
            type="button"
            disabled={!onRetry}
            aria-label="Approfondir cette lecture"
            title="Approfondir cette lecture"
          >
            <Sparkles size={19} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  )
}

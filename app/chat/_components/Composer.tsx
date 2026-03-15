'use client'

import { useEffect, useRef, useState } from 'react'
import { QUICK_PROMPTS } from '../_lib/chat'

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onQuickPrompt: (value: string) => void
  showQuickPrompts: boolean
  onAttach?: (file: File) => void
  attachedFileName?: string
  onRemoveAttach?: () => void
  onBirthFormOpen?: () => void
  highlightBirth?: boolean
  disabled?: boolean
}

export default function Composer({
  value,
  onChange,
  onSend,
  onQuickPrompt,
  showQuickPrompts,
  onAttach,
  attachedFileName,
  onRemoveAttach,
  onBirthFormOpen,
  highlightBirth,
  disabled,
}: Props) {
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }, [value])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        try {
          const fd = new FormData()
          fd.append('file', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (typeof data.text === 'string' && data.text.trim()) {
            onChange(value ? `${value} ${data.text.trim()}` : data.text.trim())
          }
        } catch { /* noop */ }
        setTranscribing(false)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      alert('Accès au microphone refusé. Veuillez autoriser le micro dans votre navigateur.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onAttach?.(file)
    e.target.value = ''
  }

  const canSend = value.trim().length > 0 && !disabled && !transcribing

  return (
    <div className="hx-composer-wrap">
      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="hx-composer-suggestions">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} type="button" onClick={() => onQuickPrompt(p)} className="hx-chip">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Attached file badge */}
      {attachedFileName && (
        <div className="hx-composer-attach-row">
          <span className="hx-composer-attach-pill">
            <AttachIcon size={12} />
            <span className="hx-composer-attach-name">
              {attachedFileName}
            </span>
            <button
              type="button"
              className="hx-composer-attach-remove"
              onClick={onRemoveAttach}
              aria-label="Retirer la pièce jointe"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="hx-composer-recording-bar">
          <span className="hx-rec-dot" />
          Enregistrement… Cliquez sur le micro pour arrêter.
        </div>
      )}
      {transcribing && (
        <div className="hx-composer-recording-bar hx-composer-transcribing-bar">
          Transcription en cours…
        </div>
      )}

      {/* Main glass bar */}
      <div className={`hx-composer-box${focused ? ' is-focused' : ''}${canSend ? ' has-content' : ''}`}>

        {/* Left actions */}
        <div className="hx-composer-actions-left">

          {/* Birth data avatar */}
          <button
            type="button"
            className={`hx-composer-action-btn${highlightBirth ? ' is-highlight' : ''}`}
            onClick={onBirthFormOpen}
            title="Données de naissance"
            aria-label="Ouvrir le formulaire de naissance"
          >
            <AvatarIcon />
          </button>

          {/* File attach */}
          <button
            type="button"
            className="hx-composer-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Joindre un fichier (PNG, JPG, JPEG, PDF)"
            aria-label="Joindre un fichier"
            disabled={disabled}
          >
            <AttachIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
            aria-hidden="true"
            tabIndex={-1}
            className="hx-sr-only"
            onChange={handleFileChange}
          />

          {/* Audio record */}
          <button
            type="button"
            className={`hx-composer-action-btn${recording ? ' is-recording' : ''}${transcribing ? ' is-loading' : ''}`}
            onClick={recording ? stopRecording : startRecording}
            title={recording ? "Arrêter l'enregistrement" : 'Enregistrer un audio'}
            aria-label={recording ? "Arrêter l'enregistrement" : 'Enregistrer un audio'}
            disabled={disabled || transcribing}
          >
            {recording ? <WaveformIcon /> : <MicIcon />}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="hx-composer-textarea"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) onSend()
            }
          }}
          placeholder={
            transcribing
              ? 'Transcription en cours…'
              : 'Écrit...'
          }
          disabled={disabled || transcribing}
        />

        {/* Send button */}
        <button
          type="button"
          className={`hx-send-button${canSend ? ' is-active' : ''}`}
          onClick={onSend}
          disabled={!canSend}
          aria-label="Envoyer"
        >
          <svg
            className={`hx-send-icon${canSend ? ' is-active' : ''}`}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="hx-composer-hint">
        <span className="hx-composer-hint-enter">⌅</span>
        Entrée pour envoyer · Maj + Entrée pour aller à la ligne
      </div>
    </div>
  )
}

/* -- Icons -- */

function AvatarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function AttachIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function WaveformIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden="true">
      <rect className="hx-wf-bar hx-wf-b1" x="0"  y="5"  width="2.5" height="6"  rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b2" x="4"  y="2"  width="2.5" height="12" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b3" x="8"  y="0"  width="2.5" height="16" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b4" x="12" y="3"  width="2.5" height="10" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b5" x="16" y="6"  width="2.5" height="4"  rx="1.25" />
    </svg>
  )
}

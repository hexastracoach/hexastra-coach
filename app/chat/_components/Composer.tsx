'use client'

import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import SuggestionChips from './SuggestionChips'

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
  suggestions?: string[]
  onSuggestionSelect?: (value: string) => void
  showFusionEntry?: boolean
  onFusionEntry?: (prompt: string) => void
}

const PLACEHOLDERS = {
  fr: [
    "Qu'est-ce qui te traverse aujourd'hui ?",
    "Parle-moi de ce qui tourne dans ta t\u00eate.",
    "Qu'est-ce qui te p\u00e8se en ce moment ?",
    "Qu'est-ce qui te bloque aujourd'hui ?",
    'Que cherches-tu \u00e0 comprendre ?',
  ],
  en: [
    'What is moving through you today?',
    'Tell me what keeps turning in your mind.',
    'What feels heavy right now?',
    'What feels blocked today?',
    'What are you trying to understand?',
  ],
}

function getStatusLabel({
  lang,
  focused,
  recording,
  transcribing,
  attachedFileName,
}: {
  lang: string
  focused: boolean
  recording: boolean
  transcribing: boolean
  attachedFileName?: string
}) {
  const isEnglish = lang.startsWith('en')

  if (transcribing) {
    return isEnglish ? 'Transcribing your voice note' : 'Transcription de votre note vocale'
  }

  if (recording) {
    return isEnglish ? 'Listening to your voice note' : "J'écoute votre note vocale"
  }

  if (attachedFileName) {
    return isEnglish ? 'Attachment ready to analyze' : 'Pièce jointe prête à analyser'
  }

  if (focused) {
    return isEnglish ? 'Hexastra is focused on your situation' : 'Hexastra se concentre sur votre situation'
  }

  return isEnglish ? 'Direct. Calm. Clear.' : 'Direct. Calme. Clair.'
}

function getHelperLabel({
  lang,
  recording,
  transcribing,
}: {
  lang: string
  recording: boolean
  transcribing: boolean
}) {
  const isEnglish = lang.startsWith('en')

  if (transcribing) {
    return isEnglish
      ? 'The transcript will be added to your message automatically.'
      : 'Le texte sera ajouté automatiquement à votre message.'
  }

  if (recording) {
    return isEnglish ? 'Tap the microphone again to stop.' : 'Touchez à nouveau le micro pour arrêter.'
  }

  return isEnglish
    ? 'You can start simply. You do not need to be precise.'
    : "Tu peux commencer simplement. Pas besoin d'être précis."
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
  suggestions,
  onSuggestionSelect,
  showFusionEntry,
  onFusionEntry,
}: Props) {
  const { lang } = useTranslation()
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }, [value])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => current + 1)
    }, 7200)

    return () => window.clearInterval(timer)
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'recording.webm')
          const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await response.json()
          if (typeof data.text === 'string' && data.text.trim()) {
            const nextText = value ? `${value} ${data.text.trim()}` : data.text.trim()
            onChange(nextText)
          }
        } catch {
          // noop
        }
        setTranscribing(false)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      alert(
        lang.startsWith('en')
          ? 'Microphone access was denied. Please allow microphone access in your browser.'
          : 'Accès au microphone refusé. Autorisez le micro dans votre navigateur.'
      )
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onAttach?.(file)
    event.target.value = ''
  }

  const canSend = value.trim().length > 0 && !disabled && !transcribing
  const placeholderOptions = lang.startsWith('en') ? PLACEHOLDERS.en : PLACEHOLDERS.fr
  const placeholder = transcribing
    ? lang.startsWith('en')
      ? 'Transcribing your message...'
      : 'Je transcris votre message...'
    : placeholderOptions[placeholderIndex % placeholderOptions.length]
  const statusLabel = getStatusLabel({
    lang,
    focused,
    recording,
    transcribing,
    attachedFileName,
  })
  const helperLabel = getHelperLabel({ lang, recording, transcribing })

  return (
    <div className="hx-composer-wrap">
      {showQuickPrompts && !(suggestions && suggestions.length > 0) && (
        <div className="hx-composer-suggestions">
          {['Découvrir mon profil', 'Comprendre mon ascendant', 'Faire un bilan', 'Analyser ma situation'].map(
            (prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onQuickPrompt(prompt)}
                className="hx-chip"
              >
                {prompt}
              </button>
            )
          )}
        </div>
      )}

      {attachedFileName && (
        <div className="hx-composer-attach-row">
          <span className="hx-composer-attach-pill">
            <AttachIcon size={12} />
            <span className="hx-composer-attach-name">{attachedFileName}</span>
            <button
              type="button"
              className="hx-composer-attach-remove"
              onClick={onRemoveAttach}
              aria-label="Retirer la pièce jointe"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {recording && (
        <div className="hx-composer-recording-bar">
          <span className="hx-rec-dot" />
          {lang.startsWith('en')
            ? 'Recording in progress. Tap the mic to stop.'
            : 'Enregistrement en cours. Touchez le micro pour arrêter.'}
        </div>
      )}
      {transcribing && (
        <div className="hx-composer-recording-bar hx-composer-transcribing-bar">
          {lang.startsWith('en') ? 'Transcription in progress...' : 'Transcription en cours...'}
        </div>
      )}

      <div className="hx-composer-shell">
        <div className={`hx-composer-box${focused ? ' is-focused' : ''}${canSend ? ' has-content' : ''}${disabled && !canSend ? ' is-busy' : ''}`}>
          <div className="hx-composer-actions-left">
            <button
              type="button"
              className={`hx-composer-action-btn${highlightBirth ? ' is-highlight' : ''}`}
              onClick={onBirthFormOpen}
              title="Données de naissance"
              aria-label="Ouvrir le formulaire de naissance"
            >
              <AvatarIcon />
            </button>

            <button
              type="button"
              className="hx-composer-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Joindre un fichier (PNG, JPG, JPEG, PDF)"
              aria-label="Joindre un fichier"
              disabled={disabled}
            >
              <PlusIcon />
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
          </div>

          <textarea
            ref={textareaRef}
            className="hx-composer-textarea"
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSend) onSend()
              }
            }}
            placeholder={placeholder}
            disabled={disabled || transcribing}
            aria-label={lang.startsWith('en') ? 'Ask your question' : 'Pose ta question'}
          />

          <div className="hx-composer-actions-right">
            {recording ? (
              <button
                type="button"
                className="hx-composer-right-btn is-recording"
                onClick={stopRecording}
                title="Arrêter l'enregistrement"
                aria-label="Arrêter l'enregistrement"
              >
                <WaveformIcon />
              </button>
            ) : canSend ? (
              <button
                type="button"
                className="hx-composer-right-btn is-send"
                onClick={onSend}
                disabled={!canSend}
                aria-label={lang.startsWith('en') ? 'Send' : 'Envoyer'}
              >
                <SendArrowIcon />
              </button>
            ) : (
              <button
                type="button"
                className={`hx-composer-right-btn${transcribing ? ' is-loading' : ''}`}
                onClick={startRecording}
                title="Enregistrer un audio"
                aria-label="Enregistrer un audio"
                disabled={disabled || transcribing}
              >
                <MicIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AvatarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function AttachIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      <rect className="hx-wf-bar hx-wf-b1" x="0" y="5" width="2.5" height="6" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b2" x="4" y="2" width="2.5" height="12" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b3" x="8" y="0" width="2.5" height="16" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b4" x="12" y="3" width="2.5" height="10" rx="1.25" />
      <rect className="hx-wf-bar hx-wf-b5" x="16" y="6" width="2.5" height="4" rx="1.25" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SendArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

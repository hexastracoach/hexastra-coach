'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { usePromptChat } from '@/app/chat/_lib/usePromptChat'

export default function PromptChatClient() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, isLoading, error, send } = usePromptChat({
    context: { language: 'fr' },
  })

  // Auto-scroll vers le dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSend() {
    if (!input.trim() || isLoading) return
    send(input)
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Pose ta question…
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="animate-pulse">…</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-destructive">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="border-t bg-background px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message… (Entrée pour envoyer)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border bg-muted/40 px-4 py-3 text-sm
                       placeholder:text-muted-foreground focus:outline-none focus:ring-1
                       focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-medium
                       text-primary-foreground transition-opacity
                       hover:opacity-90 disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}

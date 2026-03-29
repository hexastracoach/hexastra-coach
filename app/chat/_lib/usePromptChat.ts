'use client'

import { useState, useCallback, useRef } from 'react'
import { randomUUID } from 'crypto'

export type PromptMsg = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type PromptChatContext = {
  userId?: string
  plan?: string
  language?: string
}

type UsePromptChatOptions = {
  context?: PromptChatContext
  onError?: (err: string) => void
}

export function usePromptChat(options: UsePromptChatOptions = {}) {
  const [messages, setMessages] = useState<PromptMsg[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim()
      if (!trimmed || isLoading) return

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMsg: PromptMsg = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            context: {
              language: 'fr',
              ...options.context,
            },
          }),
          signal: controller.signal,
        })

        const data = await res.json()

        if (!res.ok) {
          const msg = data?.error ?? `Erreur ${res.status}`
          setError(msg)
          options.onError?.(msg)
          return
        }

        const assistantMsg: PromptMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply ?? '',
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = 'La requête a échoué. Réessaie.'
        setError(msg)
        options.onError?.(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, options],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, send, reset }
}

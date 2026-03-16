import { applyIntelligentSilence as legacySilence } from '@/lib/chat/intelligentSilenceEngine'

export function applySilence(text: string, intent?: string, userMessage?: string, isReading?: boolean) {
  return legacySilence(text, { intent, userMessage, isReading })
}

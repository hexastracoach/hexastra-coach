export type DetectedIntent =
  | 'greeting'
  | 'gratitude'
  | 'analysis'
  | 'emotion'
  | 'question'
  | 'conversation'

export function detectIntent(message: string): DetectedIntent {
  const text = (message || '').trim().toLowerCase()

  if (/^(salut|bonjour|hello|hey|coucou)\b/.test(text)) return 'greeting'
  if (/merci\b/.test(text)) return 'gratitude'
  if (/(analyse|lecture|th[eè]me|multi-angle)/.test(text)) return 'analysis'
  if (/je (suis|me sens)\b/.test(text)) return 'emotion'
  if (/\b(quoi|comment|pourquoi|que faire)\b/.test(text)) return 'question'

  return 'conversation'
}

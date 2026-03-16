export type ConversationState = 'start' | 'small_talk' | 'exploration' | 'analysis' | 'closing'

export function updateConversationState(intent: string, previous: ConversationState): ConversationState {
  if (intent === 'greeting') return 'small_talk'
  if (intent === 'analysis') return 'analysis'
  if (intent === 'question') return 'exploration'
  if (intent === 'emotion') return previous === 'start' ? 'exploration' : previous
  return previous
}

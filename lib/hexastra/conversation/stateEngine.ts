export type ConversationState =
  | 'start'
  | 'small_talk'
  | 'exploration'
  | 'analysis'
  | 'decision_support'
  | 'reflection'
  | 'closing'

export function updateConversationState(intent: string, prev: ConversationState): ConversationState {
  if (intent === 'greeting' || intent === 'small_talk') return 'small_talk'
  if (intent === 'analysis' || intent === 'hexastra_reading') return 'analysis'
  if (intent === 'decision') return 'decision_support'
  if (intent === 'question' || intent === 'emotion') return 'exploration'
  return prev
}

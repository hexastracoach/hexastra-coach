import type { Intent } from './intentEngine'

export type Route =
  | 'small_reply'
  | 'navigation'
  | 'conversation'
  | 'analysis'
  | 'hexastra_reading'
  | 'decision_support'

export function routeIntent(intent: Intent): Route {
  if (intent === 'greeting' || intent === 'small_talk' || intent === 'gratitude') return 'small_reply'
  if (intent === 'navigation') return 'navigation'
  if (intent === 'analysis') return 'analysis'
  if (intent === 'hexastra_reading') return 'hexastra_reading'
  if (intent === 'decision') return 'decision_support'
  return 'conversation'
}

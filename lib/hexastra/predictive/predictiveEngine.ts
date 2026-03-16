export type PredictiveOutput = {
  next_possible_intents: string[]
  confidence: number
}

export function predictNextIntents(input: {
  message: string
  intent: string
  emotion_state?: string
  conversation_state?: string
  entities?: Record<string, any>
  memory?: unknown
}): PredictiveOutput {
  const { message, intent, entities } = input
  const intents: string[] = []

  const m = message.toLowerCase()
  const topic = entities?.topic as string | undefined

  if (intent === 'analysis' || intent === 'hexastra_reading') {
    intents.push('hexastra_reading')
  }

  if (intent === 'question' || /clarifier|préciser|comment/.test(m)) {
    intents.push('clarify_question')
  }

  if (topic === 'projet' || /projet/.test(m)) {
    intents.push('project_analysis', 'decision_help')
  }

  if (topic === 'relation' || /relation|couple|famille|ami/.test(m)) {
    intents.push('relationship_analysis')
  }

  if (topic === 'travail' || /travail|job|carrière|boulot/.test(m)) {
    intents.push('career_analysis')
  }

  if (intent === 'emotion' || /je me sens|je suis/.test(m)) {
    intents.push('self_reflection')
  }

  if (intents.length === 0) intents.push('explore_topic')

  const confidence = Math.min(0.9, 0.5 + intents.length * 0.05)

  return { next_possible_intents: Array.from(new Set(intents)), confidence }
}

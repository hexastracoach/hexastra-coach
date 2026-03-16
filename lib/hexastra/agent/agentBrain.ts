import type { Intent } from '@/lib/hexastra/conversation/intentEngine'
import type { ExtractedEntities } from '@/lib/hexastra/conversation/entityEngine'

export type EmotionState = 'neutral' | 'curious' | 'confused' | 'stressed' | 'motivated' | 'reflective'
export type ResponseDepth = 'minimal' | 'conversation' | 'analysis' | 'deep_analysis'
export type ResponseStyle = 'light' | 'coach' | 'analytical' | 'supportive'

export type AgentBrainOutput = {
  intent: Intent
  emotion_state: EmotionState
  response_depth: ResponseDepth
  response_style: ResponseStyle
  confidence: number
}

function detectEmotion(message: string): EmotionState {
  const t = message.toLowerCase()
  if (/stress|angoiss|peur|pression/.test(t)) return 'stressed'
  if (/perdu|confus|flou|hésite|doute/.test(t)) return 'confused'
  if (/curieux|pourquoi|comment/.test(t)) return 'curious'
  if (/motivé|envie|prêt|go/i.test(t)) return 'motivated'
  if (/réfléchir|comprendre|potentiel|sens/i.test(t)) return 'reflective'
  return 'neutral'
}

function chooseDepth(intent: Intent): ResponseDepth {
  if (intent === 'greeting' || intent === 'small_talk') return 'minimal'
  if (intent === 'hexastra_reading') return 'deep_analysis'
  if (intent === 'analysis' || intent === 'decision') return 'analysis'
  if (intent === 'question' || intent === 'emotion') return 'conversation'
  return 'conversation'
}

function chooseStyle(intent: Intent, emotion: EmotionState): ResponseStyle {
  if (intent === 'analysis' || intent === 'hexastra_reading') return 'analytical'
  if (emotion === 'stressed' || emotion === 'confused') return 'supportive'
  if (intent === 'decision') return 'coach'
  if (intent === 'greeting' || intent === 'small_talk') return 'light'
  return 'coach'
}

export function analyzeAgentState(params: {
  message: string
  intent: Intent
  entities?: ExtractedEntities
  memory?: unknown
}): AgentBrainOutput {
  const emotion = detectEmotion(params.message)
  const response_depth = chooseDepth(params.intent)
  const response_style = chooseStyle(params.intent, emotion)
  const confidence = 0.75

  return {
    intent: params.intent,
    emotion_state: emotion,
    response_depth,
    response_style,
    confidence,
  }
}

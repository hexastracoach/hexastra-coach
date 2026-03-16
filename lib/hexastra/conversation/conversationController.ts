import { detectIntent } from './intentEngine'
import { extractEntities } from './entityEngine'
import { updateConversationState, type ConversationState } from './stateEngine'
import { updateShortTermMemory, mergeLongTermMemory, type ShortTermMemory, type LongTermMemory } from './memoryEngine'
import { routeIntent } from './routingEngine'
import { runReasoning } from './reasoningEngine'
import { addHumanTone } from './humanToneEngine'
import { applySilence } from './silenceEngine'
import { buildResponse } from './responseBuilder'
import { chooseResponseType } from './responseTypeEngine'
import { analyzeAgentState } from '@/lib/hexastra/agent/agentBrain'
import { detectUserDepthLevel } from '@/lib/chat/adaptiveDepthEngine'
import { ensureHexAstraTone } from '@/lib/chat/conversationToneEngine'
import { composeResponse } from '@/lib/chat/responseComposer'
import { predictNextIntents } from '@/lib/hexastra/predictive/predictiveEngine'
import { buildNavigationReply } from './navigationEngine'

export type ConversationContext = {
  shortTerm: ShortTermMemory
  longTerm: LongTermMemory
  state: ConversationState
}

export function runConversationController({
  message,
  history,
  userPlan,
  ctx,
}: {
  message: string
  history: string[]
  userPlan: string
  ctx: ConversationContext
}): { reply: string; ctx: ConversationContext } {
  // Language detection (simplifié)
  const language = 'fr'

  const intentResult = detectIntent(message)
  const entities = extractEntities(message)
  const brain = analyzeAgentState({ message, intent: intentResult.intent, entities })
  const state = updateConversationState(intentResult.intent, ctx.state)
  const prediction = predictNextIntents({
    message,
    intent: intentResult.intent,
    emotion_state: brain.emotion_state,
    conversation_state: state,
    entities,
    memory: ctx,
  })

  const updatedShort = updateShortTermMemory(ctx.shortTerm, message)
  const updatedLong = mergeLongTermMemory(ctx.longTerm, entities)

  const route = routeIntent(intentResult.intent)
  const depthLevel = detectUserDepthLevel(message, history.map((h) => ({ role: 'user', content: h } as any)), userPlan as any)

  let base = ''
  if (route === 'navigation') {
    base = buildNavigationReply()
  } else if (route === 'analysis' || route === 'hexastra_reading') {
    base = runReasoning({ intent: intentResult.intent, entities, message })
  } else if (route === 'decision_support') {
    base = runReasoning({ intent: 'decision', entities, message })
  } else if (route === 'small_reply') {
    const kindMap: Record<string, any> = {
      greeting: 'greeting',
      small_talk: 'small_talk',
      gratitude: 'gratitude',
    }
    base = buildResponse(kindMap[intentResult.intent] ?? 'greeting')
  } else {
    const responseKind = chooseResponseType(intentResult.intent)
    const mapped =
      responseKind === 'structured'
        ? 'analysis'
        : responseKind === 'empathetic'
          ? 'conversation'
          : responseKind === 'light'
            ? 'small_talk'
            : 'conversation'
    base = buildResponse(mapped as any)
  }

  const toned = ensureHexAstraTone(base, { intent: intentResult.intent, isReading: false, maxLines: 8 })
  const composed = composeResponse(toned, { intent: intentResult.intent, isReading: false })
  const human = addHumanTone(composed)
  const silent = applySilence(human, intentResult.intent, message, false)

  return {
    reply: silent,
    ctx: { shortTerm: updatedShort, longTerm: updatedLong, state },
  }
}

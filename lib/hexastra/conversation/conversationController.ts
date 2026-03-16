import { detectIntent } from './intentEngine'
import { extractEntities } from './entityEngine'
import { updateConversationState, type ConversationState } from './stateEngine'
import { updateShortTermMemory, mergeLongTermMemory, type ShortTermMemory, type LongTermMemory } from './memoryEngine'
import { routeIntent } from './routingEngine'
import { runReasoning } from './reasoningEngine'
import { addHumanTone } from './humanToneEngine'
import { applySilence } from './silenceEngine'
import { buildResponse } from './responseBuilder'
import { chooseResponseType } from '@/lib/conversation/responseTypeEngine'
import { analyzeAgentState } from '@/lib/hexastra/agent/agentBrain'
import { detectUserDepthLevel } from '@/lib/chat/adaptiveDepthEngine'
import { ensureHexAstraTone } from '@/lib/chat/conversationToneEngine'
import { composeResponse } from '@/lib/chat/responseComposer'

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

  const updatedShort = updateShortTermMemory(ctx.shortTerm, message)
  const updatedLong = mergeLongTermMemory(ctx.longTerm, entities)

  const route = routeIntent(intentResult.intent)
  const depthLevel = detectUserDepthLevel(message, history.map((h) => ({ role: 'user', content: h } as any)), userPlan as any)

  let base = ''
  if (route === 'analysis' || route === 'hexastra_reading') {
    base = runReasoning({ intent: intentResult.intent, entities, message })
  } else if (route === 'decision_support') {
    base = runReasoning({ intent: 'decision', entities, message })
  } else {
    const responseKind = chooseResponseType(intentResult.intent)
    base = buildResponse(
      responseKind === 'structured' ? 'analysis' : responseKind === 'empathetic' ? 'conversation' : responseKind,
      intentResult.intent
    )
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

import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { HexastraSessionContext } from '@/lib/hexastra/context/buildSessionContext'
import type { HexastraUserContext } from '@/lib/hexastra/context/buildUserContext'
import type { FlowStep } from '@/lib/hexastra/types'

// Keep last 6 messages (3 user + 2 assistant typically) — matches limitedMessages in runHexastraFlow.
// The orchestrator already slices to 6 before calling buildChatPayload; this is a safety cap.
function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-6)
}

function buildKnowledgeHierarchyMessage(knowledgePacket?: Record<string, unknown> | null) {
  if (!knowledgePacket) return null

  const priorityOrder = Array.isArray(knowledgePacket.priorityOrder)
    ? knowledgePacket.priorityOrder.join(' -> ')
    : 'masterPrompt -> readingStructure -> sciencePrompt -> subsciencePrompt -> referenceBook -> supportingKnowledge'
  const fusionGuide =
    typeof knowledgePacket.fusionGuide === 'string' ? knowledgePacket.fusionGuide : null

  const orderedSources = Array.isArray((knowledgePacket as { orderedSources?: unknown[] }).orderedSources)
    ? ((knowledgePacket as { orderedSources?: unknown[] }).orderedSources ?? []).slice(0, 6)
    : []

  const summarizedSources = orderedSources
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const source = entry as {
        role?: string
        filename?: string | null
        scienceTag?: string | null
        excerpt?: string
      }
      const role = source.role ?? 'supportingKnowledge'
      const filename = source.filename ?? 'source inconnue'
      const scienceTag = source.scienceTag ? ` [${source.scienceTag}]` : ''
      const excerpt = typeof source.excerpt === 'string' ? source.excerpt : ''
      return `${role}${scienceTag}: ${filename}${excerpt ? ` -> ${excerpt}` : ''}`
    })
    .filter(Boolean)
    .join('\n')

  return `Hierarchie documentaire HexAstra a respecter strictement: ${priorityOrder}${
    fusionGuide ? `\nPrincipe de fusion: ${fusionGuide}` : ''
  }${
    summarizedSources ? `\nSources ordonnees:\n${summarizedSources}` : ''
  }`
}

export function buildChatPayload({
  systemPrompt,
  userContext,
  sessionContext,
  messages,
  knowledgeBlock,
  flowStep,
  readingPacket,
  knowledgePacket,
}: {
  systemPrompt: string
  userContext: HexastraUserContext
  sessionContext: HexastraSessionContext
  messages: ChatMessage[]
  knowledgeBlock?: string | null
  flowStep?: FlowStep
  readingPacket?: Record<string, unknown> | null
  knowledgePacket?: Record<string, unknown> | null
}) {
  const compactContext = {
    plan: userContext.plan,
    language: userContext.language,
    firstName: userContext.firstName,
    practitionerUsage: userContext.practitionerUsage,
    birthData: userContext.birthData,
    memory: userContext.memory,
    journeyEnabled: Boolean(userContext.journeyEnabled),
    session: {
      currentTheme: sessionContext.currentTheme,
      contextType: sessionContext.contextType,
      selectedMenuKey: sessionContext.selectedMenuKey,
      selectedSubmenuKey: sessionContext.selectedSubmenuKey,
      readingLevel: sessionContext.readingLevel,
      timing: sessionContext.timing,
      emotionalState: sessionContext.emotionalState,
      precision: sessionContext.precision,
      dominantPotential: sessionContext.dominantPotential,
      lifePhase: sessionContext.lifePhase,
      domainRoute: sessionContext.domainRoute,
      activeModule: sessionContext.activeModule,
      flowStep: flowStep ?? 'analysis',
    },
  }

  const knowledgeHierarchyMessage = buildKnowledgeHierarchyMessage(knowledgePacket)

  const trimmed = trimMessages(messages)
  const compactContextStr = JSON.stringify(compactContext)
  const totalInputChars =
    systemPrompt.length +
    compactContextStr.length +
    trimmed.reduce((acc, m) => acc + m.content.length, 0)

  // Log payload size for observability — helps detect prompt-bloat regressions
  if (process.env.NODE_ENV !== 'test') {
    console.info('[OPENAI] preparing payload', {
      messagesCount: trimmed.length + 1,      // +1 for compactContext user message
      systemPromptChars: systemPrompt.length,
      compactContextChars: compactContextStr.length,
      historyChars: trimmed.reduce((acc, m) => acc + m.content.length, 0),
      totalInputChars,
      plan: userContext.plan,
      hasReadingPacket: Boolean(readingPacket),
      hasKnowledgePacket: Boolean(knowledgePacket),
      hasKnowledgeBlock: Boolean(knowledgeBlock),
    })
  }

  return {
    model: process.env.OPENAI_HEXASTRA_MODEL || 'gpt-4o',
    instructions: systemPrompt,
    temperature: flowStep === 'sensitive_support' ? 0.45 : 0.68,
    max_output_tokens: flowStep === 'deep_reading' || userContext.plan === 'practitioner' ? 1300 : 950,
    input: [
      {
        role: 'user',
        content: `Contexte HexAstra interne a integrer silencieusement : ${JSON.stringify(compactContext)}`,
      },
      ...(readingPacket
        ? [
            {
              role: 'assistant' as const,
              content: `Reading packet HexAstra interne a suivre prioritairement pour ordonner la lecture : ${JSON.stringify(readingPacket)}`,
            },
          ]
        : []),
      ...(knowledgePacket
        ? [
            {
              role: 'assistant' as const,
              content: `Knowledge packet HexAstra interne. Hierarchie documentaire a respecter : ${JSON.stringify(knowledgePacket)}`,
            },
          ]
        : []),
      ...(knowledgeHierarchyMessage
        ? [
            {
              role: 'assistant' as const,
              content: knowledgeHierarchyMessage,
            },
          ]
        : []),
      ...(knowledgeBlock ? [{ role: 'assistant' as const, content: knowledgeBlock }] : []),
      ...trimmed,
    ],
  }
}

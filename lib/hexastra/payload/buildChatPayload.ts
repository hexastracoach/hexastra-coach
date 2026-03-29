import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { HexastraSessionContext } from '@/lib/hexastra/context/buildSessionContext'
import type { HexastraUserContext } from '@/lib/hexastra/context/buildUserContext'
import type { FlowStep } from '@/lib/hexastra/types'

// Keep last 6 messages (3 user + 2 assistant typically) — matches limitedMessages in runHexastraFlow.
// The orchestrator already slices to 6 before calling buildChatPayload; this is a safety cap.
function trimMessages(messages: ChatMessage[], max = 6): ChatMessage[] {
  return messages.slice(-max)
}

function trimAstroExactMessages(messages: ChatMessage[]): ChatMessage[] {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && message.content.trim())

  return lastUserMessage ? [lastUserMessage] : trimMessages(messages, 1)
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
  isAstroExactCompact,
  isHoroscopeRoute,
  horoscopeVariant,
  vectorRetrievalSignalsBlock,
}: {
  systemPrompt: string
  userContext: HexastraUserContext
  sessionContext: HexastraSessionContext
  messages: ChatMessage[]
  knowledgeBlock?: string | null
  flowStep?: FlowStep
  readingPacket?: Record<string, unknown> | null
  knowledgePacket?: Record<string, unknown> | null
  /** When true: strip knowledge packets, reduce history to 2 messages, compact context */
  isAstroExactCompact?: boolean
  /** When true: apply horoscope token budget (daily=2500, weekly=5000) */
  isHoroscopeRoute?: boolean
  horoscopeVariant?: 'daily' | 'weekly' | null
  /** Bloc structuré par science issu du retrieval vectoriel — remplace le blob knowledgeBlock quand présent */
  vectorRetrievalSignalsBlock?: string | null
}) {
  // ── Astro Exact Compact: stripped-down context ────────────────────────────
  // Birth data is already injected in the system prompt via exactDataBlock.
  // We only send {firstName, language} here — no session state, no memory, no history.
  const compactContext = isAstroExactCompact
    ? {
        plan: userContext.plan,
        language: userContext.language,
        firstName: userContext.firstName,
      }
    : {
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

  // ── Compact: only last 2 messages (last user turn sufficient) ────────────
  const maxHistory = isAstroExactCompact ? 2 : 6
  const trimmed = isAstroExactCompact
    ? trimAstroExactMessages(messages)
    : trimMessages(messages, maxHistory)

  // ── Knowledge packets: skipped in compact mode ────────────────────────────
  // vectorRetrievalSignalsBlock remplace le blob knowledgeBlock quand disponible
  const resolvedKnowledgeBlock = vectorRetrievalSignalsBlock ?? knowledgeBlock
  const effectiveKnowledgeBlock = isAstroExactCompact ? null : resolvedKnowledgeBlock
  const effectiveReadingPacket = isAstroExactCompact ? null : readingPacket
  const effectiveKnowledgePacket = isAstroExactCompact ? null : knowledgePacket
  const knowledgeHierarchyMessage = buildKnowledgeHierarchyMessage(effectiveKnowledgePacket)

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
      isAstroExactCompact: Boolean(isAstroExactCompact),
      hasReadingPacket: Boolean(effectiveReadingPacket),
      hasKnowledgePacket: Boolean(effectiveKnowledgePacket),
      hasKnowledgeBlock: Boolean(effectiveKnowledgeBlock),
    })
  }

  // ── Max output tokens ─────────────────────────────────────────────────────
  // Compact mode: cap at 900 to stay within timeout budget for free plan.
  // Horoscope: 2500 for daily (15 blocks), 5000 for weekly (7 × 10 blocks).
  // Normal: 1300 for deep_reading/practitioner, 950 otherwise.
  const maxOutputTokens = isAstroExactCompact
    ? 900
    : isHoroscopeRoute
      ? (horoscopeVariant === 'weekly' ? 5000 : 2500)
      : (flowStep === 'deep_reading' || userContext.plan === 'practitioner' ? 1300 : 950)

  return {
    model: process.env.OPENAI_HEXASTRA_MODEL || 'gpt-4o',
    instructions: systemPrompt,
    temperature: flowStep === 'sensitive_support' ? 0.45 : 0.68,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: 'user',
        content: `Contexte HexAstra interne a integrer silencieusement : ${compactContextStr}`,
      },
      ...(effectiveReadingPacket
        ? [
            {
              role: 'assistant' as const,
              content: `Reading packet HexAstra interne a suivre prioritairement pour ordonner la lecture : ${JSON.stringify(effectiveReadingPacket)}`,
            },
          ]
        : []),
      ...(effectiveKnowledgePacket
        ? [
            {
              role: 'assistant' as const,
              content: `Knowledge packet HexAstra interne. Hierarchie documentaire a respecter : ${JSON.stringify(effectiveKnowledgePacket)}`,
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
      ...(effectiveKnowledgeBlock ? [{ role: 'assistant' as const, content: effectiveKnowledgeBlock }] : []),
      ...trimmed,
    ],
  }
}

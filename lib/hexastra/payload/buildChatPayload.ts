import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { HexastraSessionContext } from '@/lib/hexastra/context/buildSessionContext'
import type { HexastraUserContext } from '@/lib/hexastra/context/buildUserContext'
import type { FlowStep } from '@/lib/hexastra/types'

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-12)
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

  return {
    model: process.env.OPENAI_HEXASTRA_MODEL || 'gpt-4o',
    instructions: systemPrompt,
    temperature: flowStep === 'sensitive_support' ? 0.45 : 0.68,
    max_output_tokens: flowStep === 'deep_reading' || userContext.plan === 'practitioner' ? 1300 : 950,
    input: [
      {
        role: 'user',
        content: `Contexte HexAstra interne à intégrer silencieusement : ${JSON.stringify(compactContext)}`,
      },
      ...(readingPacket
        ? [
            {
              role: 'assistant' as const,
              content: `Reading packet HexAstra interne à suivre prioritairement pour ordonner la lecture : ${JSON.stringify(readingPacket)}`,
            },
          ]
        : []),
      ...(knowledgePacket
        ? [
            {
              role: 'assistant' as const,
              content: `Knowledge packet HexAstra interne. Hiérarchie documentaire à respecter : ${JSON.stringify(knowledgePacket)}`,
            },
          ]
        : []),
      ...(knowledgeBlock ? [{ role: 'assistant' as const, content: knowledgeBlock }] : []),
      ...trimMessages(messages),
    ],
  }
}

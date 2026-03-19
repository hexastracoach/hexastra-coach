import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { BirthProfile, ContextType, PractitionerUsageHex, UiAction } from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'
import type {
  BirthDataCompleteness,
  NormalizedInput,
  QuotaState,
  SessionState,
} from './types'

function normalizeText(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function resolveBirthDataCompleteness(profile: BirthProfile | null): BirthDataCompleteness {
  if (!profile) return 'none'
  const parts = [
    profile.firstName?.trim(),
    profile.birthDateISO?.trim() || profile.date?.trim(),
    profile.place?.trim(),
  ].filter(Boolean)

  if (parts.length >= 3) return 'complete'
  if (parts.length > 0) return 'partial'
  return 'none'
}

function resolveSessionState(messages: ChatMessage[], conversationId?: string | null): SessionState {
  if (!conversationId || messages.length <= 1) return 'new'
  const assistantCount = messages.filter((entry) => entry.role === 'assistant').length
  if (assistantCount >= 2) return 'returning'
  return 'active'
}

export function buildNormalizedInput(params: {
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  userMessage: string
  plan: PlanKey
  quotaState: QuotaState
  birthData: BirthProfile | null
  language: string
  memoryAvailable: boolean
  uiAction?: UiAction | null
  contextType: ContextType
  practitionerUsage: PractitionerUsageHex
  conversationId?: string | null
  hasExplicitGuidance: boolean
  journeyEnabled: boolean
  messages: ChatMessage[]
}): NormalizedInput {
  const birthDataCompleteness = resolveBirthDataCompleteness(params.birthData)

  return {
    requestType: params.requestType,
    selectedMenu: params.selectedMenuKey ?? null,
    selectedSubmenu: params.selectedSubmenuKey ?? null,
    userMessage: params.userMessage,
    normalizedUserMessage: normalizeText(params.userMessage),
    plan: params.plan,
    quotaState: params.quotaState,
    hasBirthData: birthDataCompleteness === 'complete',
    birthDataCompleteness,
    sessionState: resolveSessionState(params.messages, params.conversationId),
    language: params.language,
    memoryAvailable: params.memoryAvailable,
    uiAction: params.uiAction ?? null,
    contextType: params.contextType,
    practitionerUsage: params.practitionerUsage,
    conversationId: params.conversationId ?? null,
    hasExplicitGuidance: params.hasExplicitGuidance,
    journeyEnabled: params.journeyEnabled,
    birthData: params.birthData,
    messages: params.messages,
  }
}

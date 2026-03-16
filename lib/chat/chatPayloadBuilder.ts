import type { BirthData } from '@/app/chat/_lib/chat'
import type { PlanKey } from '@/lib/plans'
import type { PractitionerUsage } from './bootstrapTypes'
import type { UserEvolutionProfile } from '@/types/evolution'
import { buildPlanApiContext } from '@/lib/plans'
import { getEntitlements } from './entitlements'
import type { ContextType, UiAction } from '@/lib/hexastra/types'

export type RequestType = 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ApiBirthData = {
  name?: string
  firstName?: string
  lastName?: string
  date?: string
  time?: string
  place?: string
  country?: string
  lat?: number
  lon?: number
  gender?: string
  birthDateISO?: string
  birthTimeKnown?: boolean
}

function buildBirthDateIso(date?: string, time?: string): string | undefined {
  if (!date) return undefined
  const safeTime = time && time.trim() ? time.trim() : '12:00'
  const isoCandidate = `${date}T${safeTime}`
  const ts = Date.parse(isoCandidate)
  if (Number.isNaN(ts)) return undefined
  return new Date(ts).toISOString()
}

function toApiBirthData(bd: BirthData): ApiBirthData {
  const cleanDate = bd.birthDate ? bd.birthDate.trim() : ''
  const timeKnown = bd.birthTimeKnown ?? Boolean(bd.birthTime)
  const time = timeKnown ? (bd.birthTime || '').trim() : '12:00'
  const place = [bd.birthCity?.trim(), (bd.birthCountryName || bd.birthCountryCode || '').trim()]
    .filter(Boolean)
    .join(', ')
    || (bd.birthCity || '').trim()

  return {
    name: bd.firstName || undefined,
    firstName: bd.firstName || undefined,
    lastName: bd.lastName || undefined,
    date: cleanDate || undefined,
    time: time || undefined,
    place: place || undefined,
    country: bd.birthCountryName || bd.birthCountryCode || undefined,
    lat: bd.birthLat ? Number(bd.birthLat) : undefined,
    lon: bd.birthLng ? Number(bd.birthLng) : undefined,
    gender: bd.gender || undefined,
    birthDateISO: buildBirthDateIso(cleanDate, time),
    birthTimeKnown: timeKnown,
  }
}

function microReadingInstruction(requestType: RequestType, bd: BirthData): string | null {
  const name = bd.firstName?.trim() || 'l\'utilisateur'

  if (requestType === 'micro_profile') {
    return `[INSTRUCTION MICRO-PROFIL — GÉNÉRER MAINTENANT]\nGénère le Micro-Profil pour ${name} selon la structure HexAstra : essence, fonctionnement, sensibilité, force, vigilance. Format : 6-10 lignes. Aucune question.`
  }
  if (requestType === 'micro_year') {
    const year = new Date().getFullYear()
    return `[INSTRUCTION MICRO-ANNÉE — GÉNÉRER MAINTENANT]\nGénère la Micro-Année ${year} pour ${name} selon la structure HexAstra : phase, mouvement, opportunité, vigilance, attitude optimale. Format : 5-8 lignes. Aucune question.`
  }
  if (requestType === 'micro_month') {
    return `[INSTRUCTION MICRO-MOIS — GÉNÉRER MAINTENANT]\nGénère le Micro-Mois pour ${name} selon la structure HexAstra : thème principal, favorable, vigilance, conseil clé. Format : 2-4 lignes. Puis prépare la transition vers le menu.`
  }
  return null
}

export type ChatPayload = {
  requestType: RequestType
  mode: string
  conversationId: string | null
  language: string
  chatLanguage: string
  plan: string
  analysisDepth: string
  practitionerEnabled: boolean
  longResponseAllowed: boolean
  professionalUseAllowed: boolean
  practitionerUsage: PractitionerUsage | 'self' | 'client'
  birthData: ApiBirthData | null
  messages: ChatMessage[]
  evolutionProfile: UserEvolutionProfile | null
  contextType: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
}

export function buildChatPayload({
  requestType,
  plan,
  birthData,
  practitionerUsage,
  chatLanguage,
  conversationId,
  messages,
  evolutionProfile = null,
  contextType = 'general',
  selectedMenuKey = null,
  selectedSubmenuKey = null,
  uiAction = 'send_message',
}: {
  requestType: RequestType
  plan: PlanKey
  birthData: BirthData
  practitionerUsage: PractitionerUsage
  chatLanguage: string | undefined
  conversationId: string | null
  messages: ChatMessage[]
  evolutionProfile?: UserEvolutionProfile | null
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
}): ChatPayload {
  const planCtx = buildPlanApiContext(plan)
  const ents = getEntitlements(plan)
  const apiBirthData = toApiBirthData(birthData)

  let finalMessages = messages
  if (requestType !== 'chat') {
    const instruction = microReadingInstruction(requestType, birthData)
    if (instruction) finalMessages = [{ role: 'user', content: instruction }]
  }

  return {
    requestType,
    mode: ents.chatMode,
    conversationId,
    language: chatLanguage ?? 'fr',
    chatLanguage: chatLanguage ?? 'fr',
    plan: planCtx.plan,
    analysisDepth: planCtx.analysisDepth,
    practitionerEnabled: planCtx.practitionerEnabled,
    longResponseAllowed: planCtx.longResponseAllowed,
    professionalUseAllowed: planCtx.professionalUseAllowed,
    practitionerUsage: practitionerUsage ?? null,
    birthData: apiBirthData,
    messages: finalMessages,
    evolutionProfile,
    contextType,
    selectedMenuKey,
    selectedSubmenuKey,
    uiAction,
  }
}

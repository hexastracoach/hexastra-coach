import type { BirthData } from '@/app/chat/_lib/chat'
import type { ContextType, UiAction } from '@/lib/hexastra/types'
import { buildPlanApiContext } from '@/lib/plans'
import type { PlanKey } from '@/lib/plans'
import type { UserEvolutionProfile } from '@/types/evolution'
import { getEntitlements } from './entitlements'
import type { PractitionerUsage } from './bootstrapTypes'
import type { AnalysisMode, RenderMode } from '@/lib/hexastra/sciences/scienceTaxonomy'
import { FUSION_ONLY_ANALYSIS_MODE } from '@/lib/hexastra/fusionOnly'
import type { UserIntentKey } from '@/lib/hexastra/config/intentContextMap'

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
  const name = bd.firstName?.trim() || "l'utilisateur"

  if (requestType === 'micro_profile') {
    return `[INSTRUCTION MICRO-PROFIL - GENERER MAINTENANT]
Genere le Micro-Profil pour ${name}.
Contraintes obligatoires :
- 6 a 10 lignes, fluides, humaines, non techniques, probabilistes.
- Eviter la formulation "Tu es".
- Preferer des formulations comme "Ton fonctionnement naturel semble..." ou "Tu as tendance a...".
- Decrire le fonctionnement de base, la sensibilite dominante, l'atout principal, la vigilance et l'equilibre.
- Finir exactement par :
Cette lecture decrit ton fonctionnement de base.
Nous pouvons maintenant explorer ta situation actuelle.
- Aucune question.`.trim()
  }

  if (requestType === 'micro_year') {
    const year = new Date().getFullYear()
    return `[INSTRUCTION MICRO-ANNEE - GENERER MAINTENANT]
Genere la Micro-Annee ${year} pour ${name}.
Contraintes obligatoires :
- 5 a 8 lignes, strategiques, encourageantes, non techniques, probabilistes.
- Decrire la phase, le mouvement, l'opportunite, la vigilance et l'attitude juste.
- Finir exactement par :
Ce cycle donne le contexte de ton annee.
Explorons maintenant ta situation actuelle.
- Aucune question.`.trim()
  }

  if (requestType === 'micro_month') {
    return `[INSTRUCTION MICRO-MOIS - GENERER MAINTENANT]
Genere le Micro-Mois pour ${name}.
Contraintes obligatoires :
- 2 a 4 lignes, directes, utiles, non techniques, probabilistes.
- Decrire le theme principal du mois, le point favorable, la vigilance et le conseil cle.
- Puis ajouter exactement cette transition finale :
Ton profil, ton annee et ton contexte actuel sont maintenant poses.
Que souhaites-tu explorer ?
- Aucune question supplementaire.`.trim()
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
  practitionerUsage: PractitionerUsage | 'self' | 'client' | 'duo'
  birthData: ApiBirthData | null
  partnerBirthData?: ApiBirthData | null
  messages: ChatMessage[]
  evolutionProfile: UserEvolutionProfile | null
  contextType: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
  journeyEnabled?: boolean
  analysisMode?: AnalysisMode | null
  renderMode?: RenderMode | null
  userIntentKey?: UserIntentKey | null
}

export function buildChatPayload({
  requestType,
  plan,
  birthData,
  partnerBirthData = null,
  practitionerUsage,
  chatLanguage,
  conversationId,
  messages,
  evolutionProfile = null,
  contextType = 'general',
  selectedMenuKey = null,
  selectedSubmenuKey = null,
  uiAction = 'send_message',
  journeyEnabled = false,
  analysisMode = FUSION_ONLY_ANALYSIS_MODE,
  renderMode = null,
  userIntentKey = null,
}: {
  requestType: RequestType
  plan: PlanKey
  birthData: BirthData
  partnerBirthData?: BirthData | null
  practitionerUsage: PractitionerUsage
  chatLanguage: string | undefined
  conversationId: string | null
  messages: ChatMessage[]
  evolutionProfile?: UserEvolutionProfile | null
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
  journeyEnabled?: boolean
  analysisMode?: AnalysisMode | null
  renderMode?: RenderMode | null
  userIntentKey?: UserIntentKey | null
}): ChatPayload {
  const planCtx = buildPlanApiContext(plan)
  const ents = getEntitlements(plan)
  const apiBirthData = toApiBirthData(birthData)
  const apiPartnerBirthData = partnerBirthData ? toApiBirthData(partnerBirthData) : null

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
    partnerBirthData: apiPartnerBirthData,
    messages: finalMessages,
    evolutionProfile,
    contextType,
    selectedMenuKey,
    selectedSubmenuKey,
    uiAction,
    journeyEnabled,
    analysisMode,
    renderMode,
    userIntentKey,
  }
}

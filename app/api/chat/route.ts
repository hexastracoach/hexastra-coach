import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getChatCache, getRateLimiter } from '@/lib/system/providerFactory'
import { checkChatRateLimit, getRequestIp } from '@/lib/rateLimit/chatRateLimit'
import { getRateLimitMessage } from '@/lib/rateLimit/simpleRateLimit'
import { incrementLoad, decrementLoad, getCurrentLoad } from '@/lib/system/loadMonitor'
import { isExtremeLoad, getModeSnapshot } from '@/lib/system/runtimeMode'
import { withTimeout, TimeoutError } from '@/lib/system/withTimeout'
import { getSystemTrafficMode, recordRequest, recordTimeout, recordError } from '@/lib/system/viralMode'
import { decideChatExecutionStrategy, buildQueuedMessage } from '@/lib/queue/executionStrategy'
import { getPlanPriority } from '@/lib/billing/priority'
import { memoryChatQueue } from '@/lib/queue/memoryChatQueue'
import { processNextQueuedJob } from '@/lib/queue/processChatJob'
import { runHexastraFlow } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import { enrichReadingResponse } from '@/lib/hexastra/response/enrichReadingResponse'
import type {
  BirthProfile,
  ContextType,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import { mapDbPlanToPlanKey, downgradeIfInactive } from '@/lib/permissions/plan'
import { logger } from '@/lib/utils/logger'
import { captureError } from '@/lib/utils/errorReporter'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { validateEnv } from '@/lib/utils/env'
import { getOrCreateProfile } from '@/lib/profiles/getOrCreateProfile'
import { generateConversation } from '@/lib/hexastra/openai/generateConversation'
import { formatAnalysis } from '@/lib/hexastra/openai/formatAnalysis'
import { generateSuggestions } from '@/lib/hexastra/suggestions/generateSuggestions'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import { getPlanQuotaLimit, getPlanResponseDepth, getQuotaState } from '@/lib/hexastra/orchestration/planContracts'
import { buildReadingPlanContract } from '@/lib/hexastra/orchestration/readingPlanContract'
import { buildNormalizedInput } from '@/lib/hexastra/orchestration/normalizeInput'
import { evaluateOrchestration } from '@/lib/hexastra/orchestration/evaluateOrchestration'
import type { ExecutionPlan, OrchestrationTrace } from '@/lib/hexastra/orchestration/types'
import { updateUserEvolutionProfile } from '@/lib/evolution/evolutionEngine'
import type { UserEvolutionProfile } from '@/types/evolution'
import {
  normalizeFusionOnlyAnalysisMode,
  sanitizeFusionOnlySelectionKey,
} from '@/lib/hexastra/fusionOnly'
import {
  callN8nChatWebhook,
  isN8nChatEnabled,
} from '@/lib/n8n/chatWebhook'
import {
  buildQuotaUpgradeDecision,
  buildSmartPricingSessionState,
} from '@/lib/monetization/smartPricing'

// Providers sélectionnés une fois par warm instance (lazy singletons via providerFactory).
// Redis si UPSTASH_REDIS_REST_URL + TOKEN sont définis, sinon mémoire LRU locale.
// Fallback automatique vers mémoire si Redis échoue au runtime.
// Voir lib/system/providerFactory.ts pour la logique de sélection.
export const runtime = 'nodejs'
export const maxDuration = 120

const _cache      = getChatCache()
const _rateLimiter = getRateLimiter()

type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien'
type UsageFeature = 'chat_api'
type ChatResponsePayload = Record<string, unknown> & {
  message?: string
  reply?: string
  content?: string
  type?: string
  plan?: PlanKey
  mode?: PlanKey | string
  conversationId?: string
  flowState?: Record<string, unknown>
  menu?: Record<string, unknown>
  metadata?: Record<string, unknown>
  usedLocalFallback?: boolean
  fallbackType?: string | null
}
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: {},
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
  SUPABASE_SERVICE_ROLE_KEY: {},
}

function normalizePlanKey(value: unknown): PlanKey | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''

  if (normalized === 'free' || normalized === 'gratuit') return 'free'
  if (normalized === 'essential' || normalized === 'essentiel') return 'essential'
  if (normalized === 'premium') return 'premium'
  if (normalized === 'practitioner' || normalized === 'praticien') return 'practitioner'

  return null
}

function getTemporaryAccessOverridePlan(): PlanKey | null {
  const raw =
    process.env.HEXASTRA_ACCESS_OVERRIDE?.trim() ||
    process.env.NEXT_PUBLIC_HEXASTRA_ACCESS_OVERRIDE?.trim() ||
    ''
  const normalized = raw.toLowerCase()

  if (!normalized || normalized === '0' || normalized === 'false' || normalized === 'off') return null
  const plan = normalizePlanKey(normalized)
  if (plan) return plan
  if (normalized === 'practitioner' || normalized === 'all' || normalized === 'true') return 'practitioner'

  return null
}

function getTemporaryRequestPlan(bodyRecord: Record<string, unknown>): PlanKey | null {
  if (!getTemporaryAccessOverridePlan()) return null
  return normalizePlanKey(bodyRecord.debugPlan)
}

function normalizeText(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
}

const DEFAULT_FALLBACK_MESSAGE = 'Je suis là. Dis-moi ce dont tu as besoin.'
const DEFAULT_EMPTY_MENU = { visible: false, items: [] }

function serializeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: String(error),
  }
}

function withTrace(payload: ChatResponsePayload, trace?: OrchestrationTrace | null): ChatResponsePayload {
  if (!trace) return payload
  return {
    ...payload,
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      orchestrationTrace: trace,
    },
  }
}

function buildGreetingBranchResponse(params: {
  plan: PlanKey
  birthData: BirthProfile | null
  conversationId?: string | null
  trace?: OrchestrationTrace | null
}) {
  const { plan, birthData, conversationId, trace } = params
  const canOpenMenu = isBirthProfileComplete(birthData)
  const greetingMenu = canOpenMenu ? getMenuForMode(getModeForPlan(plan)) : []
  const payload = withTrace(
    {
      content: canOpenMenu
        ? 'Bienvenue.\n\nJe suis HexAstra Coach.\nChaque réponse te donne une lecture claire, une mise en perspective et une action concrète.\n\nTu peux aussi mettre a jour tes donnees de naissance depuis le formulaire dans la barre de chat.\n\nQue souhaites-tu explorer ?'
        : 'Bienvenue.\n\nJe suis HexAstra Coach.\nUn outil de lecture stratégique pour t’aider à comprendre ta situation, ton timing et la meilleure direction à prendre.\n\nPour lancer ta premiere lecture automatique, ouvre le formulaire de donnees de naissance dans la barre de chat et remplis-le une seule fois.',
      type: 'greeting',
      plan,
      mode: plan,
      conversationId: conversationId ?? randomUUID(),
      flowState: { step: canOpenMenu ? 'menu' : 'conversation', completed: true },
      menu: {
        visible: canOpenMenu,
        items: greetingMenu,
      },
      metadata: {
        contextType: 'general',
        selectedMenuKey: null,
        selectedSubmenuKey: null,
        intentDetected: 'greeting',
      },
    },
    trace
  )

  return buildConsistentResponse(payload, {
    type: 'greeting',
    plan,
    mode: plan,
    conversationId: conversationId ?? undefined,
    flowState: { step: canOpenMenu ? 'menu' : 'conversation', completed: true },
    menu: {
      visible: canOpenMenu,
      items: greetingMenu,
    },
  })
}

function shouldFormatAnalysisResponse(params: {
  plan: PlanKey
  execution: ExecutionPlan
  explicitGuidance: boolean
  response: ChatResponsePayload
}) {
  const { plan, execution, explicitGuidance, response } = params
  return (
    plan !== 'free' &&
    execution.callConversationFormatter &&
    !explicitGuidance &&
    response?.flowState?.step !== 'menu' &&
    !(response?.menu?.visible) &&
    typeof response?.message === 'string' &&
    response.message.trim().length > 0 &&
    !String((response?.metadata as Record<string, unknown> | undefined)?.selectedSubmenuKey ?? '').startsWith('science_') &&
    (response?.metadata as Record<string, unknown> | undefined)?.contextType !== 'science' &&
    !looksAlreadyStructured(response.message)
  )
}

async function applyAnalysisResponsePolicy(params: {
  response: ChatResponsePayload
  plan: PlanKey
  execution: ExecutionPlan
  explicitGuidance: boolean
}) {
  const { response, plan, execution, explicitGuidance } = params
  const shouldRephrase = shouldFormatAnalysisResponse({
    plan,
    execution,
    explicitGuidance,
    response,
  })

  if (!shouldRephrase || typeof response.message !== 'string') {
    return response
  }

  const reformatted = await formatAnalysis(response.message)
  if (!reformatted) return response

  const withSuggestions = `${reformatted}\n\n${generateSuggestions(response.message).join('\n')}`

  return {
    ...response,
    message: withSuggestions,
    reply: withSuggestions,
    content: withSuggestions,
  }
}

function buildConsistentResponse(
  payload: ChatResponsePayload,
  defaults?: {
    type?: string
    plan?: PlanKey
    mode?: PlanKey | string
    conversationId?: string
    flowState?: Record<string, unknown>
    menu?: Record<string, unknown>
  }
): ChatResponsePayload {
  const trimmedMessage =
    typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message.trim()
      : null
  const trimmedReply =
    typeof payload.reply === 'string' && payload.reply.trim().length > 0
      ? payload.reply.trim()
      : null
  const trimmedContent =
    typeof payload.content === 'string' && payload.content.trim().length > 0
      ? payload.content.trim()
      : null

  const finalText =
    trimmedMessage ?? trimmedReply ?? trimmedContent ?? DEFAULT_FALLBACK_MESSAGE

  return {
    ...payload,
    message: finalText,
    reply: finalText,
    content: finalText,
    type:
      typeof payload.type === 'string'
        ? payload.type
        : defaults?.type ?? 'conversation',
    plan:
      (typeof payload.plan === 'string' ? payload.plan : defaults?.plan) ?? 'free',
    mode:
      (typeof payload.mode === 'string' ? payload.mode : defaults?.mode) ??
      (typeof payload.plan === 'string' ? payload.plan : defaults?.plan) ??
      'free',
    conversationId:
      (typeof payload.conversationId === 'string' && payload.conversationId.trim()) ||
      defaults?.conversationId ||
      randomUUID(),
    flowState:
      payload.flowState && typeof payload.flowState === 'object'
        ? payload.flowState
        : defaults?.flowState ?? { step: 'conversation', completed: true },
    menu:
      payload.menu && typeof payload.menu === 'object'
        ? payload.menu
        : defaults?.menu ?? DEFAULT_EMPTY_MENU,
  }
}

export function getNormalizationDiagnostics(payload: ChatResponsePayload) {
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  const reply = typeof payload.reply === 'string' ? payload.reply.trim() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim() : ''
  const from = message ? 'message' : reply ? 'reply' : content ? 'content' : 'fallback'
  const finalText = message || reply || content || DEFAULT_FALLBACK_MESSAGE
  const metadata = payload.metadata && typeof payload.metadata === 'object'
    ? (payload.metadata as Record<string, unknown>)
    : {}
  const explicitUsedLocalFallback =
    payload.usedLocalFallback === true || metadata.usedLocalFallback === true
  const explicitFallbackType =
    typeof payload.fallbackType === 'string'
      ? payload.fallbackType
      : typeof metadata.fallbackType === 'string'
        ? (metadata.fallbackType as string)
        : null

  return {
    from,
    usedLocalFallback: explicitUsedLocalFallback || from === 'fallback',
    fallbackType: explicitFallbackType,
    finalTextLength: finalText.length,
  }
}

function isGreeting(normalized: string): boolean {
  return /^(salut|bonjour|hello|hey|coucou|yo|bonsoir|hi|cava|ca va|ça va|merci|ok|daccord|dac|oui|non)$/.test(
    normalized.replace(/\s+/g, '')
  )
}

function isReadingFollowUp(message: string, history: ChatMessage[]): boolean {
  const norm = normalizeText(message)
  if (!norm) return false

  const followUpMarkers =
    /(developpe|develope|developper|approfondis|approfondir|continue|vas plus loin|plus en detail|plus en profondeur|detaille|detaille moi|explique mieux|peux tu plus|peux tu développer|peux tu developper|et pour|et concernant|sur ce point|dans ce cas|qu est ce que ca veut dire|que signifie)/i

  if (!followUpMarkers.test(norm) && norm.length > 80) return false

  const lastAssistantMessage = [...history].reverse().find((entry) => entry.role === 'assistant')?.content ?? ''
  if (!lastAssistantMessage) return false

  const assistantNorm = normalizeText(lastAssistantMessage)
  return (
    /(signature de naissance|axes dominants|orientation actuelle|lecture|theme natal|theme astral|maison 1|maison i|oppos[ée]e|astrol|neurokua|human design|porteum|portes|canaux|centres|autorite|strategie|forces|vigilances|ce qui se joue|ce qui compte|direction|action concrete)/i.test(
      assistantNorm
    ) ||
    looksAlreadyStructured(lastAssistantMessage)
  )
}

function isContextualFlowCommand(
  message: string,
  history: ChatMessage[],
  selectedMenuKey?: string | null,
  selectedSubmenuKey?: string | null
) {
  const norm = normalizeText(message)
  if (!norm) return false

  const hasActiveSelection = Boolean(selectedMenuKey || selectedSubmenuKey)
  const isShortChoice = /^\d{1,2}$/.test(norm) || /^niveau\s*\d+$/.test(norm)
  const isCompositeChoice = /^\d{1,2}\s*(et|&|\+|puis|then)\s*\d{1,2}$/.test(norm)
  const isActiveScienceFollowUp =
    hasActiveSelection &&
    /(\bhd\b|human design|porteum|portes?|canaux?|centres?|profil|autorite|strategie|astrologie|astrolex|maisons?|aspects?|synastrie|geo astrologie|neurokua|baseline|balance|overload|recalibration|numerologie|enneagramme|kua)/.test(
      norm
    )
  const isActiveContextQuestion =
    hasActiveSelection &&
    (
      message.includes('?') ||
      /\b(quels?|quelle?s?|comment|pourquoi|est ce|peux tu|peut tu|donne moi|fais moi|analyse|explique|dis moi|pour moi|sur moi|applique|regarde|parle moi|montre moi)\b/.test(
        norm
      ) ||
      norm.split(' ').length >= 4
    )
  const isModeSwitch =
    norm === 'mode praticien' ||
    norm === 'menu praticien' ||
    norm === 'passe moi en mode praticien' ||
    norm === 'repasse moi en mode praticien' ||
    norm === 'en mode praticien' ||
    norm === 'analyse par science' ||
    norm === 'analyse par sciences' ||
    norm === 'retour aux sciences' ||
    norm === 'retour au sciences' ||
    norm === 'redonne moi les sciences' ||
    norm === 'redonne moi les science'

  if (isModeSwitch) return true
  if (isActiveScienceFollowUp) return true
  if (isActiveContextQuestion) return true
  if (!isShortChoice && !isCompositeChoice) return false

  const lastAssistantMessage = [...history].reverse().find((entry) => entry.role === 'assistant')?.content ?? ''
  const assistantNorm = normalizeText(lastAssistantMessage)
  const assistantShowsGuidedFlow =
    /analyse par science|selection|astrologie|astrolex|human design|porteum|neurokua|numerologie|trianglenumeris|enneagramme|kua|maslow|mode praticien|niveau|analyses par situation|analyses par science|menu praticien/.test(
      assistantNorm
    )

  return hasActiveSelection || assistantShowsGuidedFlow
}

function detectIntentLocal(
  message: string,
  history: ChatMessage[],
  selectedMenuKey?: string | null,
  selectedSubmenuKey?: string | null
): 'greeting' | 'menu' | 'birth_update' | 'analysis' | 'conversation' {
  const norm = normalizeText(message)
  if (isGreeting(norm)) return 'greeting'
  if (/(menu|angle|angles|option|choix|navigation)/.test(norm)) return 'menu'
  if (isContextualFlowCommand(message, history, selectedMenuKey, selectedSubmenuKey)) return 'analysis'
  if (isReadingFollowUp(message, history)) return 'analysis'
  if (/(profil|analyse|lecture|theme|thème|astral|natal|astro|astrology|human design|design humain|porteum|\bhd\b|porte|portes|canal|canaux|centre|centres|autorite|strategie|numerologie|numerology|enneagramme|enneagram|relation|travail|periode|période|decision|décision|blocage|question|hexastra|neurokua|kua|etat du jour|état du jour)/.test(norm)) {
    return 'analysis'
  }
  if (
    /(donnees de naissance mises a jour|donnees naissance mises a jour|birth data updated|ne e le|nee le|ne le|prenom|date de naissance|heure de naissance|ville de naissance|pays de naissance)/.test(
      norm
    )
  ) {
    return 'birth_update'
  }
  return 'conversation'
}

function buildOutOfScopeResponse(plan: PlanKey, mode: string, conversationId?: string | null) {
  return buildConsistentResponse(
    {
      message:
        "Je reste dans le cadre d'HexAstra Coach : lecture de situation, timing, dynamiques personnelles, relationnelles, professionnelles et decisions.\n\nSi tu veux, reformule ta demande dans cet angle ou choisis une lecture du menu.",
      type: 'out_of_scope',
      plan,
      mode,
      conversationId: conversationId ?? randomUUID(),
      flowState: { step: 'conversation', completed: true },
      menu: DEFAULT_EMPTY_MENU,
      metadata: {
        contextType: 'general',
        selectedMenuKey: null,
        selectedSubmenuKey: null,
        intentDetected: 'out_of_scope',
      },
    },
    {
      type: 'out_of_scope',
      plan,
      mode,
      conversationId: conversationId ?? undefined,
      flowState: { step: 'conversation', completed: true },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

function hasExplicitGuidance(body: Record<string, unknown>) {
  return Boolean(
    (typeof body.selectedMenuKey === 'string' && body.selectedMenuKey.trim()) ||
      (typeof body.selectedSubmenuKey === 'string' && body.selectedSubmenuKey.trim()) ||
      body.uiAction === 'select_menu_item' ||
      body.uiAction === 'select_submenu_item' ||
      body.uiAction === 'restart_flow'
  )
}

function looksAlreadyStructured(text: string) {
  const trimmed = (text || '').trim()
  return (
    /^1[\.\)]\s/m.test(trimmed) ||
    /^[-•]\s/m.test(trimmed) ||
    trimmed.split(/\r?\n/).filter(Boolean).length >= 6
  )
}

/**
 * Clé de cache stable et sécurisée.
 *
 * SHA-256 au lieu de concaténation brute :
 * - Longueur bornée (64 hex) quelle que soit la taille du message ou des données de naissance
 * - Pas d'injection de séparateur :: dans les valeurs
 * - Compatible avec les clés Redis (pas d'espace, pas de caractères spéciaux)
 *
 * La normalisation du message (lowercase + trim) assure que deux messages
 * identiques à la casse près partagent le même slot de cache.
 */
function buildCacheKey(userId: string | null, plan: PlanKey, message: string, birthData?: unknown): string {
  const uid = userId ?? 'guest'
  const planKey = plan || 'free'
  const msg = message.trim().toLowerCase()
  const bd  = birthData ? JSON.stringify(birthData) : ''
  return createHash('sha256').update(`${uid}::${planKey}::${msg}::${bd}`).digest('hex')
}

/**
 * Lecture du cache via le provider actif (Redis ou mémoire selon config).
 * Retourne null si absent ou expiré — jamais de stale data.
 */
async function getCache(key: string): Promise<unknown | null> {
  return _cache.get<unknown>(key)
}

/**
 * Écriture dans le cache via le provider actif (Redis ou mémoire selon config).
 * TTL et taille gérés par l'implémentation.
 */
async function setCache(key: string, value: unknown): Promise<void> {
  return _cache.set(key, value)
}

function limitHistory(messages: ChatMessage[], max = 6): ChatMessage[] {
  const recent = messages.slice(-max)
  const users = recent.filter((m) => m.role === 'user').slice(-3)
  const assistants = recent.filter((m) => m.role === 'assistant').slice(-2)
  const allowed = new Set([...users, ...assistants])
  return recent.filter((m) => allowed.has(m))
}

function normalizeBirthData(raw: unknown): BirthProfile | null {
  if (!raw || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>
  const isoRaw = typeof data.birthDateISO === 'string' ? data.birthDateISO.trim() : ''
  let isoDate: string | undefined
  let isoTime: string | undefined
  if (isoRaw && isoRaw.includes('T')) {
    const [d, t] = isoRaw.split('T')
    isoDate = d
    isoTime = (t || '').replace('Z', '').slice(0, 5)
  }

  const birthTimeKnown =
    typeof data.birthTimeKnown === 'boolean' ? data.birthTimeKnown : undefined

  const birth: BirthProfile = {
    name: typeof data.name === 'string' ? data.name.trim() : undefined,
    firstName: typeof data.firstName === 'string' ? data.firstName.trim() : undefined,
    lastName: typeof data.lastName === 'string' ? data.lastName.trim() : undefined,
    date:
      typeof data.date === 'string'
        ? data.date.trim()
        : typeof data.birthDate === 'string'
          ? data.birthDate.trim()
          : isoDate,
    time:
      typeof data.time === 'string'
        ? data.time.trim()
        : typeof data.birthTime === 'string'
          ? data.birthTime.trim()
          : isoTime,
    place:
      typeof data.place === 'string'
        ? data.place.trim()
        : typeof data.birthCity === 'string'
          ? data.birthCity.trim()
          : undefined,
    country:
      typeof data.country === 'string'
        ? data.country.trim()
        : typeof data.birthCountryName === 'string'
          ? data.birthCountryName.trim()
          : undefined,
    lat: typeof data.lat === 'number' ? data.lat : undefined,
    lon: typeof data.lon === 'number' ? data.lon : undefined,
    gender: typeof data.gender === 'string' ? data.gender.trim() : undefined,
    birthDateISO: isoRaw || undefined,
    birthTimeKnown,
  }

  const hasUsefulData = Boolean(
    birth.firstName ||
      birth.lastName ||
      birth.date ||
      birth.time ||
      birth.place ||
      birth.country ||
      typeof birth.lat === 'number' ||
      typeof birth.lon === 'number'
  )

  return hasUsefulData ? birth : null
}

function isBirthProfileComplete(profile: BirthProfile | null) {
  if (!profile) return false
  return Boolean(profile.firstName?.trim() && (profile.birthDateISO?.trim() || profile.date?.trim()) && profile.place?.trim())
}

function buildSafeErrorResponse() {
  return buildConsistentResponse(
    {
      message: "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu.",
      mode: 'free',
      plan: 'free',
      flowState: { step: 'error', completed: false },
      conversationId: randomUUID(),
      metadata: {
        shouldPersistMemory: false,
      },
    },
    {
      type: 'error',
      plan: 'free',
      mode: 'free',
      flowState: { step: 'error', completed: false },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

/**
 * Réponse de fallback pour la branche 'analysis' quand runHexastraFlow timeout ou échoue.
 *
 * PHILOSOPHIE : ne jamais laisser l'utilisateur face à une page blanche ou une erreur 500.
 * Le fallback offre une réponse partielle exploitable plutôt qu'un échec complet.
 *
 * Contenu :
 * - CE QUI SE PASSE : synthèse directe à partir de la question (sans calcul IA)
 * - UNE ACTION CONCRÈTE : conseil universel mais pertinent
 * - MESSAGE HONNÊTE : indiquer que la lecture complète est en cours / a pris du retard
 */
function buildAnalysisFallbackResponse(params: {
  plan: PlanKey
  conversationId: string | null
  userMessage: string
  lang?: string
}) {
  const { plan, conversationId, userMessage, lang = 'fr' } = params
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'

  const shortQuestion = userMessage.slice(0, 80).trim()

  const message = isFr
    ? `Je lis ta question : "${shortQuestion}${userMessage.length > 80 ? '…' : ''}"\n\n` +
      `La lecture complète prend un peu plus de temps que prévu ce soir — ` +
      `le système est sollicité. Reformule ta question dans quelques instants ` +
      `et je t'apporterai une analyse complète.\n\n` +
      `En attendant : la clarté vient rarement en cherchant une réponse immédiate. ` +
      `Pose la question différemment si tu peux — et reviens dans 30 secondes.`
    : `I see your question: "${shortQuestion}${userMessage.length > 80 ? '…' : ''}"\n\n` +
      `The full reading is taking longer than expected — the system is under heavy load. ` +
      `Please try again in a few moments for a complete analysis.\n\n` +
      `In the meantime: clarity rarely comes from seeking an immediate answer. ` +
      `Rephrase your question if you can — and come back in 30 seconds.`

  return buildConsistentResponse(
    {
      message,
      plan,
      mode: plan,
      type: 'analysis',
      flowState: { step: 'analysis', completed: false },
      conversationId: conversationId ?? randomUUID(),
      metadata: {
        shouldPersistMemory: false,
        fallback: true,
        fallbackReason: 'flow_timeout_or_error',
      },
    },
    {
      type: 'analysis',
      plan,
      mode: plan,
      flowState: { step: 'analysis', completed: false },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

/**
 * Lance runHexastraFlow avec un timeout de sécurité supplémentaire côté route.
 *
 * runHexastraFlow a déjà un global timeout de 29s en interne, mais il peut
 * rester bloqué si un sous-processus ne répond pas correctement.
 * Ce wrapper ajoute une couche route-level via `withTimeout` (lib/system/withTimeout.ts) :
 * si la Promise ne se résout pas avant ROUTE_FLOW_TIMEOUT_MS, on retourne le fallback proprement.
 *
 * `withTimeout` est préféré à `Promise.race` inline car :
 * - nettoie le timer si la Promise résout avant le timeout (pas de fuite de timer)
 * - lève `TimeoutError` nommé — distinguable dans le catch
 * - centralise le pattern pour tous les call-sites
 */
const ROUTE_FLOW_TIMEOUT_MS = 28_000  // 2s avant la limite Vercel 30s

async function runFlowWithFallback(params: {
  flowInput: Parameters<typeof runHexastraFlow>[0]
  plan: PlanKey
  conversationId: string | null
  userMessage: string
  lang: string
  logFn: (level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => void
}): Promise<{ result: Awaited<ReturnType<typeof runHexastraFlow>>; usedFallback: false }
          | { result: ReturnType<typeof buildAnalysisFallbackResponse>; usedFallback: true }> {
  const { flowInput, plan, conversationId, userMessage, lang, logFn } = params

  try {
    const result = await withTimeout(
      runHexastraFlow(flowInput),
      ROUTE_FLOW_TIMEOUT_MS,
      'runHexastraFlow'
    )
    return { result, usedFallback: false }
  } catch (err) {
    const isTimeout = err instanceof TimeoutError
    // Alimenter le tracker viralMode pour détecter les dégradations systémiques
    if (isTimeout) recordTimeout()
    else            recordError()
    logFn(isTimeout ? 'warn' : 'error', 'flow_fallback_activated', {
      reason: err instanceof Error ? err.message : String(err),
      isTimeout,
      plan,
    })
    return {
      result: buildAnalysisFallbackResponse({ plan, conversationId, userMessage, lang }),
      usedFallback: true,
    }
  }
}

function buildQuotaErrorResponse(params: {
  plan: PlanKey
  used: number
  limit: number
  resetAt: string | null
  messages?: ChatMessage[]
}) {
  const { plan, used, limit, resetAt, messages = [] } = params
  const upgradeDecision = buildQuotaUpgradeDecision(plan)
  const pricingSessionState = buildSmartPricingSessionState({
    messages,
    lastInteractionTimestamp: new Date().toISOString(),
  })

  const planLabel =
    plan === 'essential'
      ? 'Essentiel'
      : plan === 'premium'
        ? 'Premium'
      : plan === 'practitioner'
          ? 'Praticien'
          : 'Gratuit'

  const freeMessage = `Tu as atteint la limite de ton acces decouverte pour le moment.

Ton espace gratuit se reouvrira automatiquement dans 24h.
Si tu veux continuer maintenant, tu peux aller plus loin avec Essentiel.`

  const paidMessage = `Tu as atteint la limite de ton plan ${planLabel} pour le moment.

Tu pourras reessayer plus tard, ou passer a l'offre superieure si tu veux continuer tout de suite.`

  const finalMessage = plan === 'free' ? freeMessage : paidMessage

  return buildConsistentResponse(
    {
      message: finalMessage,
      mode: plan,
      plan,
      flowState: { step: 'quota_limit', completed: false },
      conversationId: randomUUID(),
      metadata: {
        shouldPersistMemory: false,
        quotaExceeded: true,
        upgradeShown: upgradeDecision.shouldShow,
        upgradeReason: upgradeDecision.reason,
        upgradeText: upgradeDecision.message,
        upgradeTargetPlan: upgradeDecision.targetPlan ?? undefined,
        upgradeCtaLabel: upgradeDecision.ctaLabel ?? undefined,
        resetAt,
        used,
        limit,
        advancedAnalysisAvailable: plan === 'practitioner',
        pricingSessionState,
      },
    },
    {
      type: 'quota',
      plan,
      mode: plan,
      flowState: { step: 'quota_limit', completed: false },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

function getGuestSubjectKey(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || ''
  return createHash('sha1')
    .update(`${ua}::${ip}`)
    .digest('hex')
}

function normalizeLanguage(language: string | undefined | null): SupportedLanguage | null {
  if (!language || typeof language !== 'string') return null
  const value = language.slice(0, 2).toLowerCase()
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage) ? (value as SupportedLanguage) : null
}

function resolveRequestedLanguage(body: Record<string, unknown>, messages: ChatMessage[]) {
  const explicitLanguage = normalizeLanguage(
    typeof body.language === 'string'
      ? body.language.trim()
      : typeof body.chatLanguage === 'string'
        ? body.chatLanguage.trim()
        : undefined
  )

  if (explicitLanguage) return explicitLanguage

  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content
  const detected = lastUserMessage ? detectLanguageFromText(lastUserMessage) : null
  return detected ?? 'fr'
}

function detectLanguageFromText(text: string): SupportedLanguage | null {
  const samples: { lang: SupportedLanguage; terms: string[] }[] = [
    { lang: 'fr', terms: ['bonjour', 'salut'] },
    { lang: 'en', terms: ['hello', 'hi', 'thanks'] },
    { lang: 'es', terms: ['hola', 'gracias'] },
    { lang: 'pt', terms: ['olá', 'obrigado'] },
    { lang: 'de', terms: ['hallo', 'danke'] },
    { lang: 'it', terms: ['ciao', 'grazie'] },
  ]

  const lowered = (text || '').toLowerCase()
  const scores = samples.map((sample) => ({
    lang: sample.lang,
    score: sample.terms.reduce((s, term) => (lowered.includes(term) ? s + 1 : s), 0),
  }))

  const best = scores.reduce((max, current) => (current.score > max.score ? current : max), { lang: 'fr' as SupportedLanguage, score: 0 })
  return best.score === 0 ? null : best.lang
}

async function resolveEffectivePlan(_req: NextRequest): Promise<{ plan: PlanKey; userId: string | null }> {
  const temporaryPlan = getTemporaryAccessOverridePlan()
  if (temporaryPlan) {
    return { plan: temporaryPlan, userId: null }
  }

  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { plan: 'free', userId: null }

    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!adminUrl || !adminKey) return { plan: 'free', userId: user.id }

    const { profile } = await getOrCreateProfile({ id: user.id, email: user.email, full_name: null })
    const plan = downgradeIfInactive(mapDbPlanToPlanKey(profile.plan as DbPlan | undefined), profile.stripe_subscription_status ?? null)
    return { plan, userId: user.id }
  } catch (error) {
    logger.error('[api/chat] resolveEffectivePlan failed', { error })
    return { plan: 'free', userId: null }
  }
}

async function enforceDailyQuota(params: { req: NextRequest; userId: string | null; plan: PlanKey; feature: UsageFeature }) {
  const { req, userId, plan, feature } = params
  if (getTemporaryAccessOverridePlan()) {
    return {
      blocked: false as const,
      used: 0,
      limit: null,
      remaining: null,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  const limit = getPlanQuotaLimit(plan)
  if (limit === null) {
    return {
      blocked: false as const,
      used: 0,
      limit: null,
      remaining: null,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!adminUrl || !adminKey) {
    logger.warn('[api/chat] quota disabled: missing admin Supabase env')
    return {
      blocked: false as const,
      used: 0,
      limit,
      remaining: limit,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  // Singleton — une seule instance Supabase admin par warm instance Vercel.
  // Évite le setup de connexion (~30-50ms) à chaque appel enforceDailyQuota.
  const admin = getAdminClient()
  const subjectKey = userId ? `user:${userId}` : getGuestSubjectKey(req)
  const now = new Date()

  const key = createHash('sha1')
    .update(`${subjectKey}::${feature}::${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`)
    .digest('hex')

  const { data } = await admin
    .from('daily_usage')
    .select('*')
    .eq('usage_key', key)
    .maybeSingle()

  const used = data?.used ?? 0
  const blocked = used >= limit

  const remaining = blocked ? 0 : Math.max(0, limit - used)
  const resetAt = new Date()
  resetAt.setUTCDate(resetAt.getUTCDate() + 1)
  resetAt.setUTCHours(0, 0, 0, 0)

  return {
    blocked,
    used,
    limit,
    remaining,
    resetAt: resetAt.toISOString(),
    windowStartedAt: data?.window_started_at ?? null,
  }
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const log = (level: 'info' | 'debug' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => {
    logger[level](`[api/chat][${requestId}] ${msg}`, meta)
  }
  let failureStage = 'request_received'
  let failureContext: Record<string, unknown> = {}

  // ── Suivi de charge (LOAD MONITOR) ─────────────────────────────────────────
  // incrementLoad() AVANT tout await. decrementLoad() dans le bloc `finally`
  // ci-dessous — garanti même en cas d'exception ou de return anticipé.
  incrementLoad()
  recordRequest()

  // ── Drain opportuniste de la queue ─────────────────────────────────────────
  // after() exécute la callback APRÈS l'envoi de la réponse au client.
  // Chaque requête sync trigger ainsi le traitement d'un job en attente.
  // Garanti de ne jamais bloquer ou crasher la requête courante.
  after(() => processNextQueuedJob().catch(() => {}))

  log('info', 'POST hit', { load: getModeSnapshot() })

  try {
    failureStage = 'validate_env'
    const temporaryPlan = getTemporaryAccessOverridePlan()
    if (temporaryPlan) {
      log('warn', 'temporary access override enabled', { plan: temporaryPlan })
    } else {
      validateEnv(REQUIRED_ENV)
    }

    // ── Parallélisation (BLOC 5) ────────────────────────────────────────────
    // resolveEffectivePlan() lit les cookies Supabase — indépendant du body.
    // req.json() lit le body HTTP — indépendant des cookies.
    // En les lançant ensemble : on économise ~200-400ms (temps du round-trip DB auth)
    // pendant que le body est parsé.
    //
    // ⚠️  Si le body est invalide, on retourne 400 avant d'utiliser planPromise.
    //     La Promise continue en arrière-plan et se résout silencieusement (sans effet).
    failureStage = 'parse_body'
    const planPromise = resolveEffectivePlan(req)
    const body = await req.json().catch(() => null)
    log('debug', 'body parsed', { hasBody: Boolean(body) })

    if (!body || typeof body !== 'object') {
      log('warn', 'invalid body')
      const safeErrorResponse = buildSafeErrorResponse()
      log('info', 'response normalized', {
        branch: 'safe_error',
        ...getNormalizationDiagnostics(safeErrorResponse),
      })
      return NextResponse.json(safeErrorResponse, { status: 400 })
    }

    const requestType =
      (body as Record<string, unknown>).requestType === 'micro_profile' ||
      (body as Record<string, unknown>).requestType === 'micro_year' ||
      (body as Record<string, unknown>).requestType === 'micro_month'
        ? ((body as Record<string, unknown>).requestType as 'micro_profile' | 'micro_year' | 'micro_month')
        : 'chat'
    const isMicroReadingRequest = requestType !== 'chat'

    // ── Rate limiting IP ───────────────────────────────────────────────────
    // Les micro-lectures sont déclenchées automatiquement en rafale
    // (profil -> année -> mois). Elles ne doivent pas être bloquées par le
    // rate-limit de messages manuels, sinon l'onboarding s'arrête après la
    // première ou deuxième micro-lecture.
    if (!isMicroReadingRequest) {
      const ip = getRequestIp(req)
      const rl = checkChatRateLimit(ip)
      if (!rl.allowed) {
        log('warn', 'rate limit exceeded', { ip, used: rl.used, resetAt: rl.resetAt })
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessaie dans quelques instants.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(rl.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(rl.resetAt),
            },
          },
        )
      }
    }

    const sanitizedMessages = limitHistory(sanitizeMessages((body as Record<string, unknown>).messages))
    const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === 'user')?.content?.trim() ?? ''
    const normalizedLast = normalizeText(lastUserMessage)
    const requestedConversationId =
      typeof (body as Record<string, unknown>).conversationId === 'string'
        ? ((body as Record<string, unknown>).conversationId as string)
        : null
    const bodyRecord = body as Record<string, unknown>
    const requestedSelectedMenuKey = sanitizeFusionOnlySelectionKey(
      typeof bodyRecord.selectedMenuKey === 'string' ? (bodyRecord.selectedMenuKey as string) : null,
    )
    const requestedSelectedSubmenuKey = sanitizeFusionOnlySelectionKey(
      typeof bodyRecord.selectedSubmenuKey === 'string' ? (bodyRecord.selectedSubmenuKey as string) : null,
    )
    const VALID_INTENT_KEYS = ['understand_situation', 'make_decision', 'relationships', 'money_work', 'inner_state']
    const requestedUserIntentKey =
      typeof bodyRecord.userIntentKey === 'string' && VALID_INTENT_KEYS.includes(bodyRecord.userIntentKey as string)
        ? (bodyRecord.userIntentKey as string)
        : null

    // Intent-based routing is handled entirely inside runHexastraFlow via intentClassifier.
    // Do NOT override selectedMenuKey here — science_astrologie has domainRoute: 'timing'
    // which would corrupt all routing. The Railway call is forced directly in the flow.
    const effectiveSelectedMenuKey = requestedSelectedMenuKey

    failureContext = {
      requestType,
      conversationId: requestedConversationId,
      selectedMenuKey: requestedSelectedMenuKey,
      selectedSubmenuKey: requestedSelectedSubmenuKey,
      messagesCount: sanitizedMessages.length,
      lastUserMessagePreview: lastUserMessage.slice(0, 240),
    }

    log('info', 'request summary', {
      requestType,
      messagesCount: sanitizedMessages.length,
      lastUserMessage,
      normalizedLast,
    })

    // Récupère le résultat de la Promise lancée en parallèle avec req.json().
    // Si resolveEffectivePlan a déjà fini (corps long à parser), await est immédiat.
    const resolvedPlan = await planPromise
    const temporaryRequestPlan = getTemporaryRequestPlan(bodyRecord)
    const effectivePlan = temporaryRequestPlan ?? resolvedPlan.plan
    const userId = temporaryRequestPlan ? null : resolvedPlan.userId
    log('info', 'effective plan resolved', {
      effectivePlan,
      userId,
      debugPlan: temporaryRequestPlan,
    })

    // ── PROTECTION EXTRÊME (BLOC 7 — dernier recours) ─────────────────────
    // Atteint uniquement si isExtremeLoad() est vrai ET que la queue elle-même
    // est saturée (queuedJobs > seuil viral).
    // Dans ce cas, la queue ne peut pas absorber plus — on refuse poliment.
    if (isExtremeLoad()) {
      log('warn', 'system_extreme_overload', {
        ...getModeSnapshot(),
        userId: userId ?? null,
        plan: effectivePlan,
      })
      return NextResponse.json(
        {
          status: 'overloaded',
          type: 'queued',
          plan: effectivePlan,
          mode: effectivePlan,
          message: 'Forte demande exceptionnelle. Réessaie dans 30 secondes.',
          flowState: { step: 'queued', completed: false },
          menu: DEFAULT_EMPTY_MENU,
          metadata: { queued: false, retryAfterSeconds: 30 },
        },
        { status: 503, headers: { 'Retry-After': '30' } }
      )
    }

    // ── RATE LIMIT PAR PLAN (BLOC 2 étendu) ───────────────────────────────
    // Deuxième couche de protection post-auth :
    // applique un cooldown minimum entre deux requêtes consécutives du même utilisateur,
    // calibré selon le plan (free=10s, essential=5s, premium=3s, practitioner=2s).
    // La première couche (checkChatRateLimit sur IP) a déjà été vérifiée plus haut.
    if (!isMicroReadingRequest) {
      const ip = getRequestIp(req)
      const userRl = await _rateLimiter.check({ userId, ip, plan: effectivePlan })
      if (!userRl.allowed) {
        const retryAfterSec = Math.ceil(userRl.retryAfterMs / 1000)
        log('warn', 'user_rate_limit_exceeded', {
          reason: userRl.reason,
          plan: effectivePlan,
          userId: userId ?? null,
          retryAfterMs: userRl.retryAfterMs,
        })
        return NextResponse.json(
          { error: getRateLimitMessage(userRl.reason, effectivePlan) },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec),
              'X-RateLimit-Reason': userRl.reason ?? 'unknown',
            },
          }
        )
      }
    }

    // ── MODE VIRAL + STRATÉGIE D'EXÉCUTION ────────────────────────────────
    // Calcul du mode de trafic système (normal / high / critical / viral).
    // Basé sur : requêtes actives + jobs en queue + taux d'erreur/timeout récents.
    //
    // Décision de stratégie :
    //   sync         → traitement synchrone normal
    //   degraded-sync → synchrone avec tokens réduits
    //   queue         → job mis en attente, client reçoit jobId pour polling
    //
    // Les plans premium/praticien conservent toujours l'accès synchrone.
    // Les utilisateurs free sont mis en queue en mode viral.
    {
      const queuedJobs    = await memoryChatQueue.getQueueSize()
      const activeReqs    = getCurrentLoad()
      const trafficMode   = getSystemTrafficMode({ queuedJobs })
      const execStrategy  = decideChatExecutionStrategy({
        mode:           trafficMode,
        plan:           effectivePlan,
        activeRequests: activeReqs,
        queuedJobs,
      })

      log('info', 'traffic_mode_and_strategy', {
        trafficMode,
        execStrategy,
        activeRequests: activeReqs,
        queuedJobs,
        plan: effectivePlan,
      })

      if (execStrategy === 'queue') {
        const ip        = getRequestIp(req)
        const jobResult = await memoryChatQueue.enqueue({
          requestId,
          userId,
          plan:      effectivePlan,
          ip,
          priority:  getPlanPriority(effectivePlan),
          createdAt: Date.now(),
          body,
        })

        const lang = typeof (body as Record<string, unknown>).language === 'string'
          ? ((body as Record<string, unknown>).language as string)
          : 'fr'

        log('info', 'request_queued', {
          jobId:             jobResult.jobId,
          position:          jobResult.position,
          estimatedWaitSec:  jobResult.estimatedWaitSec,
          plan:              effectivePlan,
          trafficMode,
        })

        return NextResponse.json(
          {
            status:            'queued',
            type:              'queued',
            jobId:             jobResult.jobId,
            position:          jobResult.position,
            estimatedWaitSec:  jobResult.estimatedWaitSec,
            plan:              effectivePlan,
            mode:              effectivePlan,
            message:           buildQueuedMessage(effectivePlan, lang),
            flowState:         { step: 'queued', completed: false },
            menu:              DEFAULT_EMPTY_MENU,
            metadata: {
              queued:              true,
              trafficMode,
              retryAfterSeconds:   jobResult.estimatedWaitSec,
              statusUrl:           `/api/chat/status/${jobResult.jobId}`,
            },
          },
          { status: 202 }
        )
      }
      // degraded-sync : continuer normalement — costControl réduit les tokens dans runHexastraFlow
    }

    const responseDepth = getPlanResponseDepth(effectivePlan)
    const journeyEnabled =
      typeof (body as Record<string, unknown>).journeyEnabled === 'boolean'
        ? ((body as Record<string, unknown>).journeyEnabled as boolean)
        : false

    const normalizedBirthData = normalizeBirthData(bodyRecord.birthData)
    const normalizedPractitionerUsage = normalizePractitionerUsage(bodyRecord.practitionerUsage)
    const requestedAnalysisMode = normalizeFusionOnlyAnalysisMode(
      bodyRecord.analysisMode === 'science_by_science' || bodyRecord.analysisMode === 'hexastra_fusion'
        ? (bodyRecord.analysisMode as 'science_by_science' | 'hexastra_fusion')
        : null,
    )
    const requestedRenderMode =
      bodyRecord.renderMode === 'simple' || bodyRecord.renderMode === 'approfondie' || bodyRecord.renderMode === 'praticien'
        ? (bodyRecord.renderMode as 'simple' | 'approfondie' | 'praticien')
        : null
    const normalizedContextType = normalizeContextType(bodyRecord.contextType)
    const normalizedUiAction = normalizeUiAction(bodyRecord.uiAction)
    const requestedLanguage = resolveRequestedLanguage(bodyRecord, sanitizedMessages)
    const explicitGuidance = hasExplicitGuidance(bodyRecord)
    const requestedEvolutionProfile =
      bodyRecord.evolutionProfile && typeof bodyRecord.evolutionProfile === 'object'
        ? (bodyRecord.evolutionProfile as Record<string, unknown>)
        : null
    const requestedApiConversationId =
      typeof bodyRecord.conversationId === 'string'
        ? (bodyRecord.conversationId as string)
        : null
    const intentLocal = detectIntentLocal(
      lastUserMessage,
      sanitizedMessages,
      requestedSelectedMenuKey,
      requestedSelectedSubmenuKey
    )
    log('info', 'intent detected', { intentLocal })

    log('info', 'intent context', { userIntentKey: requestedUserIntentKey })

    const sharedFlowInput = {
      plan: effectivePlan,
      responseDepth,
      language: requestedLanguage,
      birthData: normalizedBirthData,
      practitionerUsage: normalizedPractitionerUsage,
      practitionerContext: normalizedPractitionerUsage,
      conversationId: requestedApiConversationId,
      messages: sanitizedMessages,
      evolutionProfile: requestedEvolutionProfile,
      journeyEnabled,
      analysisMode: requestedAnalysisMode,
      renderMode: requestedRenderMode,
      userIntentKey: requestedUserIntentKey,
    }

    failureStage = 'pre_quota_orchestration'
    const preQuotaEvaluation = evaluateOrchestration({
      normalized: buildNormalizedInput({
        requestType,
        selectedMenuKey: requestedSelectedMenuKey,
        selectedSubmenuKey: requestedSelectedSubmenuKey,
        userMessage: lastUserMessage,
        plan: effectivePlan,
        quotaState: 'ok',
        birthData: normalizedBirthData,
        language: requestedLanguage,
        memoryAvailable: Boolean(userId),
        uiAction: normalizedUiAction,
        contextType: normalizedContextType,
        practitionerUsage: normalizedPractitionerUsage,
        practitionerContext: normalizedPractitionerUsage,
        conversationId: requestedApiConversationId,
        hasExplicitGuidance: explicitGuidance,
        journeyEnabled,
        messages: sanitizedMessages,
        analysisMode: requestedAnalysisMode,
        renderMode: requestedRenderMode,
      }),
      legacyIntent: intentLocal,
    })
    const {
      menuContract,
      policy: preQuotaDecision,
      trace: preQuotaTrace,
    } = preQuotaEvaluation

    log('info', 'orchestration pre-quota', {
      branch: preQuotaDecision.branch,
      route: preQuotaDecision.effectiveRoute,
      reasons: preQuotaDecision.reasonCodes,
    })

    const cacheKey = buildCacheKey(userId, effectivePlan, lastUserMessage, normalizedBirthData)
    const cached = await getCache(cacheKey)
    if (cached) {
      const cachedResponse = buildConsistentResponse(withTrace(cached as ChatResponsePayload, preQuotaTrace), {
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        menu: DEFAULT_EMPTY_MENU,
      })
      log('info', 'cacheHit', {
        cacheKey,
        branch: 'cache',
        ...getNormalizationDiagnostics(cached as ChatResponsePayload),
      })
      return NextResponse.json(cachedResponse, { status: 200 })
    }

    const preQuotaHandler = ({
      out_of_scope: async () => {
        log('info', 'branch chosen', { branch: 'out_of_scope' })
        const outOfScopeResponse = withTrace(
          buildOutOfScopeResponse(effectivePlan, effectivePlan, requestedConversationId ?? null),
          preQuotaTrace
        )
        log('info', 'response normalized', {
          branch: 'out_of_scope',
          ...getNormalizationDiagnostics(outOfScopeResponse),
        })
        return NextResponse.json(outOfScopeResponse, { status: 200 })
      },
      greeting: async () => {
        log('info', 'branch chosen', { branch: 'greeting' })
        const greetingResponse = buildGreetingBranchResponse({
          plan: effectivePlan,
          birthData: normalizedBirthData,
          conversationId: requestedConversationId ?? null,
          trace: preQuotaTrace,
        })
        log('info', 'response normalized', {
          branch: 'greeting',
          ...getNormalizationDiagnostics(greetingResponse),
        })
        return NextResponse.json(greetingResponse, { status: 200 })
      },
      menu: async () => {
        log('info', 'branch chosen', { branch: 'menu' })
        const menuResponse = await runHexastraFlow({
          ...sharedFlowInput,
          requestType: 'chat',
          contextType: 'general',
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          uiAction: 'open_menu',
        })
        const normalizedMenuResponse = buildConsistentResponse(
          withTrace(menuResponse as ChatResponsePayload, preQuotaTrace),
          {
            type: 'menu',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            flowState: { step: 'menu', completed: true },
            menu: DEFAULT_EMPTY_MENU,
          }
        )
        await setCache(cacheKey, normalizedMenuResponse)
        log('info', 'response normalized', {
          branch: 'menu',
          ...getNormalizationDiagnostics(menuResponse as ChatResponsePayload),
        })
        const status = normalizedMenuResponse.flowState?.step === 'error' ? 500 : 200
        return NextResponse.json(normalizedMenuResponse, { status })
      },
      birth_update: async () => {
        log('info', 'branch chosen', { branch: 'birth_update' })
        const birthResponse = await runHexastraFlow({
          ...sharedFlowInput,
          requestType: 'chat',
          contextType: 'general',
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          uiAction: 'restart_flow',
        })
        const normalizedBirthResponse = buildConsistentResponse(
          withTrace(birthResponse as ChatResponsePayload, preQuotaTrace),
          {
            type: 'birth_update',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            flowState: { step: 'birthdata', completed: true },
            menu: DEFAULT_EMPTY_MENU,
          }
        )
        await setCache(cacheKey, normalizedBirthResponse)
        log('info', 'response normalized', {
          branch: 'birth_update',
          ...getNormalizationDiagnostics(birthResponse as ChatResponsePayload),
        })
        const status = normalizedBirthResponse.flowState?.step === 'error' ? 500 : 200
        return NextResponse.json(normalizedBirthResponse, { status })
      },
      clarification: async () => {
        log('info', 'branch chosen', { branch: 'clarification' })
        const clarificationResponse = await runHexastraFlow({
          ...sharedFlowInput,
          requestType,
          contextType: normalizedContextType,
          selectedMenuKey: effectiveSelectedMenuKey,
          selectedSubmenuKey: requestedSelectedSubmenuKey,
          uiAction: normalizedUiAction,
        })
        const normalizedClarificationResponse = buildConsistentResponse(
          withTrace(clarificationResponse as ChatResponsePayload, preQuotaTrace),
          {
            type: 'analysis',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            menu: DEFAULT_EMPTY_MENU,
          }
        )
        await setCache(cacheKey, normalizedClarificationResponse)
        log('info', 'response normalized', {
          branch: 'clarification',
          ...getNormalizationDiagnostics(clarificationResponse as ChatResponsePayload),
        })
        const status = normalizedClarificationResponse.flowState?.step === 'error' ? 500 : 200
        return NextResponse.json(normalizedClarificationResponse, { status })
      },
    } as const)[preQuotaDecision.branch]

    if (preQuotaHandler) {
      return await preQuotaHandler()
    }

    const quota = isMicroReadingRequest
      ? {
          blocked: false as const,
          used: 0,
          limit: null,
          remaining: null,
          resetAt: null,
          windowStartedAt: null,
        }
      : await enforceDailyQuota({
          req,
          userId,
          plan: effectivePlan,
          feature: 'chat_api',
        })

    log('debug', 'quota', quota as any)

    if (quota.blocked && quota.limit !== null) {
      log('warn', 'quota blocked before n8n delegation', { userId, plan: effectivePlan, used: quota.used })
      const quotaResponse = buildQuotaErrorResponse({
        plan: effectivePlan,
        used: quota.used,
        limit: quota.limit,
        resetAt: quota.resetAt,
        messages: sanitizedMessages,
      })
      log('info', 'response normalized', {
        branch: 'quota',
        ...getNormalizationDiagnostics(quotaResponse),
      })
      return NextResponse.json(quotaResponse, { status: 429 })
    }

    if (isN8nChatEnabled()) {
      failureStage = 'n8n_chat_webhook'
      log('info', 'branch chosen', { branch: 'n8n_chat_webhook' })

      try {
        const n8nResponse = await callN8nChatWebhook({
          source: 'hexastra-web',
          requestId,
          userId,
          plan: effectivePlan,
          responseDepth,
          readingPlan: buildReadingPlanContract(effectivePlan),
          requestType,
          conversationId: requestedApiConversationId,
          language: requestedLanguage,
          messages: sanitizedMessages,
          lastUserMessage,
          birthData: normalizedBirthData,
          partnerBirthData: normalizeBirthData(bodyRecord.partnerBirthData),
          practitionerUsage: normalizedPractitionerUsage,
          contextType: normalizedContextType,
          selectedMenuKey: requestedSelectedMenuKey,
          selectedSubmenuKey: requestedSelectedSubmenuKey,
          uiAction: normalizedUiAction,
          journeyEnabled,
          analysisMode: requestedAnalysisMode,
          renderMode: requestedRenderMode,
          userIntentKey: requestedUserIntentKey,
          evolutionProfile: requestedEvolutionProfile,
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            resetAt: quota.resetAt,
            windowStartedAt: quota.windowStartedAt,
          },
        })

        const normalizedN8nResponse = buildConsistentResponse(n8nResponse as ChatResponsePayload, {
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId: requestedConversationId ?? undefined,
          flowState: { step: 'conversation', completed: true },
          menu: DEFAULT_EMPTY_MENU,
        })

        const assistantReply =
          typeof normalizedN8nResponse.message === 'string'
            ? normalizedN8nResponse.message
            : typeof normalizedN8nResponse.reply === 'string'
              ? normalizedN8nResponse.reply
              : typeof normalizedN8nResponse.content === 'string'
                ? normalizedN8nResponse.content
                : ''

        const evolutionDecision = updateUserEvolutionProfile({
          userMessage: lastUserMessage,
          assistantResponse: assistantReply,
          currentProfile: (requestedEvolutionProfile as UserEvolutionProfile | null) ?? null,
        })

        log('info', 'response normalized', {
          branch: 'n8n_chat_webhook',
          ...getNormalizationDiagnostics(normalizedN8nResponse),
        })

        return NextResponse.json(
          {
            ...normalizedN8nResponse,
            plan: effectivePlan,
            mode: effectivePlan,
            updatedEvolutionProfile:
              normalizedN8nResponse.updatedEvolutionProfile ??
              (evolutionDecision.shouldUpdate
                ? evolutionDecision.nextProfile
                : (requestedEvolutionProfile ?? null)),
            metadata: {
              ...((normalizedN8nResponse.metadata as Record<string, unknown> | undefined) ?? {}),
              automation: 'n8n',
              quota: {
                used: quota.used,
                limit: quota.limit,
                remaining: quota.remaining,
                resetAt: quota.resetAt,
                windowStartedAt: quota.windowStartedAt,
              },
              responseDepth,
              journeyEnabled,
            },
          },
          { status: 200 }
        )
      } catch (error) {
        recordError()
        log('error', 'n8n chat webhook failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        captureError(error, {
          path: '/api/chat',
          requestId,
          extra: {
            stage: failureStage,
            n8nConfigured: true,
          },
        })

        const errorResponse = buildConsistentResponse(
          {
            message: "L'automatisation du chat n8n n'a pas répondu correctement. Vérifie le workflow n8n puis réessaie.",
            type: 'error',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? randomUUID(),
            flowState: { step: 'error', completed: false },
            menu: DEFAULT_EMPTY_MENU,
            metadata: {
              automation: 'n8n',
              shouldPersistMemory: false,
            },
          },
          {
            type: 'error',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            flowState: { step: 'error', completed: false },
            menu: DEFAULT_EMPTY_MENU,
          }
        )

        return NextResponse.json(errorResponse, { status: 502 })
      }
    }

    failureStage = 'post_quota_orchestration'
    const postQuotaEvaluation = evaluateOrchestration({
      normalized: buildNormalizedInput({
        requestType,
        selectedMenuKey: requestedSelectedMenuKey,
        selectedSubmenuKey: requestedSelectedSubmenuKey,
        userMessage: lastUserMessage,
        plan: effectivePlan,
        quotaState: getQuotaState({
          plan: effectivePlan,
          blocked: quota.blocked,
          remaining: quota.remaining,
        }),
        birthData: normalizedBirthData,
        language: requestedLanguage,
        memoryAvailable: Boolean(userId),
        uiAction: normalizedUiAction,
        contextType: normalizedContextType,
        practitionerUsage: normalizedPractitionerUsage,
        practitionerContext: normalizedPractitionerUsage,
        conversationId: requestedApiConversationId,
        hasExplicitGuidance: explicitGuidance,
        journeyEnabled,
        messages: sanitizedMessages,
        analysisMode: requestedAnalysisMode,
        renderMode: requestedRenderMode,
      }),
      legacyIntent: intentLocal,
      menuContract,
    })
    const {
      inference: postQuotaInference,
      policy: postQuotaDecision,
      execution: postQuotaExecution,
      trace: postQuotaTrace,
    } = postQuotaEvaluation

    log('info', 'orchestration post-quota', {
      branch: postQuotaDecision.branch,
      route: postQuotaDecision.effectiveRoute,
      reasons: postQuotaDecision.reasonCodes,
    })

    const postQuotaHandler = ({
      quota: async () => {
        if (quota.limit === null) return null
        log('warn', 'quota blocked', { userId, plan: effectivePlan, used: quota.used })
        const quotaResponse = withTrace(
          buildQuotaErrorResponse({
            plan: effectivePlan,
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
            messages: sanitizedMessages,
          }),
          postQuotaTrace
        )
        log('info', 'response normalized', {
          branch: 'quota',
          ...getNormalizationDiagnostics(quotaResponse),
        })
        return NextResponse.json(quotaResponse, { status: 429 })
      },
      conversation: async () => {
        log('info', 'branch chosen', { branch: 'conversation' })
        try {
          const content = await generateConversation(lastUserMessage || 'Bonjour.')
          const convResponse = buildConsistentResponse(
            withTrace(
              {
                content,
                type: 'conversation',
                plan: effectivePlan,
                mode: effectivePlan,
                conversationId: requestedConversationId ?? randomUUID(),
                flowState: { step: 'conversation', completed: true },
                menu: DEFAULT_EMPTY_MENU,
              },
              postQuotaTrace
            ),
            {
              type: 'conversation',
              plan: effectivePlan,
              mode: effectivePlan,
              conversationId: requestedConversationId ?? undefined,
              flowState: { step: 'conversation', completed: true },
              menu: DEFAULT_EMPTY_MENU,
            }
          )
          await setCache(cacheKey, convResponse)
          log('info', 'response normalized', {
            branch: 'conversation',
            ...getNormalizationDiagnostics({ content }),
          })
          return NextResponse.json(convResponse, { status: 200 })
        } catch (error) {
          log('warn', 'simple conversation failed, fallback local', { error: (error as Error)?.message })
          const payload = withTrace(
            {
              type: 'conversation',
              plan: effectivePlan,
              mode: effectivePlan,
              conversationId: requestedConversationId ?? randomUUID(),
              flowState: { step: 'conversation', completed: true },
              menu: DEFAULT_EMPTY_MENU,
            },
            postQuotaTrace
          )
          const convResponse = buildConsistentResponse(payload, {
            type: 'conversation',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            flowState: { step: 'conversation', completed: true },
            menu: DEFAULT_EMPTY_MENU,
          })
          log('info', 'response normalized', {
            branch: 'conversation_fallback',
            ...getNormalizationDiagnostics(payload),
          })
          return NextResponse.json(convResponse, { status: 200 })
        }
      },
      analysis: async () => {
        log('info', 'branch chosen', { branch: 'analysis', load: getModeSnapshot() })
        failureStage = 'analysis_run_flow'

        // ── Fallback intelligent (BLOC 5) ────────────────────────────────
        // runFlowWithFallback ajoute un timeout route-level (28s) en plus du
        // timeout global interne à runHexastraFlow (29s).
        // Si runHexastraFlow timeout ou lève une exception non catchée,
        // on retourne une réponse partielle exploitable plutôt qu'un 500.
        const { result: response, usedFallback } = await runFlowWithFallback({
          flowInput: {
            ...sharedFlowInput,
            requestType,
            contextType: normalizedContextType,
            selectedMenuKey: effectiveSelectedMenuKey,
            selectedSubmenuKey: requestedSelectedSubmenuKey,
            uiAction: normalizedUiAction,
          },
          plan: effectivePlan,
          conversationId: requestedConversationId,
          userMessage: lastUserMessage,
          lang: requestedLanguage ?? 'fr',
          logFn: log,
        })

        // Si le fallback a été utilisé, retourner directement (pas d'enrichissement)
        if (usedFallback) {
          log('warn', 'analysis_fallback_used', {
            plan: effectivePlan,
            load: getModeSnapshot(),
          })
          return NextResponse.json(
            buildConsistentResponse(
              withTrace(response as ChatResponsePayload, postQuotaTrace),
              { type: 'analysis', plan: effectivePlan, mode: effectivePlan,
                conversationId: requestedConversationId ?? undefined, menu: DEFAULT_EMPTY_MENU }
            ),
            { status: 200 }
          )
        }

        const analysisResponse = await applyAnalysisResponsePolicy({
          response: response as ChatResponsePayload,
          plan: effectivePlan,
          execution: postQuotaExecution,
          explicitGuidance,
        })

        const finalResponse = buildConsistentResponse(
          withTrace(analysisResponse, postQuotaTrace),
          {
            type: 'analysis',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            menu: DEFAULT_EMPTY_MENU,
          }
        )

        await setCache(cacheKey, finalResponse)

        const enriched = enrichReadingResponse({
          response: finalResponse as any,
          plan: effectivePlan,
          birthDate: (finalResponse as any)?.birthData?.date ?? (body as any)?.birthData?.date,
          solarSign: (finalResponse as any)?.birthData?.solarSign ?? (body as any)?.birthData?.solarSign,
          contextType: finalResponse?.metadata?.contextType ?? (body as any)?.contextType,
          domainRoute: (finalResponse as any)?.domainRoute ?? (body as any)?.domainRoute,
          selectedMenuKey:
            (finalResponse?.metadata as any)?.selectedMenuKey ??
            (body as any)?.selectedMenuKey ??
            null,
          selectedSubmenuKey:
            (finalResponse?.metadata as any)?.selectedSubmenuKey ??
            (body as any)?.selectedSubmenuKey ??
            null,
          explicitGuidance,
        })

        const normalizedEnriched = buildConsistentResponse(enriched as ChatResponsePayload, {
          type:
            typeof finalResponse.type === 'string'
              ? finalResponse.type
              : 'analysis',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId: requestedConversationId ?? undefined,
          menu: DEFAULT_EMPTY_MENU,
        })

        log('info', 'response normalized', {
          branch: 'analysis',
          ...getNormalizationDiagnostics(enriched as ChatResponsePayload),
        })
        log('info', 'return final payload', {
          step: enriched?.flowState?.step ?? finalResponse?.flowState?.step,
          menuVisible: enriched?.menu?.visible ?? finalResponse?.menu?.visible,
          intentDetected: postQuotaInference.explicitIntent,
        })
        // ── Evolution memory — pure sync, zero latency ──────────────────
        const assistantReply =
          typeof (normalizedEnriched as Record<string, unknown>).message === 'string'
            ? ((normalizedEnriched as Record<string, unknown>).message as string)
            : typeof (normalizedEnriched as Record<string, unknown>).reply === 'string'
              ? ((normalizedEnriched as Record<string, unknown>).reply as string)
              : typeof (normalizedEnriched as Record<string, unknown>).content === 'string'
                ? ((normalizedEnriched as Record<string, unknown>).content as string)
                : ''

        const evolutionDecision = updateUserEvolutionProfile({
          userMessage: lastUserMessage,
          assistantResponse: assistantReply,
          currentProfile: (requestedEvolutionProfile as UserEvolutionProfile | null) ?? null,
        })

        const finalStatus = normalizedEnriched.flowState?.step === 'error' ? 500 : 200
        return NextResponse.json(
          {
            ...normalizedEnriched,
            plan: effectivePlan,
            mode: effectivePlan,
            // Retourné au client → sauvegardé en localStorage par ChatPageClient
            updatedEvolutionProfile: evolutionDecision.shouldUpdate
              ? evolutionDecision.nextProfile
              : (requestedEvolutionProfile ?? null),
            metadata: {
              ...(((normalizedEnriched as ChatResponsePayload)?.metadata as Record<string, unknown> | undefined) ??
                ((finalResponse as ChatResponsePayload)?.metadata as Record<string, unknown> | undefined) ??
                {}),
              quota: {
                used: quota.used,
                limit: quota.limit,
                remaining: quota.remaining,
                resetAt: quota.resetAt,
                windowStartedAt: quota.windowStartedAt,
              },
              responseDepth,
              journeyEnabled,
              intentDetected: postQuotaInference.explicitIntent,
            },
          },
          { status: finalStatus }
        )
      },
    // When the user has selected a sidebar intent, any 'conversation' branch
    // must be upgraded to 'analysis' so runHexastraFlow is called with the
    // full KS context and the user's energetic profile.
    } as const)[
      requestedUserIntentKey && postQuotaDecision.branch === 'conversation'
        ? 'analysis'
        : postQuotaDecision.branch
    ]

    if (postQuotaHandler) {
      const postQuotaResponse = await postQuotaHandler()
      if (postQuotaResponse) return postQuotaResponse
    }
  } catch (error) {
    const serializedError = serializeUnknownError(error)
    log('error', 'fatal error', {
      stage: failureStage,
      ...failureContext,
      errorName: serializedError.name ?? null,
      errorMessage: serializedError.message,
      errorStack: serializedError.stack ?? null,
    })
    captureError(error, {
      path: '/api/chat',
      requestId,
      extra: {
        stage: failureStage,
        ...failureContext,
      },
    })
    const safeErrorResponse = buildSafeErrorResponse()
    log('info', 'response normalized', {
      branch: 'safe_error',
      ...getNormalizationDiagnostics(safeErrorResponse),
    })
    return NextResponse.json(safeErrorResponse, { status: 500 })
  } finally {
    // ── Décrément de la charge ────────────────────────────────────────────
    // Garanti quelle que soit la sortie : return normal, throw, timeout.
    decrementLoad()
  }
}

function normalizeContextType(value: unknown): ContextType {
  return typeof value === 'string' ? (value as ContextType) : 'general'
}

function normalizeUiAction(value: unknown): UiAction {
  return typeof value === 'string' ? (value as UiAction) : 'send_message'
}

function normalizePractitionerUsage(value: unknown): PractitionerUsageHex {
  if (value === 'self' || value === 'client' || value === 'duo') return value
  if (value === 'personal') return 'self'
  return null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((m): m is { role?: unknown; content?: unknown } => Boolean(m && typeof m === 'object'))
    .map(
      (m): ChatMessage => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.trim() : '',
      })
    )
    .filter((m) => m.content.length > 0)
    .slice(-30)
}

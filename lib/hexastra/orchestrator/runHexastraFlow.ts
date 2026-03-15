import { randomUUID } from 'crypto'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import { buildUserContext } from '@/lib/hexastra/context/buildUserContext'
import { buildSessionContext } from '@/lib/hexastra/context/buildSessionContext'
import { buildChatPayload } from '@/lib/hexastra/payload/buildChatPayload'
import { compressKnowledgeContext } from '@/lib/contextCompressor'
import { getAdaptiveRetrievalConfig } from '@/lib/retrievalPolicy'
import { getMenuForMode, findMenuItem } from '@/lib/hexastra/menus/getMenuForMode'
import {
  persistConversationMessage,
  writeSessionState,
} from '@/lib/hexastra/memory/sessionMemory'
import { writeUserMemory } from '@/lib/hexastra/memory/userMemory'
import { multiLayerRetrieval } from '@/lib/hexastra/retrieval/multiLayerRetrieval'

import type {
  BirthProfile,
  ContextType,
  DomainRoute,
  FlowStep,
  HexastraApiResponse,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import { getModulesForDomain } from '@/lib/hexastra/router/moduleRouter'
import { buildSignalEnvelope } from '@/lib/hexastra/fusion/signalEnvelope'
import { fusionEngine } from '@/lib/hexastra/fusion/fusionEngine'
import { arbiter } from '@/lib/hexastra/fusion/arbiter'
import { applySentinel } from '@/lib/hexastra/security/sentinel'
import { computeFlowStep } from '@/lib/hexastra/session/sessionBrain'
import { buildRetrievalPlan } from '@/lib/hexastra/vector/retrievalPlanner'
import { logger } from '@/lib/utils/logger'

const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID || ''
const API_URL = (
  process.env.HEXASTRA_API_URL || 'https://hexastra-api-production.up.railway.app'
).replace(/\/$/, '')
const API_KEY = process.env.HEXASTRA_API_KEY || ''

type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'

type SpecializedModuleResult = {
  source: 'gps_kua' | 'neurokua' | 'fusion'
  publicSummary: string
  raw: Record<string, unknown> | null
}

function normalizePlan(plan: unknown): PlanKey {
  return plan === 'essential' || plan === 'premium' || plan === 'practitioner'
    ? plan
    : 'free'
}

function isBirthComplete(birth: BirthProfile | null): boolean {
  return Boolean(birth?.firstName && birth?.date && birth?.place)
}

function buildMissingBirthMessage(language: string): string {
  return language.startsWith('en')
    ? 'To personalize the reading, I need your first name, birth date, birth time (or unknown), and birth city + country.'
    : 'Pour personnaliser la lecture, j’ai besoin de ton prénom, de ta date de naissance, de ton heure de naissance (ou inconnue), et de ta ville + pays de naissance.'
}

function buildPractitionerUsageMessage(language: string): string {
  return language.startsWith('en')
    ? 'Is this analysis for 1 — yourself or 2 — a client?'
    : 'Cette analyse est-elle pour : 1 — un usage personnel 2 — un client(e) ?'
}

function buildGreetingMessage(mode: ReturnType<typeof getModeForPlan>, language: string): string {
  const items = getMenuForMode(mode).slice(0, 6)

  const intro = language.startsWith('en')
    ? 'Hello, I’m HexAstra. I can help you clarify a situation, explore a life theme, or start a personalized reading.'
    : 'Bonjour, je suis HexAstra. Je peux t’aider à clarifier une situation, explorer un thème de vie, ou lancer une lecture personnalisée.'

  const invite = language.startsWith('en')
    ? 'Choose the angle you want to explore:'
    : 'Choisis l’angle que tu veux explorer :'

  const lines = items.map((item, index) => `${index + 1} — ${item.label} : ${item.description}`)

  return [intro, '', invite, '', ...lines].join('\n')
}

function yearKey(date = new Date()): string {
  return String(date.getFullYear())
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function shouldGenerateMicroProfile(
  lastAt?: string | null,
  birthData?: BirthProfile | null
): boolean {
  return Boolean(birthData?.date) && !lastAt
}

function shouldGenerateYearReading(lastAt?: string | null): boolean {
  if (!lastAt) return true
  return !lastAt.startsWith(yearKey())
}

function shouldGenerateMonthReading(lastAt?: string | null): boolean {
  if (!lastAt) return true
  return !lastAt.startsWith(monthKey())
}

function detectLanguageFromMessages(messages: ChatMessage[], fallback = 'fr'): string {
  const text = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')
    .toLowerCase()

  if (!text.trim()) return fallback
  if (/\b(hello|hi|hey|please|thanks|thank you)\b/i.test(text)) return 'en'
  return 'fr'
}

async function callOpenAI(payload: unknown): Promise<string> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return "OPENAI_API_KEY manquante. Configure la variable d’environnement pour activer HexAstra."
    }

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok || !json) {
      logger.error('[callOpenAI] OpenAI error', { status: res.status, json })
      return 'Je n’ai pas pu terminer la lecture pour le moment.'
    }

    const output = Array.isArray((json as any).output) ? (json as any).output : []
    const text = output
      .flatMap((block: any) => (Array.isArray(block?.content) ? block.content : []))
      .filter((item: any) => item?.type === 'output_text' && typeof item.text === 'string')
      .map((item: any) => item.text)
      .join('')
      .trim()

    return text || 'Je n’ai pas pu finaliser la lecture pour le moment.'
  } catch (error) {
    logger.error('[callOpenAI] failed', { error })
    return 'Le moteur HexAstra est temporairement indisponible.'
  }
}

function buildSpecializedContext(result: SpecializedModuleResult | null): string {
  if (!result) return ''

  return [
    `[RÉSULTAT MÉTIER PRIORITAIRE — À UTILISER COMME SOURCE DE VÉRITÉ]`,
    `Source: ${result.source}`,
    `Résumé public attendu: ${result.publicSummary}`,
    `Données structurées: ${JSON.stringify(result.raw ?? {})}`,
    `Règle: reformule ce résultat dans le style HexAstra sans dire que tu n'as pas trouvé dans les documents.`,
  ].join('\n')
}

function buildKnowledgeQuery({
  latestUserMessage,
  selectedMenuLabel,
  selectedSubmenuLabel,
  contextType,
  domainRoute,
  querySuffix,
}: {
  latestUserMessage: string
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  contextType?: ContextType
  domainRoute?: DomainRoute
  querySuffix?: string
}): string {
  const parts = [latestUserMessage.trim()]

  if (selectedMenuLabel) parts.push(`menu principal: ${selectedMenuLabel}`)
  if (selectedSubmenuLabel) parts.push(`sous-menu: ${selectedSubmenuLabel}`)
  if (contextType) parts.push(`contexte: ${contextType}`)
  if (domainRoute) parts.push(`domaine KS prioritaire: ${domainRoute}`)
  if (querySuffix) parts.push(querySuffix)

  parts.push(
    'Appliquer les règles HexAstra, les garde-fous, la mémoire, le timing, le potentiel dominant, et la logique KS.FUSION.V13 si pertinent.'
  )

  return parts.filter(Boolean).join('\n')
}

async function buildKnowledgeBlock({
  latestUserMessage,
  plan,
  selectedMenuLabel,
  selectedSubmenuLabel,
  contextType,
  domainRoute,
  flowStep,
  specializedSource,
}: {
  latestUserMessage: string
  plan: PlanKey
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  contextType?: ContextType
  domainRoute?: DomainRoute
  flowStep: FlowStep
  specializedSource?: string | null
}): Promise<{ block: string | null; profile: string }> {
  const openaiKey = process.env.OPENAI_API_KEY

  if (!VECTOR_STORE_ID || !openaiKey || !latestUserMessage.trim()) {
    logger.warn('[runHexastraFlow] retrieval disabled', {
      hasVectorStoreId: Boolean(VECTOR_STORE_ID),
      hasOpenAIKey: Boolean(openaiKey),
      hasQuery: Boolean(latestUserMessage.trim()),
    })
    return { block: null, profile: 'disabled' }
  }

  const retrievalPlan = buildRetrievalPlan({
    plan,
    flowStep,
    domainRoute: domainRoute ?? 'general',
    specializedSource,
  })

  if (!retrievalPlan.includeKnowledge) {
    return { block: null, profile: retrievalPlan.profile }
  }

  const query = buildKnowledgeQuery({
    latestUserMessage,
    selectedMenuLabel,
    selectedSubmenuLabel,
    contextType,
    domainRoute,
    querySuffix: retrievalPlan.querySuffix,
  })

  const knowledgeResults = await multiLayerRetrieval({
    query,
    plan,
    vectorStoreId: VECTOR_STORE_ID,
    apiKey: openaiKey,
    domainRoute,
  })

  if (!knowledgeResults.length) {
    logger.info('[runHexastraFlow] retrieval returned 0 docs', {
      query,
      plan,
      domainRoute,
    })
    return { block: null, profile: retrievalPlan.profile }
  }

  const config = getAdaptiveRetrievalConfig({ plan, domainRoute, query })

  const compressed = compressKnowledgeContext(
    knowledgeResults.slice(0, retrievalPlan.topK),
    {
      ...config,
      maxDocsAfterDedup: Math.min(config.maxDocsAfterDedup, retrievalPlan.topK),
      maxContextChars:
        retrievalPlan.profile === 'minimal'
          ? Math.min(config.maxContextChars, 4500)
          : retrievalPlan.profile === 'balanced'
            ? Math.min(config.maxContextChars, 9000)
            : Math.min(config.maxContextChars, 15000),
    }
  )

  if (!compressed.block) {
    return { block: null, profile: retrievalPlan.profile }
  }

  return {
    profile: retrievalPlan.profile,
    block: [
      compressed.block,
      '',
      `[MÉTHODE] Les ressources ci-dessus sont déjà filtrées et priorisées selon le step ${flowStep}. Si un résultat métier structuré existe, il prime sur ces ressources.`,
    ].join('\n'),
  }
}

async function callRailway(path: string, payload: Record<string, unknown>) {
  const url = `${API_URL}${path}`

  console.log('[HexAstra][Railway] URL =', url)
  console.log('[HexAstra][Railway] API key present =', Boolean(API_KEY))
  console.log('[HexAstra][Railway] Payload keys =', Object.keys(payload))

  let res: Response

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    })
  } catch (error) {
    logger.error('[HexAstra][Railway] network/fetch error', { error })
    throw new Error(`Railway fetch failed for ${path}`)
  }

  const text = await res.text().catch(() => '')

  console.log('[HexAstra][Railway] status =', res.status)
  console.log('[HexAstra][Railway] body =', text)

  if (!res.ok) {
    throw new Error(`Railway ${path} failed: ${res.status} ${text}`)
  }

  try {
    return text ? JSON.parse(text) : {}
  } catch (error) {
    logger.error('[HexAstra][Railway] invalid JSON', { error })
    throw new Error(`Railway ${path} returned invalid JSON`)
  }
}

async function runSpecializedModule({
  domainRoute,
  birthData,
  practitionerUsage,
  messages,
}: {
  domainRoute: DomainRoute
  birthData: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
  messages: ChatMessage[]
}): Promise<SpecializedModuleResult | null> {
  const latestUserMessage =
    messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''

  if (
    (domainRoute === 'gps_kua' || domainRoute === 'neurokua') &&
    birthData?.date &&
    birthData?.place
  ) {
    try {
      const kua = await callRailway('/kua', {
        birth_date: birthData.date,
        birth_time: birthData.time || 'unknown',
        birth_city: birthData.place,
        birth_country: birthData.country,
        first_name: birthData.firstName,
        question: latestUserMessage,
        practitioner_usage: practitionerUsage,
      })

      const summary =
        typeof kua?.publicSummary === 'string'
          ? kua.publicSummary
          : typeof kua?.summary === 'string'
            ? kua.summary
            : `Utilise le calcul Kua/GPS fourni pour éclairer l'orientation, l'équilibre et la direction prioritaire.`

      return {
        source: domainRoute === 'gps_kua' ? 'gps_kua' : 'neurokua',
        publicSummary: summary,
        raw: kua && typeof kua === 'object' ? (kua as Record<string, unknown>) : null,
      }
    } catch (error) {
      logger.error('[runSpecializedModule:/kua] failed', {
        apiUrl: API_URL,
        hasApiKey: Boolean(API_KEY),
        error,
        birthData,
        latestUserMessage,
      })
    }
  }

  if (domainRoute === 'fusion' && birthData?.date && birthData?.place) {
    try {
      const fusion = await callRailway('/chart/fusion', {
        first_name: birthData.firstName,
        birth_date: birthData.date,
        birth_time: birthData.time || 'unknown',
        birth_city: birthData.place,
        birth_country: birthData.country,
        question: latestUserMessage,
        practitioner_usage: practitionerUsage,
      })

      const summary =
        typeof fusion?.publicSummary === 'string'
          ? fusion.publicSummary
          : typeof fusion?.summary === 'string'
            ? fusion.summary
            : `Utilise la synthèse fusionnée fournie comme signal dominant de la réponse finale.`

      return {
        source: 'fusion',
        publicSummary: summary,
        raw:
          fusion && typeof fusion === 'object' ? (fusion as Record<string, unknown>) : null,
      }
    } catch (error) {
      logger.error('[runSpecializedModule:/chart/fusion] failed', {
        apiUrl: API_URL,
        hasApiKey: Boolean(API_KEY),
        error,
        birthData,
        latestUserMessage,
      })
    }
  }

  return null
}

function resolveDomainRoute(input: {
  latestUserMessage: string
  selectedMenuDomainRoute?: DomainRoute | null
  sessionDomainRoute?: DomainRoute | null
  contextType?: ContextType
}): DomainRoute {
  if (input.selectedMenuDomainRoute) return input.selectedMenuDomainRoute
  if (input.sessionDomainRoute) return input.sessionDomainRoute

  const classified = classifyQuery(input.latestUserMessage)
  if (classified) return classified

  switch (input.contextType) {
    case 'energy':
      return 'neurokua'
    case 'decision':
      return 'decision'
    case 'relationship':
      return 'relationship'
    case 'career':
      return 'career'
    case 'hexastraReading':
      return 'fusion'
    default:
      return 'general'
  }
}

function buildFusionInstruction(input: {
  resolvedDomainRoute: DomainRoute
  activeModules: string[]
  fusedSignal: any
  arbitration: string | null
}): string {
  const lines = [
    `[ORCHESTRATION KS PRIORITAIRE]`,
    `Domaine résolu: ${input.resolvedDomainRoute}`,
    `Modules actifs: ${input.activeModules.join(', ') || 'aucun'}`,
  ]

  if (input.fusedSignal) {
    lines.push(`Signal dominant: ${input.fusedSignal.dominantSignal ?? 'non défini'}`)
    lines.push(`Phase dominante: ${input.fusedSignal.phase ?? 'non définie'}`)
    lines.push(`Zone dominante: ${input.fusedSignal.zone ?? 'non définie'}`)
  }

  if (input.arbitration) {
    lines.push(`Arbitrage: ${input.arbitration}`)
  }

  lines.push(
    `Règle: si un résultat métier structuré existe, il prime sur le retrieval documentaire.`,
    `Règle: les documents servent à gouverner, enrichir et stabiliser la réponse.`,
    `Règle: ne jamais dire "je n'ai pas trouvé dans les documents" si une logique métier spécialisée est disponible.`
  )

  return lines.join('\n')
}

function buildMenuOnlyMessage(
  mode: ReturnType<typeof getModeForPlan>,
  language: string
): string {
  const items = getMenuForMode(mode)
  const intro = language.startsWith('en')
    ? 'Choose the angle you want to explore:'
    : 'Choisis l’angle que tu veux explorer :'

  const lines = items
    .slice(0, 9)
    .map((item, index) => `${index + 1} — ${item.label} : ${item.description}`)

  return [intro, '', ...lines].join('\n')
}

function isReadingRequest(args: {
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  contextType?: ContextType
  latestUserMessage: string
}): boolean {
  const msg = args.latestUserMessage.toLowerCase()

  if (
    args.requestType === 'micro_profile' ||
    args.requestType === 'micro_year' ||
    args.requestType === 'micro_month'
  ) {
    return true
  }

  if (args.contextType === 'hexastraReading') return true
  if (args.selectedMenuKey || args.selectedSubmenuKey) return true

  return /lecture|profil|analyse|scan|cycle|année|mois|portrait|lecture générale|lecture complete|lecture complète/i.test(
    msg
  )
}

export async function runHexastraFlow(input: {
  plan?: PlanKey
  responseDepth?: ResponseDepth
  language?: string
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  birthData: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
  conversationId?: string | null
  messages: ChatMessage[]
  evolutionProfile?: Record<string, unknown> | null
}): Promise<HexastraApiResponse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.error('[runHexastraFlow] Supabase public env missing')
    throw new Error('Supabase env missing')
  }

  if (!API_KEY || !API_URL) {
    logger.error('[runHexastraFlow] HEXASTRA_API env missing')
    throw new Error('HEXASTRA API env missing')
  }

  const conversationId = input.conversationId ?? randomUUID()
  const fallbackLanguage = input.language ?? detectLanguageFromMessages(input.messages, 'fr')
  const fallbackPlan = normalizePlan(input.plan)
  const latestUserMessage =
    input.messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
  const isGreeting = /^(bonjour|salut|hello|hey|bonsoir|coucou|yo)\s*$/i.test(
    latestUserMessage.trim()
  )

  try {
    let supabase: any = null
    let user: any = null

    try {
      supabase = await createSupabaseServer()
      const authResult = supabase?.auth ? await supabase.auth.getUser() : null
      user = authResult?.data?.user ?? null
    } catch (authError) {
      logger.error('[runHexastraFlow] supabase/auth unavailable', { error: authError })
    }

    let userContext: any = null
    try {
      userContext = await buildUserContext({
        supabase,
        user,
        fallbackPlan,
        fallbackLanguage,
        birthData: input.birthData,
        practitionerUsage: input.practitionerUsage,
      })
    } catch (userContextError) {
      logger.error('[runHexastraFlow] buildUserContext failed', { error: userContextError })

      userContext = {
        plan: fallbackPlan,
        language: fallbackLanguage,
        birthData: input.birthData,
        practitionerUsage: input.practitionerUsage,
        memory: null,
      }
    }

    const plan = normalizePlan(userContext.plan)
    const mode = getModeForPlan(plan)

    if (isGreeting && !input.selectedMenuKey && !input.selectedSubmenuKey) {
      const message = buildGreetingMessage(mode, userContext.language ?? fallbackLanguage)

      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'menu', completed: true },
        menu: { visible: true, items: getMenuForMode(mode) },
        suggestions: getMenuForMode(mode)
          .slice(0, 4)
          .map((item) => item.label),
        metadata: {
          contextType: input.contextType ?? 'general',
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          sessionStep: 'menu',
          emotionalState: null,
          timing: null,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    let sessionContext: any = null
    try {
      sessionContext = await buildSessionContext({
        supabase,
        conversationId,
        message: latestUserMessage,
        contextType: input.contextType,
        selectedMenuKey: input.selectedMenuKey,
        selectedSubmenuKey: input.selectedSubmenuKey,
        practitioner: mode === 'praticien',
      })
    } catch (sessionError) {
      logger.error('[runHexastraFlow] buildSessionContext failed', { error: sessionError })

      sessionContext = {
        contextType: input.contextType ?? 'general',
        domainRoute: null,
        selectedMenuKey: input.selectedMenuKey ?? null,
        selectedSubmenuKey: input.selectedSubmenuKey ?? null,
        emotionalState: null,
        timing: null,
        precision: null,
        readingLevel: null,
        lifePhase: null,
        dominantPotential: null,
        activeModule: null,
        currentTheme: null,
        state: null,
      }
    }

    const practitionerNeedsUsage =
      plan === 'practitioner' &&
      !userContext.practitionerUsage &&
      input.requestType === 'chat'

    if (practitionerNeedsUsage) {
      const message = buildPractitionerUsageMessage(userContext.language ?? fallbackLanguage)

      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'practitioner_usage', completed: false },
        metadata: {
          practitionerUsage: null,
          contextType: sessionContext.contextType,
          shouldPersistMemory: false,
        },
      }
    }

    if (!isBirthComplete(userContext.birthData) && input.requestType === 'chat') {
      const message = buildMissingBirthMessage(userContext.language ?? fallbackLanguage)

      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'birthdata', completed: false },
        metadata: {
          practitionerUsage: userContext.practitionerUsage,
          contextType: sessionContext.contextType,
          shouldPersistMemory: false,
        },
      }
    }

    const userMemory = userContext.memory
    const profileDue = shouldGenerateMicroProfile(
      userMemory?.last_profile_reading_at,
      userContext.birthData
    )
    const yearDue = shouldGenerateYearReading(userMemory?.last_year_reading_at)
    const monthDue = shouldGenerateMonthReading(userMemory?.last_month_reading_at)

    let effectiveRequestType = input.requestType

    if (input.requestType === 'chat') {
      if (profileDue) effectiveRequestType = 'micro_profile'
      else if (yearDue) effectiveRequestType = 'micro_year'
      else if (monthDue) effectiveRequestType = 'micro_month'
    }

    const selectedMenu = findMenuItem(
      mode,
      input.selectedSubmenuKey ?? input.selectedMenuKey ?? null
    )

    const initialResolvedDomainRoute = resolveDomainRoute({
      latestUserMessage,
      selectedMenuDomainRoute: selectedMenu?.domainRoute ?? null,
      sessionDomainRoute: sessionContext.domainRoute,
      contextType: selectedMenu?.contextType ?? sessionContext.contextType,
    })

    const readingRequest = isReadingRequest({
      requestType: effectiveRequestType,
      selectedMenuKey: input.selectedMenuKey,
      selectedSubmenuKey: input.selectedSubmenuKey,
      contextType: selectedMenu?.contextType ?? sessionContext.contextType,
      latestUserMessage,
    })

    const resolvedDomainRoute: DomainRoute = readingRequest
      ? 'fusion'
      : initialResolvedDomainRoute

    const activeModules = getModulesForDomain(resolvedDomainRoute)
    const hasBirthData = isBirthComplete(userContext.birthData)
    const hasShownMicroReadings = Boolean(sessionContext.state?.has_shown_micro_readings)

    const flowStep = computeFlowStep({
      requestType: effectiveRequestType,
      uiAction: input.uiAction,
      latestUserMessage,
      hasBirthData,
      hasShownMicroReadings,
      practitionerNeedsUsage,
      selectedMenuKey: input.selectedMenuKey ?? sessionContext.selectedMenuKey,
      selectedSubmenuKey: input.selectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
      emotionalState: sessionContext.emotionalState,
      timing: sessionContext.timing,
      precision: sessionContext.precision,
    })

    if (
      (flowStep === 'menu' &&
        !latestUserMessage.trim() &&
        !input.selectedMenuKey &&
        !input.selectedSubmenuKey)
    ) {
      const message = buildMenuOnlyMessage(mode, userContext.language ?? fallbackLanguage)

      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'menu', completed: true },
        menu: { visible: true, items: getMenuForMode(mode) },
        suggestions: getMenuForMode(mode)
          .slice(0, 4)
          .map((item) => item.label),
        metadata: {
          contextType: sessionContext.contextType,
          practitionerUsage: userContext.practitionerUsage,
          shouldPersistMemory: false,
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          sessionStep: 'menu',
          emotionalState: sessionContext.emotionalState,
          timing: sessionContext.timing,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    const shouldRunSpecialized =
      readingRequest && Boolean(userContext.birthData?.date && userContext.birthData?.place)

    const specializedResult = shouldRunSpecialized
      ? await runSpecializedModule({
          domainRoute: resolvedDomainRoute,
          birthData: userContext.birthData,
          practitionerUsage: userContext.practitionerUsage,
          messages: input.messages,
        })
      : null

    if (readingRequest && !specializedResult) {
      const message = userContext.language?.startsWith('en')
        ? 'The HexAstra calculation service is temporarily unavailable. Please try again in a few moments.'
        : 'Le service de calcul HexAstra est temporairement indisponible. Réessaie dans quelques instants.'

      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: flowStep, completed: false },
        metadata: {
          contextType: selectedMenu?.contextType ?? sessionContext.contextType,
          practitionerUsage: userContext.practitionerUsage,
          shouldPersistMemory: false,
          selectedMenuKey: input.selectedMenuKey ?? sessionContext.selectedMenuKey,
          selectedSubmenuKey: input.selectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
          sessionStep: flowStep,
          emotionalState: sessionContext.emotionalState,
          timing: sessionContext.timing,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    const selectedMenuLabel = input.selectedMenuKey
      ? findMenuItem(mode, input.selectedMenuKey)?.label ?? null
      : null

    const selectedSubmenuLabel = input.selectedSubmenuKey
      ? findMenuItem(mode, input.selectedSubmenuKey)?.label ?? null
      : null

    const knowledgePayload =
      effectiveRequestType === 'chat'
        ? await buildKnowledgeBlock({
            latestUserMessage,
            plan,
            selectedMenuLabel,
            selectedSubmenuLabel,
            contextType: selectedMenu?.contextType ?? sessionContext.contextType,
            domainRoute: resolvedDomainRoute,
            flowStep,
            specializedSource: specializedResult?.source ?? null,
          })
        : { block: null, profile: 'minimal' }

    const systemPrompt = buildSystemPrompt({
      plan,
      mode,
      language: userContext.language ?? fallbackLanguage,
      contextType: selectedMenu?.contextType ?? sessionContext.contextType,
      practitionerUsage: userContext.practitionerUsage,
      selectedMenuLabel,
      selectedSubmenuLabel,
      requestType: effectiveRequestType,
      domainRoute: resolvedDomainRoute,
      specializedSource: specializedResult?.source ?? null,
      flowStep,
      emotionalState: sessionContext.emotionalState,
      precision: sessionContext.precision,
      retrievalProfile: knowledgePayload.profile,
      responseDepth: input.responseDepth,
    } as any)

    const signalInputs = []

    if (specializedResult) {
      signalInputs.push(
        buildSignalEnvelope({
          module: specializedResult.source,
          result: specializedResult.raw,
          domainRoute: resolvedDomainRoute,
        })
      )
    }

    signalInputs.push(
      buildSignalEnvelope({
        module: 'context_engine',
        result: {
          readingLevel: sessionContext.readingLevel,
          lifePhase: sessionContext.lifePhase,
          dominantPotential: sessionContext.dominantPotential,
          contextType: selectedMenu?.contextType ?? sessionContext.contextType,
          emotionalState: sessionContext.emotionalState,
          precision: sessionContext.precision,
          timing: sessionContext.timing,
          flowStep,
        },
        domainRoute: resolvedDomainRoute,
      })
    )

    const fusedSignal = signalInputs.length ? fusionEngine(signalInputs) : null
    const arbitration = fusedSignal ? arbiter(fusedSignal) : null

    const menuInstruction =
      input.uiAction === 'select_menu_item' || input.uiAction === 'select_submenu_item'
        ? `${selectedMenu ? `L’utilisateur a choisi : ${selectedMenu.label}. ${selectedMenu.description}` : ''} ${selectedMenu?.promptHint ?? ''}`.trim()
        : ''

    const specializedInstruction = buildSpecializedContext(specializedResult)
    const fusionInstruction = buildFusionInstruction({
      resolvedDomainRoute,
      activeModules,
      fusedSignal,
      arbitration,
    })

    const messages = [
      ...input.messages,
      ...(menuInstruction ? [{ role: 'user' as const, content: menuInstruction }] : []),
      ...(specializedInstruction
        ? [{ role: 'assistant' as const, content: specializedInstruction }]
        : []),
      ...(fusionInstruction
        ? [{ role: 'assistant' as const, content: fusionInstruction }]
        : []),
    ]

    const payload = buildChatPayload({
      systemPrompt,
      userContext,
      sessionContext,
      messages,
      knowledgeBlock: knowledgePayload.block,
      flowStep,
    })

    const rawMessage = await callOpenAI(payload)
    const message = applySentinel(rawMessage)

    const menuVisible =
      effectiveRequestType === 'micro_month' ||
      input.uiAction === 'open_menu' ||
      input.uiAction === 'restart_flow' ||
      flowStep === 'menu'

    const menuItems = getMenuForMode(mode)

    try {
      await persistConversationMessage(
        supabase,
        conversationId,
        'user',
        latestUserMessage || menuInstruction || `[${effectiveRequestType}]`
      )

      await persistConversationMessage(supabase, conversationId, 'assistant', message, {
        flowStep,
        mode,
        contextType: selectedMenu?.contextType ?? sessionContext.contextType,
        domainRoute: resolvedDomainRoute,
        activeModule:
          specializedResult?.source ?? activeModules[0] ?? sessionContext.activeModule,
        emotionalState: sessionContext.emotionalState,
        timing: sessionContext.timing,
        precision: sessionContext.precision,
      })

      await writeSessionState(supabase, conversationId, {
        current_theme: selectedMenu?.label ?? sessionContext.currentTheme ?? null,
        current_context_type: selectedMenu?.contextType ?? sessionContext.contextType,
        menu_level: input.selectedSubmenuKey ? 'submenu' : 'main',
        last_selected_menu_key: input.selectedMenuKey ?? sessionContext.selectedMenuKey,
        last_selected_submenu_key:
          input.selectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
        active_flow: flowStep,
        current_domain_route: resolvedDomainRoute,
        active_module: specializedResult?.source ?? activeModules[0] ?? null,
        has_shown_micro_readings:
          effectiveRequestType === 'micro_month'
            ? true
            : sessionContext.state?.has_shown_micro_readings ?? false,
        last_emotional_state: sessionContext.emotionalState,
        last_timing: sessionContext.timing,
        last_precision: sessionContext.precision,
        last_reading_level: sessionContext.readingLevel,
      })
    } catch (memoryError) {
      logger.error('[runHexastraFlow] memory/session persistence failed', { error: memoryError })
    }

    const nowIso = new Date().toISOString()

    if (user?.id) {
      try {
        const memoryPatch: Record<string, string | null> = {
          reading_level: sessionContext.readingLevel,
          dominant_potential: sessionContext.dominantPotential,
          life_phase: sessionContext.lifePhase,
        }

        if (effectiveRequestType === 'micro_profile') {
          memoryPatch.last_profile_reading_at = nowIso
        }

        if (effectiveRequestType === 'micro_year') {
          memoryPatch.last_year_reading_at = nowIso
        }

        if (effectiveRequestType === 'micro_month') {
          memoryPatch.last_month_reading_at = nowIso
        }

        await writeUserMemory(supabase, user.id, memoryPatch)
      } catch (userMemoryError) {
        logger.error('[runHexastraFlow] writeUserMemory failed', { error: userMemoryError })
      }
    }

    return {
      message,
      reply: message,
      mode,
      plan,
      conversationId,
      flowState: { step: menuVisible ? 'menu' : flowStep, completed: true },
      menu: { visible: menuVisible, items: menuItems },
      suggestions: menuVisible
        ? menuItems.slice(0, 4).map((item) => item.label)
        : undefined,
      metadata: {
        contextType: selectedMenu?.contextType ?? sessionContext.contextType,
        practitionerUsage: userContext.practitionerUsage,
        shouldPersistMemory: true,
        selectedMenuKey: input.selectedMenuKey ?? sessionContext.selectedMenuKey,
        selectedSubmenuKey: input.selectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
        sessionStep: flowStep,
        emotionalState: sessionContext.emotionalState,
        timing: sessionContext.timing,
      },
      updatedEvolutionProfile: input.evolutionProfile ?? null,
    }
  } catch (error) {
    logger.error('[runHexastraFlow] fatal error', { error })

    const mode = getModeForPlan(fallbackPlan)

    if (isGreeting) {
      const message = buildGreetingMessage(mode, fallbackLanguage)

      return {
        message,
        reply: message,
        mode,
        plan: fallbackPlan,
        conversationId,
        flowState: { step: 'menu', completed: true },
        menu: { visible: true, items: getMenuForMode(mode) },
        suggestions: getMenuForMode(mode)
          .slice(0, 4)
          .map((item) => item.label),
        metadata: {
          shouldPersistMemory: false,
          contextType: input.contextType ?? 'general',
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      } as HexastraApiResponse
    }

    return {
      message: 'Je n’ai pas pu terminer la lecture pour le moment. Réessaie dans quelques instants.',
      reply: 'Je n’ai pas pu terminer la lecture pour le moment. Réessaie dans quelques instants.',
      mode: 'free',
      plan: 'free' as PlanKey,
      conversationId,
      flowState: { step: 'error', completed: false },
      metadata: {
        shouldPersistMemory: false,
      },
      updatedEvolutionProfile: input.evolutionProfile ?? null,
    } as unknown as HexastraApiResponse
  }
}

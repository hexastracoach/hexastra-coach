import { randomUUID } from 'crypto'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import { buildReadingPacket } from '@/lib/hexastra/orchestrator/buildReadingPacket'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
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
  HexastraMenuItem,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import { getModulesForDomain } from '@/lib/hexastra/router/moduleRouter'
import {
  getKsDomainConfig,
  getKsFreeformContract,
  getKsFreeformExecutionContract,
  getKsSelectionConfig,
  getKsSelectionExecutionContract,
} from '@/lib/hexastra/ks/ksRegistry'
import { executeKsSubmodules } from '@/lib/hexastra/ks/submoduleExecutor'
import { buildSignalEnvelope } from '@/lib/hexastra/fusion/signalEnvelope'
import type { KSSignal } from '@/lib/hexastra/fusion/signalEnvelope'
import { fusionEngine } from '@/lib/hexastra/fusion/fusionEngine'
import { arbiter } from '@/lib/hexastra/fusion/arbiter'
import { applySentinel } from '@/lib/hexastra/security/sentinel'
import { buildKsLeadSummary } from '@/lib/hexastra/orchestrator/ksOutputComposer'
import { generateHexastraReading } from '@/lib/hexastra/reading/hexastraReadingEngine'
import { computeFlowStep } from '@/lib/hexastra/session/sessionBrain'
import { buildRetrievalPlan } from '@/lib/hexastra/vector/retrievalPlanner'
import { logger } from '@/lib/utils/logger'
import { getOpenAIClient } from '@/lib/openai/client'

import { generateConversation } from '@/lib/hexastra/openai/generateConversation'
import { formatAnalysis } from '@/lib/hexastra/openai/formatAnalysis'

const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID || ''
const API_URL = (process.env.HEXASTRA_API_URL || '').replace(/\/$/, '')
const API_KEY = process.env.HEXASTRA_API_KEY || ''
const GLOBAL_FLOW_TIMEOUT_MS = 18000
const flowLog = (
  level: 'info' | 'debug' | 'warn' | 'error',
  msg: string,
  meta?: Record<string, unknown>
) => {
  logger[level](`[runHexastraFlow] ${msg}`, meta)
}

type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'

type SpecializedModuleResult = {
  source: 'gps_kua' | 'neurokua' | 'fusion'
  publicSummary: string
  raw: Record<string, unknown> | null
}

const safeString = (value: unknown): string => (typeof value === 'string' ? value : '')
const safeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value.filter(Boolean) as T[] : [])
const safeBuildSignalEnvelope = (params: Parameters<typeof buildSignalEnvelope>[0]): KSSignal | null => {
  try {
    const signal = buildSignalEnvelope(params)
    return signal && typeof signal === 'object' ? (signal as KSSignal) : null
  } catch (error) {
    logger.error('[runHexastraFlow] buildSignalEnvelope failed', { error, module: params.module })
    return null
  }
}

function normalizeMenuItem(item: Partial<HexastraMenuItem>): HexastraMenuItem {
  return {
    key: safeString(item.key) || 'unknown',
    label: safeString(item.label),
    description: safeString(item.description) || undefined,
    contextType: (item.contextType as ContextType) ?? 'general',
    domainRoute: (item.domainRoute as DomainRoute) ?? 'fusion',
    promptHint: safeString(item.promptHint) || undefined,
    submenu: safeArray<HexastraMenuItem>(item.submenu).map((sub) => normalizeMenuItem(sub)),
  }
}

function normalizePlan(plan: unknown): PlanKey {
  return plan === 'essential' || plan === 'premium' || plan === 'practitioner'
    ? plan
    : 'free'
}

function isBirthComplete(birth: BirthProfile | null): boolean {
  return Boolean(birth?.firstName && birth?.date && birth?.place)
}

function tr(language: string, variants: Partial<Record<string, string>>, fallback = 'fr'): string {
  const code = language?.slice(0, 2).toLowerCase() || fallback
  return variants[code] ?? variants[fallback] ?? ''
}

function buildMissingBirthMessage(language: string): string {
  return tr(language, {
    en: 'To personalize the reading, I need your first name, birth date, birth time (or unknown), and birth city + country.',
    fr: 'Pour personnaliser la lecture, j’ai besoin de ton prénom, de ta date de naissance, de ton heure de naissance (ou inconnue), et de ta ville + pays de naissance.',
    es: 'Para personalizar la lectura necesito tu nombre, fecha de nacimiento, hora (o desconocida) y ciudad + país de nacimiento.',
    pt: 'Para personalizar a leitura, preciso do teu primeiro nome, data de nascimento, hora (ou desconhecida) e cidade + país de nascimento.',
    de: 'Für eine personalisierte Lesung brauche ich deinen Vornamen, dein Geburtsdatum, Geburtszeit (oder unbekannt) sowie Geburtsort und Land.',
    it: 'Per personalizzare la lettura ho bisogno del tuo nome, data di nascita, ora (o sconosciuta) e città + paese di nascita.',
  })
}

function buildPractitionerUsageMessage(language: string): string {
  return tr(language, {
    en: 'Is this analysis for 1 — yourself or 2 — a client?',
    fr: 'Cette analyse est-elle pour : 1 — un usage personnel 2 — un(e) client(e) ?',
    es: '¿Este análisis es para 1 — ti mismo o 2 — un cliente?',
    pt: 'Esta análise é para 1 — você mesmo ou 2 — um cliente?',
    de: 'Ist diese Analyse für 1 — dich selbst oder 2 — einen Klienten?',
    it: 'Questa analisi è per 1 — te stesso oppure 2 — un cliente?',
  })
}

function buildGreetingMessage(mode: ReturnType<typeof getModeForPlan>, language: string): string {
  const intro = tr(language, {
    en: 'Hello, I’m HexAstra. I can help you clarify a situation, explore a life theme, or start a personalized reading.',
    fr: 'Bonjour, je suis HexAstra. Je peux t’aider à clarifier une situation, explorer un thème de vie, ou lancer une lecture personnalisée.',
    es: 'Hola, soy HexAstra. Puedo ayudarte a clarificar una situación, explorar un tema de vida o iniciar una lectura personalizada.',
    pt: 'Olá, sou a HexAstra. Posso ajudar a clarificar uma situação, explorar um tema de vida ou iniciar uma leitura personalizada.',
    de: 'Hallo, ich bin HexAstra. Ich kann dir helfen, eine Situation zu klären, ein Lebensthema zu erkunden oder eine persönliche Lesung zu starten.',
    it: 'Ciao, sono HexAstra. Posso aiutarti a chiarire una situazione, esplorare un tema di vita o iniziare una lettura personalizzata.',
  })

  const invite = tr(language, {
    en: 'I’m here to help. Ask your question or explore an angle below.',
    fr: 'Je suis là pour t’accompagner. Pose ta question ou explore un angle ci-dessous.',
    es: 'Estoy aquí para acompañarte. Haz tu pregunta o explora un ángulo justo debajo.',
    pt: 'Estou aqui para acompanhar-te. Faz a tua pergunta ou explora um ângulo abaixo.',
    de: 'Ich begleite dich: Stelle deine Frage oder wähle einen Blickwinkel unten.',
    it: 'Sono qui per accompagnarti. Fai la tua domanda o esplora un angolo qui sotto.',
  })

  return [intro, '', invite].join('\n')
}

function yearKey(date = new Date()): string {
  return String(date.getFullYear())
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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

function toSpecializedSource(domainRoute: DomainRoute): SpecializedModuleResult['source'] {
  if (domainRoute === 'gps_kua' || domainRoute === 'neurokua' || domainRoute === 'fusion') {
    return domainRoute
  }
  return 'fusion'
}

function shouldForceDirectReading(params: {
  uiAction: UiAction
  selectedMenuKey: string | null
  selectedSubmenuKey: string | null
  latestUserMessage: string
}) {
  const { uiAction, selectedMenuKey, selectedSubmenuKey, latestUserMessage } = params
  if (uiAction !== 'select_menu_item' && uiAction !== 'select_submenu_item' && uiAction !== 'restart_flow') {
    return false
  }

  const forcedKeys = new Set([
    'state_today',
    'fatigue_recharge',
    'stress_overload',
    'quick_adjustment',
    'detailed_reading',
    'quick_summary',
    'general_trends',
    'current_strengths',
    'vigilance_points',
    'orientation',
    'decision_pro',
    'decision_relation',
    'decision_project',
    'global_decision',
  ])

  const normalizedMessage = latestUserMessage.toLowerCase()
  if (
    normalizedMessage.includes('theme natal') ||
    normalizedMessage.includes('thème natal') ||
    normalizedMessage.includes('theme astral') ||
    normalizedMessage.includes('thème astral') ||
    normalizedMessage.includes('carte du ciel') ||
    normalizedMessage.includes('fais la lecture') ||
    normalizedMessage.includes('donne-moi directement le bilan') ||
    normalizedMessage.includes("donne-moi directement l'analyse")
  ) {
    return true
  }

  return forcedKeys.has(selectedSubmenuKey ?? '') || forcedKeys.has(selectedMenuKey ?? '')
}

function resolveRetrievalProfile(params: {
  domainRoute: DomainRoute
  specializedSource?: string | null
  selectedMenu?: HexastraMenuItem | null
  selectedSubmenu?: HexastraMenuItem | null
  latestUserMessage?: string | null
}) {
  const selectionConfig =
    getKsSelectionExecutionContract(params.selectedSubmenu?.key ?? null) ??
    getKsSelectionExecutionContract(params.selectedMenu?.key ?? null)
  const freeformConfig = getKsFreeformExecutionContract(params.latestUserMessage ?? null)

  if (selectionConfig || freeformConfig) return 'selection_specialized'
  if (params.specializedSource) return 'specialized_first'
  if (params.selectedSubmenu?.key || params.selectedMenu?.key) return 'menu_guided'
  if (params.domainRoute === 'neurokua' || params.domainRoute === 'gps_kua') return 'signal_first'
  return 'balanced'
}

function chooseResponseStrategy(params: {
  latestUserMessage: string
  selectedMenu?: HexastraMenuItem | null
  selectedSubmenu?: HexastraMenuItem | null
  flowStep: FlowStep
  domainRoute: DomainRoute
  birthDataComplete: boolean
}) {
  const text = params.latestUserMessage.trim().toLowerCase()
  const hasExplicitSelection = Boolean(params.selectedMenu?.key || params.selectedSubmenu?.key)
  const isShort = text.length < 24
  const isVeryBroad =
    /\b(ma vie|mon travail|mes relations|une lecture|analyse moi|j ai besoin d aide)\b/i.test(text)
  const isDirectRequest =
    /(theme natal|thème natal|theme astral|thème astral|carte du ciel|neurokua|etat du jour|état du jour|lecture|bilan|analyse|decision|décision)/i.test(text)

  if (params.flowStep === 'clarification') return 'clarify'
  if (hasExplicitSelection) return 'direct_read'
  if ((params.domainRoute === 'fusion' || params.domainRoute === 'neurokua') && isDirectRequest && params.birthDataComplete) {
    return 'direct_read'
  }
  if (isVeryBroad) return 'refine'
  if (isShort && !isDirectRequest) return 'explore'
  return 'direct_read'
}

function buildKsNarrativeBrief(params: {
  domainRoute: DomainRoute
  selectedMenu?: HexastraMenuItem | null
  selectedSubmenu?: HexastraMenuItem | null
  latestUserMessage?: string | null
  specializedResult?: SpecializedModuleResult | null
  fusedSignal?: {
    primaryModule?: string | null
    dominantSignal?: string | null
    phase?: string | null
    zone?: string | null
    narrativeBrief?: string | null
    confidenceScore?: number
  } | null
  executedSubmodules?: { key: string; result: Record<string, unknown> }[]
}) {
  const domainConfig = getKsDomainConfig(params.domainRoute)
  const selectionConfig =
    getKsSelectionExecutionContract(params.selectedSubmenu?.key ?? null) ??
    getKsSelectionExecutionContract(params.selectedMenu?.key ?? null)
  const freeformConfig = getKsFreeformExecutionContract(params.latestUserMessage ?? null)
  const effectiveSelectionConfig = selectionConfig ?? freeformConfig
  const focus = params.selectedSubmenu?.label ?? params.selectedMenu?.label ?? 'aucun angle explicite'
  const parts = [
    `domaine: ${params.domainRoute}`,
    `focus: ${focus}`,
    effectiveSelectionConfig?.narrativeContract ? `contrat selection: ${effectiveSelectionConfig.narrativeContract}` : null,
    effectiveSelectionConfig?.outputStructure ? `structure: ${effectiveSelectionConfig.outputStructure}` : null,
    effectiveSelectionConfig?.submodules?.length
      ? `sous-modules: ${effectiveSelectionConfig.submodules.join(', ')}`
      : null,
    effectiveSelectionConfig?.submoduleContracts?.length
      ? `contrats sous-modules: ${effectiveSelectionConfig.submoduleContracts
          .map((contract) => `${contract.key}=${contract.outputType}`)
          .join(', ')}`
      : null,
    params.executedSubmodules?.length
      ? `sous-modules executes: ${params.executedSubmodules
          .map((entry) => {
            const summary =
              typeof entry.result.publicSummary === 'string' ? entry.result.publicSummary : entry.key
            return `${entry.key}=${summary}`
          })
          .join(' | ')}`
      : null,
    `contrat: ${domainConfig.narrativeContract}`,
    params.specializedResult?.source ? `source prioritaire: ${params.specializedResult.source}` : null,
    params.fusedSignal?.primaryModule ? `module dominant: ${params.fusedSignal.primaryModule}` : null,
    params.fusedSignal?.dominantSignal ? `signal dominant: ${params.fusedSignal.dominantSignal}` : null,
    params.fusedSignal?.phase ? `phase: ${params.fusedSignal.phase}` : null,
    params.fusedSignal?.zone ? `zone: ${params.fusedSignal.zone}` : null,
    typeof params.fusedSignal?.confidenceScore === 'number'
      ? `confiance: ${params.fusedSignal.confidenceScore}`
      : null,
    params.fusedSignal?.narrativeBrief ?? null,
  ].filter(Boolean)

  return parts.join(' | ')
}

function withGlobalTimeout<T>(promise: Promise<T>, timeoutMs: number, meta?: Record<string, unknown>) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        flowLog('error', 'global timeout reached', { timeoutMs, ...(meta ?? {}) })
        reject(new Error(`runHexastraFlow timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      promise.finally(() => clearTimeout(timeoutId)).catch(() => {
        // The caller handles the original rejection; this catch only avoids an unhandled finally chain.
      })
    }),
  ])
}

async function callRailway(path: string, payload: Record<string, unknown>) {
  const url = `${API_URL}${path}`

  const started = Date.now()
  flowLog('info', 'before Railway call', { path, timeoutMs: 9000 })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(9000),
  })

  if (!res.ok) {
    flowLog('warn', 'after Railway call', {
      path,
      status: res.status,
      ok: false,
      durationMs: Date.now() - started,
    })
    throw new Error(`Railway ${path} failed with status ${res.status}`)
  }
  flowLog('info', 'after Railway call', {
    path,
    status: res.status,
    ok: true,
    durationMs: Date.now() - started,
  })

  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    logger.error('[HexAstra][Railway] invalid JSON', { error })
    throw new Error(`Railway ${path} returned invalid JSON`)
  }
}

async function callOpenAIResponse(payload: {
  model: string
  instructions: string
  input: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  max_output_tokens?: number
}) {
  const openai = getOpenAIClient()
  const started = Date.now()
  flowLog('info', 'before OpenAI call', { model: payload.model })
  const response = await openai.responses.create({
    model: payload.model,
    input: [
      { role: 'system', content: payload.instructions },
      ...payload.input,
    ],
    temperature: payload.temperature,
    max_output_tokens: payload.max_output_tokens,
  })

  const text = response.output_text ?? ''
  flowLog('info', 'after OpenAI call', {
    model: payload.model,
    durationMs: Date.now() - started,
    finalTextLength: text.length,
  })
  return text
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
    messages.filter((m) => m.role === 'user').at(-1)?.content?.trim() ?? ''

  if (!latestUserMessage || latestUserMessage.length < 3) {
    flowLog('info', 'skip specialized module: empty latestUserMessage', { domainRoute })
    return null
  }

  const allowedDomain = domainRoute === 'neurokua' || domainRoute === 'gps_kua' || domainRoute === 'fusion'
  if (!allowedDomain) {
    flowLog('info', 'skip specialized module: domainRoute not specialized', { domainRoute })
    return null
  }

  if (!birthData || !isBirthComplete(birthData)) {
    flowLog('info', 'skip specialized module: birth data incomplete', {
      hasBirth: Boolean(birthData),
      birthKeys: birthData ? Object.keys(birthData) : [],
    })
    return null
  }

  // Nouvelle API : tout passe par /chart/fusion (couvre HD, numérologie, kua…)
  if (birthData?.birthDateISO || birthData?.date) {
    try {
      const lat = typeof birthData.lat === 'number' ? birthData.lat : Number(birthData.lat)
      const lon = typeof birthData.lon === 'number' ? birthData.lon : Number(birthData.lon)

      const birthDateISO =
        birthData.birthDateISO ||
        (birthData.date
          ? `${birthData.date}${birthData.time ? `T${birthData.time}Z` : 'T00:00:00Z'}`
          : undefined)

      const fusionPayload = {
        birthDateISO,
        lat: Number.isFinite(lat) ? lat : undefined,
        lon: Number.isFinite(lon) ? lon : undefined,
        city: safeString(birthData.place) || safeString((birthData as any).city),
        country: safeString(birthData.country),
        place: safeString(birthData.place),
        name: safeString(birthData.name) || safeString(birthData.firstName),
        gender: safeString(birthData.gender) || 'M',
        tz: 1,
        question: latestUserMessage,
        practitioner_usage: practitionerUsage,
      }

      const fusion = await callRailway('/chart/fusion', {
        first_name: fusionPayload.name,
        birth_date: fusionPayload.birthDateISO?.slice(0, 10) ?? birthData.date,
        birth_time: birthData.time || 'unknown',
        birthDateISO: fusionPayload.birthDateISO,
        birth_city: fusionPayload.city,
        birth_country: fusionPayload.country,
        lat: fusionPayload.lat,
        lon: fusionPayload.lon,
        question: fusionPayload.question,
        practitioner_usage: fusionPayload.practitioner_usage,
      })

      const summary =
        typeof fusion?.publicSummary === 'string'
          ? fusion.publicSummary
          : typeof fusion?.summary === 'string'
            ? fusion.summary
            : `Utilise la synthèse fusionnée fournie comme signal dominant de la réponse finale.`

      return {
        source: domainRoute === 'neurokua' ? 'neurokua' : domainRoute,
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

      // Retour de secours pour ne pas casser le flow NeuroKua
      return {
        source: domainRoute === 'neurokua' ? 'neurokua' : domainRoute,
        publicSummary:
          'Module NeuroKua indisponible pour le moment. Je te partage une lecture générale en attendant.',
        raw: null,
      }
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
      return 'gps_kua'
    case 'practitioner':
      return 'fusion'
    default:
      return 'fusion'
  }
}

function normalizeBirthData(birth: BirthProfile | null): BirthProfile | null {
  if (!birth) return null

  const norm = { ...birth }
  norm.firstName = norm.firstName?.trim()
  norm.lastName = norm.lastName?.trim()
  norm.place = norm.place?.trim()
  norm.country = norm.country?.trim()
  norm.birthDateISO = norm.birthDateISO?.trim()
  norm.date = norm.date?.trim()
  norm.time = norm.time?.trim()
  return norm
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
  journeyEnabled?: boolean
}): Promise<HexastraApiResponse> {
  flowLog('info', 'enter runHexastraFlow', {
    plan: input.plan,
    requestType: input.requestType,
    messages: Array.isArray(input.messages) ? input.messages.length : 0,
    globalTimeoutMs: GLOBAL_FLOW_TIMEOUT_MS,
  })

  const executeFlow = async (): Promise<HexastraApiResponse> => {
    // Central input normalization to keep the flow crash-proof
    const normalizedMessages = safeArray<ChatMessage>(input.messages)
    const normalizedContextType: ContextType = input.contextType ?? 'general'
    const normalizedBirthData = normalizeBirthData(input.birthData)
    const normalizedPractitionerUsage = input.practitionerUsage ?? null
    const normalizedSelectedMenuKey = input.selectedMenuKey ?? null
    const normalizedSelectedSubmenuKey = input.selectedSubmenuKey ?? null
    const normalizedUiAction = input.uiAction ?? 'send_message'
    const normalizedJourneyToggle = Boolean(input?.journeyEnabled)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('[runHexastraFlow] Supabase public env missing')
      throw new Error('Supabase env missing')
    }

    if (!API_KEY || !API_URL) {
      logger.error('[runHexastraFlow] HEXASTRA_API env missing', {
        hasApiUrl: Boolean(API_URL),
        apiUrlLength: API_URL?.length ?? 0,
        hasApiKey: Boolean(API_KEY),
        apiKeyLength: API_KEY?.length ?? 0,
      })
      throw new Error('HEXASTRA API env missing')
    }

    const conversationId = input.conversationId ?? randomUUID()
    const fallbackLanguage = input.language ?? detectLanguageFromMessages(normalizedMessages, 'fr')
    const fallbackPlan = normalizePlan(input.plan)
    let journeyEnabled = normalizedJourneyToggle

    logger.debug('[runHexastraFlow] normalized input', {
      plan: input.plan,
      normalizedPlan: fallbackPlan,
      language: fallbackLanguage,
      contextType: normalizedContextType,
      uiAction: normalizedUiAction,
      messagesCount: normalizedMessages.length,
      selectedMenuKey: normalizedSelectedMenuKey,
      selectedSubmenuKey: normalizedSelectedSubmenuKey,
      journeyEnabled: normalizedJourneyToggle,
    })

    if (!VECTOR_STORE_ID) {
      logger.warn('[runHexastraFlow] OPENAI_VECTOR_STORE_ID missing — retrieval disabled')
    }

    // limiter le contexte à 6 messages (3 user + 2 assistant + dernier user)
    const limitedMessages = (() => {
      const recent = normalizedMessages.slice(-6)
      const users = recent.filter((m) => m.role === 'user').slice(-3)
      const assistants = recent.filter((m) => m.role === 'assistant').slice(-2)
      const allowed = new Set([...users, ...assistants])
      return recent.filter((m) => allowed.has(m))
    })()

    const latestUserMessage =
      limitedMessages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
    const isGreeting = /^(bonjour|salut|hello|hey|bonsoir|coucou|yo)\s*$/i.test(
      latestUserMessage.trim()
    )

    let supabase: any = null
    let user: any = null

    try {
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
          birthData: normalizedBirthData,
          practitionerUsage: normalizedPractitionerUsage,
        })
      } catch (userContextError) {
        logger.error('[runHexastraFlow] buildUserContext failed', { error: userContextError })

        userContext = {
          plan: fallbackPlan,
          language: fallbackLanguage,
          birthData: normalizedBirthData,
          practitionerUsage: normalizedPractitionerUsage,
          memory: null,
          journeyEnabled: normalizedJourneyToggle,
        }
      }

      const plan = normalizePlan(userContext.plan)
      const mode = getModeForPlan(plan)
      journeyEnabled = normalizedJourneyToggle ?? userContext.journeyEnabled ?? false
      userContext = { ...userContext, journeyEnabled }

      const menuItems = safeArray(getMenuForMode(mode)).map((item) => normalizeMenuItem(item))
      const forceDirectReading = shouldForceDirectReading({
        uiAction: normalizedUiAction,
        selectedMenuKey: normalizedSelectedMenuKey,
        selectedSubmenuKey: normalizedSelectedSubmenuKey,
        latestUserMessage,
      })

      const computedFlowStep = computeFlowStep({
        requestType: input.requestType,
        uiAction: normalizedUiAction,
        latestUserMessage,
        hasBirthData: isBirthComplete(userContext.birthData),
        hasShownMicroReadings: Boolean(userContext.session?.hasShownMicroReadings),
        practitionerNeedsUsage: plan === 'practitioner' && !normalizedPractitionerUsage,
        selectedMenuKey: normalizedSelectedMenuKey,
        selectedSubmenuKey: normalizedSelectedSubmenuKey,
        emotionalState: 'neutral',
        timing: 'exploration',
        precision: 'medium',
      } as Parameters<typeof computeFlowStep>[0])
      const flowStep =
        forceDirectReading && computedFlowStep !== 'sensitive_support'
          ? 'analysis'
          : computedFlowStep

    const selectedMenu =
      normalizedSelectedMenuKey && menuItems
        ? findMenuItem(menuItems, normalizedSelectedMenuKey)
        : null

    const selectedSubmenu =
      selectedMenu && normalizedSelectedSubmenuKey
        ? findMenuItem(selectedMenu.submenu ?? [], normalizedSelectedSubmenuKey)
        : null

    const latestMenuKey = selectedSubmenu?.key ?? selectedMenu?.key ?? null
    const latestDomainRoute = selectedSubmenu?.domainRoute ?? selectedMenu?.domainRoute ?? null

    const effectiveRequestType =
      normalizedUiAction === 'open_menu' || normalizedUiAction === 'restart_flow'
        ? 'chat'
        : input.requestType

    const isBirthNeeded = !isBirthComplete(userContext.birthData)

    if (plan === 'practitioner' && input.requestType === 'chat' && !normalizedPractitionerUsage) {
      const message = buildPractitionerUsageMessage(userContext.language ?? fallbackLanguage)
      flowLog('info', 'flow step final', {
        step: 'practitioner_usage',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'practitioner_usage', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          journeyEnabled,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (isBirthNeeded && !isGreeting && input.requestType === 'chat') {
      const message = buildMissingBirthMessage(userContext.language ?? fallbackLanguage)
      flowLog('info', 'flow step final', {
        step: 'birthdata_missing',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'birthdata_missing', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          sessionStep: 'birthdata_missing',
          emotionalState: null,
          timing: null,
          journeyEnabled,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    const domainRoute = resolveDomainRoute({
      latestUserMessage,
      selectedMenuDomainRoute: latestDomainRoute,
      sessionDomainRoute: userContext.session?.domainRoute ?? null,
      contextType: normalizedContextType,
    })

    const retrievalConfig = getAdaptiveRetrievalConfig({
      plan,
      domainRoute,
      query: latestUserMessage,
    })
    const retrievalPlan = buildRetrievalPlan({
      plan,
      flowStep,
      domainRoute,
      specializedSource: null,
    }) as any
    const retrievalResults =
      VECTOR_STORE_ID && process.env.OPENAI_API_KEY
        ? await multiLayerRetrieval({
            query: latestUserMessage,
            plan,
            vectorStoreId: VECTOR_STORE_ID,
            apiKey: process.env.OPENAI_API_KEY,
            domainRoute,
          })
        : []

    const knowledgePayload =
      retrievalResults.length
        ? compressKnowledgeContext(retrievalResults as any, retrievalConfig)
        : { block: null }

    const selectedMenuKey =
      latestMenuKey ??
      userContext.session?.selectedMenuKey ??
      retrievalPlan?.menu?.selectedMenuKey ??
      null
    const selectedSubmenuKey =
      selectedSubmenu?.key ??
      userContext.session?.selectedSubmenuKey ??
      retrievalPlan?.menu?.selectedSubmenuKey ??
      null

    const sessionContext = await buildSessionContext({
      supabase,
      conversationId,
      message: latestUserMessage,
      contextType: normalizedContextType,
      selectedMenuKey,
      selectedSubmenuKey,
      practitioner: plan === 'practitioner',
    })

    const menuInstruction = retrievalPlan?.menu?.instruction ?? null
    let specializedResult = await runSpecializedModule({
      domainRoute,
      birthData: normalizeBirthData(userContext.birthData),
      practitionerUsage: normalizedPractitionerUsage,
      messages: limitedMessages,
    })
    if (!specializedResult) {
      const fallbackPublicSummary =
        domainRoute === 'neurokua'
          ? 'Module NeuroKua indisponible pour le moment. Je te partage une lecture générale basée sur tes données enregistrées.'
          : domainRoute === 'gps_kua'
            ? 'Module GPS indisponible. Je propose une orientation générale en attendant.'
            : 'Je poursuis avec une lecture générale.'

      specializedResult = {
        source: toSpecializedSource(domainRoute),
        publicSummary: fallbackPublicSummary,
        raw: null,
      }
      flowLog('warn', 'fallback module used', { domainRoute, source: specializedResult.source })
    }
    flowLog('info', 'specializedResult', {
      hasResult: Boolean(specializedResult),
      source: specializedResult?.source,
    })

    const freeformContract = getKsFreeformExecutionContract(latestUserMessage)
    const selectionModules =
      getKsSelectionExecutionContract(selectedSubmenu?.key ?? null)?.modules ??
      getKsSelectionExecutionContract(selectedMenu?.key ?? null)?.modules ??
      freeformContract?.modules ??
      []
    const selectionSubmodules =
      getKsSelectionExecutionContract(selectedSubmenu?.key ?? null)?.submodules ??
      getKsSelectionExecutionContract(selectedMenu?.key ?? null)?.submodules ??
      freeformContract?.submodules ??
      []
    const executedSubmodules = executeKsSubmodules({
      submodules: selectionSubmodules,
      birthData: normalizeBirthData(userContext.birthData),
      latestUserMessage,
      domainRoute,
      practitionerUsage: normalizedPractitionerUsage,
    })
    const activeModules = Array.from(
      new Set([...selectionModules, ...selectionSubmodules, ...getModulesForDomain(domainRoute)])
    )

    const knowledgeBlock = knowledgePayload?.block

    // Construire des signaux KS robustes
    const signals: KSSignal[] = []
    const specializedSignal = specializedResult
      ? safeBuildSignalEnvelope({
          module: specializedResult.source ?? 'specialized',
          result: specializedResult.raw ?? { publicSummary: specializedResult.publicSummary },
          domainRoute,
        })
      : null
    if (specializedSignal) signals.push(specializedSignal)

    const knowledgeSignal = knowledgeBlock
      ? safeBuildSignalEnvelope({ module: 'retrieval', result: { signals: [knowledgeBlock] }, domainRoute })
      : null
    if (knowledgeSignal) signals.push(knowledgeSignal)
    for (const executedSubmodule of executedSubmodules) {
      const submoduleSignal = safeBuildSignalEnvelope({
        module: executedSubmodule.key,
        result: executedSubmodule.result,
        domainRoute,
      })
      if (submoduleSignal) signals.push(submoduleSignal)
    }

    const safeSignals = Array.isArray(signals) ? signals.filter(Boolean) : []
    const fallbackSignal =
      safeBuildSignalEnvelope({ module: 'fallback', result: {}, domainRoute }) ??
      buildSignalEnvelope({ module: 'fallback', result: {}, domainRoute })

    let fusedSignal: any = null
    let arbitration: any = null
    try {
      fusedSignal = fusionEngine(safeSignals.length ? safeSignals : [fallbackSignal])
      arbitration = await arbiter(fusedSignal)
    } catch (fusionError) {
      logger.error('[runHexastraFlow] fusion/buildSignalEnvelope failed', {
        error: fusionError,
        signalsType: typeof safeSignals,
        signalsLength: safeSignals.length,
      })
      fusedSignal = fusedSignal || { dominantSignal: 'signal_general' }
      arbitration = arbitration || {}
    }

    const selectedPromptHint =
      getKsSelectionExecutionContract(selectedSubmenu?.key ?? null)?.promptHint ??
      getKsSelectionExecutionContract(selectedMenu?.key ?? null)?.promptHint ??
      freeformContract?.promptHint ??
      selectedSubmenu?.promptHint ??
      selectedMenu?.promptHint ??
      menuInstruction ??
      null
    const selectedOutputStructure =
      getKsSelectionExecutionContract(selectedSubmenu?.key ?? null)?.outputStructure ??
      getKsSelectionExecutionContract(selectedMenu?.key ?? null)?.outputStructure ??
      freeformContract?.outputStructure ??
      null
    const retrievalProfile = resolveRetrievalProfile({
      domainRoute,
      specializedSource: specializedResult?.source ?? null,
      selectedMenu,
      selectedSubmenu,
      latestUserMessage,
    })
    const readingSummary = generateHexastraReading({
      latestUserMessage,
      contextType: normalizedContextType,
      domainRoute,
      birthData: normalizeBirthData(userContext.birthData),
      practitionerUsage: normalizedPractitionerUsage,
      fusedSignal,
    })
    const ksNarrativeBrief = buildKsNarrativeBrief({
      domainRoute,
      selectedMenu,
      selectedSubmenu,
      latestUserMessage,
      specializedResult,
      fusedSignal,
      executedSubmodules,
    })
    const ksSummary = {
      dominantSignal: fusedSignal?.dominantSignal ?? null,
      primaryModule: fusedSignal?.primaryModule ?? null,
      primaryFamily: fusedSignal?.primaryFamily ?? null,
      sourceLayers: Array.isArray(fusedSignal?.sourceLayers) ? fusedSignal.sourceLayers : [],
      submodules: executedSubmodules.map((entry) => entry.key),
    }
    const ksSubmoduleSummaries = executedSubmodules
      .map((entry) => entry.result.publicSummary)
      .filter((summary): summary is string => typeof summary === 'string' && summary.trim().length > 0)
    const normalizedReadingSummary = {
      detectedTheme: readingSummary.detectedTheme,
      detectedSubtheme: readingSummary.detectedSubtheme,
      detectedScience: readingSummary.detectedScience,
      readingLevel: readingSummary.readingLevel,
      momentType: readingSummary.momentType,
      phaseType: readingSummary.phaseType,
      dominantPotential: readingSummary.dominantPotential,
      mainLever: readingSummary.mainLever,
      executiveSummary: readingSummary.executiveSummary,
    }
    const readingPacket = buildReadingPacket({
      domainRoute,
      selectedOutputStructure,
      ksNarrativeBrief,
      ksSummary,
      readingSummary: normalizedReadingSummary,
      submoduleSummaries: ksSubmoduleSummaries,
    })
    const knowledgePacket = buildKnowledgePacket({
      results: retrievalResults,
      domainRoute,
      selectedMenuLabel: selectedMenu?.label ?? null,
      selectedSubmenuLabel: selectedSubmenu?.label ?? null,
      selectedPromptHint,
      selectedOutputStructure,
      latestUserMessage,
    })
    const responseStrategy = chooseResponseStrategy({
      latestUserMessage,
      selectedMenu,
      selectedSubmenu,
      flowStep,
      domainRoute,
      birthDataComplete: isBirthComplete(userContext.birthData),
    })

    const systemPrompt = buildSystemPrompt({
      plan,
      mode,
      language: userContext.language ?? fallbackLanguage,
      firstName: userContext.firstName ?? userContext.name ?? null,
      contextType: normalizedContextType,
      practitionerUsage: userContext.practitionerUsage ?? null,
      selectedMenuLabel: selectedMenu?.label ?? null,
      selectedSubmenuLabel: selectedSubmenu?.label ?? null,
      selectedPromptHint,
      selectedOutputStructure,
      ksSummary,
      ksSubmoduleSummaries,
      readingSummary: normalizedReadingSummary,
      requestType: input.requestType,
      domainRoute,
      specializedSource: specializedResult?.source ?? null,
      ksNarrativeBrief,
      flowStep,
      emotionalState: sessionContext.emotionalState,
      precision: sessionContext.precision,
      retrievalProfile,
      responseStrategy,
    })

    const messagesForLLM = limitedMessages.length
      ? limitedMessages
      : [{ role: 'user' as const, content: latestUserMessage }]

    const payload = buildChatPayload({
      systemPrompt,
      userContext,
      sessionContext,
      messages: messagesForLLM,
      knowledgeBlock: knowledgePayload?.block ?? null,
      flowStep,
      readingPacket,
      knowledgePacket,
    })

    const rawMessage = await callOpenAIResponse({
      ...payload,
      input: payload.input as { role: 'system' | 'user' | 'assistant'; content: string }[],
    })
    let message = applySentinel(rawMessage)
    if (!message || !message.trim()) {
      message =
        domainRoute === 'neurokua'
          ? "Je n’ai pas pu ouvrir NeuroKua pour le moment. Voici une lecture générale en attendant : focus sur ton équilibre du jour."
          : "Je poursuis avec une réponse courte basée sur les informations disponibles."
      flowLog('warn', 'fallback module used', { domainRoute, source: 'openai_empty_response' })
    }
    message = buildKsLeadSummary({
      flowStep,
      selectedOutputStructure,
      fusedSignal,
      executedSubmodules,
      message,
    })

    const menuVisible =
      effectiveRequestType === 'micro_month' ||
      normalizedUiAction === 'open_menu' ||
      normalizedUiAction === 'restart_flow' ||
      flowStep === 'menu'

    const menuItemsReturned = menuItems

    if (menuVisible && (!message || !message.trim())) {
      message =
        "Tes données sont bien enregistrées. Je peux maintenant ouvrir ton profil ou explorer une question."
    }

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
        domainRoute: domainRoute,
        activeModule:
          specializedResult?.source ?? activeModules[0] ?? sessionContext.activeModule,
        emotionalState: sessionContext.emotionalState,
        timing: sessionContext.timing,
        precision: sessionContext.precision,
      })

      await writeSessionState(supabase, conversationId, {
        current_theme: selectedMenu?.label ?? sessionContext.currentTheme ?? null,
        current_context_type: selectedMenu?.contextType ?? sessionContext.contextType,
        menu_level: normalizedSelectedSubmenuKey ? 'submenu' : 'main',
        last_selected_menu_key: normalizedSelectedMenuKey ?? sessionContext.selectedMenuKey,
        last_selected_submenu_key:
          normalizedSelectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
        active_flow: flowStep,
        current_domain_route: domainRoute,
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

    const menuVisibleReturn =
      effectiveRequestType === 'micro_month' ||
      normalizedUiAction === 'open_menu' ||
      normalizedUiAction === 'restart_flow' ||
      flowStep === 'menu'

    const finalMessage = menuVisibleReturn
      ? message
      : message

    flowLog('info', 'flow step final', {
      step: menuVisibleReturn ? 'menu' : flowStep,
      finalMessageLength: finalMessage.length,
      menuVisible: menuVisibleReturn,
    })

      return {
        message: finalMessage,
        reply: finalMessage,
        mode,
        plan,
        conversationId,
        flowState: { step: menuVisibleReturn ? 'menu' : flowStep, completed: true },
        menu: { visible: menuVisibleReturn, items: menuItemsReturned },
        suggestions: menuVisibleReturn
          ? []
          : [],
        metadata: {
          contextType: selectedMenu?.contextType ?? sessionContext.contextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: !menuVisibleReturn,
          selectedMenuKey,
          selectedSubmenuKey,
          sessionStep: menuVisibleReturn ? 'menu' : flowStep,
          emotionalState: sessionContext.emotionalState,
          timing: sessionContext.timing,
          journeyEnabled,
          ksSummary: {
            dominantSignal: ksSummary.dominantSignal,
            primaryModule: ksSummary.primaryModule,
            primaryFamily: ksSummary.primaryFamily,
            sourceLayers: ksSummary.sourceLayers,
            submodules: ksSummary.submodules,
          },
          readingSummary: normalizedReadingSummary,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      } as HexastraApiResponse;
    } catch (error) {
      logger.error('[runHexastraFlow] fatal error', { error })
      flowLog('error', 'flow step final', {
        step: 'error',
        finalMessageLength: "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu.".length,
      })
      return {
        message: "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu.",
        reply: "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu.",
        mode: 'free',
        plan: 'free' as PlanKey,
        conversationId,
        flowState: { step: 'error', completed: false },
        metadata: {
          shouldPersistMemory: false,
          journeyEnabled,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      } as unknown as HexastraApiResponse;
    }
  }

  return withGlobalTimeout(executeFlow(), GLOBAL_FLOW_TIMEOUT_MS, {
    requestType: input.requestType,
    conversationId: input.conversationId ?? null,
  }).catch((error) => {
    logger.error('[runHexastraFlow] fatal error', { error })
    const conversationId = input.conversationId ?? randomUUID()
    const journeyEnabled = Boolean(input?.journeyEnabled)
    const message =
      "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu."

    flowLog('error', 'flow step final', {
      step: 'error',
      finalMessageLength: message.length,
    })

    return {
      message,
      reply: message,
      mode: 'free',
      plan: 'free' as PlanKey,
      conversationId,
      flowState: { step: 'error', completed: false },
      metadata: {
        shouldPersistMemory: false,
        journeyEnabled,
      },
      updatedEvolutionProfile: input.evolutionProfile ?? null,
    } as unknown as HexastraApiResponse
  })
}

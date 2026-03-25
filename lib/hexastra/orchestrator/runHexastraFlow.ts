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
import {
  getMenuForMode,
  getInternalMenuForMode,
  findMenuItem,
  resolveKsSelectionKeyFromMenuKey,
} from '@/lib/hexastra/menus/getMenuForMode'
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
  getKsFreeformExecutionContract,
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
import {
  buildContextSelectionPrompt,
  findLooseMenuSelection,
  getScienceSubanalysisDefinition,
  resolveScienceSubanalysisSelection,
} from '@/lib/hexastra/orchestrator/contextualSelection'
import {
  canAccessScienceBreakdown,
  detectExplicitScienceIntent,
  isFusionFollowupRequest,
  normalizeFusionOnlyAnalysisMode,
  resolvePublicScienceFromSelectionKey,
  sanitizeFusionOnlySelectionKey,
} from '@/lib/hexastra/fusionOnly'

import { buildNormalizedInput } from '@/lib/hexastra/orchestration/normalizeInput'
import { evaluateOrchestration } from '@/lib/hexastra/orchestration/evaluateOrchestration'
import { buildScopeRefusalResponse } from '@/lib/hexastra/orchestration/scopeRefusalTemplate'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import type { OrchestrationTrace } from '@/lib/hexastra/orchestration/types'
import {
  requiresExactData,
  hasResolvedExactData,
  formatExactDataBlockCapped,
  buildExactDataAuditLog,
  buildCompactNatalReadingContext,
  buildDeterministicAstroExactAnswer,
  buildValidatedAstroExactFallback,
  enforceAstroExactRender,
} from '@/lib/hexastra/guards/exactDataGuard'
import {
  buildExactDataUnavailableResponse,
  buildIncompleteExactDataResponse,
} from '@/lib/hexastra/guards/exactDataResponse'
import {
  extractCoreAstroPlacements,
  formatCoreAstroBlock,
  asksForCorePlacements,
} from '@/lib/hexastra/guards/extractCoreAstro'
import {
  extractHDProfileFromRaw,
  formatHDProfileBlock,
  asksForHDProfile,
  isReliableHumanDesignProfile,
} from '@/lib/humandesign/profile'
import { buildCompactHumanDesignContext, type CompactHDContext } from '@/lib/humandesign/compactContext'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { isActionableDirectRequest, directRequestSkipReason } from '@/lib/hexastra/orchestration/directRequest'
import { detectHoroscopeIntent, isHoroscopeRequest, detectHoroscopeVariant } from '@/lib/hexastra/orchestration/horoscopeClassifier'
import { buildHoroscopeDataBlock, validateHoroscopeOutput } from '@/lib/hexastra/prompts/horoscopePrompt'
import { selectResponseMode, buildResponseModeDirective } from '@/lib/hexastra/orchestration/responseModes'
import { resolveVectorSkip } from '@/lib/hexastra/vector/vectorPolicy'
import { isReliableExactData } from '@/lib/exact-data/reliability'
import { buildCompactExactScienceBlock } from '@/lib/exact-data/compactBlocks'
import {
  shouldBlockFalsePlanLimitation,
  containsFalsePlanLimitation,
  ANTI_HALLUCINATION_RULES,
  ANTI_CONTRADICTION_DIRECTIVE,
  detectResponseModeMismatch,
} from '@/lib/hexastra/guards/hallucinationGuard'
import {
  buildSmartPricingSessionState,
  buildSmartUpgradeDecision,
  toSessionStatePatch,
} from '@/lib/monetization/smartPricing'

const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID || ''
const API_URL = (process.env.HEXASTRA_API_URL || '').replace(/\/$/, '')
const API_KEY = process.env.HEXASTRA_API_KEY || ''

// Global: just under Vercel/Railway function limit (30 s)
const GLOBAL_FLOW_TIMEOUT_MS = 29000

// Per-plan OpenAI call timeout — leaves headroom for context-build + Supabase after
const OPENAI_TIMEOUT_BY_PLAN: Record<string, number> = {
  free:          13000,
  essential:     17000,
  premium:       22000,
  practitioner:  26000,
}
function resolveOpenAiTimeoutMs(plan: string): number {
  return OPENAI_TIMEOUT_BY_PLAN[plan] ?? OPENAI_TIMEOUT_BY_PLAN.free
}

function getCompatibleSelectionExecutionContract(key?: string | null) {
  return getKsSelectionExecutionContract(resolveKsSelectionKeyFromMenuKey(key))
}

const flowLog = (
  level: 'info' | 'debug' | 'warn' | 'error',
  msg: string,
  meta?: Record<string, unknown>
) => {
  logger[level](`[runHexastraFlow] ${msg}`, meta)
}

type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'

type SpecializedModuleResult = {
  source: 'gps_kua' | 'neurokua' | 'fusion' | 'timing' | 'science'
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

function requiresPreciseBirthContext(message: string): boolean {
  const normalized = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return /(maison|maisons|house|houses|oppose|opposee|opposees|theme natal|theme astral|carte du ciel)/.test(
    normalized,
  )
}

function hasPreciseBirthContext(profile: BirthProfile | null): boolean {
  if (!profile) return false

  return Boolean(
    profile.firstName?.trim() &&
      (profile.birthDateISO?.trim() || profile.date?.trim()) &&
      profile.place?.trim() &&
      (profile.time?.trim() || profile.birthTimeKnown === false),
  )
}

function buildMissingBirthMessage(language: string, latestUserMessage?: string): string {
  if (requiresPreciseBirthContext(latestUserMessage ?? '')) {
    return tr(language, {
      en: `To give you your houses, their signs, and their opposites, I need your full birth details.\n\nGive me:\n- First name\n- Birth date (DD/MM/YYYY)\n- Birth time (or "unknown")\n- Birth city + country\n\nAs soon as I have that, I’ll give you:\n- the 12 houses\n- the sign in each house\n- their opposites\n- a simple reading of what this means for you`,
      fr: `Pour te donner tes maisons, leurs signes et leurs opposés, il me manque une base essentielle : tes données de naissance complètes.\n\nDonne-moi :\n- Prénom\n- Date de naissance (JJ/MM/AAAA)\n- Heure de naissance (ou "inconnue")\n- Ville + pays\n\nDès que j’ai ça, je te donne :\n- les 12 maisons\n- le signe dans chaque maison\n- leurs opposés\n- une lecture simple pour comprendre ce que ça veut dire concrètement pour toi`,
    })
  }

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildGreetingMessage(mode: ReturnType<typeof getModeForPlan>, language: string): string {
  const intro = tr(language, {
    en: 'Hello. Tell me about your situation, even in a few lines.',
    fr: 'Bonjour. Parle-moi de ta situation, même en quelques lignes.',
    es: 'Hola, soy HexAstra. Puedo ayudarte a clarificar una situación, explorar un tema de vida o iniciar una lectura personalizada.',
    pt: 'Olá, sou a HexAstra. Posso ajudar a clarificar uma situação, explorar um tema de vida ou iniciar uma leitura personalizada.',
    de: 'Hallo, ich bin HexAstra. Ich kann dir helfen, eine Situation zu klären, ein Lebensthema zu erkunden oder eine persönliche Lesung zu starten.',
    it: 'Ciao, sono HexAstra. Posso aiutarti a chiarire una situazione, esplorare un tema di vita o iniziare una lettura personalizzata.',
  })

  const invite = tr(language, {
    en: 'I will help you understand what is happening, then see the clearest next direction.',
    fr: 'Je t’aiderai à comprendre ce qui se joue, puis à voir plus clair.',
    es: 'Estoy aquí para acompañarte. Haz tu pregunta o explora un ángulo justo debajo.',
    pt: 'Estou aqui para acompanhar-te. Faz a tua pergunta ou explora um ângulo abaixo.',
    de: 'Ich begleite dich: Stelle deine Frage oder wähle einen Blickwinkel unten.',
    it: 'Sono qui per accompagnarti. Fai la tua domanda o esplora un angolo qui sotto.',
  })

  return [intro, '', invite].join('\n')
}

function asksForScienceOverview(message: string) {
  const normalized = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return (
    /a quelle science|a quelles sciences|quelles sciences|quels angles|de quoi es tu capable|de quoi tu es capable|quels modules|que peux tu analyser/.test(
      normalized,
    ) ||
    normalized.trim() === 'analyse par science' ||
    normalized.trim() === 'analyse par sciences'
  )
}

function asksToReturnToSciences(message: string) {
  const normalized = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return /retour au sciences|retour aux sciences|redonne moi les science|redonne moi les sciences|les sciences disponibles/.test(
    normalized,
  )
}

function normalizeSelectionText(message: string) {
  return (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function asksForPractitionerMasterMenu(message: string) {
  const normalized = normalizeSelectionText(message)
  return (
    normalized === 'mode praticien' ||
    normalized === 'en mode praticien' ||
    normalized === 'menu praticien' ||
    normalized === 'repasse moi en mode praticien' ||
    normalized === 'passe moi en mode praticien' ||
    normalized === 'retour au mode praticien'
  )
}

function looksLikePractitionerMasterMenu(message: string) {
  const normalized = normalizeSelectionText(message)
  return (
    normalized.includes('menu praticien') &&
    normalized.includes('analyses par situation') &&
    normalized.includes('analyses par science')
  )
}

function looksLikeScienceOverviewMenu(message: string) {
  const normalized = normalizeSelectionText(message)
  return (
    normalized.includes('analyse par science') &&
      /(astrologie|astrolex|human design|enneagramme|kua|neurokua|numerologie)/.test(
        normalized,
      )
  )
}

function parseCompositeChoice(message: string) {
  const match = normalizeSelectionText(message).match(
    /^(\d{1,2})\s*(?:et|&|\+|puis|then)\s*(\d{1,2})$/,
  )
  if (!match) return null
  return { first: match[1], second: match[2] }
}

function buildPractitionerMasterMenuMessage(language: string) {
  const intro = tr(language, {
    fr: 'Bienvenue en Mode Praticien.',
    en: 'Welcome to Practitioner Mode.',
  })

  return [
    intro,
    '',
    'Ce mode permet :',
    '- une analyse plus precise et structuree',
    '- un vocabulaire plus technique',
    '- des lectures exploitables en consultation ou accompagnement',
    '',
    'Mode Praticien — menu',
    '',
    'A — Analyses par situation',
    '1 — NeuroKua™ : diagnostic de l etat interne et reglages d equilibre',
    '2 — Relationnel™ : dynamiques, tensions et leviers relationnels',
    '3 — Professionnel™ : positionnement, risques et strategie d evolution',
    '4 — Cycle a venir™ : projection de phase et timing d action',
    '5 — Decision precise™ : comparatif A/B avec risques et plan',
    '6 — Lecture generale actuelle™ : synthese multidimensionnelle exploitable',
    '',
    'B — Analyses par science',
    '7 — Astrologie™ : cycles, maisons, aspects et timing',
    '8 — Human Design™ : centres, canaux, portes et decision',
    '9 — Enneagramme™ : mecanismes, stress et leviers d evolution',
    '10 — Kua™ : orientation, espace et optimisation',
    '11 — NeuroKua™ : 4 dynamiques, axe correctif et reglage sensoriel',
    '12 — Numerologie™ : cycles annuels, mensuels et transitions',
    '',
    'C — Lectures HexAstra',
    '14 — Lecture HexAstra complete™ : lecture structuree, prete pour consultation',
    '15 — Analyse de phase de vie™ : comprendre la phase et la traverser juste',
    '16 — Analyse multidimensionnelle personnelle™ : leviers, timing et plan',
    '',
    'Tu peux repondre avec un numero simple, ou avec une combinaison comme 12 et 1.',
  ].join('\n')
}

function buildScienceOverviewMessage(language: string, practitionerMode: boolean) {
  const intro = practitionerMode
    ? "Parfait.\nOn passe en Mode Praticien — Analyse par science."
    : "Bonne question.\nHexAstra ne fonctionne pas comme un outil \"une science = une reponse\".\nIl croise plusieurs approches pour comprendre ta situation humaine et t'aider a decider."

  const scienceList = practitionerMode
    ? [
        '7 — Astrologie™ : cycles, maisons, aspects et timing',
        '8 — Human Design™ : fonctionnement naturel, centres et decision',
        '9 — Enneagramme™ : mecanismes comportementaux, stress',
        '10 — Kua™ : orientation, environnement, optimisation',
        '11 — NeuroKua™ : 4 dynamiques, regulation et ajustement sensoriel',
        '12 — Numerologie™ : cycles annuels et mensuels',
      ]
    : [
        '1 — Astrologie™ : cycles de vie, timing, maisons et aspects',
        '2 — Human Design™ : fonctionnement naturel, centres et decision',
        '3 — Enneagramme™ : reactions automatiques, stress, comportement',
        '4 — Kua™ : environnement, orientation, equilibre dans l espace',
        '5 — NeuroKua™ : etat interne, axe dominant et reglage utile',
        '6 — Numerologie™ : cycles, annee, mois, dynamique temporelle',
      ]

  const outro = practitionerMode
    ? "Choisis maintenant la science a analyser.\nReponds avec le numero ou le nom."
    : "Tu ne choisis pas une science pour apprendre, tu la choisis pour mieux comprendre ce que tu vis et savoir quoi faire.\n\nDis-moi simplement le numero ou le nom de la science que tu veux explorer."

  return [intro, '', 'Analyse par science — selection', ...scienceList, '', outro].join('\n')
}

function resolveScienceChoiceKey(params: {
  choice: string
  practitionerMode: boolean
  selectedMenuKey?: string | null
  lastAssistantMessage?: string
}) {
  const { choice, practitionerMode, selectedMenuKey, lastAssistantMessage } = params
  const regularChoices: Record<string, string> = {
    '1': 'science_astrolex',
    '2': 'science_porteum',
    '3': 'science_enneagram',
    '4': 'science_kua',
    '5': 'science_neurokua',
    '6': 'science_triangle',
  }
  const practitionerChoices: Record<string, string> = {
    '7': 'science_astrolex',
    '8': 'science_porteum',
    '9': 'science_enneagram',
    '10': 'science_kua',
    '11': 'science_neurokua',
    '12': 'science_triangle',
  }

  if (selectedMenuKey === 'science' || looksLikeScienceOverviewMenu(lastAssistantMessage ?? '')) {
    if (practitionerMode) {
      return practitionerChoices[choice] ?? regularChoices[choice] ?? null
    }
    return regularChoices[choice] ?? null
  }

  if (
    practitionerMode &&
    (selectedMenuKey === 'practitioner_menu' || looksLikePractitionerMasterMenu(lastAssistantMessage ?? ''))
  ) {
    return practitionerChoices[choice] ?? null
  }

  return null
}

export function buildScienceSubanalysisRequest(
  selectionKey: string,
  choice: string,
) {
  const option = resolveScienceSubanalysisSelection(selectionKey, choice)
  return option?.clarificationQuestion ?? null
}

function resolveContextualSelection(params: {
  message: string
  language: string
  practitionerMode: boolean
  menuItems: HexastraMenuItem[]
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  lastAssistantMessage?: string
}) {
  const {
    message,
    language,
    practitionerMode,
    menuItems,
    selectedMenuKey,
    selectedSubmenuKey,
    lastAssistantMessage,
  } = params
  const normalizedMessage = normalizeSelectionText(message)
  const singleChoice = normalizedMessage.match(/^(\d{1,2})$/)?.[1] ?? null
  const compositeChoice = parseCompositeChoice(message)

  if (practitionerMode && asksForPractitionerMasterMenu(message)) {
    return {
      kind: 'menu' as const,
      immediateMessage: buildPractitionerMasterMenuMessage(language),
      selectedMenuKey: 'practitioner_menu',
      selectedSubmenuKey: null,
    }
  }

  const looseSelection = findLooseMenuSelection({
    items: menuItems,
    message,
    selectedMenuKey,
  })

  if (looseSelection?.kind === 'open_parent') {
    return {
      kind: 'open_parent' as const,
      selectedMenuKey: looseSelection.item.key,
      selectedSubmenuKey: null,
    }
  }

  if (looseSelection?.kind === 'subscience') {
    return {
      kind: 'context' as const,
      selectedMenuKey: 'science',
      selectedSubmenuKey: looseSelection.option.key,
      uiAction: 'select_submenu_item' as UiAction,
    }
  }

  if (looseSelection?.kind === 'submenu') {
    const isVirtualTopLevel = looseSelection.parent.key === looseSelection.item.key
    if (looseSelection.item.key.startsWith('science_')) {
      return {
        kind: 'science' as const,
        selectedMenuKey: 'science',
        selectedSubmenuKey: looseSelection.item.key,
        uiAction: 'select_submenu_item' as UiAction,
      }
    }

    return {
      kind: 'context' as const,
      selectedMenuKey: isVirtualTopLevel ? looseSelection.item.key : looseSelection.parent.key,
      selectedSubmenuKey: isVirtualTopLevel ? null : looseSelection.item.key,
      uiAction: (isVirtualTopLevel ? 'select_menu_item' : 'select_submenu_item') as UiAction,
    }
  }

  const resolvedSelectedSubmenuKey = resolveKsSelectionKeyFromMenuKey(selectedSubmenuKey)
  const selectedScienceKey = resolvedSelectedSubmenuKey?.startsWith('science_')
    ? getScienceSubanalysisDefinition(resolvedSelectedSubmenuKey)?.parentScienceKey ??
      resolvedSelectedSubmenuKey
    : null

  const directSubscienceSelection = resolveScienceSubanalysisSelection(selectedScienceKey, message)
  if (directSubscienceSelection) {
    return {
      kind: 'context' as const,
      selectedMenuKey: 'science',
      selectedSubmenuKey: directSubscienceSelection.key,
      uiAction: 'select_submenu_item' as UiAction,
    }
  }

  if (selectedSubmenuKey?.startsWith('science_') && singleChoice) {
    const subscienceSelection = resolveScienceSubanalysisSelection(selectedSubmenuKey, singleChoice)
    if (subscienceSelection) {
      return {
        kind: 'context' as const,
        selectedMenuKey: 'science',
        selectedSubmenuKey: subscienceSelection.key,
        uiAction: 'select_submenu_item' as UiAction,
      }
    }
  }

  if (compositeChoice) {
    const scienceKey = resolveScienceChoiceKey({
      choice: compositeChoice.first,
      practitionerMode,
      selectedMenuKey,
      lastAssistantMessage,
    })
    if (scienceKey) {
      const subscienceSelection = resolveScienceSubanalysisSelection(
        scienceKey,
        compositeChoice.second,
      )
      if (subscienceSelection) {
        return {
          kind: 'context' as const,
          selectedMenuKey: 'science',
          selectedSubmenuKey: subscienceSelection.key,
          uiAction: 'select_submenu_item' as UiAction,
        }
      }

      return {
        kind: 'science' as const,
        selectedMenuKey: 'science',
        selectedSubmenuKey: scienceKey,
        uiAction: 'select_submenu_item' as UiAction,
      }
    }
  }

  if (singleChoice) {
    const scienceKey = resolveScienceChoiceKey({
      choice: singleChoice,
      practitionerMode,
      selectedMenuKey,
      lastAssistantMessage,
    })
    if (scienceKey) {
      return {
        kind: 'science' as const,
        selectedMenuKey: 'science',
        selectedSubmenuKey: scienceKey,
        uiAction: 'select_submenu_item' as UiAction,
      }
    }
  }

  return null
}

function buildScienceSubanalysisMessage(selectionKey: string, practitionerMode: boolean) {
  if (selectionKey === 'science_astrolex') {
    const intro = practitionerMode
      ? 'Tu as choisi Astrologie™ en Mode Praticien.'
      : 'Tu as choisi Astrologie™.'
    const prompt = practitionerMode
      ? "Pour un diagnostic precis et exploitable, choisis maintenant l'angle d'analyse :"
      : "Pour que l'analyse soit vraiment utile et pas trop vague, choisis l'angle precis que tu veux explorer :"
    const lines = practitionerMode
      ? [
          '1 — Transitus™ : ce qui est en train de se jouer concretement maintenant',
          '2 — Domus™ : le domaine de vie ou les maisons les plus activees',
          '3 — Aspectum™ : les tensions, appuis et rapports de force du moment',
          '4 — Synastrie™ : la dynamique astrologique avec une personne ou une relation',
          '5 — Geo-Astrologie™ : l impact des lieux, du deplacement ou du cadre geographique',
          '6 — Planetarium™ : les planetes dominantes et leurs messages',
          '7 — Synthese astrologique™ : lecture strategique complete',
        ]
      : [
          '1 — Energie actuelle : l ambiance globale du moment',
          '2 — Domaine active : le secteur de ta vie le plus impacte',
          '3 — Tension ou opportunite : ce qui bloque ou ce qui peut avancer',
          '4 — Timing : est-ce le bon moment pour agir ou attendre',
          '5 — Synastrie : la dynamique astrologique avec une autre personne',
          '6 — Lieux / geo-astrologie : l effet des lieux et de ton environnement',
          '7 — Conseil du cycle : comment t adapter concretement a cette phase',
        ]

    return [intro, '', prompt, '', 'Astrologie™ — selection', ...lines, '', 'Reponds avec le numero pour continuer.'].join(
      '\n',
    )
  }

  if (selectionKey === 'science_neurokua') {
    return [
      'Tu as choisi NeuroKua™.',
      '',
      'Choisis maintenant l angle que tu veux explorer :',
      '',
      'NeuroKua™ — selection',
      '1 — Baseline™ : ton niveau de reference et ton mode dominant',
      '2 — Balance™ : ton axe dominant, ton axe correctif et le desequilibre principal',
      '3 — Timing™ : agir, recuperer ou temporiser selon la fenetre du moment',
      '4 — Overload™ : surcharge, manque ou usure par accumulation',
      '5 — Recalibration™ : reglage rapide de direction, rythme, couleur ou environnement',
      '6 — Synesthesia™ : orientation, couleur et environnement sensoriel utiles',
      '',
      'Reponds avec le numero pour continuer.',
    ].join('\n')
  }

  if (selectionKey === 'science_porteum') {
    return [
      'Tu as choisi Human Design™.',
      '',
      'Choisis maintenant l angle que tu veux explorer :',
      '',
      'Human Design™ — selection',
      '1 — Centres™ : zones stables et zones sensibles',
      '2 — Canaux™ : dynamiques d expression et de circulation',
      '3 — Portes™ : mecanismes precis actuellement actifs',
      '4 — Profil™ : posture naturelle et style d incarnation',
      '5 — Autorite / Strategie™ : ta meilleure maniere de decider',
      '6 — Synthese™ : lecture complete et exploitable',
      '',
      'Reponds avec le numero pour continuer.',
    ].join('\n')
  }

  if (selectionKey === 'science_triangle') {
    return [
      'Tu as choisi Numerologie™.',
      '',
      'Choisis maintenant l angle que tu veux explorer :',
      '',
      'Numerologie™ — selection',
      '1 — Cycle annuel : le mouvement de fond de cette annee',
      '2 — Cycle mensuel : ce que le moment active concretement',
      '3 — Chemin / vibration dominante : la frequence qui guide ta phase',
      '4 — Defis et transitions : ce qui demande adaptation',
      '5 — Opportunite / vigilance : ce qui est favorise ou a surveiller',
      '6 — Conseil du cycle : comment t adapter avec justesse',
      '',
      'Reponds avec le numero pour continuer.',
    ].join('\n')
  }

  if (selectionKey === 'science_enneagram') {
    return [
      'Tu as choisi Enneagramme™.',
      '',
      'Choisis maintenant l angle que tu veux explorer :',
      '',
      'Enneagramme™ — selection',
      '1 — Reaction dominante : ton mecanisme le plus spontané',
      '2 — Stress : comment tu te deformes sous pression',
      '3 — Defense automatique : ce que tu mets en place pour tenir',
      '4 — Levier d evolution : ce qui t aide a t ouvrir',
      '5 — Lecture complete : une synthese utile et actionnable',
      '',
      'Reponds avec le numero pour continuer.',
    ].join('\n')
  }

  if (selectionKey === 'science_kua') {
    return [
      'Tu as choisi Kua™.',
      '',
      'Choisis maintenant l angle que tu veux explorer :',
      '',
      'Kua™ — selection',
      '1 — Orientation generale : la direction la plus favorable',
      '2 — Espace de vie : comment mieux te positionner',
      '3 — Decision : quelle orientation soutient le mieux ton choix',
      '4 — Equilibre environnemental : ce qui apaise ou fatigue ton systeme',
      '5 — Conseil pratique : un ajustement concret a faire maintenant',
      '',
      'Reponds avec le numero pour continuer.',
    ].join('\n')
  }

  return null
}

function buildPractitionerLevelMessage(level: string, currentScienceLabel?: string | null) {
  const science = currentScienceLabel ?? 'cette lecture'

  if (level === '3') {
    return [
      'Parfait, tu montes en niveau d’analyse.',
      '',
      `Mode Praticien — Niveau 3 (${science})`,
      'On passe d une lecture a une logique de diagnostic avance, d optimisation et de precision des leviers.',
      '',
      'Ce niveau demande :',
      '1 — de distinguer la situation reelle du ressenti immediat',
      '2 — d identifier la contradiction centrale',
      '3 — de transformer la lecture en test concret dans le reel',
      '',
      'Dis-moi maintenant le domaine exact a appliquer : travail, relation, argent, decision, ou situation generale.',
    ].join('\n')
  }

  if (level === '2') {
    return [
      'Parfait, on ajuste au Mode Praticien — Niveau 2.',
      '',
      `Mode Praticien — Niveau 2 (${science})`,
      'On reste structure, direct et operationnel, avec plus de precision qu en mode libre et moins de profondeur diagnostique qu au niveau 3.',
      '',
      'Dis-moi maintenant le domaine exact a appliquer : travail, relation, argent, decision, ou situation generale.',
    ].join('\n')
  }

  return [
    'Mode Praticien active.',
    '',
    `On travaille maintenant ${science} avec une lecture plus structuree, plus nette et plus exploitable.`,
    'Tu peux me donner un domaine precis ou choisir un angle plus fin pour continuer.',
  ].join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function yearKey(date = new Date()): string {
  return String(date.getFullYear())
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  if (
    domainRoute === 'gps_kua' ||
    domainRoute === 'neurokua' ||
    domainRoute === 'fusion' ||
    domainRoute === 'timing' ||
    domainRoute === 'science'
  ) {
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
  selectionKey?: string | null
  latestUserMessage?: string | null
}) {
  const selectionConfig =
    getCompatibleSelectionExecutionContract(params.selectionKey ?? null) ??
    getCompatibleSelectionExecutionContract(params.selectedSubmenu?.key ?? null) ??
    getCompatibleSelectionExecutionContract(params.selectedMenu?.key ?? null)
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
  selectionKey?: string | null
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
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
    getCompatibleSelectionExecutionContract(params.selectionKey ?? null) ??
    getCompatibleSelectionExecutionContract(params.selectedSubmenu?.key ?? null) ??
    getCompatibleSelectionExecutionContract(params.selectedMenu?.key ?? null)
  const freeformConfig = getKsFreeformExecutionContract(params.latestUserMessage ?? null)
  const effectiveSelectionConfig = selectionConfig ?? freeformConfig
  const focus =
    params.selectedSubmenuLabel ??
    params.selectedMenuLabel ??
    params.selectedSubmenu?.label ??
    params.selectedMenu?.label ??
    'aucun angle explicite'
  const parts = [
    `domaine: ${params.domainRoute}`,
    `focus: ${focus}`,
    effectiveSelectionConfig?.executionStrategy
      ? `strategie execution: ${effectiveSelectionConfig.executionStrategy}`
      : null,
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
  if (!API_URL) {
    throw new Error('HEXASTRA API URL missing')
  }

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
  timeoutMs?: number
}) {
  const openai = getOpenAIClient()
  const started = Date.now()
  const timeoutMs = payload.timeoutMs ?? OPENAI_TIMEOUT_BY_PLAN.free

  const charCount =
    payload.instructions.length +
    payload.input.reduce((acc, m) => acc + m.content.length, 0)
  const rawDataKeys = payload.input
    .map((m) => m.content)
    .filter((c) => c.startsWith('DONNÉES EXACTES'))
    .length > 0
    ? 'exactDataBlock=yes'
    : 'exactDataBlock=no'

  flowLog('info', '[OPENAI] preparing payload', {
    model: payload.model,
    messagesCount: payload.input.length + 1, // +1 for system
    systemPromptChars: payload.instructions.length,
    inputChars: charCount,
    maxOutputTokens: payload.max_output_tokens,
    temperature: payload.temperature,
    timeoutMs,
    rawDataKeys,
  })
  flowLog('info', '[OPENAI] call started', { model: payload.model })

  const callPromise = openai.responses.create({
    model: payload.model,
    input: [
      { role: 'system', content: payload.instructions },
      ...payload.input,
    ],
    temperature: payload.temperature,
    max_output_tokens: payload.max_output_tokens,
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      flowLog('error', '[OPENAI] timeout reached', { model: payload.model, timeoutMs })
      reject(new Error(`OpenAI call timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    callPromise.finally(() => clearTimeout(id)).catch(() => {})
  })

  const response = await Promise.race([callPromise, timeoutPromise])
  const text = (response as Awaited<typeof callPromise>).output_text ?? ''
  const durationMs = Date.now() - started

  flowLog('info', '[OPENAI] call finished', {
    model: payload.model,
    durationMs,
    outputChars: text.length,
    withinTimeout: durationMs < timeoutMs,
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

  const allowedDomain =
    domainRoute === 'neurokua' ||
    domainRoute === 'gps_kua' ||
    domainRoute === 'fusion' ||
    domainRoute === 'timing' ||
    domainRoute === 'science'
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

export function resolveAstroFollowupRoutingState(params: {
  semanticContextType: string
  currentRoute: DomainRoute
  science: string | null | undefined
  isAstroExact?: boolean
  hasBirthData?: boolean
  subcategory?: string | null
  requestKind?: string | null
}): {
  branch: 'analysis' | null
  route: DomainRoute
  science: string | null
  isAstroExact: boolean
  shouldUseApiBackbone: boolean
  effectiveDomainForApi: DomainRoute
  lockTrigger: 'astro_followup' | 'astro_exact_with_birth_data' | null
  forcedWithoutSubcategory: boolean
  forcedWithUnknownRequestKind: boolean
} {
  const shouldForceAstroExactScienceRoute =
    params.science === 'astrology' &&
    params.isAstroExact === true &&
    params.hasBirthData === true

  if (params.semanticContextType === 'astro_followup' || shouldForceAstroExactScienceRoute) {
    return {
      branch: 'analysis',
      route: 'science',
      science: 'astrology',
      isAstroExact: true,
      shouldUseApiBackbone: true,
      effectiveDomainForApi: 'science',
      lockTrigger:
        params.semanticContextType === 'astro_followup'
          ? 'astro_followup'
          : 'astro_exact_with_birth_data',
      forcedWithoutSubcategory:
        shouldForceAstroExactScienceRoute && !params.subcategory,
      forcedWithUnknownRequestKind:
        shouldForceAstroExactScienceRoute && params.requestKind === 'unknown',
    }
  }

  return {
    branch: null,
    route: params.currentRoute,
    science: params.science ?? null,
    isAstroExact: false,
    shouldUseApiBackbone: false,
    effectiveDomainForApi: params.currentRoute,
    lockTrigger: null,
    forcedWithoutSubcategory: false,
    forcedWithUnknownRequestKind: false,
  }
}

export function resolveFinalFlowPresentation(params: {
  branch?: string | null
  flowStep: FlowStep
  effectiveRequestType: string
  uiAction: UiAction
  isAstroExact: boolean
  exactDataResolved: boolean
  specializedResultHasResult: boolean
  science: string | null | undefined
  isHumanDesignExact: boolean
  hdHasUsableFields: boolean
}): {
  chosenFinalStep: FlowStep
  menuVisible: boolean
  astroExactMenuOverrideBlocked: boolean
  birthUpdateMenuOverrideBlocked: boolean
  hdExactAnalysisOverride: boolean
} {
  const menuVisibleCandidate =
    params.effectiveRequestType === 'micro_month' ||
    params.uiAction === 'open_menu' ||
    params.uiAction === 'restart_flow' ||
    params.flowStep === 'menu'

  const astroExactResultLockedToAnalysis =
    params.isAstroExact &&
    params.exactDataResolved &&
    params.specializedResultHasResult &&
    params.science === 'astrology'

  const astroExactMenuOverrideBlocked =
    astroExactResultLockedToAnalysis && menuVisibleCandidate

  const birthUpdateMenuOverrideBlocked =
    astroExactMenuOverrideBlocked &&
    (params.branch === 'birth_update' || params.uiAction === 'restart_flow')

  if (astroExactResultLockedToAnalysis) {
    return {
      chosenFinalStep: 'analysis',
      menuVisible: false,
      astroExactMenuOverrideBlocked,
      birthUpdateMenuOverrideBlocked,
      hdExactAnalysisOverride: false,
    }
  }

  const hdExactAnalysisOverride =
    !menuVisibleCandidate &&
    params.isHumanDesignExact &&
    params.exactDataResolved &&
    params.hdHasUsableFields

  const finalFlowStep = hdExactAnalysisOverride ? 'analysis' : params.flowStep

  return {
    chosenFinalStep: menuVisibleCandidate ? 'menu' : finalFlowStep,
    menuVisible: menuVisibleCandidate,
    astroExactMenuOverrideBlocked: false,
    birthUpdateMenuOverrideBlocked: false,
    hdExactAnalysisOverride,
  }
}

export async function runHexastraFlow(input: {
  plan?: PlanKey
  responseDepth?: ResponseDepth
  language?: string
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  birthData: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
  practitionerContext?: PractitionerUsageHex
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  uiAction?: UiAction
  conversationId?: string | null
  messages: ChatMessage[]
  evolutionProfile?: Record<string, unknown> | null
  journeyEnabled?: boolean
  analysisMode?: 'science_by_science' | 'hexastra_fusion' | null
  renderMode?: 'simple' | 'approfondie' | 'praticien' | null
  userIntentKey?: string | null
}): Promise<HexastraApiResponse> {
  flowLog('info', 'enter runHexastraFlow', {
    plan: input.plan,
    requestType: input.requestType,
    messages: Array.isArray(input.messages) ? input.messages.length : 0,
    globalTimeoutMs: GLOBAL_FLOW_TIMEOUT_MS,
  })

  const executeFlow = async (): Promise<HexastraApiResponse> => {
    const flowStartMs = Date.now()
    let astroStartMs: number | null = null
    let astroEndMs: number | null = null
    let openAiStartMs: number | null = null
    let openAiEndMs: number | null = null

    // Central input normalization to keep the flow crash-proof
    const normalizedMessages = safeArray<ChatMessage>(input.messages)
    // Resolve contextType: intent sidebar takes precedence over generic 'general'
    const intentContextType: ContextType | null = (() => {
      const k = input.userIntentKey
      if (!k) return null
      const map: Record<string, ContextType> = {
        understand_situation: 'general',
        make_decision: 'decision',
        relationships: 'relationship',
        money_work: 'career',
        inner_state: 'energy',
      }
      return map[k] ?? null
    })()
    const normalizedContextType: ContextType = intentContextType ?? input.contextType ?? 'general'
    const normalizedBirthData = normalizeBirthData(input.birthData)
    const normalizedPractitionerUsage = input.practitionerUsage ?? null
    const normalizedSelectedMenuKey = sanitizeFusionOnlySelectionKey(input.selectedMenuKey ?? null)
    const normalizedSelectedSubmenuKey = sanitizeFusionOnlySelectionKey(input.selectedSubmenuKey ?? null)
    const normalizedUiAction = input.uiAction ?? 'send_message'
    const normalizedJourneyToggle = Boolean(input?.journeyEnabled)
    const normalizedAnalysisMode = normalizeFusionOnlyAnalysisMode(input.analysisMode ?? null)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('[runHexastraFlow] Supabase public env missing')
      throw new Error('Supabase env missing')
    }

    if (!API_URL) {
      logger.warn('[runHexastraFlow] HEXASTRA_API_URL missing — exact-data backbone disabled', {
        hasApiUrl: false,
        apiUrlLength: 0,
        hasApiKey: Boolean(API_KEY),
        apiKeyLength: API_KEY?.length ?? 0,
      })
    } else if (!API_KEY) {
      logger.warn('[runHexastraFlow] HEXASTRA_API_KEY missing — continuing without x-api-key header', {
        hasApiUrl: true,
        apiUrlLength: API_URL.length,
        hasApiKey: false,
        apiKeyLength: 0,
      })
    }

    const conversationId = input.conversationId ?? randomUUID()
    const fallbackLanguage = input.language ?? detectLanguageFromMessages(normalizedMessages, 'fr')
    const fallbackPlan = normalizePlan(input.plan)
    let journeyEnabled = normalizedJourneyToggle
    let orchestrationTrace: OrchestrationTrace | null = null

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
      userIntentKey: input.userIntentKey ?? null,
      resolvedContextType: normalizedContextType,
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

      const publicMenuItems = safeArray(getMenuForMode(mode)).map((item) => normalizeMenuItem(item))
      const contextualMenuItems = [
        ...publicMenuItems,
        ...safeArray(getInternalMenuForMode(mode, plan)).map((item) => normalizeMenuItem(item)),
      ]
      const lastAssistantMessage =
        [...limitedMessages].reverse().find((message) => message.role === 'assistant')?.content ?? ''
      let selectedMenuKey = normalizedSelectedMenuKey
      let selectedSubmenuKey = normalizedSelectedSubmenuKey
      let uiAction = normalizedUiAction

      if (isFusionFollowupRequest(latestUserMessage)) {
        selectedMenuKey = null
        selectedSubmenuKey = null
      }

      const contextualSelection = resolveContextualSelection({
        message: latestUserMessage,
        language: userContext.language ?? fallbackLanguage,
        practitionerMode: mode === 'praticien',
        menuItems: contextualMenuItems,
        selectedMenuKey,
        selectedSubmenuKey,
        lastAssistantMessage,
      })

      if (contextualSelection?.selectedMenuKey !== undefined) {
        selectedMenuKey = contextualSelection.selectedMenuKey
      }

      if (contextualSelection?.selectedSubmenuKey !== undefined) {
        selectedSubmenuKey = contextualSelection.selectedSubmenuKey
      }

      if (contextualSelection?.uiAction) {
        uiAction = contextualSelection.uiAction
      }

      const forceDirectReading = shouldForceDirectReading({
        uiAction,
        selectedMenuKey,
        selectedSubmenuKey,
        latestUserMessage,
      })

      // ── Horoscope priority detection — fires BEFORE general classification ───
      // Must run early to prevent clarification/fallback_general routing.
      const horoscopeIntent = detectHoroscopeIntent(latestUserMessage)
      const isHoroscopeRoute = horoscopeIntent.matched
      const horoscopeVariant = horoscopeIntent.matched ? horoscopeIntent.variant : null

      if (isHoroscopeRoute) {
        flowLog('info', 'HOROSCOPE_INTENT_MATCHED', {
          variant: horoscopeVariant,
          message: latestUserMessage.slice(0, 80),
          action: 'priority_route — bypassing general classification fallback',
        })
      }

      // Pass conversation history so detectContext can detect astro follow-ups
      // (e.g. "non ce n'est pas ça" after an astro_exact reading)
      const semanticCtx = detectContext(latestUserMessage, limitedMessages)

      // Universal classification: intent + science + subcategory + requestKind in one call
      const universalClassif = classifyMessage(latestUserMessage, limitedMessages)
      const explicitScienceIntent = detectExplicitScienceIntent({
        message: latestUserMessage,
        scienceHint: universalClassif.science,
        subcategory: universalClassif.subcategory,
      })
      flowLog('info', 'CLASSIFICATION_RESOLVED', {
        intent: universalClassif.intent,
        science: universalClassif.science,
        subcategory: universalClassif.subcategory,
        requestKind: universalClassif.requestKind,
        needsExactData: universalClassif.needsExactData,
        needsInterpretation: universalClassif.needsInterpretation,
        needsVectorEnrichment: universalClassif.needsVectorEnrichment,
        confidence: universalClassif.confidence,
        domainRoute: universalClassif.domainRoute,
        explicitScienceIntent: explicitScienceIntent?.science ?? null,
      })

      const shouldForceScienceAngleDirectRead =
        Boolean(explicitScienceIntent) &&
        (!contextualSelection || contextualSelection.kind === 'science')

      if (explicitScienceIntent && shouldForceScienceAngleDirectRead) {
        selectedMenuKey = 'science'
        selectedSubmenuKey = explicitScienceIntent.selectionKey
        uiAction = 'send_message'

        flowLog('info', 'SCIENCE_ANGLE_REQUEST_DETECTED', {
          science: explicitScienceIntent.science,
          selectionKey: explicitScienceIntent.selectionKey,
          source: contextualSelection?.kind ?? 'message',
        })
      }

      // astro_followup is treated as astro_exact everywhere downstream
      const isAstroExact =
        semanticCtx.contextType === 'astro_exact' ||
        semanticCtx.contextType === 'astro_followup'

      // human_design_exact: HD chart request ("design humain", "mon hd", "bodygraph", etc.)
      const isHumanDesignExact = semanticCtx.contextType === 'human_design_exact'
      const hasBirthData = isBirthComplete(userContext.birthData)
      const shouldForceAstroExactScienceRoute =
        universalClassif.science === 'astrology' &&
        isAstroExact &&
        hasBirthData

      flowLog('info', 'SCIENCE_ROUTE_SELECTED', {
        science: universalClassif.science,
        isAstroExact,
        isHumanDesignExact,
        hasBirthData,
        shouldForceAstroExactScienceRoute,
        requestKind: universalClassif.requestKind,
        subcategory: universalClassif.subcategory,
        confidence: universalClassif.confidence,
      })

      if (isHumanDesignExact) {
        flowLog('info', 'HUMAN_DESIGN_EXACT_DETECTED', {
          message: latestUserMessage.slice(0, 80),
          confidence: semanticCtx.confidence,
          action: 'routing to HD exact pipeline — no vector search — API backbone forced',
        })
      }

      if (isHoroscopeRoute) {
        flowLog('info', 'HOROSCOPE_ROUTE_SELECTED', {
          variant: horoscopeVariant,
          message: latestUserMessage.slice(0, 80),
        })
      }

      // Direct request detection: skip contextual framing when user already asked a complete question
      // Combines: universal classification + semantic exact routes (astro_exact, human_design_exact, horoscope)
      const isDirectRequest =
        isAstroExact ||
        isHumanDesignExact ||
        isHoroscopeRoute ||
        isActionableDirectRequest(latestUserMessage, universalClassif)

      if (isDirectRequest) {
        flowLog('info', 'DIRECT_REQUEST_DETECTED', {
          message: latestUserMessage.slice(0, 100),
          reason: directRequestSkipReason(latestUserMessage, universalClassif),
          isAstroExact,
          isHumanDesignExact,
          science: universalClassif.science,
          requestKind: universalClassif.requestKind,
          subcategory: universalClassif.subcategory,
        })
      }

      const blockMicroProfile =
        isAstroExact ||
        isHumanDesignExact ||
        isHoroscopeRoute ||
        ((universalClassif.requestKind === 'exact_fact' || universalClassif.requestKind === 'exact_profile') &&
          universalClassif.science !== 'general' &&
          universalClassif.science !== 'fusion') ||
        (semanticCtx.contextType !== 'profile' &&
          semanticCtx.contextType !== 'unknown' &&
          semanticCtx.confidence >= 0.8)

      flowLog('debug', 'semantic_context_detected', {
        contextDetected: semanticCtx.contextType,
        confidence: semanticCtx.confidence,
        fromHistory: semanticCtx.fromHistory ?? false,
        isAstroExact,
        isHumanDesignExact,
        blockMicroProfile,
        message: latestUserMessage.slice(0, 80),
      })

      if (semanticCtx.contextType === 'astro_followup') {
        flowLog('info', '[ASTRO_FOLLOWUP] previous exact astro context detected', {
          message: latestUserMessage.slice(0, 80),
          confidence: semanticCtx.confidence,
          action: 'forcing isAstroExact=true + shouldUseApiBackbone=true',
        })
      }

      const computedFlowStep = computeFlowStep({
        requestType: input.requestType,
        uiAction,
        latestUserMessage,
        hasBirthData: isBirthComplete(userContext.birthData),
        hasShownMicroReadings: Boolean(userContext.session?.hasShownMicroReadings),
        practitionerNeedsUsage: plan === 'practitioner' && !normalizedPractitionerUsage,
        selectedMenuKey,
        selectedSubmenuKey,
        emotionalState: 'neutral',
        timing: 'exploration',
        precision: 'medium',
        blockMicroProfile,
      } as Parameters<typeof computeFlowStep>[0])

      if (blockMicroProfile && computedFlowStep !== 'micro_profile') {
        flowLog('debug', 'blocked_profile_fallback', {
          reason: `semantic context '${semanticCtx.contextType}' blocked micro_profile — routed to '${computedFlowStep}'`,
        })
      }

      const flowStep = isHoroscopeRoute
        ? 'analysis'
        : isDirectRequest &&
            computedFlowStep !== 'sensitive_support' &&
            computedFlowStep !== 'birthdata' &&
            computedFlowStep !== 'practitioner_usage'
          ? 'analysis'
        : forceDirectReading && computedFlowStep !== 'sensitive_support'
          ? 'analysis'
          : computedFlowStep

      if (isHoroscopeRoute) {
        flowLog('info', 'HOROSCOPE_PRIORITY_ROUTE_APPLIED', {
          computedFlowStep,
          forcedFlowStep: 'analysis',
          variant: horoscopeVariant,
          action: 'computeFlowStep result overridden — clarification bypassed',
        })
      }

    const selectedMenu =
      selectedMenuKey && contextualMenuItems
        ? findMenuItem(contextualMenuItems, selectedMenuKey)
        : null

    const selectedSubmenu =
      selectedMenu && selectedSubmenuKey
        ? findMenuItem(selectedMenu.submenu ?? [], selectedSubmenuKey)
        : null

    const selectionExecutionContractPreview =
      getCompatibleSelectionExecutionContract(selectedSubmenuKey ?? selectedMenuKey ?? null)
    const selectedSubscienceDefinition = getScienceSubanalysisDefinition(
      resolveKsSelectionKeyFromMenuKey(selectedSubmenuKey)
    )
    const selectedParentScience =
      selectedMenu?.key === 'science' && selectedSubscienceDefinition?.parentScienceKey
        ? findMenuItem(selectedMenu.submenu ?? [], selectedSubscienceDefinition.parentScienceKey)
        : null
    const selectedMenuLabel =
      selectedParentScience?.label ??
      selectedMenu?.label ??
      selectionExecutionContractPreview?.label ??
      null
    const selectedSubmenuLabel =
      selectedSubmenu?.label ??
      selectionExecutionContractPreview?.label ??
      selectedSubscienceDefinition?.label ??
      null
    const selectedSubmenuPromptHint =
      selectedSubmenu?.promptHint ??
      selectionExecutionContractPreview?.promptHint ??
      selectedSubscienceDefinition?.promptHint ??
      null
    const selectedSubmenuDescription =
      selectedSubmenu?.description ??
      selectionExecutionContractPreview?.contextFrame ??
      selectedSubscienceDefinition?.contextFrame ??
      null
    const selectedContextType =
      selectedSubmenu?.contextType ??
      selectedParentScience?.contextType ??
      selectedMenu?.contextType ??
      normalizedContextType
    const latestDomainRoute =
      selectedSubmenu?.domainRoute ??
      selectedParentScience?.domainRoute ??
      selectedMenu?.domainRoute ??
      null

    const effectiveRequestType =
      uiAction === 'open_menu' || uiAction === 'restart_flow'
        ? 'chat'
        : input.requestType

    const orchestrationLegacyIntent =
      isGreeting
        ? 'greeting'
        : uiAction === 'open_menu'
          ? 'menu'
          : uiAction === 'restart_flow'
            ? 'birth_update'
            : latestUserMessage.trim()
              ? 'analysis'
              : 'conversation'
    const orchestrationNormalized = buildNormalizedInput({
      requestType: effectiveRequestType,
      selectedMenuKey,
      selectedSubmenuKey,
      userMessage: latestUserMessage,
      plan,
      quotaState: 'ok',
      birthData: normalizeBirthData(userContext.birthData),
      language: userContext.language ?? fallbackLanguage,
      memoryAvailable: Boolean(userContext.memory),
      uiAction,
      contextType: selectedContextType,
      practitionerUsage: userContext.practitionerUsage ?? normalizedPractitionerUsage,
      practitionerContext: input.practitionerContext ?? normalizedPractitionerUsage,
      conversationId,
      hasExplicitGuidance: Boolean(selectedMenuKey || selectedSubmenuKey || uiAction !== 'send_message'),
      journeyEnabled,
      messages: limitedMessages,
      analysisMode: normalizedAnalysisMode,
      renderMode: input.renderMode ?? null,
    })
    const orchestration = evaluateOrchestration({
      normalized: orchestrationNormalized,
      legacyIntent: orchestrationLegacyIntent,
      semanticContext: semanticCtx?.contextType ?? null,
    })
    const {
      menuContract,
      policy: orchestrationDecision,
      execution: orchestrationExecution,
      trace,
    } = orchestration
    orchestrationTrace = trace
    flowLog('debug', 'orchestration trace', {
      branch: orchestrationDecision.branch,
      route: isHoroscopeRoute ? 'horoscope_direct' : orchestrationDecision.effectiveRoute,
      effectiveRouteAfterLocks: isHoroscopeRoute
        ? 'horoscope_direct'
        : shouldForceAstroExactScienceRoute
          ? 'science'
          : orchestrationDecision.effectiveRoute,
      renderTemplate: orchestrationExecution.renderTemplate,
      reasons: orchestrationDecision.reasonCodes,
      routeChosenReason: isHoroscopeRoute
        ? 'horoscope_direct'
        : shouldForceAstroExactScienceRoute
          ? 'astro_exact_locked_to_science'
          : orchestrationDecision.effectiveRoute === 'general'
          ? 'fallback_general'
          : 'explicit_match',
      fallbackUsed:
        !isHoroscopeRoute &&
        !shouldForceAstroExactScienceRoute &&
        orchestrationDecision.effectiveRoute === 'general',
      semanticContext: isHoroscopeRoute ? 'horoscope' : (semanticCtx?.contextType ?? 'unknown'),
      hasBirthData,
      shouldForceAstroExactScienceRoute,
      forcedWithoutSubcategory:
        shouldForceAstroExactScienceRoute && !universalClassif.subcategory,
      forcedWithUnknownRequestKind:
        shouldForceAstroExactScienceRoute && universalClassif.requestKind === 'unknown',
    })

    if (isHoroscopeRoute && orchestrationDecision.effectiveRoute === 'general') {
      flowLog('info', 'HOROSCOPE_FALLBACK_BYPASSED', {
        bypassedRoute: orchestrationDecision.effectiveRoute,
        forcedRoute: 'horoscope_direct',
        variant: horoscopeVariant,
      })
    }

    if (shouldForceAstroExactScienceRoute && orchestrationDecision.effectiveRoute === 'general') {
      flowLog('info', 'ASTRO_EXACT_GENERAL_FALLBACK_BYPASSED', {
        science: universalClassif.science,
        isAstroExact,
        hasBirthData,
        subcategory: universalClassif.subcategory,
        requestKind: universalClassif.requestKind,
        bypassedRoute: orchestrationDecision.effectiveRoute,
        forcedRoute: 'science',
      })
    }

    const isBirthNeeded = !hasBirthData
    const needsPreciseBirthContext = requiresPreciseBirthContext(latestUserMessage)
    const isPreciseBirthContextMissing =
      needsPreciseBirthContext && !hasPreciseBirthContext(userContext.birthData)

    if (orchestrationDecision.branch === 'out_of_scope' && input.requestType === 'chat' && !isGreeting) {
      const message = buildScopeRefusalResponse(userContext.language ?? fallbackLanguage)
      flowLog('info', 'flow step final', {
        step: 'out_of_scope',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'out_of_scope', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          journeyEnabled,
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

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
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if ((isBirthNeeded || isPreciseBirthContextMissing) && !isGreeting && input.requestType === 'chat') {
      const message = buildMissingBirthMessage(
        userContext.language ?? fallbackLanguage,
        latestUserMessage,
      )
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
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (contextualSelection?.kind === 'menu' && contextualSelection.immediateMessage && !isHoroscopeRoute) {
      const message = contextualSelection.immediateMessage
      flowLog('info', 'flow step final', {
        step: 'clarification',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        content: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'clarification', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey,
          selectedSubmenuKey,
          sessionStep: 'clarification',
          emotionalState: null,
          timing: null,
          journeyEnabled,
          contextFrame: 'Mode Praticien',
          clarificationQuestion: 'Choisis le numero de l axe que tu veux explorer.',
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    // Log when contextual framing is bypassed for a direct request
    if (
      isDirectRequest &&
      (contextualSelection?.kind === 'open_parent' || contextualSelection?.kind === 'context')
    ) {
      flowLog('info', 'CONTEXT_FRAMING_SKIPPED', {
        kind: contextualSelection.kind,
        message: latestUserMessage.slice(0, 100),
        science: universalClassif.science,
        requestKind: universalClassif.requestKind,
        subcategory: universalClassif.subcategory,
        action: 'DIRECT_EXECUTION_SELECTED',
      })
    }

    if (contextualSelection?.kind === 'open_parent' && selectedMenu && !isDirectRequest) {
      const followUpLine = (userContext.language ?? fallbackLanguage).toLowerCase().startsWith('en')
        ? 'You can now choose a sub-angle or ask your question directly in this frame.'
        : 'Tu peux maintenant choisir un sous-angle ou poser directement ta question dans ce cadre.'
      const message = [
        buildContextSelectionPrompt({
          language: userContext.language ?? fallbackLanguage,
          label: selectedMenu.label,
        }),
        '',
        followUpLine,
      ].join('\n')

      flowLog('info', 'flow step final', {
        step: 'clarification',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        content: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'clarification', completed: false },
        menu: { visible: true, items: publicMenuItems },
        metadata: {
          contextType: selectedMenu.contextType ?? normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey,
          selectedSubmenuKey: null,
          sessionStep: 'clarification',
          emotionalState: null,
          timing: null,
          journeyEnabled,
          contextFrame: selectedMenu.label,
          clarificationQuestion: 'Choisis un sous-angle ou pose directement ta question.',
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (input.requestType === 'chat' && (asksForScienceOverview(latestUserMessage) || asksToReturnToSciences(latestUserMessage))) {
      const message = buildScienceOverviewMessage(userContext.language ?? fallbackLanguage, mode === 'praticien')
      flowLog('info', 'flow step final', {
        step: 'clarification',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        content: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'clarification', completed: false },
        menu: { visible: true, items: publicMenuItems },
        metadata: {
          contextType: 'science',
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey: 'science',
          selectedSubmenuKey: null,
          sessionStep: 'clarification',
          emotionalState: null,
          timing: null,
          journeyEnabled,
          contextFrame: 'Analyse par science',
          clarificationQuestion: 'Choisis la science que tu veux explorer.',
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (
      input.requestType === 'chat' &&
      mode === 'praticien' &&
      /(^|\s)niveau\s*(2|3)\s*$/i.test(latestUserMessage.trim())
    ) {
      const level = latestUserMessage.trim().match(/(2|3)/)?.[1] ?? '2'
      const activeScienceLabel = selectedSubmenu?.label ?? selectedMenu?.label ?? null
      const message = buildPractitionerLevelMessage(level, activeScienceLabel)
      flowLog('info', 'flow step final', {
        step: 'clarification',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        content: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'clarification', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey,
          selectedSubmenuKey,
          sessionStep: 'clarification',
          emotionalState: null,
          timing: null,
          journeyEnabled,
          contextFrame: activeScienceLabel ?? 'Mode Praticien',
          clarificationQuestion: 'Donne maintenant le domaine exact a analyser.',
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (
      input.requestType === 'chat' &&
      uiAction === 'select_submenu_item' &&
      selectedSubmenuKey &&
      selectedSubmenuKey.startsWith('science_') &&
      !selectedSubscienceDefinition
    ) {
      const sciencePrompt = buildScienceSubanalysisMessage(
        selectedSubmenuKey,
        mode === 'praticien',
      )

      if (sciencePrompt) {
        flowLog('info', 'flow step final', {
          step: 'clarification',
          finalMessageLength: sciencePrompt.length,
        })
        return {
          message: sciencePrompt,
          reply: sciencePrompt,
          content: sciencePrompt,
          mode,
          plan,
          conversationId,
          flowState: { step: 'clarification', completed: false },
          menu: { visible: false, items: [] },
          metadata: {
            contextType: 'science',
            practitionerUsage: userContext.practitionerUsage ?? null,
            shouldPersistMemory: false,
            selectedMenuKey,
            selectedSubmenuKey,
            sessionStep: 'clarification',
            emotionalState: null,
            timing: null,
            journeyEnabled,
            contextFrame: selectedSubmenuLabel ?? 'Analyse par science',
            clarificationQuestion: 'Choisis maintenant le sous-angle a explorer.',
            orchestrationTrace,
          },
          updatedEvolutionProfile: input.evolutionProfile ?? null,
        }
      }
    }

    if (
      input.requestType === 'chat' &&
      contextualSelection?.kind === 'context' &&
      !isDirectRequest
    ) {
      const message = buildContextSelectionPrompt({
        language: userContext.language ?? fallbackLanguage,
        label: selectedSubmenuLabel ?? selectedMenuLabel ?? 'cet angle',
        parentLabel:
          selectedSubmenuLabel && selectedMenuLabel && selectedMenuLabel !== selectedSubmenuLabel
            ? selectedMenuLabel
            : null,
      })

      flowLog('info', 'flow step final', {
        step: 'clarification',
        finalMessageLength: message.length,
      })
      return {
        message,
        reply: message,
        content: message,
        mode,
        plan,
        conversationId,
        flowState: { step: 'clarification', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: selectedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          selectedMenuKey,
          selectedSubmenuKey,
          sessionStep: 'clarification',
          emotionalState: null,
          timing: null,
          journeyEnabled,
          contextFrame:
            selectionExecutionContractPreview?.contextFrame ??
            selectedSubmenuLabel ??
            selectedMenuLabel ??
            'Contexte actif',
          clarificationQuestion:
            selectionExecutionContractPreview?.clarificationQuestion ??
            'Pose maintenant ta question dans ce cadre.',
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (isDirectRequest) {
      flowLog('info', 'DIRECT_EXECUTION_SELECTED', {
        message: latestUserMessage.slice(0, 100),
        science: universalClassif.science,
        requestKind: universalClassif.requestKind,
        subcategory: universalClassif.subcategory,
        framingKindBypassed: contextualSelection?.kind ?? 'none',
      })
    }

    const initialDomainRoute = resolveDomainRoute({
      latestUserMessage,
      selectedMenuDomainRoute: latestDomainRoute,
      sessionDomainRoute: userContext.session?.domainRoute ?? null,
      contextType: normalizedContextType,
    })
    const astroFollowupRouting = resolveAstroFollowupRoutingState({
      semanticContextType: semanticCtx.contextType,
      currentRoute: initialDomainRoute,
      science: universalClassif.science,
      isAstroExact,
      hasBirthData,
      subcategory: universalClassif.subcategory,
      requestKind: universalClassif.requestKind,
    })
    const domainRoute = astroFollowupRouting.route

    if (astroFollowupRouting.lockTrigger === 'astro_exact_with_birth_data') {
      flowLog(
        'info',
        astroFollowupRouting.forcedWithoutSubcategory
          ? 'ASTRO_EXACT_ROUTE_FORCED_WITHOUT_SUBCATEGORY'
          : 'ASTRO_EXACT_ROUTE_FORCED',
        {
          science: universalClassif.science,
          isAstroExact,
          hasBirthData,
          needsExactData: universalClassif.needsExactData,
          subcategory: universalClassif.subcategory,
          requestKind: universalClassif.requestKind,
          message: latestUserMessage.slice(0, 100),
          chosenRoute: astroFollowupRouting.route,
          lockedRoute: astroFollowupRouting.route,
          effectiveDomainForApi: astroFollowupRouting.effectiveDomainForApi,
          forcedWithoutSubcategory: astroFollowupRouting.forcedWithoutSubcategory,
          forcedWithUnknownRequestKind: astroFollowupRouting.forcedWithUnknownRequestKind,
          lockTrigger: 'science === astrology && isAstroExact && hasBirthData',
        },
      )
    }

    const retrievalQuery = [
      latestUserMessage,
      selectedMenuLabel,
      selectedSubmenuLabel,
      selectedSubmenuPromptHint ?? selectedMenu?.promptHint ?? null,
      selectedSubmenuDescription ?? selectedMenu?.description ?? null,
    ]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(' | ')

    const retrievalConfig = getAdaptiveRetrievalConfig({
      plan,
      domainRoute,
      query: retrievalQuery || latestUserMessage,
    })
    const retrievalPlan = buildRetrievalPlan({
      plan,
      flowStep,
      domainRoute,
      specializedSource: null,
    }) as any

    // ── Skip vector retrieval based on universal vector policy ────────────────
    // Policy: exact fact/profile → skip; interpretation/guidance → enrich.
    // Legacy astro_exact / human_design_exact → always skip.
    // Horoscope → always skip (structured template, no vector enrichment needed).
    const skipVectorRetrieval = isHoroscopeRoute || resolveVectorSkip(
      isAstroExact,
      isHumanDesignExact,
      universalClassif.requestKind,
      false, // exactDataResolved not yet known at this point — conservative skip
    )
    if (skipVectorRetrieval) {
      const skipReason = isHoroscopeRoute
        ? 'VECTOR_SEARCH_SKIPPED_FOR_HOROSCOPE'
        : isHumanDesignExact
          ? 'VECTOR_SEARCH_SKIPPED_FOR_EXACT_HUMAN_DESIGN'
          : isAstroExact
            ? 'VECTOR_SEARCH_SKIPPED_FOR_EXACT_ASTRO'
            : 'VECTOR_SEARCH_SKIPPED_FOR_EXACT_QUERY'
      flowLog('info', skipReason, {
        semanticContextType: semanticCtx.contextType,
        requestKind: universalClassif.requestKind,
        isAstroExact,
        isHumanDesignExact,
        isHoroscopeRoute,
        reason: isHoroscopeRoute
          ? 'horoscope uses structured template — no vector enrichment needed'
          : 'exact data from Railway is source of truth — vector search unnecessary',
      })
    }

    const retrievalResults =
      !skipVectorRetrieval && VECTOR_STORE_ID && process.env.OPENAI_API_KEY
        ? await multiLayerRetrieval({
            query: retrievalQuery || latestUserMessage,
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

    const resolvedSelectedMenuKey =
      selectedMenuKey ??
      userContext.session?.selectedMenuKey ??
      retrievalPlan?.menu?.selectedMenuKey ??
      null
    const resolvedSelectedSubmenuKey =
      selectedSubmenuKey ??
      userContext.session?.selectedSubmenuKey ??
      retrievalPlan?.menu?.selectedSubmenuKey ??
      null

    const sessionContext = await buildSessionContext({
      supabase,
      conversationId,
      message: latestUserMessage,
      contextType: normalizedContextType,
      selectedMenuKey: resolvedSelectedMenuKey,
      selectedSubmenuKey: resolvedSelectedSubmenuKey,
      practitioner: plan === 'practitioner',
    })

    const menuInstruction = retrievalPlan?.menu?.instruction ?? null
    const selectionExecutionContract =
      selectionExecutionContractPreview ??
      getCompatibleSelectionExecutionContract(selectedSubmenu?.key ?? null) ??
      getCompatibleSelectionExecutionContract(selectedMenuKey ?? null)
    const freeformContract = getKsFreeformExecutionContract(latestUserMessage)
    const effectiveExecutionContract = selectionExecutionContract ?? freeformContract

    // Exact subcategory from orchestration — used to force API call regardless of domain
    const isExactDataSubcategory =
      astroFollowupRouting.shouldUseApiBackbone ||
      requiresExactData(orchestrationExecution.detectedSubcategory)

    // Effective domain for API: prefer orchestration route over legacy 'general' fallback.
    // When orchestration detected 'science' or 'fusion' but legacy classifyQuery returned 'general'
    // (e.g. accent mismatch, unlisted pattern), use the orchestration result.
    const effectiveDomainForApi: DomainRoute =
      semanticCtx.contextType === 'astro_followup'
        ? astroFollowupRouting.effectiveDomainForApi
        : orchestrationExecution.route !== 'general'
          ? orchestrationExecution.route
          : domainRoute

    const domainConfigForApi = getKsDomainConfig(effectiveDomainForApi)

    // Force API call for astro/HD exact requests and any subcategory requiring deterministic data
    const shouldUseApiBackbone =
      astroFollowupRouting.shouldUseApiBackbone ||
      isAstroExact ||
      isHumanDesignExact ||
      isExactDataSubcategory ||
      effectiveExecutionContract?.executionStrategy === 'api_first' ||
      (!effectiveExecutionContract && domainConfigForApi.executionStrategy === 'api_first')

    flowLog('debug', 'api_backbone_resolution', {
      legacyDomainRoute: domainRoute,
      lockedRoute: astroFollowupRouting.route,
      orchestrationRoute: orchestrationExecution.route,
      effectiveDomainForApi,
      isAstroExact,
      hasBirthData,
      isExactDataSubcategory,
      semanticContextType: semanticCtx.contextType,
      detectedSubcategory: orchestrationExecution.detectedSubcategory,
      shouldUseApiBackbone,
      lockTrigger: astroFollowupRouting.lockTrigger,
    })

    if (semanticCtx.contextType === 'astro_followup' && shouldUseApiBackbone) {
      flowLog('info', '[ASTRO_FOLLOWUP] contradiction follow-up forced to astro_exact', {
        message: latestUserMessage.slice(0, 80),
        effectiveDomainForApi,
        shouldUseApiBackbone,
        action: 'reusing exactData or recalling backbone',
      })
    }

    if (isAstroExact || isExactDataSubcategory) {
      const bDataForLog = normalizeBirthData(userContext.birthData)
      const scienceLabel = (universalClassif.science ?? orchestrationExecution.detectedScience ?? 'exact').toUpperCase()
      flowLog('info', `[${scienceLabel}] entering exact resolver`, {
        contextType: semanticCtx.contextType,
        subcategory: orchestrationExecution.detectedSubcategory,
        science: orchestrationExecution.detectedScience,
        effectiveDomainForApi,
        shouldUseApiBackbone,
      })
      flowLog('info', `[${scienceLabel}] stored birth data loaded`, {
        hasFirstName: Boolean(bDataForLog?.firstName),
        hasDate: Boolean(bDataForLog?.date || bDataForLog?.birthDateISO),
        hasTime: Boolean(bDataForLog?.time),
        hasPlace: Boolean(bDataForLog?.place),
      })
      if (shouldUseApiBackbone) {
        flowLog('info', `[${scienceLabel}] calling Hexastra API`, { effectiveDomainForApi })
      }
    }

    astroStartMs = Date.now()
    let specializedResult = shouldUseApiBackbone
      ? await runSpecializedModule({
          domainRoute: effectiveDomainForApi,
          birthData: normalizeBirthData(userContext.birthData),
          practitionerUsage: normalizedPractitionerUsage,
          messages: limitedMessages,
        })
      : null
    astroEndMs = Date.now()

    if (isAstroExact || isExactDataSubcategory) {
      const exactScienceLabel = (universalClassif.science ?? 'exact').toUpperCase()
      const rawKeyCount = specializedResult?.raw ? Object.keys(specializedResult.raw).length : 0
      const rawTotalChars = specializedResult?.raw ? JSON.stringify(specializedResult.raw).length : 0
      if (specializedResult?.raw && rawKeyCount > 0) {
        flowLog('info', `[EXACT] exact data resolved`, {
          science: exactScienceLabel,
          source: specializedResult.source,
          rawKeyCount,
          rawTotalChars,
          astroMs: astroEndMs - astroStartMs,
        })
      } else {
        flowLog('warn', `[EXACT] exact data failed`, {
          science: exactScienceLabel,
          hasSpecializedResult: Boolean(specializedResult),
          hasRaw: Boolean(specializedResult?.raw),
          source: specializedResult?.source ?? null,
          shouldUseApiBackbone,
          astroMs: astroEndMs - astroStartMs,
        })
      }
    }

    if (shouldUseApiBackbone && !specializedResult) {
      const fallbackPublicSummary =
        effectiveDomainForApi === 'neurokua'
          ? 'Module NeuroKua indisponible pour le moment. Je te partage une lecture générale basée sur tes données enregistrées.'
          : effectiveDomainForApi === 'gps_kua'
            ? 'Module GPS indisponible. Je propose une orientation générale en attendant.'
            : 'Je poursuis avec une lecture générale.'

      specializedResult = {
        source: toSpecializedSource(effectiveDomainForApi),
        publicSummary: fallbackPublicSummary,
        raw: null,
      }
      flowLog('warn', 'fallback module used', { effectiveDomainForApi, source: specializedResult.source })
    }
    // ── Exact Data Guard ────────────────────────────────────────────────────
    // For subcategories that require deterministic calculated data (ascendant,
    // houses, HD type, Kua number, etc.), block the LLM response if the API
    // could not resolve the exact data. Never let the LLM hallucinate.
    const detectedSubcategoryForGuard = orchestrationExecution.detectedSubcategory
    const detectedSubcategoriesForReliability =
      orchestrationExecution.detectedSubcategories.length > 0
        ? orchestrationExecution.detectedSubcategories
        : universalClassif.subcategory
          ? [universalClassif.subcategory]
          : detectedSubcategoryForGuard
            ? [detectedSubcategoryForGuard]
            : []
    const exactDataNeeded =
      semanticCtx.contextType === 'astro_followup' ||
      requiresExactData(detectedSubcategoryForGuard)
    const rawExactDataResolved = hasResolvedExactData(specializedResult)

    // Universal reliability check — validates field completeness per science
    const reliabilityResult = isReliableExactData(
      universalClassif.science,
      detectedSubcategoriesForReliability,
      specializedResult?.raw ?? null,
    )
    let exactDataResolved = rawExactDataResolved && reliabilityResult.completeness > 0
    flowLog(reliabilityResult.reliable ? 'info' : 'warn', 'EXACT_DATA_RELIABLE', {
      science: universalClassif.science,
      subcategory: universalClassif.subcategory ?? detectedSubcategoryForGuard,
      requestedSubcategories: detectedSubcategoriesForReliability,
      reliable: reliabilityResult.reliable,
      completeness: reliabilityResult.completeness,
      missingFields: reliabilityResult.missingFields,
      exactDataResolved,
    })

    // ── Pre-build HD compact context for early reliability override ──────────
    // Built here (before selectResponseMode) so that field presence can be used
    // as a secondary reliability signal. The isHumanDesignExactCompact block
    // below will log the full context; this just provides the data early.
    let hdCompactCtx: CompactHDContext | null = null
    if (isHumanDesignExact && rawExactDataResolved && specializedResult?.raw) {
      hdCompactCtx = buildCompactHumanDesignContext(specializedResult.raw)
    }

    if (!exactDataResolved && hdCompactCtx) {
      const hasUsableHdData =
        [
          hdCompactCtx.hdType,
          hdCompactCtx.hdProfile,
          hdCompactCtx.hdAuthority,
          hdCompactCtx.hdStrategy,
          hdCompactCtx.hdDefinition,
          hdCompactCtx.hdIncarnationCross,
        ].some(Boolean) ||
        hdCompactCtx.hdDefinedCenters.length > 0 ||
        hdCompactCtx.hdActivatedGates.length > 0 ||
        hdCompactCtx.hdDefinedChannels.length > 0

      if (hasUsableHdData) {
        exactDataResolved = true
        flowLog('info', 'EXACT_DATA_RESOLUTION_OVERRIDE', {
          science: 'human_design',
          reason: 'compact HD context resolved usable science-specific fields',
        })
      }
    }

    // ── Effective reliability — belt-and-suspenders ───────────────────────────
    // If the reliability check missed some aliases but the compact context resolved
    // key fields (type + authority OR strategy), treat the data as exploitable.
    // This prevents clarification loops when Railway returns valid data.
    let effectiveReliable = reliabilityResult.reliable
    if (!effectiveReliable && exactDataResolved) {
      // HD: compact context is authoritative proof that data is usable
      if (hdCompactCtx) {
        const hdCoreCount = [hdCompactCtx.hdType, hdCompactCtx.hdAuthority, hdCompactCtx.hdStrategy].filter(Boolean).length
        if (hdCoreCount >= 2) {
          effectiveReliable = true
          flowLog('info', 'EXACT_RELIABILITY_OVERRIDE', {
            science: universalClassif.science,
            reason: 'compact context resolved enough core HD fields',
            hdType: hdCompactCtx.hdType,
            hdAuthority: hdCompactCtx.hdAuthority,
            hdStrategy: hdCompactCtx.hdStrategy,
            hdCoreCount,
          })
        }
      }
      // Numerology: life path present in merged sources → override
      if (universalClassif.science === 'numerology' && specializedResult?.raw) {
        const numeRaw = specializedResult.raw as Record<string, unknown>
        const numeBlock = (numeRaw.numerology ?? numeRaw.numerologie ?? numeRaw.numbers ?? {}) as Record<string, unknown>
        const merged = { ...numeBlock, ...numeRaw }
        const hasLifePath = [
          'chemin_de_vie', 'life_path', 'lifePath', 'cheminVie', 'lifePathNumber',
        ].some(k => merged[k] !== undefined && merged[k] !== null && merged[k] !== '')
        if (hasLifePath) {
          effectiveReliable = true
          flowLog('info', 'EXACT_RELIABILITY_OVERRIDE', {
            science: 'numerology',
            reason: 'life path present in raw numerology data',
          })
        }
      }
    }

    const isStrictExactRequestKind =
      universalClassif.requestKind === 'exact_fact' || universalClassif.requestKind === 'exact_profile'

    if (
      exactDataNeeded &&
      exactDataResolved &&
      !effectiveReliable &&
      isStrictExactRequestKind &&
      input.requestType === 'chat'
    ) {
      const partialMessage = buildIncompleteExactDataResponse({
        language: userContext.language ?? fallbackLanguage,
        subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory ?? 'donnée exacte',
        missingExactFields: reliabilityResult.missingFields,
      })
      flowLog('warn', 'exact_data_partial_guard_triggered', {
        subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory,
        requestKind: universalClassif.requestKind,
        missingFields: reliabilityResult.missingFields,
        reliabilityReliable: reliabilityResult.reliable,
        exactDataResolved,
        science: universalClassif.science,
      })
      return {
        message: partialMessage,
        reply: partialMessage,
        mode,
        plan,
        conversationId,
        flowState: { step: 'analysis', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          journeyEnabled,
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    // False plan limitation guard: if data is resolved and reliable, block plan-restriction messages
    const blockFalsePlanLimitation = shouldBlockFalsePlanLimitation(exactDataResolved, effectiveReliable)
    if (blockFalsePlanLimitation) {
      flowLog('info', 'FALSE_PLAN_LIMITATION_BLOCKED', {
        reason: 'exact data is resolved and reliable — any plan limitation message would be a false negative',
        science: universalClassif.science,
        subcategory: universalClassif.subcategory,
      })
    }

    // Response mode selection — passes effective reliability (post compact-context override)
    const responseMode = selectResponseMode({
      requestKind: universalClassif.requestKind,
      subcategory: universalClassif.subcategory ?? detectedSubcategoryForGuard,
      plan,
      exactDataResolved,
      exactDataReliable: effectiveReliable,
      isPedagogical: universalClassif.requestKind === 'clarification',
    })
    // Enneagram always uses interpretive_reading — prose, not structured output
    const effectiveResponseMode =
      semanticCtx.contextType === 'astro_followup' && exactDataResolved
        ? 'calculated_reading'
        : universalClassif.science === 'enneagram' && responseMode === 'calculated_reading'
          ? 'interpretive_reading'
          : responseMode
    if (effectiveResponseMode !== responseMode) {
      flowLog('info', 'ENNEAGRAM_MODE_OVERRIDE', {
        from: responseMode,
        to: effectiveResponseMode,
        science: universalClassif.science,
      })
    }

    flowLog('info', 'RESPONSE_MODE_SELECTED', {
      responseMode: effectiveResponseMode,
      requestKind: universalClassif.requestKind,
      subcategory: universalClassif.subcategory ?? detectedSubcategoryForGuard,
      plan,
      exactDataResolved,
    })

    const responseModeDirective = buildResponseModeDirective(effectiveResponseMode)

    // Anti-contradiction directive: inject when astro follow-up contradicts a value
    const antiContradictionActive = semanticCtx.contextType === 'astro_followup'

    // Build birth data field list for diagnostic (used in refusal message)
    const birthDataForGuard = normalizeBirthData(userContext.birthData)
    const presentBirthFields = [
      birthDataForGuard?.firstName?.trim() ? 'prénom' : null,
      birthDataForGuard?.date?.trim() ?? birthDataForGuard?.birthDateISO?.trim() ? 'date de naissance' : null,
      birthDataForGuard?.time?.trim() ? 'heure de naissance' : null,
      birthDataForGuard?.place?.trim() ? 'lieu de naissance' : null,
    ].filter(Boolean) as string[]
    const needsPreciseTime = ['ascendant', 'maisons', 'theme_natal'].includes(detectedSubcategoryForGuard ?? '')
    const missingBirthFields: string[] = []
    if (!birthDataForGuard?.firstName?.trim()) missingBirthFields.push('prénom')
    if (!birthDataForGuard?.date?.trim() && !birthDataForGuard?.birthDateISO?.trim()) missingBirthFields.push('date de naissance')
    if (needsPreciseTime && !birthDataForGuard?.time?.trim()) missingBirthFields.push("heure de naissance (indispensable pour l'ascendant et les maisons)")
    if (!birthDataForGuard?.place?.trim()) missingBirthFields.push('lieu de naissance')

    // Audit log
    const auditLog = buildExactDataAuditLog({
      subcategory: detectedSubcategoryForGuard,
      requiresExact: exactDataNeeded,
      resolvedExact: exactDataResolved,
      hasRaw: Boolean(specializedResult?.raw && Object.keys(specializedResult.raw).length > 0),
      specializedSource: specializedResult?.source ?? null,
      birthDataPresent: presentBirthFields.length >= 3,
      birthDataFields: presentBirthFields,
    })
    flowLog('info', 'exact_data_audit', auditLog)

    if (isHumanDesignExact && exactDataResolved) {
      flowLog('info', 'HUMAN_DESIGN_EXACT_DATA_RESOLVED', {
        subcategory: detectedSubcategoryForGuard,
        rawKeys: specializedResult?.raw ? Object.keys(specializedResult.raw).length : 0,
        source: specializedResult?.source ?? null,
      })
    }

    if (exactDataNeeded && !exactDataResolved && input.requestType === 'chat') {
      const birthDataComplete = missingBirthFields.length === 0 && presentBirthFields.length >= 3
      const refusalMessage = buildExactDataUnavailableResponse({
        language: userContext.language ?? fallbackLanguage,
        subcategory: detectedSubcategoryForGuard!,
        missingBirthFields,
        birthDataComplete,
      })
      flowLog('warn', 'exact_data_guard_triggered', {
        subcategory: detectedSubcategoryForGuard,
        missingFields: missingBirthFields,
        birthDataComplete,
        specializedSource: specializedResult?.source ?? null,
        isAstroExact,
        isExactDataSubcategory,
        reason: birthDataComplete ? 'api_calculation_failed' : 'missing_birth_fields',
      })
      return {
        message: refusalMessage,
        reply: refusalMessage,
        mode,
        plan,
        conversationId,
        flowState: { step: 'analysis', completed: false },
        menu: { visible: false, items: [] },
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          journeyEnabled,
          orchestrationTrace,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    flowLog('info', 'specializedResult', {
      hasResult: Boolean(specializedResult),
      source: specializedResult?.source,
      shouldUseApiBackbone,
      exactDataNeeded,
      exactDataResolved,
    })
    const selectionModules =
      selectionExecutionContract?.modules ??
      freeformContract?.modules ??
      []
    const selectionSubmodules =
      selectionExecutionContract?.submodules ??
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      arbitration = arbitration || {}
    }

    const selectedPromptHint =
      menuContract?.promptHint ??
      selectionExecutionContract?.promptHint ??
      freeformContract?.promptHint ??
      selectedSubmenuPromptHint ??
      selectedMenu?.promptHint ??
      menuInstruction ??
      null
    const selectedOutputStructure =
      menuContract?.outputStructure ??
      selectionExecutionContract?.outputStructure ??
      freeformContract?.outputStructure ??
      null
    const selectedContextFrame =
      menuContract?.contextFrame ??
      selectionExecutionContract?.contextFrame ??
      freeformContract?.contextFrame ??
      null
    const selectedClarificationQuestion =
      menuContract?.clarificationQuestion ??
      selectionExecutionContract?.clarificationQuestion ??
      freeformContract?.clarificationQuestion ??
      null
    const retrievalProfile = resolveRetrievalProfile({
      domainRoute,
      specializedSource: specializedResult?.source ?? null,
      selectedMenu,
      selectedSubmenu,
      selectionKey: selectedSubmenuKey ?? selectedMenuKey ?? null,
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
      selectionKey: selectedSubmenuKey ?? selectedMenuKey ?? null,
      selectedMenuLabel,
      selectedSubmenuLabel,
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
      selectedMenuLabel,
      selectedSubmenuLabel,
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

    // Build exact data block — capped at 4000 chars to avoid prompt explosion.
    // A full /chart/fusion response can be 50k–150k chars; we only need key fields.
    const exactDataMaxChars = plan === 'practitioner' ? 6000 : plan === 'premium' ? 5000 : 4000
    const astroCompactCtx =
      isAstroExact && exactDataResolved && specializedResult?.raw
        ? buildCompactNatalReadingContext(specializedResult.raw, exactDataMaxChars)
        : null
    const birthDataForAstroExact = normalizeBirthData(userContext.birthData)
    const astroBirthDate =
      birthDataForAstroExact?.date?.trim() ||
      birthDataForAstroExact?.birthDateISO?.slice(0, 10) ||
      null

    const shouldRequireSunSignForAstroExact =
      isAstroExact &&
      exactDataResolved &&
      (
        semanticCtx.contextType === 'astro_followup' ||
        detectedSubcategoryForGuard === 'theme_natal' ||
        detectedSubcategoryForGuard === 'planetes' ||
        asksForCorePlacements(latestUserMessage)
      )

    if (shouldRequireSunSignForAstroExact && astroCompactCtx && !astroCompactCtx.sunSign) {
      const partialMessage = buildIncompleteExactDataResponse({
        language: userContext.language ?? fallbackLanguage,
        subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory ?? 'theme_natal',
        missingExactFields: ['sun'],
      })
      flowLog('error', 'ASTRO_SUN_SIGN_MISSING_GUARD', {
        semanticContextType: semanticCtx.contextType,
        subcategory: detectedSubcategoryForGuard,
        astroBirthDate,
        astroPathMissingFields: astroCompactCtx.missingFields,
      })
      return {
        message: partialMessage,
        reply: partialMessage,
        mode,
        plan,
        conversationId,
        flowState: { step: 'analysis', completed: false },
        menu: { visible: false, items: [] },
        usedLocalFallback: false,
        fallbackType: null,
        metadata: {
          contextType: normalizedContextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: false,
          journeyEnabled,
          orchestrationTrace,
          usedLocalFallback: false,
          fallbackType: null,
        },
        updatedEvolutionProfile: input.evolutionProfile ?? null,
      }
    }

    if (astroCompactCtx && astroBirthDate === '1990-01-24' && astroCompactCtx.sunSign !== 'Verseau') {
      flowLog('error', 'ASTRO_SUN_SIGN_DEBUG_ALERT', {
        zodiacMode: 'tropical',
        expectedSunSign: 'Verseau',
        extractedSunSign: astroCompactCtx.sunSign,
        astroBirthDate,
        birthTime: birthDataForAstroExact?.time ?? null,
        birthPlace: birthDataForAstroExact?.place ?? null,
      })
    }
    const scienceCompactBlock =
      exactDataNeeded && exactDataResolved && specializedResult?.raw
        ? buildCompactExactScienceBlock({
            science: universalClassif.science,
            raw: specializedResult.raw,
            requestedSubcategories: detectedSubcategoriesForReliability,
            maxChars: Math.min(exactDataMaxChars, 1800),
          })
        : null
    const rawExactDataBlock =
      exactDataNeeded && exactDataResolved && specializedResult?.raw
        ? astroCompactCtx?.compactDataBlock ??
          (isHumanDesignExact && hdCompactCtx
            ? hdCompactCtx.compactDataBlock
            : scienceCompactBlock ?? formatExactDataBlockCapped(specializedResult.raw, exactDataMaxChars))
        : null

    // ── Intent-driven profile block ────────────────────────────────────────────
    // When userIntentKey is set and Railway data resolved but exactDataNeeded=false
    // (message classifier returned 'unknown'), inject a compact science block so
    // the AI grounds its reading in the user's actual energetic profile.
    const INTENT_SCIENCE_FOR_BLOCK: Record<string, string> = {
      understand_situation: 'astrology',
      make_decision: 'human_design',
      relationships: 'enneagram',
      money_work: 'numerology',
      inner_state: 'human_design',
    }
    const intentScienceForBlock = input.userIntentKey
      ? (INTENT_SCIENCE_FOR_BLOCK[input.userIntentKey] ?? null)
      : null
    let intentCompactBlock: string | null = null
    if (!exactDataNeeded && intentScienceForBlock && exactDataResolved && specializedResult?.raw) {
      const intentRaw = specializedResult.raw as Record<string, unknown>
      if (intentScienceForBlock === 'astrology') {
        intentCompactBlock = buildCompactNatalReadingContext(intentRaw, 2000).compactDataBlock || null
      } else if (intentScienceForBlock === 'human_design') {
        intentCompactBlock = buildCompactHumanDesignContext(intentRaw)?.compactDataBlock ?? null
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        intentCompactBlock = buildCompactExactScienceBlock({ science: intentScienceForBlock as any, raw: intentRaw, maxChars: 2000 })
      }
      if (intentCompactBlock) {
        flowLog('info', 'INTENT_PROFILE_BLOCK_INJECTED', {
          userIntentKey: input.userIntentKey,
          scienceUsed: intentScienceForBlock,
          blockChars: intentCompactBlock.length,
        })
      }
    }

    // ── Deterministic core placements block (Bug 3) ──────────────────────────
    // When the user explicitly asks for sun/moon/rising, extract these values
    // deterministically from raw data and pin them ABOVE the capped block.
    // This prevents the LLM from reformulating or hallucinating different values.
    let coreAstroBlock: string | null = null
    if (
      isAstroExact &&
      exactDataResolved &&
      specializedResult?.raw &&
      (
        asksForCorePlacements(latestUserMessage) ||
        semanticCtx.contextType === 'astro_followup'
      )
    ) {
      const corePlacements = extractCoreAstroPlacements(specializedResult.raw)
      if (corePlacements.sun || corePlacements.moon || corePlacements.rising) {
        coreAstroBlock = formatCoreAstroBlock(corePlacements, userContext.language ?? 'fr')
        flowLog('info', '[ASTRO_FOLLOWUP] reusing exactData or recalling backbone', {
          sun: corePlacements.sun?.sign ?? null,
          moon: corePlacements.moon?.sign ?? null,
          rising: corePlacements.rising?.sign ?? null,
          allResolved: corePlacements.allResolved,
          missing: corePlacements.missing,
        })
      }
    }

    // ── Astro Exact Compact route flag ────────────────────────────────────────
    // Activates the compact rendering path when:
    // - semantic context is astro_exact or astro_followup
    // - exact data is resolved from Railway
    // Effects: compact system prompt, no knowledge packets, 2-msg history, faster timeout.
    const isAstroExactCompact = isAstroExact && exactDataResolved

    if (isAstroExactCompact) {
      flowLog('info', 'ASTRO_EXACT_ROUTE_SELECTED', {
        subcategory: detectedSubcategoryForGuard,
        semanticContextType: semanticCtx.contextType,
        plan,
        exactDataResolved,
        action: 'compact prompt + no vector knowledge + reduced history',
      })

      if (specializedResult?.raw) {
        const compactCtx =
          astroCompactCtx ?? buildCompactNatalReadingContext(specializedResult.raw)
        flowLog('info', 'ASTRO_COMPACT_CONTEXT_BUILT', {
          sunSign: compactCtx.sunSign,
          moonSign: compactCtx.moonSign,
          risingSign: compactCtx.risingSign,
          risingSource: compactCtx.fieldSources.ascendant ?? null,
          keyAspectsCount: compactCtx.keyAspects.length,
          dominantHousesCount: compactCtx.dominantHouses.length,
          stelliumsCount: compactCtx.stelliums.length,
          compactDataBlockChars: compactCtx.compactDataBlock.length,
        })
      }
    }

    // ── Human Design Exact Compact route flag ─────────────────────────────────
    // Activates when: semantic context is human_design_exact AND exact data resolved.
    // Effects: skip vector search (already done), compact HD context block logged.
    const isHumanDesignExactCompact = isHumanDesignExact && exactDataResolved

    if (isHumanDesignExactCompact) {
      flowLog('info', 'HUMAN_DESIGN_ROUTE_SELECTED', {
        subcategory: detectedSubcategoryForGuard,
        semanticContextType: semanticCtx.contextType,
        plan,
        exactDataResolved,
        action: 'HD compact context — no vector knowledge — reduced history',
      })

      if (hdCompactCtx) {
        flowLog('info', 'HUMAN_DESIGN_COMPACT_CONTEXT_BUILT', {
          hdType: hdCompactCtx.hdType,
          hdProfile: hdCompactCtx.hdProfile,
          hdAuthority: hdCompactCtx.hdAuthority,
          hdStrategy: hdCompactCtx.hdStrategy,
          hdSignature: hdCompactCtx.hdSignature,
          hdNotSelfTheme: hdCompactCtx.hdNotSelfTheme,
          hdDefinedCentersCount: hdCompactCtx.hdDefinedCenters.length,
          hdOpenCentersCount: hdCompactCtx.hdOpenCenters.length,
          hdActivatedGatesCount: hdCompactCtx.hdActivatedGates.length,
          compactDataBlockChars: hdCompactCtx.compactDataBlock.length,
        })
      }
    } else if (isHumanDesignExact && !exactDataResolved) {
      flowLog('warn', 'HUMAN_DESIGN_RENDER_BLOCKED_NO_RELIABLE_DATA', {
        subcategory: detectedSubcategoryForGuard,
        hasSpecializedResult: Boolean(specializedResult),
        hasRaw: Boolean(specializedResult?.raw),
        reason: 'exact data not resolved — cannot guarantee HD values — fallback to general flow',
      })
    }

    // ── Deterministic HD profile block ───────────────────────────────────────
    // When the user asks for their HD profile and exact data is resolved,
    // extract personalityLine/designLine deterministically from raw API data
    // and pin the profile BEFORE the raw data block. Blocks LLM invention.
    let hdProfileBlock: string | null = null
    const isHdProfileSubcategory =
      detectedSubcategoryForGuard === 'profil_hd' ||
      detectedSubcategoryForGuard === 'human_design_exact' ||
      isHumanDesignExact ||
      asksForHDProfile(latestUserMessage)

    if (isHdProfileSubcategory && exactDataResolved && specializedResult?.raw) {
      const hdResult = extractHDProfileFromRaw(specializedResult.raw)
      if (isReliableHumanDesignProfile(hdResult)) {
        hdProfileBlock = formatHDProfileBlock(hdResult, userContext.language ?? 'fr')
        flowLog('info', '[HD_PROFILE] deterministic profile extracted', {
          profile: hdResult.profile,
          personalityLine: hdResult.personalityLine,
          designLine: hdResult.designLine,
          source: hdResult.source,
          calculated: hdResult.calculated,
        })
      } else {
        flowLog('warn', '[HD_PROFILE] could not extract reliable profile from raw data', {
          subcategory: detectedSubcategoryForGuard,
          hdResult,
          rawKeys: specializedResult.raw ? Object.keys(specializedResult.raw).slice(0, 20) : [],
          hint: 'Check /chart/fusion response for personality_line / design_line fields',
        })
      }
    }

    // Exact astro rendering uses only the compact validated block to avoid
    // leaking rich/raw payloads that encourage the model to "complete" values.
    const exactDataBlockForPrompt = isAstroExactCompact
      ? astroCompactCtx?.compactDataBlock ?? coreAstroBlock ?? rawExactDataBlock
      : [coreAstroBlock, rawExactDataBlock ?? intentCompactBlock].filter(Boolean).join('\n\n') || null

    const horoscopeDataBlock = isHoroscopeRoute
      ? buildHoroscopeDataBlock(
          userContext.firstName ?? userContext.name ?? null,
          userContext.birthData ?? null,
          specializedResult?.raw ?? null,
          horoscopeVariant ?? 'daily',
        )
      : null

    const scienceBreakdownAvailable = canAccessScienceBreakdown(plan)
    const activeSelectionScience =
      resolvePublicScienceFromSelectionKey(selectedSubmenuKey) ??
      resolvePublicScienceFromSelectionKey(selectedMenuKey)
    const selectedScienceForPrompt =
      explicitScienceIntent?.science ??
      activeSelectionScience ??
      (domainRoute === 'science' || domainRoute === 'gps_kua'
        ? resolvePublicScienceFromSelectionKey(
            resolveKsSelectionKeyFromMenuKey(selectedSubmenuKey ?? selectedMenuKey),
          ) ?? resolvePublicScienceFromSelectionKey(selectedSubmenuKey ?? selectedMenuKey)
        : null)

    const systemPrompt = buildSystemPrompt({
      plan,
      mode,
      language: userContext.language ?? fallbackLanguage,
      firstName: userContext.firstName ?? userContext.name ?? null,
      contextType: selectedContextType ?? normalizedContextType,
      practitionerUsage: userContext.practitionerUsage ?? null,
      practitionerContext: input.practitionerContext ?? normalizedPractitionerUsage,
      selectedMenuLabel,
      selectedSubmenuLabel,
      selectedPromptHint,
      selectedOutputStructure,
      selectedContextFrame,
      selectedClarificationQuestion,
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
      evolutionProfile: input.evolutionProfile ?? null,
      messages: limitedMessages,
      analysisMode: normalizedAnalysisMode,
      renderMode: input.renderMode ?? null,
      selectedScience: selectedScienceForPrompt,
      selectedSubcategory: universalClassif.subcategory,
      userIntentKey: input.userIntentKey ?? null,
      exactDataBlock: exactDataBlockForPrompt,
      requiresExactData: exactDataNeeded,
      hdProfileBlock,
      isAstroExactCompact: isAstroExactCompact || isHumanDesignExactCompact,
      responseModeDirective,
      antiHallucinationRules: exactDataNeeded ? ANTI_HALLUCINATION_RULES : undefined,
      antiContradictionDirective: antiContradictionActive ? ANTI_CONTRADICTION_DIRECTIVE : undefined,
      isHoroscopeRoute: isHoroscopeRoute || undefined,
      horoscopeVariant: horoscopeVariant ?? undefined,
      horoscopeDataBlock: horoscopeDataBlock ?? undefined,
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
      isAstroExactCompact: isAstroExactCompact || isHumanDesignExactCompact,
      isHoroscopeRoute: isHoroscopeRoute || undefined,
      horoscopeVariant: horoscopeVariant ?? undefined,
    })

    if (isAstroExactCompact || isHumanDesignExactCompact) {
      flowLog('info', isHumanDesignExactCompact ? 'HUMAN_DESIGN_ROUTE_SELECTED' : 'OPENAI_PAYLOAD_REDUCED_FOR_EXACT_ASTRO', {
        systemPromptChars: systemPrompt.length,
        inputMessages: payload.input.length,
        maxOutputTokens: payload.max_output_tokens,
        plan,
        isHumanDesignExactCompact,
        hint: 'compact route: no knowledge packets, last user message only, compact system prompt',
      })
    }

    openAiStartMs = Date.now()

    // ── Per-plan OpenAI timeout ────────────────────────────────────────────
    // Compact route: use a tighter timeout budget since the payload is much smaller.
    // Non-compact astro_exact: bump free plan from 13s to 20s to accommodate the
    // larger exact data block that may still be present.
    // Horoscope: daily=22s, weekly=28s (15-block or 70-block generation).
    const isCompactRoute = isAstroExactCompact || isHumanDesignExactCompact
    const openAiTimeoutMs = isHoroscopeRoute
      ? (horoscopeVariant === 'weekly' ? 28000 : 22000)
      : isCompactRoute
        ? Math.min(resolveOpenAiTimeoutMs(plan), 18000)    // compact: at most 18s (fast path)
        : (isAstroExact || isHumanDesignExact)
          ? Math.max(resolveOpenAiTimeoutMs(plan), 20000)  // non-compact exact: at least 20s
          : resolveOpenAiTimeoutMs(plan)

    // ── Max output tokens ─────────────────────────────────────────────────
    // buildChatPayload already sets the right budget for horoscope (daily=2500, weekly=5000).
    // Compact + free plan: cap at 550 tokens (fast, cheap — planets list + brief reading).
    // Non-compact exact + free plan: cap at 700 tokens (larger data block needs more output).
    const effectiveMaxOutputTokens = isHoroscopeRoute
      ? payload.max_output_tokens
      : isCompactRoute && plan === 'free'
        ? Math.min(payload.max_output_tokens ?? 950, 550)
        : (!isCompactRoute && plan === 'free' && (isAstroExact || isHumanDesignExact || isExactDataSubcategory))
          ? Math.min(payload.max_output_tokens ?? 950, 700)
          : payload.max_output_tokens

    if (isCompactRoute) {
      flowLog('info', 'TIMEOUT_SAFE_MODE_ENABLED', {
        openAiTimeoutMs,
        effectiveMaxOutputTokens,
        plan,
        isAstroExactCompact,
        isHumanDesignExactCompact,
      })
    }

    // ── OpenAI call with astro-exact local fallback on timeout ───────────
    // If Railway already returned reliable data but OpenAI times out, we never
    // show a generic error. Instead we return the calculated values directly.
    let usedLocalFallback = false
    let fallbackType: string | null = null
    let rawMessage: string
    const deterministicSimpleAstroAnswer =
      isAstroExactCompact && astroCompactCtx
        ? buildDeterministicAstroExactAnswer({
            message: latestUserMessage,
            ctx: astroCompactCtx,
            language: userContext.language ?? fallbackLanguage,
            subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory,
            requestKind: universalClassif.requestKind,
          })
        : null
    if (deterministicSimpleAstroAnswer) {
      rawMessage = deterministicSimpleAstroAnswer
      openAiEndMs = openAiStartMs
      flowLog('info', 'ASTRO_EXACT_SIMPLE_FACT_LOCAL_RESPONSE', {
        subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory,
        requestKind: universalClassif.requestKind,
        responseChars: rawMessage.length,
      })
    } else {
      try {
        rawMessage = await callOpenAIResponse({
          ...payload,
          max_output_tokens: effectiveMaxOutputTokens,
          input: payload.input as { role: 'system' | 'user' | 'assistant'; content: string }[],
          timeoutMs: openAiTimeoutMs,
        })
        openAiEndMs = Date.now()
      } catch (openAiErr) {
        openAiEndMs = Date.now()
        const isTimeout = openAiErr instanceof Error && openAiErr.message.includes('timed out')
        if (isTimeout && isAstroExactCompact && exactDataResolved && specializedResult?.raw) {
          flowLog('warn', 'ASTRO_EXACT_LOCAL_FALLBACK_ACTIVATED', {
            openAiMs: openAiEndMs - (openAiStartMs ?? openAiEndMs),
            plan,
            isAstroExactCompact,
            reason: 'OpenAI timeout — Railway data available — serving local deterministic fallback',
            hint: 'User sees calculated values + retry invitation instead of error',
          })
          usedLocalFallback = true
          fallbackType = 'astro_exact_local'
          rawMessage = astroCompactCtx
            ? buildValidatedAstroExactFallback(
                astroCompactCtx,
                userContext.language ?? fallbackLanguage,
                userContext.firstName ?? userContext.name ?? null,
              )
            : buildValidatedAstroExactFallback(
                buildCompactNatalReadingContext(specializedResult.raw, exactDataMaxChars),
                userContext.language ?? fallbackLanguage,
                userContext.firstName ?? userContext.name ?? null,
              )
        } else {
          throw openAiErr
        }
      }
    }

    if (isAstroExactCompact && astroCompactCtx) {
      const enforcedAstroRender = enforceAstroExactRender({
        message: rawMessage,
        ctx: astroCompactCtx,
        language: userContext.language ?? fallbackLanguage,
        firstName: userContext.firstName ?? userContext.name ?? null,
        latestUserMessage: latestUserMessage,
        subcategory: detectedSubcategoryForGuard ?? universalClassif.subcategory,
        requestKind: universalClassif.requestKind,
      })
      if (enforcedAstroRender.usedFallback) {
        flowLog('warn', 'ASTRO_EXACT_RENDER_GUARDRAIL_TRIGGERED', {
          violations: enforcedAstroRender.validation.violations,
          semanticContextType: semanticCtx.contextType,
          fallbackType: enforcedAstroRender.fallbackType,
        })
        usedLocalFallback = true
        fallbackType = enforcedAstroRender.fallbackType
        rawMessage = enforcedAstroRender.message
      }
    }

    const contextMs = astroStartMs ? astroStartMs - flowStartMs : Date.now() - flowStartMs
    const astroMs = (astroStartMs && astroEndMs) ? astroEndMs - astroStartMs : 0
    const openAiMs = (openAiStartMs && openAiEndMs) ? openAiEndMs - openAiStartMs : 0
    const totalMs = Date.now() - flowStartMs

    // ── Post-render guards ────────────────────────────────────────────────────
    // Horoscope output validation: check required blocks are present
    if (isHoroscopeRoute && horoscopeVariant) {
      const horoscopeValidation = validateHoroscopeOutput(rawMessage, horoscopeVariant)
      flowLog(horoscopeValidation.valid ? 'info' : 'warn', 'HOROSCOPE_RENDER_SUCCESS', {
        variant: horoscopeVariant,
        valid: horoscopeValidation.valid,
        missingBlocks: horoscopeValidation.missingBlocks,
        responseChars: rawMessage.length,
      })
    }

    // Detect false plan limitation in the generated response (observability only)
    if (blockFalsePlanLimitation && containsFalsePlanLimitation(rawMessage)) {
      flowLog('warn', 'FALSE_PLAN_LIMITATION_DETECTED_IN_RESPONSE', {
        plan,
        exactDataResolved,
        reliabilityReliable: reliabilityResult.reliable,
        responseExcerpt: rawMessage.slice(0, 120),
        hint: 'LLM output contains a false plan limitation despite exact data being resolved. Review system prompt rules.',
      })
    }

    // Detect response mode mismatch (observability only)
    if (detectResponseModeMismatch(rawMessage, effectiveResponseMode, exactDataResolved)) {
      flowLog('warn', 'RESPONSE_MODE_MISMATCH_DETECTED', {
        expectedMode: effectiveResponseMode,
        requestKind: universalClassif.requestKind,
        responseExcerpt: rawMessage.slice(0, 120),
        hint: 'Response appears to be prose for a fact/list request. Check mode directive injection.',
      })
    }

    if (openAiMs < openAiTimeoutMs) {
      const successLabel = isHumanDesignExactCompact
        ? 'HUMAN_DESIGN_RENDER_SUCCESS'
        : isAstroExactCompact ? 'ASTRO_EXACT_RENDER_SUCCESS' : 'FINAL_RENDER_SUCCESS'
      flowLog('info', successLabel, {
        openAiMs,
        openAiTimeoutMs,
        isAstroExactCompact,
        isHumanDesignExactCompact,
        responseMode: effectiveResponseMode,
        requestKind: universalClassif.requestKind,
      })
    } else {
      const timeoutLabel = isHumanDesignExactCompact
        ? 'HUMAN_DESIGN_RENDER_SUCCESS'
        : isAstroExactCompact ? 'ASTRO_EXACT_RENDER_TIMEOUT' : 'FINAL_RENDER_SUCCESS'
      flowLog('warn', timeoutLabel, {
        openAiMs,
        openAiTimeoutMs,
        isAstroExactCompact,
        isHumanDesignExactCompact,
        responseMode: effectiveResponseMode,
      })
    }

    flowLog('info', '[FLOW] stage durations', {
      contextMs,
      astroMs,
      openAiMs,
      totalMs,
      plan,
      isAstroExact,
      isAstroExactCompact,
      usedLocalFallback,
      fallbackType,
      effectiveMaxOutputTokens,
      exactDataBlockChars: exactDataBlockForPrompt?.length ?? 0,
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

    const hdHasUsableFields =
      hdCompactCtx !== null &&
      [hdCompactCtx.hdType, hdCompactCtx.hdProfile, hdCompactCtx.hdAuthority, hdCompactCtx.hdStrategy].some(Boolean)
    const effectiveScienceForFinalStep =
      astroFollowupRouting.science ?? universalClassif.science ?? null
    const finalFlowPresentation = resolveFinalFlowPresentation({
      branch: orchestrationDecision.branch,
      flowStep,
      effectiveRequestType,
      uiAction,
      isAstroExact,
      exactDataResolved,
      specializedResultHasResult: Boolean(specializedResult),
      science: effectiveScienceForFinalStep,
      isHumanDesignExact,
      hdHasUsableFields,
    })
    const menuVisible = finalFlowPresentation.menuVisible

    const menuItemsReturned = publicMenuItems

    if (menuVisible && (!message || !message.trim())) {
      message =
        "Tes données sont bien enregistrées. Je peux maintenant ouvrir ton profil ou explorer une question."
    }

    const pricingSessionState = buildSmartPricingSessionState({
      messages: limitedMessages,
      lastInteractionTimestamp: new Date().toISOString(),
      previousState: sessionContext.state,
    })
    const smartUpgradeDecision = buildSmartUpgradeDecision({
      plan,
      sessionState: pricingSessionState,
      previousState: sessionContext.state,
    })

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
        contextType: selectedContextType ?? sessionContext.contextType,
        domainRoute: domainRoute,
        activeModule:
          specializedResult?.source ?? activeModules[0] ?? sessionContext.activeModule,
        emotionalState: sessionContext.emotionalState,
        timing: sessionContext.timing,
        precision: sessionContext.precision,
      })

      await writeSessionState(supabase, conversationId, {
        current_theme:
          selectedSubmenuLabel ??
          selectedMenuLabel ??
          sessionContext.currentTheme ??
          null,
        current_context_type: selectedContextType ?? sessionContext.contextType,
        menu_level: resolvedSelectedSubmenuKey ? 'submenu' : 'main',
        last_selected_menu_key: resolvedSelectedMenuKey ?? sessionContext.selectedMenuKey,
        last_selected_submenu_key:
          resolvedSelectedSubmenuKey ?? sessionContext.selectedSubmenuKey,
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
        last_science_used:
          selectedScienceForPrompt ??
          activeSelectionScience ??
          sessionContext.state?.last_science_used ??
          null,
        last_subcategory: universalClassif.subcategory ?? sessionContext.state?.last_subcategory ?? null,
        ...toSessionStatePatch(pricingSessionState, smartUpgradeDecision),
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

    const finalMessage = message
    const finalStepLogMeta = {
      branch: orchestrationDecision.branch,
      uiAction,
      science: effectiveScienceForFinalStep,
      subcategory: universalClassif.subcategory ?? null,
      exactDataResolved,
      specializedResultHasResult: Boolean(specializedResult),
      chosenFinalStep: finalFlowPresentation.chosenFinalStep,
    }

    if (finalFlowPresentation.astroExactMenuOverrideBlocked) {
      flowLog('info', 'ASTRO_EXACT_RESULT_PREVENTED_MENU_OVERRIDE', {
        ...finalStepLogMeta,
        menuVisible: finalFlowPresentation.menuVisible,
      })
    }

    if (finalFlowPresentation.birthUpdateMenuOverrideBlocked) {
      flowLog('info', 'BIRTH_UPDATE_MENU_OVERRIDE_BLOCKED', {
        ...finalStepLogMeta,
        menuVisible: finalFlowPresentation.menuVisible,
      })
    }

    // Force flowState.step to 'analysis' when HD exact data is resolved with usable fields.
    // computeFlowStep() may return 'clarification' because it runs before exactDataResolved
    // is known — this override corrects the step at the final return point.
    if (finalFlowPresentation.hdExactAnalysisOverride && flowStep !== 'analysis') {
      flowLog('info', 'HD_EXACT_FLOW_STEP_OVERRIDE', {
        from: flowStep,
        to: 'analysis',
        reason: 'isHumanDesignExact && exactDataResolved && hdCompactCtx has usable fields',
        hdType: hdCompactCtx?.hdType,
        hdProfile: hdCompactCtx?.hdProfile,
      })
    }

    flowLog('info', 'flow step final', {
      step: finalFlowPresentation.chosenFinalStep,
      finalMessageLength: finalMessage.length,
      menuVisible: finalFlowPresentation.menuVisible,
    })

    return {
      message: finalMessage,
      reply: finalMessage,
      mode,
      plan,
      conversationId,
      usedLocalFallback,
      fallbackType,
      flowState: { step: finalFlowPresentation.chosenFinalStep, completed: true },
      menu: { visible: finalFlowPresentation.menuVisible, items: menuItemsReturned },
      suggestions: finalFlowPresentation.menuVisible
        ? []
        : [],
      metadata: {
        contextType: selectedContextType ?? sessionContext.contextType,
        practitionerUsage: userContext.practitionerUsage ?? null,
        shouldPersistMemory: !finalFlowPresentation.menuVisible,
        selectedMenuKey: resolvedSelectedMenuKey,
        selectedSubmenuKey: resolvedSelectedSubmenuKey,
        contextFrame: selectedContextFrame,
        clarificationQuestion: selectedClarificationQuestion,
        sessionStep: finalFlowPresentation.chosenFinalStep,
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
        orchestrationTrace,
        usedLocalFallback,
        fallbackType,
        upgradeShown: smartUpgradeDecision.shouldShow,
        upgradeReason: smartUpgradeDecision.reason,
        upgradeText: smartUpgradeDecision.message,
        upgradeTargetPlan: smartUpgradeDecision.targetPlan ?? undefined,
        upgradeCtaLabel: smartUpgradeDecision.ctaLabel ?? undefined,
        pricingSessionState,
        fusionOnlyExperience: true,
        scienceBreakdownAvailable,
        advancedAnalysisAvailable: plan === 'practitioner',
        responseDepth:
          plan === 'practitioner'
            ? 'expert'
            : plan === 'premium'
              ? 'long'
              : plan === 'essential'
                ? 'medium'
                : 'short',
      },
      updatedEvolutionProfile: input.evolutionProfile ?? null,
    } as HexastraApiResponse
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
          orchestrationTrace,
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
        orchestrationTrace: null,
      },
      updatedEvolutionProfile: input.evolutionProfile ?? null,
    } as unknown as HexastraApiResponse
  })
}

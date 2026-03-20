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

import { buildNormalizedInput } from '@/lib/hexastra/orchestration/normalizeInput'
import { evaluateOrchestration } from '@/lib/hexastra/orchestration/evaluateOrchestration'
import { buildScopeRefusalResponse } from '@/lib/hexastra/orchestration/scopeRefusalTemplate'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import type { OrchestrationTrace } from '@/lib/hexastra/orchestration/types'
import {
  requiresExactData,
  hasResolvedExactData,
  formatExactDataBlock,
  buildExactDataAuditLog,
} from '@/lib/hexastra/guards/exactDataGuard'
import { buildExactDataUnavailableResponse } from '@/lib/hexastra/guards/exactDataResponse'

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

  const selectedScienceKey = selectedSubmenuKey?.startsWith('science_')
    ? getScienceSubanalysisDefinition(selectedSubmenuKey)?.parentScienceKey ?? selectedSubmenuKey
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
    getKsSelectionExecutionContract(params.selectionKey ?? null) ??
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
    getKsSelectionExecutionContract(params.selectionKey ?? null) ??
    getKsSelectionExecutionContract(params.selectedSubmenu?.key ?? null) ??
    getKsSelectionExecutionContract(params.selectedMenu?.key ?? null)
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
      const lastAssistantMessage =
        [...limitedMessages].reverse().find((message) => message.role === 'assistant')?.content ?? ''
      let selectedMenuKey = normalizedSelectedMenuKey
      let selectedSubmenuKey = normalizedSelectedSubmenuKey
      let uiAction = normalizedUiAction
      const contextualSelection = resolveContextualSelection({
        message: latestUserMessage,
        language: userContext.language ?? fallbackLanguage,
        practitionerMode: mode === 'praticien',
        menuItems,
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

      const semanticCtx = detectContext(latestUserMessage)
      const isAstroExact = semanticCtx.contextType === 'astro_exact'
      const blockMicroProfile =
        isAstroExact ||
        (semanticCtx.contextType !== 'profile' &&
          semanticCtx.contextType !== 'unknown' &&
          semanticCtx.confidence >= 0.8)

      flowLog('debug', 'semantic_context_detected', {
        contextDetected: semanticCtx.contextType,
        confidence: semanticCtx.confidence,
        isAstroExact,
        blockMicroProfile,
        message: latestUserMessage.slice(0, 80),
      })

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

      const flowStep =
        forceDirectReading && computedFlowStep !== 'sensitive_support'
          ? 'analysis'
          : computedFlowStep

    const selectedMenu =
      selectedMenuKey && menuItems
        ? findMenuItem(menuItems, selectedMenuKey)
        : null

    const selectedSubmenu =
      selectedMenu && selectedSubmenuKey
        ? findMenuItem(selectedMenu.submenu ?? [], selectedSubmenuKey)
        : null

    const selectionExecutionContractPreview =
      getKsSelectionExecutionContract(selectedSubmenuKey ?? selectedMenuKey ?? null)
    const selectedSubscienceDefinition = getScienceSubanalysisDefinition(selectedSubmenuKey)
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
      analysisMode: input.analysisMode ?? null,
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
      route: orchestrationDecision.effectiveRoute,
      renderTemplate: orchestrationExecution.renderTemplate,
      reasons: orchestrationDecision.reasonCodes,
      routeChosenReason: orchestrationDecision.effectiveRoute === 'general' ? 'fallback_general' : 'explicit_match',
      fallbackUsed: orchestrationDecision.effectiveRoute === 'general',
      semanticContext: semanticCtx?.contextType ?? 'unknown',
    })

    const isBirthNeeded = !isBirthComplete(userContext.birthData)
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

    if (contextualSelection?.kind === 'menu' && contextualSelection.immediateMessage) {
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

    if (contextualSelection?.kind === 'open_parent' && selectedMenu) {
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
        menu: { visible: true, items: menuItems },
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
        menu: { visible: true, items: menuItems },
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
      contextualSelection?.kind === 'context'
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

    const domainRoute = resolveDomainRoute({
      latestUserMessage,
      selectedMenuDomainRoute: latestDomainRoute,
      sessionDomainRoute: userContext.session?.domainRoute ?? null,
      contextType: normalizedContextType,
    })

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
    const retrievalResults =
      VECTOR_STORE_ID && process.env.OPENAI_API_KEY
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
      getKsSelectionExecutionContract(selectedSubmenu?.key ?? null) ??
      getKsSelectionExecutionContract(selectedMenuKey ?? null)
    const freeformContract = getKsFreeformExecutionContract(latestUserMessage)
    const effectiveExecutionContract = selectionExecutionContract ?? freeformContract

    // Exact subcategory from orchestration — used to force API call regardless of domain
    const isExactDataSubcategory = requiresExactData(orchestrationExecution.detectedSubcategory)

    // Effective domain for API: prefer orchestration route over legacy 'general' fallback.
    // When orchestration detected 'science' or 'fusion' but legacy classifyQuery returned 'general'
    // (e.g. accent mismatch, unlisted pattern), use the orchestration result.
    const effectiveDomainForApi: DomainRoute =
      orchestrationExecution.route !== 'general'
        ? orchestrationExecution.route
        : domainRoute

    const domainConfigForApi = getKsDomainConfig(effectiveDomainForApi)

    // Force API call for astro exact requests and any subcategory requiring deterministic data
    const shouldUseApiBackbone =
      isAstroExact ||
      isExactDataSubcategory ||
      effectiveExecutionContract?.executionStrategy === 'api_first' ||
      (!effectiveExecutionContract && domainConfigForApi.executionStrategy === 'api_first')

    flowLog('debug', 'api_backbone_resolution', {
      legacyDomainRoute: domainRoute,
      orchestrationRoute: orchestrationExecution.route,
      effectiveDomainForApi,
      isAstroExact,
      isExactDataSubcategory,
      detectedSubcategory: orchestrationExecution.detectedSubcategory,
      shouldUseApiBackbone,
    })

    if (isAstroExact || isExactDataSubcategory) {
      const bDataForLog = normalizeBirthData(userContext.birthData)
      flowLog('info', '[ASTRO] entering astrology_exact resolver', {
        contextType: semanticCtx.contextType,
        subcategory: orchestrationExecution.detectedSubcategory,
        science: orchestrationExecution.detectedScience,
        effectiveDomainForApi,
        shouldUseApiBackbone,
      })
      flowLog('info', '[ASTRO] stored birth data loaded', {
        hasFirstName: Boolean(bDataForLog?.firstName),
        hasDate: Boolean(bDataForLog?.date || bDataForLog?.birthDateISO),
        hasTime: Boolean(bDataForLog?.time),
        hasPlace: Boolean(bDataForLog?.place),
      })
      if (shouldUseApiBackbone) {
        flowLog('info', '[ASTRO] calling Hexastra Swiss Ephemeris', { effectiveDomainForApi })
      }
    }

    let specializedResult = shouldUseApiBackbone
      ? await runSpecializedModule({
          domainRoute: effectiveDomainForApi,
          birthData: normalizeBirthData(userContext.birthData),
          practitionerUsage: normalizedPractitionerUsage,
          messages: limitedMessages,
        })
      : null

    if (isAstroExact || isExactDataSubcategory) {
      if (specializedResult?.raw && Object.keys(specializedResult.raw).length > 0) {
        flowLog('info', '[ASTRO] exact data resolved', {
          source: specializedResult.source,
          rawKeys: Object.keys(specializedResult.raw),
        })
      } else {
        flowLog('warn', '[ASTRO] exact data failed', {
          hasSpecializedResult: Boolean(specializedResult),
          hasRaw: Boolean(specializedResult?.raw),
          source: specializedResult?.source ?? null,
          shouldUseApiBackbone,
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
    const exactDataNeeded = requiresExactData(detectedSubcategoryForGuard)
    const exactDataResolved = hasResolvedExactData(specializedResult)

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

    // Build exact data block to inject into the system prompt when raw data is available
    const exactDataBlockForPrompt =
      exactDataNeeded && exactDataResolved && specializedResult?.raw
        ? formatExactDataBlock(specializedResult.raw)
        : null

    const systemPrompt = buildSystemPrompt({
      plan,
      mode,
      language: userContext.language ?? fallbackLanguage,
      firstName: userContext.firstName ?? userContext.name ?? null,
      contextType: normalizedContextType,
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
      analysisMode: input.analysisMode ?? null,
      renderMode: input.renderMode ?? null,
      exactDataBlock: exactDataBlockForPrompt,
      requiresExactData: exactDataNeeded,
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
      uiAction === 'open_menu' ||
      uiAction === 'restart_flow' ||
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
      uiAction === 'open_menu' ||
      uiAction === 'restart_flow' ||
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
          contextType: selectedContextType ?? sessionContext.contextType,
          practitionerUsage: userContext.practitionerUsage ?? null,
          shouldPersistMemory: !menuVisibleReturn,
          selectedMenuKey: resolvedSelectedMenuKey,
          selectedSubmenuKey: resolvedSelectedSubmenuKey,
          contextFrame: selectedContextFrame,
          clarificationQuestion: selectedClarificationQuestion,
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
          orchestrationTrace,
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

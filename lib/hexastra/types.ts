import type { PlanKey } from '@/lib/plans'
import type { OrchestrationTrace } from '@/lib/hexastra/orchestration/types'

export type { ScienceKey, AnalysisMode, RenderMode } from '@/lib/hexastra/sciences/scienceTaxonomy'

export type HexastraMode = 'libre' | 'libre_avance' | 'libre_approfondi' | 'praticien'

export type FlowStep =
  | 'language'
  | 'birthdata'
  | 'birthdata_missing'
  | 'practitioner_usage'
  | 'analysis_mode_selection'
  | 'render_mode_selection'
  | 'micro_profile'
  | 'micro_year'
  | 'micro_month'
  | 'menu'
  | 'clarification'
  | 'analysis'
  | 'decision'
  | 'deep_reading'
  | 'sensitive_support'
  | 'quota_limit'
  | 'out_of_scope'
  | 'error'

export type ContextType =
  | 'general'
  | 'decision'
  | 'relationship'
  | 'career'
  | 'energy'
  | 'wellbeing'
  | 'timing'
  | 'hexastraReading'
  | 'science'
  | 'practitioner'

export type UiAction =
  | 'new_reading'
  | 'open_menu'
  | 'select_menu_item'
  | 'select_submenu_item'
  | 'send_message'
  | 'restart_flow'

export type PractitionerUsageHex = 'self' | 'client' | 'duo' | null
export type PractitionerContext = 'self' | 'client' | 'duo'

export type BirthProfile = {
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

export type DomainRoute =
  | 'general'
  | 'neurokua'
  | 'gps_kua'
  | 'fusion'
  | 'relationship'
  | 'career'
  | 'decision'
  | 'timing'
  | 'wellbeing'
  | 'science'

export type HexastraMenuItem = {
  key: string
  label: string
  description: string
  contextType: ContextType
  domainRoute?: DomainRoute
  promptHint?: string
  submenu?: HexastraMenuItem[]
}

export type HexastraFlowState = {
  step: FlowStep
  completed: boolean
}

export type HexastraApiResponse = {
  message: string
  reply?: string
  content?: string
  mode: HexastraMode
  plan: PlanKey
  flowState: HexastraFlowState
  conversationId: string
  type?: string
  menu?: {
    visible: boolean
    items: HexastraMenuItem[]
  }
  suggestions?: string[]
  metadata?: {
    contextType?: ContextType
    practitionerUsage?: PractitionerUsageHex
    shouldPersistMemory?: boolean
    selectedMenuKey?: string | null
    selectedSubmenuKey?: string | null
    sessionStep?: FlowStep
    emotionalState?: EmotionalState
    timing?: TimingIntensity
    journeyEnabled?: boolean
    lastUserMessage?: string
    userMemoryUpdate?: Record<string, unknown>
    quota?: {
      used?: number
      limit?: number | null
      remaining?: number | null
      resetAt?: string | null
      windowStartedAt?: string | null
    }
    quotaExceeded?: boolean
    resetAt?: string | null
    used?: number
    limit?: number
    upgradeTargetPlan?: string
    upgradeCtaLabel?: string
    premiumPreviewLocked?: boolean
    intentDetected?: string
    responseDepth?: 'short' | 'medium' | 'long' | 'expert'
    ksSummary?: {
      dominantSignal?: string | null
      primaryModule?: string | null
      primaryFamily?: string | null
      sourceLayers?: string[]
      submodules?: string[]
    }
    readingSummary?: {
      detectedTheme?: string | null
      detectedSubtheme?: string | null
      detectedScience?: string | null
      readingLevel?: string | null
      momentType?: string | null
      phaseType?: string | null
      dominantPotential?: string | null
      mainLever?: string | null
      executiveSummary?: string[]
    }
    contextFrame?: string | null
    clarificationQuestion?: string | null
    orchestrationTrace?: OrchestrationTrace
  }
  updatedEvolutionProfile?: Record<string, unknown> | null
}

export type EmotionalState = 'neutral' | 'surcharge' | 'clarification' | 'decision' | 'exploration'
export type PrecisionLevel = 'vague' | 'medium' | 'precise'
export type TimingIntensity = 'exploration' | 'adjustment' | 'bascule' | 'high_tension'

export type SessionStateRecord = {
  current_theme?: string | null
  current_context_type?: ContextType | null
  menu_level?: 'main' | 'submenu' | null
  last_selected_menu_key?: string | null
  last_selected_submenu_key?: string | null
  active_flow?: FlowStep | string | null
  current_domain_route?: DomainRoute | null
  active_module?: string | null
  has_shown_micro_readings?: boolean | null
  last_emotional_state?: EmotionalState | string | null
  last_timing?: TimingIntensity | string | null
  last_precision?: PrecisionLevel | string | null
  last_reading_level?: string | null
  /** Dernière science utilisée (ex: 'astrology', 'numerology') */
  last_science_used?: string | null
  /** Dernière sous-catégorie détectée (ex: 'transits', 'ascendant') */
  last_subcategory?: string | null
  /** Dernier mode d'analyse choisi */
  last_analysis_mode?: 'science_by_science' | 'hexastra_fusion' | null
}

export type UserMemoryRecord = {
  main_goal?: string | null
  life_context?: string | null
  life_phase?: string | null
  dominant_life_zone?: string | null
  dominant_potential?: string | null
  reading_level?: string | null
  last_profile_reading_at?: string | null
  last_year_reading_at?: string | null
  last_month_reading_at?: string | null
}

export type BuildPromptInput = {
  plan: PlanKey
  mode: HexastraMode
  language: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
  firstName?: string | null
  contextType: ContextType
  practitionerUsage: PractitionerUsageHex
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  selectedPromptHint?: string | null
  selectedOutputStructure?: string | null
  selectedContextFrame?: string | null
  selectedClarificationQuestion?: string | null
  ksSummary?: {
    dominantSignal?: string | null
    primaryModule?: string | null
    primaryFamily?: string | null
    sourceLayers?: string[]
    submodules?: string[]
  } | null
  ksSubmoduleSummaries?: string[] | null
  readingSummary?: {
    detectedTheme?: string | null
    detectedSubtheme?: string | null
    detectedScience?: string | null
    readingLevel?: string | null
    momentType?: string | null
    phaseType?: string | null
    dominantPotential?: string | null
    mainLever?: string | null
    executiveSummary?: string[]
  } | null
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  domainRoute?: DomainRoute
  specializedSource?: string | null
  ksNarrativeBrief?: string | null
  flowStep?: FlowStep
  emotionalState?: EmotionalState
  precision?: PrecisionLevel
  retrievalProfile?: string
  responseStrategy?: 'direct_read' | 'clarify' | 'explore' | 'refine'

  /** profondeur de réponse selon le plan */
  responseDepth?: 'short' | 'medium' | 'long' | 'expert'
  /** Mode d'analyse choisi par l'utilisateur au bootstrap */
  analysisMode?: 'science_by_science' | 'hexastra_fusion' | null
  /** Niveau de restitution praticien choisi au bootstrap */
  renderMode?: 'simple' | 'approfondie' | 'praticien' | 'hexastra_horoscope' | null
  /** Science sélectionnée dans le menu (clé du menu level 1) */
  selectedScience?: string | null
  /** Contexte praticien: self = perso, client = pour un client, duo = lecture croisée 2 personnes */
  practitionerContext?: 'self' | 'client' | 'duo' | null
  /**
   * Bloc de données exactes calculées (ascendant, type HD, nombre Kua, etc.).
   * Injecté dans le prompt comme source de vérité — le LLM ne doit jamais contredire ces valeurs.
   */
  exactDataBlock?: string | null
  /** Whether this request requires exact calculated data */
  requiresExactData?: boolean
  /**
   * Bloc profil Human Design déterministe (PersonnalityLine/DesignLine calculé depuis l'API).
   * Injecté AVANT le exactDataBlock pour bloquer toute invention du LLM.
   */
  hdProfileBlock?: string | null
  /**
   * Route compacte dédiée aux lectures astro exactes (thème natal, ascendant, etc.)
   * quand les données API sont résolues. Active un prompt court, pas de KS verbose,
   * pas de vector knowledge, historique réduit à 2 messages.
   */
  isAstroExactCompact?: boolean
  /**
   * Profil d'évolution utilisateur — envoyé depuis le client (localStorage).
   * Injecté dans le prompt système via buildEvolutionContext().
   */
  evolutionProfile?: Record<string, unknown> | null
  /**
   * Directive de mode de réponse (exact_list, exact_card, interpretive_reading, compact_timeout_safe).
   * Générée par selectResponseMode() + buildResponseModeDirective() dans runHexastraFlow.
   * Injectée dans le prompt pour guider le format de sortie du LLM.
   */
  responseModeDirective?: string | null
  /**
   * Règles anti-hallucination (8 règles absolues).
   * Injectées uniquement quand exactDataNeeded=true.
   * Source: ANTI_HALLUCINATION_RULES depuis hallucinationGuard.ts.
   */
  antiHallucinationRules?: string | null
  /**
   * Directive anti-contradiction.
   * Injectée quand l'utilisateur conteste une valeur exacte (astro_followup).
   * Source: ANTI_CONTRADICTION_DIRECTIVE depuis hallucinationGuard.ts.
   */
  antiContradictionDirective?: string | null
  /**
   * Activates the HexAstra Horoscope structured template.
   * When true, buildSystemPrompt returns buildHoroscopeSystemPrompt(input).
   * Bypasses the generic KS system prompt entirely.
   */
  isHoroscopeRoute?: boolean
  /** 'daily' (15 blocs) or 'weekly' (7 × 10 blocs + synthèse). Defaults to 'daily'. */
  horoscopeVariant?: 'daily' | 'weekly' | null
  /**
   * Personalized data block for the horoscope (current date, sun sign, birth date, etc.).
   * Built by buildHoroscopeDataBlock() from birthData + optional Railway raw data.
   */
  horoscopeDataBlock?: string | null
}

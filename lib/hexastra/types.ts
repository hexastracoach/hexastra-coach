import type { PlanKey } from '@/lib/plans'

export type HexastraMode = 'libre' | 'libre_avance' | 'libre_approfondi' | 'praticien'

export type FlowStep =
  | 'language'
  | 'birthdata'
  | 'birthdata_missing'
  | 'practitioner_usage'
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

export type PractitionerUsageHex = 'self' | 'client' | null

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
  firstName?: string | null
  contextType: ContextType
  practitionerUsage: PractitionerUsageHex
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  selectedPromptHint?: string | null
  selectedOutputStructure?: string | null
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  domainRoute?: DomainRoute
  specializedSource?: string | null
  ksNarrativeBrief?: string | null
  flowStep?: FlowStep
  emotionalState?: EmotionalState
  precision?: PrecisionLevel
  retrievalProfile?: string

  /** profondeur de réponse selon le plan */
  responseDepth?: 'short' | 'medium' | 'long' | 'expert'
}

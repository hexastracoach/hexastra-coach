import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type {
  BirthProfile,
  ContextType,
  DomainRoute,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'

export type QuotaState = 'ok' | 'soft_limit' | 'hard_limit'
export type BirthDataCompleteness = 'none' | 'partial' | 'complete'
export type SessionState = 'new' | 'active' | 'returning'
export type UrgencyLevel = 'low' | 'medium' | 'high'
export type DepthRequested = 'light' | 'guided' | 'deep'
export type TimeHorizon = 'present' | 'short_term' | 'mid_term' | 'long_term'
export type FallbackMode =
  | 'none'
  | 'soft_text'
  | 'menu_redirect'
  | 'quota_notice'
  | 'degraded_analysis'
export type RequestBranch =
  | 'greeting'
  | 'menu'
  | 'birth_update'
  | 'conversation'
  | 'analysis'
  | 'clarification'
  | 'out_of_scope'
  | 'quota'
  | 'collect_analysis_choices'
  | 'collect_practitioner_choices'
export type OrchestrationResponseDepth = 'short' | 'medium' | 'long' | 'expert'
export type MenuDataRequirement = 'none' | 'birth_basic' | 'birth_precise'

export type NormalizedInput = {
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  selectedMenu: string | null
  selectedSubmenu: string | null
  userMessage: string
  normalizedUserMessage: string
  plan: PlanKey
  quotaState: QuotaState
  hasBirthData: boolean
  birthDataCompleteness: BirthDataCompleteness
  sessionState: SessionState
  language: string
  memoryAvailable: boolean
  uiAction: UiAction | null
  contextType: ContextType
  practitionerUsage: PractitionerUsageHex
  conversationId: string | null
  hasExplicitGuidance: boolean
  journeyEnabled: boolean
  birthData: BirthProfile | null
  messages: ChatMessage[]
  /** Selected science key from the science-first menu (e.g. 'astrologie') */
  selectedScience: string | null
  /** Selected subcategory key within a science (e.g. 'astro_transits') */
  selectedSubcategory: string | null
  /** How the user prefers to read: per science or full fusion */
  analysisMode: 'science_by_science' | 'hexastra_fusion' | null
  /** Depth of restitution (praticien plan only) */
  renderMode: 'simple' | 'approfondie' | 'praticien' | null
  /** Practitioner context: self = personal, client = for a client, duo = crossed reading (practitioner plan only) */
  practitionerContext: 'self' | 'client' | 'duo' | null
}

export type InferenceResult = {
  explicitIntent: 'greeting' | 'menu' | 'birth_update' | 'analysis' | 'conversation' | 'out_of_scope'
  implicitIntent: string
  dominantDomain: DomainRoute
  urgencyLevel: UrgencyLevel
  depthRequested: DepthRequested
  timeHorizon: TimeHorizon
  needsBirthData: boolean
  needsAnalysisEngine: boolean
  needsExternalCalculation: boolean
  clarificationNeeded: boolean
  scopeAllowed: boolean
  isContextSelectionOnly: boolean
}

export type MenuContract = {
  id: string
  parentId: string | null
  role: string
  contextType: ContextType
  route: DomainRoute
  maxDepth: DepthRequested
  dataRequirement: MenuDataRequirement
  outputStructure: string | null
  contextFrame: string | null
  clarificationQuestion: string | null
  promptHint: string | null
  planCompatibility: PlanKey[]
  fallbackBehavior: FallbackMode[]
}

export type PlanContract = {
  id: PlanKey
  mode: 'libre' | 'libre_avance' | 'libre_approfondi' | 'praticien'
  responseDepth: OrchestrationResponseDepth
  maxDepth: DepthRequested
  maxOutputLength: 'short' | 'medium' | 'long'
  quotaLimit: number | null
  features: {
    microReadings: boolean
    menuNavigation: boolean
    advancedMemory: boolean
    deepAnalysis: boolean
    practitionerStructure: boolean
    clientUsage: boolean
    scienceMenu: boolean
    externalCalculation: boolean
    /** Which analysisMode values are unlocked (empty = none) */
    allowedAnalysisModes: ('science_by_science' | 'hexastra_fusion')[]
    /** Which renderMode values are unlocked (empty = none) */
    allowedRenderModes: ('simple' | 'approfondie' | 'praticien')[]
    /** Whether PractitionerContext (self/client/duo) selection is unlocked */
    allowsPractitionerContext: boolean
  }
  fallback: {
    quotaExceeded: FallbackMode
    missingBirthData: FallbackMode
    planInsufficient: FallbackMode
    incompatibleMenu: FallbackMode
  }
}

export type ScopeVerdict = 'in_universe' | 'ambiguous' | 'out_of_universe'

export type ScopeResult = {
  verdict: ScopeVerdict
  confidence: number
  matchedDomains: string[]
  matchedKeywords: string[]
  reasonCodes: string[]
}

export type PolicyDecision = {
  allowed: boolean
  branch: RequestBranch
  reasonCodes: string[]
  effectiveRoute: DomainRoute
  effectiveDepth: DepthRequested
  useExternalCalculation: boolean
  useMemory: boolean
  askClarification: boolean
  fallbackMode: FallbackMode
  upsellEligible: boolean
  needsReframing: boolean
}

export type ExecutionPlan = {
  branch: RequestBranch
  route: DomainRoute
  renderTemplate: string
  callAnalysisEngine: boolean
  callBirthApi: boolean
  callMemory: boolean
  callConversationFormatter: boolean
  maxOutputLength: 'short' | 'medium' | 'long'
  /** Primary detected subcategory key (highest score) */
  detectedSubcategory: string | null
  /** Primary detected science */
  detectedScience: string | null
  /** All detected subcategory keys, ordered by score */
  detectedSubcategories: string[]
  /** All detected sciences (unique) */
  detectedSciences: string[]
  /** Response type: structured_data | analysis | fusion_reading (primary match) or fused type */
  responseType: 'structured_data' | 'analysis' | 'fusion_reading' | 'structured' | 'explanation' | 'fusion' | null
  /** single | multi | fusion */
  multiAnalysisMode: 'single' | 'multi' | 'fusion'
  /** Fusion type when multi-match */
  fusionType: 'internal' | 'inter_science' | 'hexastra' | null
}

export type OrchestrationTrace = {
  normalized: Pick<
    NormalizedInput,
    | 'requestType'
    | 'selectedMenu'
    | 'selectedSubmenu'
    | 'plan'
    | 'quotaState'
    | 'birthDataCompleteness'
    | 'sessionState'
    | 'language'
    | 'uiAction'
    | 'contextType'
    | 'hasExplicitGuidance'
  >
  inference: InferenceResult
  policy: PolicyDecision
  execution: ExecutionPlan
}

import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import type { MenuContract, NormalizedInput, InferenceResult, ScopeResult } from './types'
import type { SubcategoryDetectionResult } from './detectSubcategory'
import type { DomainRoute } from '@/lib/hexastra/types'

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function inferUrgency(text: string): InferenceResult['urgencyLevel'] {
  if (includesAny(text, [/\burgent\b/, /\bmaintenant\b/, /\bimmediat/i, /\bcrise\b/])) return 'high'
  if (includesAny(text, [/\brapidement\b/, /\bcette semaine\b/, /\bbientot\b/])) return 'medium'
  return 'low'
}

function inferDepth(normalized: NormalizedInput): InferenceResult['depthRequested'] {
  const text = normalized.normalizedUserMessage
  if (
    normalized.selectedSubmenu ||
    includesAny(text, [/\bdetail/i, /\bapprofond/i, /\btheme natal\b/, /\blecture complete\b/, /\bcomplet/i])
  ) {
    return 'deep'
  }
  if (normalized.selectedMenu || normalized.hasExplicitGuidance) return 'guided'
  return 'light'
}

function inferTimeHorizon(text: string): InferenceResult['timeHorizon'] {
  if (includesAny(text, [/\baujourd hui\b/, /\bmaintenant\b/, /\ben ce moment\b/])) return 'present'
  if (includesAny(text, [/\bcette semaine\b/, /\bprochains jours\b/, /\bbientot\b/])) return 'short_term'
  if (includesAny(text, [/\bprochains mois\b/, /\bce mois\b/, /\b3 mois\b/, /\b6 mois\b/])) return 'mid_term'
  if (includesAny(text, [/\bannee\b/, /\blong terme\b/, /\bavenir\b/])) return 'long_term'
  return 'present'
}

function inferNeedsBirthData(normalized: NormalizedInput, menuContract: MenuContract | null, dominantDomain: InferenceResult['dominantDomain']): boolean {
  if (normalized.requestType !== 'chat') return true
  if (menuContract?.dataRequirement === 'birth_basic' || menuContract?.dataRequirement === 'birth_precise') {
    return true
  }
  return dominantDomain === 'fusion' || dominantDomain === 'science' || dominantDomain === 'timing' || dominantDomain === 'neurokua' || dominantDomain === 'gps_kua'
}

function inferExplicitIntent(params: {
  normalized: NormalizedInput
  legacyIntent?: InferenceResult['explicitIntent'] | null
  scopeAllowed: boolean
  isContextSelectionOnly: boolean
}): InferenceResult['explicitIntent'] {
  const { normalized, legacyIntent, scopeAllowed, isContextSelectionOnly } = params
  if (!scopeAllowed) return 'out_of_scope'
  if (legacyIntent) return legacyIntent
  if (isContextSelectionOnly) return 'analysis'
  if (!normalized.normalizedUserMessage) return 'conversation'
  return 'analysis'
}

/** Map a single SubcategoryScience to DomainRoute */
function scienceToDomainRoute(science: string): DomainRoute {
  switch (science) {
    case 'kua': return 'neurokua'
    case 'hexastra_fusion': return 'fusion'
    default: return 'science'
  }
}

/** Resolve dominant domain for multi-science detection */
function resolveDominantDomain(
  subcategoryDetection: SubcategoryDetectionResult | null | undefined,
  menuContract: MenuContract | null,
  userMessage: string,
): DomainRoute {
  if (!subcategoryDetection?.primary) {
    return menuContract?.route ?? classifyQuery(userMessage)
  }
  const uniqueSciences = [...new Set(subcategoryDetection.matches.map((m) => m.science))]
  // Multiple different sciences → fusion route
  if (uniqueSciences.length >= 2) return 'fusion'
  // Single science (possibly multiple subcats) → map to route
  return scienceToDomainRoute(subcategoryDetection.primary.science)
}

export function inferRequest(params: {
  normalized: NormalizedInput
  menuContract: MenuContract | null
  legacyIntent?: InferenceResult['explicitIntent'] | null
  scopeResult?: ScopeResult | null
  subcategoryDetection?: SubcategoryDetectionResult | null
}): InferenceResult {
  const { normalized, menuContract, legacyIntent, scopeResult, subcategoryDetection } = params
  const scopeAllowed = scopeResult ? scopeResult.verdict !== 'out_of_universe' : true

  // PRIORITY ABSOLUTE: subcategory > science > menu > classifyQuery > fallback
  const dominantDomain: DomainRoute = resolveDominantDomain(subcategoryDetection, menuContract, normalized.userMessage)
  const isShortChoice =
    /^\d{1,2}$/.test(normalized.normalizedUserMessage) ||
    /^niveau\s*\d+$/.test(normalized.normalizedUserMessage)
  const isCompositeChoice = /^\d{1,2}\s*(et|&|\+|puis|then)\s*\d{1,2}$/.test(normalized.normalizedUserMessage)
  const userAskedQuestion =
    normalized.userMessage.includes('?') ||
    includesAny(normalized.normalizedUserMessage, [
      /\bquels?\b/,
      /\bquelle\b/,
      /\bcomment\b/,
      /\bpourquoi\b/,
      /\best ce\b/,
      /\bpeux tu\b/,
      /\bdonne moi\b/,
      /\bfais moi\b/,
      /\banalyse\b/,
      /\bexplique\b/,
      /\bdis moi\b/,
      /\bmontre moi\b/,
    ])
  const isContextSelectionOnly =
    Boolean(menuContract) &&
    (normalized.uiAction === 'select_menu_item' ||
      normalized.uiAction === 'select_submenu_item' ||
      isShortChoice ||
      isCompositeChoice ||
      normalized.normalizedUserMessage === (menuContract?.id ?? '').toLowerCase())

  const clarificationNeeded =
    normalized.requestType === 'chat' &&
    Boolean(menuContract) &&
    isContextSelectionOnly &&
    !userAskedQuestion

  const explicitIntent = inferExplicitIntent({
    normalized,
    legacyIntent,
    scopeAllowed,
    isContextSelectionOnly,
  })

  const depthRequested = inferDepth(normalized)
  const needsBirthData = inferNeedsBirthData(normalized, menuContract, dominantDomain)
  const needsExternalCalculation = needsBirthData || dominantDomain === 'science' || dominantDomain === 'timing'
  const implicitIntent =
    clarificationNeeded
      ? 'context_confirmation'
      : menuContract
        ? `analysis_in_${menuContract.role}`
        : dominantDomain
  const needsAnalysisEngine =
    explicitIntent === 'analysis' || explicitIntent === 'menu' || explicitIntent === 'birth_update'

  return {
    explicitIntent,
    implicitIntent,
    dominantDomain,
    urgencyLevel: inferUrgency(normalized.normalizedUserMessage),
    depthRequested,
    timeHorizon: inferTimeHorizon(normalized.normalizedUserMessage),
    needsBirthData,
    needsAnalysisEngine,
    needsExternalCalculation,
    clarificationNeeded,
    scopeAllowed,
    isContextSelectionOnly,
  }
}

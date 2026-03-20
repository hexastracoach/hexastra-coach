import { getPlanContract } from './planContracts'
import { buildFusionContext } from './fusionEngine'
import type { ExecutionPlan, MenuContract, NormalizedInput, PolicyDecision } from './types'
import type { SubcategoryDetectionResult } from './detectSubcategory'
import type { SemanticContextType } from './detectContext'

export function buildExecutionPlan(params: {
  normalized: NormalizedInput
  decision: PolicyDecision
  menuContract: MenuContract | null
  subcategoryDetection?: SubcategoryDetectionResult | null
  semanticContext?: SemanticContextType | null
}): ExecutionPlan {
  const { normalized, decision, menuContract, subcategoryDetection, semanticContext } = params
  const planContract = getPlanContract(normalized.plan)

  function resolveAnalysisTemplate(): string {
    if (menuContract?.outputStructure) return 'guided_analysis'
    switch (semanticContext) {
      case 'current':        return 'situation_reading'
      case 'timing':         return 'timing_reading'
      case 'decision':       return 'decision_guidance'
      case 'compatibility':  return 'compatibility_reading'
      case 'profile':        return 'micro_profile'
      default:               return 'analysis'
    }
  }

  const renderTemplate =
    decision.branch === 'greeting'
      ? 'greeting'
      : decision.branch === 'menu'
        ? 'menu'
        : decision.branch === 'quota'
          ? 'quota_notice'
          : decision.branch === 'out_of_scope'
            ? 'scope_redirect'
            : decision.branch === 'conversation'
              ? 'conversation'
              : decision.branch === 'clarification'
                ? 'clarification'
                : resolveAnalysisTemplate()

  // Resolve fusion context when multiple subcategories are detected
  const matches = subcategoryDetection?.matches ?? []
  const fusion = matches.length >= 1 ? buildFusionContext(matches, normalized.plan) : null

  return {
    branch: decision.branch,
    route: decision.effectiveRoute,
    renderTemplate,
    callAnalysisEngine:
      decision.branch === 'menu' ||
      decision.branch === 'birth_update' ||
      decision.branch === 'clarification' ||
      decision.branch === 'analysis',
    callBirthApi: decision.useExternalCalculation && decision.branch === 'analysis',
    callMemory: decision.useMemory,
    callConversationFormatter: decision.branch === 'analysis' && !normalized.hasExplicitGuidance,
    maxOutputLength: planContract.maxOutputLength,
    // Primary detection (backward compat)
    detectedSubcategory: subcategoryDetection?.subcategory ?? null,
    detectedScience: subcategoryDetection?.science ?? null,
    // Multi-detection
    detectedSubcategories: fusion?.combinedSubcategories ?? (subcategoryDetection?.subcategory ? [subcategoryDetection.subcategory] : []),
    detectedSciences: fusion?.sciences ?? (subcategoryDetection?.science ? [subcategoryDetection.science] : []),
    // Fusion
    responseType: fusion?.responseType ?? subcategoryDetection?.responseType ?? null,
    multiAnalysisMode: fusion?.analysisMode ?? 'single',
    fusionType: fusion?.fusionType ?? null,
  }
}

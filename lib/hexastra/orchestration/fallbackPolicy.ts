import type { FallbackMode, MenuContract, NormalizedInput, PlanContract, InferenceResult } from './types'

export function resolveFallbackMode(params: {
  normalized: NormalizedInput
  inference: InferenceResult
  planContract: PlanContract
  menuContract: MenuContract | null
}): FallbackMode {
  const { normalized, inference, planContract, menuContract } = params

  if (normalized.quotaState === 'hard_limit') return planContract.fallback.quotaExceeded
  if (inference.explicitIntent === 'out_of_scope') return 'menu_redirect'
  if (inference.needsBirthData && normalized.birthDataCompleteness === 'none') {
    return planContract.fallback.missingBirthData
  }
  if (menuContract && !menuContract.planCompatibility.includes(normalized.plan)) {
    return planContract.fallback.planInsufficient
  }
  if (inference.clarificationNeeded) return 'soft_text'
  return 'none'
}

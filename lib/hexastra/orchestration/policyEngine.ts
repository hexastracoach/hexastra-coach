import { getPlanContract } from './planContracts'
import { resolveFallbackMode } from './fallbackPolicy'
import type { InferenceResult, MenuContract, NormalizedInput, PolicyDecision, ScopeResult } from './types'

const DEPTH_RANK = {
  light: 1,
  guided: 2,
  deep: 3,
} as const

function clampDepth(requested: InferenceResult['depthRequested'], allowed: InferenceResult['depthRequested']) {
  return DEPTH_RANK[requested] <= DEPTH_RANK[allowed] ? requested : allowed
}

export function decidePolicy(params: {
  normalized: NormalizedInput
  inference: InferenceResult
  menuContract: MenuContract | null
  scopeResult?: ScopeResult | null
}): PolicyDecision {
  const { normalized, inference, menuContract, scopeResult } = params
  const planContract = getPlanContract(normalized.plan)
  const reasonCodes: string[] = []

  if (normalized.quotaState === 'hard_limit') {
    reasonCodes.push('quota_blocked')
  }
  if (!inference.scopeAllowed) {
    reasonCodes.push('out_of_scope')
  }
  if (inference.clarificationNeeded) {
    reasonCodes.push('clarification_required')
  }
  if (inference.needsBirthData && normalized.birthDataCompleteness !== 'complete') {
    reasonCodes.push('birth_data_missing_or_partial')
  }
  if (menuContract && !menuContract.planCompatibility.includes(normalized.plan)) {
    reasonCodes.push('plan_incompatible_with_menu')
  }

  let branch: PolicyDecision['branch']
  if (normalized.quotaState === 'hard_limit') {
    branch = 'quota'
  } else if (!inference.scopeAllowed) {
    branch = 'out_of_scope'
  } else if (inference.explicitIntent === 'greeting') {
    branch = 'greeting'
  } else if (inference.explicitIntent === 'menu') {
    branch = 'menu'
  } else if (inference.explicitIntent === 'birth_update') {
    branch = 'birth_update'
  } else if (inference.clarificationNeeded) {
    branch = 'clarification'
  } else if (inference.explicitIntent === 'conversation') {
    branch = 'conversation'
  } else {
    branch = 'analysis'
  }

  const fallbackMode = resolveFallbackMode({
    normalized,
    inference,
    planContract,
    menuContract,
  })

  const needsReframing =
    scopeResult?.verdict === 'ambiguous' && branch !== 'out_of_scope' && branch !== 'quota'

  return {
    allowed: branch !== 'out_of_scope' && branch !== 'quota',
    branch,
    reasonCodes,
    effectiveRoute: menuContract?.route ?? inference.dominantDomain,
    effectiveDepth: clampDepth(inference.depthRequested, planContract.maxDepth),
    useExternalCalculation: planContract.features.externalCalculation && inference.needsExternalCalculation,
    useMemory: planContract.features.advancedMemory && normalized.memoryAvailable,
    askClarification: inference.clarificationNeeded,
    fallbackMode,
    upsellEligible:
      normalized.quotaState === 'hard_limit' ||
      Boolean(menuContract && !menuContract.planCompatibility.includes(normalized.plan)),
    needsReframing,
  }
}

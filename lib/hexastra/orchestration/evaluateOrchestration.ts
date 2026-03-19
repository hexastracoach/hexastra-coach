import { resolveMenuContract } from './menuContracts'
import { inferRequest } from './inferRequest'
import { decidePolicy } from './policyEngine'
import { buildExecutionPlan } from './executionPlanner'
import type {
  InferenceResult,
  MenuContract,
  NormalizedInput,
  OrchestrationTrace,
  PolicyDecision,
  ExecutionPlan,
} from './types'

export type OrchestrationEvaluation = {
  menuContract: MenuContract | null
  normalized: NormalizedInput
  inference: InferenceResult
  policy: PolicyDecision
  execution: ExecutionPlan
  trace: OrchestrationTrace
}

export function buildOrchestrationTrace(params: {
  normalized: NormalizedInput
  inference: InferenceResult
  policy: PolicyDecision
  execution: ExecutionPlan
}): OrchestrationTrace {
  const { normalized, inference, policy, execution } = params

  return {
    normalized: {
      requestType: normalized.requestType,
      selectedMenu: normalized.selectedMenu,
      selectedSubmenu: normalized.selectedSubmenu,
      plan: normalized.plan,
      quotaState: normalized.quotaState,
      birthDataCompleteness: normalized.birthDataCompleteness,
      sessionState: normalized.sessionState,
      language: normalized.language,
      uiAction: normalized.uiAction,
      contextType: normalized.contextType,
      hasExplicitGuidance: normalized.hasExplicitGuidance,
    },
    inference,
    policy,
    execution,
  }
}

export function evaluateOrchestration(params: {
  normalized: NormalizedInput
  legacyIntent?: InferenceResult['explicitIntent'] | null
  menuContract?: MenuContract | null
}): OrchestrationEvaluation {
  const menuContract =
    params.menuContract ??
    resolveMenuContract({
      plan: params.normalized.plan,
      selectedMenuKey: params.normalized.selectedMenu,
      selectedSubmenuKey: params.normalized.selectedSubmenu,
    })

  const inference = inferRequest({
    normalized: params.normalized,
    menuContract,
    legacyIntent: params.legacyIntent,
  })

  const policy = decidePolicy({
    normalized: params.normalized,
    inference,
    menuContract,
  })

  const execution = buildExecutionPlan({
    normalized: params.normalized,
    decision: policy,
    menuContract,
  })

  return {
    menuContract,
    normalized: params.normalized,
    inference,
    policy,
    execution,
    trace: buildOrchestrationTrace({
      normalized: params.normalized,
      inference,
      policy,
      execution,
    }),
  }
}

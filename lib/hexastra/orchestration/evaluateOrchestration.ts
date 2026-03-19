import { resolveMenuContract } from './menuContracts'
import { inferRequest } from './inferRequest'
import { decidePolicy } from './policyEngine'
import { buildExecutionPlan } from './executionPlanner'
import { detectScope } from './detectScope'
import type {
  InferenceResult,
  MenuContract,
  NormalizedInput,
  OrchestrationTrace,
  PolicyDecision,
  ExecutionPlan,
  ScopeResult,
} from './types'

export type OrchestrationEvaluation = {
  menuContract: MenuContract | null
  normalized: NormalizedInput
  scope: ScopeResult
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

  const scope = detectScope(params.normalized.userMessage)

  const inference = inferRequest({
    normalized: params.normalized,
    menuContract,
    legacyIntent: params.legacyIntent,
    scopeResult: scope,
  })

  const policy = decidePolicy({
    normalized: params.normalized,
    inference,
    menuContract,
    scopeResult: scope,
  })

  const execution = buildExecutionPlan({
    normalized: params.normalized,
    decision: policy,
    menuContract,
  })

  return {
    menuContract,
    normalized: params.normalized,
    scope,
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

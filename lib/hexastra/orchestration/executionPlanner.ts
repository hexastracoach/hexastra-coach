import { getPlanContract } from './planContracts'
import type { ExecutionPlan, MenuContract, NormalizedInput, PolicyDecision } from './types'

export function buildExecutionPlan(params: {
  normalized: NormalizedInput
  decision: PolicyDecision
  menuContract: MenuContract | null
}): ExecutionPlan {
  const { normalized, decision, menuContract } = params
  const planContract = getPlanContract(normalized.plan)

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
                : menuContract?.outputStructure
                  ? 'guided_analysis'
                  : 'analysis'

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
  }
}

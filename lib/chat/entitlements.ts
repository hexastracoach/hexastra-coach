import type { PlanKey } from '@/lib/plans'
import { getPlanContract } from '@/lib/hexastra/orchestration/planContracts'

export type ChatMode = 'essentiel' | 'premium' | 'praticien'

export type Entitlements = {
  canChat: boolean
  canMicroReadings: boolean
  canPractitionerMode: boolean
  /** Ask personal vs client before starting (practitioner plan only) */
  canAskPractitionerUsage: boolean
  /** Ask science-by-science vs fusion (essentiel / premium / praticien — not free) */
  canSelectAnalysisMode: boolean
  /** Ask render depth (praticien only) */
  canSelectRenderMode: boolean
  /** Ask self / client / duo context (practitioner plan only) */
  canSelectPractitionerContext: boolean
  chatMode: ChatMode
  maxTokens: number
}

export function getEntitlements(plan: PlanKey): Entitlements {
  const contract = getPlanContract(plan)

  const chatMode: ChatMode = contract.features.practitionerStructure
    ? 'praticien'
    : contract.mode === 'libre_approfondi'
    ? 'premium'
    : 'essentiel'

  const maxTokens =
    contract.responseDepth === 'expert' ? 2000 :
    contract.responseDepth === 'long'   ? 1600 :
    contract.responseDepth === 'medium' ? 1400 : 1200

  return {
    canChat: true,
    canMicroReadings: contract.features.microReadings,
    canPractitionerMode: contract.features.practitionerStructure,
    canAskPractitionerUsage: contract.features.clientUsage,
    canSelectAnalysisMode: contract.features.allowedAnalysisModes.length > 1,
    canSelectRenderMode: contract.features.practitionerStructure,
    canSelectPractitionerContext: contract.features.allowsPractitionerContext,
    chatMode,
    maxTokens,
  }
}

import { PLAN_CAPABILITIES } from '@/lib/plans'
import type { PlanKey } from '@/lib/plans'

export type ChatMode = 'essentiel' | 'premium' | 'praticien'

export type Entitlements = {
  canChat: boolean
  canMicroReadings: boolean
  canPractitionerMode: boolean
  /** Ask personal vs client before starting (practitioner plan only) */
  canAskPractitionerUsage: boolean
  chatMode: ChatMode
  maxTokens: number
}

export function getEntitlements(plan: PlanKey): Entitlements {
  const caps = PLAN_CAPABILITIES[plan]

  const chatMode: ChatMode = caps.canUsePractitionerMode
    ? 'praticien'
    : caps.availableModes.includes('premium')
    ? 'premium'
    : 'essentiel'

  const maxTokens =
    caps.analysisDepth === 'expert' ? 2000 :
    caps.analysisDepth === 'high'   ? 1600 :
    caps.analysisDepth === 'medium' ? 1600 : 1600

  return {
    canChat: caps.canUseChat,
    canMicroReadings: true,            // all plans get micro-readings
    canPractitionerMode: caps.canUsePractitionerMode,
    canAskPractitionerUsage: caps.canAnalyzeForClients,
    chatMode,
    maxTokens,
  }
}

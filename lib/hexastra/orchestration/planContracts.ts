import type { PlanKey } from '@/types/subscription'
import type { OrchestrationResponseDepth, PlanContract, QuotaState } from './types'

export const PLAN_CONTRACTS: Record<PlanKey, PlanContract> = {
  free: {
    id: 'free',
    mode: 'libre',
    responseDepth: 'short',
    maxDepth: 'light',
    maxOutputLength: 'short',
    quotaLimit: 10,
    features: {
      microReadings: true,
      menuNavigation: true,
      advancedMemory: false,
      deepAnalysis: false,
      practitionerStructure: false,
      clientUsage: false,
      scienceMenu: false,
      fusionOnlyExperience: true,
      scienceBreakdownAccess: false,
      externalCalculation: true,
      allowedAnalysisModes: [],
      allowedRenderModes: [],
      allowsPractitionerContext: false,
    },
    fallback: {
      quotaExceeded: 'quota_notice',
      missingBirthData: 'soft_text',
      planInsufficient: 'menu_redirect',
      incompatibleMenu: 'menu_redirect',
    },
  },
  essential: {
    id: 'essential',
    mode: 'libre_avance',
    responseDepth: 'medium',
    maxDepth: 'guided',
    maxOutputLength: 'medium',
    quotaLimit: null,
    features: {
      microReadings: true,
      menuNavigation: true,
      advancedMemory: true,
      deepAnalysis: false,
      practitionerStructure: false,
      clientUsage: false,
      scienceMenu: false,
      fusionOnlyExperience: true,
      scienceBreakdownAccess: false,
      externalCalculation: true,
      allowedAnalysisModes: [],
      allowedRenderModes: [],
      allowsPractitionerContext: false,
    },
    fallback: {
      quotaExceeded: 'quota_notice',
      missingBirthData: 'soft_text',
      planInsufficient: 'menu_redirect',
      incompatibleMenu: 'menu_redirect',
    },
  },
  premium: {
    id: 'premium',
    mode: 'libre_approfondi',
    responseDepth: 'long',
    maxDepth: 'deep',
    maxOutputLength: 'long',
    quotaLimit: null,
    features: {
      microReadings: true,
      menuNavigation: true,
      advancedMemory: true,
      deepAnalysis: true,
      practitionerStructure: false,
      clientUsage: false,
      scienceMenu: false,
      fusionOnlyExperience: true,
      scienceBreakdownAccess: false,
      externalCalculation: true,
      allowedAnalysisModes: [],
      allowedRenderModes: ['simple', 'approfondie'],
      allowsPractitionerContext: false,
    },
    fallback: {
      quotaExceeded: 'quota_notice',
      missingBirthData: 'soft_text',
      planInsufficient: 'menu_redirect',
      incompatibleMenu: 'menu_redirect',
    },
  },
  practitioner: {
    id: 'practitioner',
    mode: 'praticien',
    responseDepth: 'expert',
    maxDepth: 'deep',
    maxOutputLength: 'long',
    quotaLimit: null,
    features: {
      microReadings: true,
      menuNavigation: true,
      advancedMemory: true,
      deepAnalysis: true,
      practitionerStructure: true,
      clientUsage: true,
      scienceMenu: false,
      fusionOnlyExperience: true,
      scienceBreakdownAccess: true,
      externalCalculation: true,
      allowedAnalysisModes: [],
      allowedRenderModes: ['simple', 'approfondie', 'praticien'],
      allowsPractitionerContext: true,
    },
    fallback: {
      quotaExceeded: 'quota_notice',
      missingBirthData: 'soft_text',
      planInsufficient: 'menu_redirect',
      incompatibleMenu: 'menu_redirect',
    },
  },
}

export function getPlanContract(plan: PlanKey): PlanContract {
  return PLAN_CONTRACTS[plan] ?? PLAN_CONTRACTS.free
}

export function getPlanQuotaLimit(plan: PlanKey): number | null {
  return getPlanContract(plan).quotaLimit
}

export function getPlanResponseDepth(plan: PlanKey): OrchestrationResponseDepth {
  return getPlanContract(plan).responseDepth
}

export function getQuotaState(params: {
  plan: PlanKey
  blocked?: boolean
  remaining?: number | null
}): QuotaState {
  if (params.blocked) return 'hard_limit'
  const limit = getPlanQuotaLimit(params.plan)
  if (limit === null) return 'ok'
  if (typeof params.remaining === 'number' && params.remaining <= 2) return 'soft_limit'
  return 'ok'
}

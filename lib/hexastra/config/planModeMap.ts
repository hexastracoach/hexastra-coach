import type { PlanKey } from '@/lib/plans'
import type { HexastraMode } from '@/lib/hexastra/types'
import { PLAN_CONTRACTS } from '@/lib/hexastra/orchestration/planContracts'

export type FeatureKey =
  | 'micro_readings'
  | 'menu_navigation'
  | 'advanced_memory'
  | 'deep_analysis'
  | 'practitioner_structure'
  | 'client_usage'
  | 'science_menu'

export type PlanModeConfig = {
  mode: HexastraMode
  maxDepth: 'short' | 'medium' | 'deep' | 'expert'
  features: Record<FeatureKey, boolean>
  longResponses: boolean
}

function toModeDepth(plan: PlanKey): PlanModeConfig['maxDepth'] {
  if (plan === 'practitioner') return 'expert'
  return 'deep'
}

export const PLAN_MODE_MAP: Record<PlanKey, PlanModeConfig> = {
  free: {
    mode: PLAN_CONTRACTS.free.mode,
    maxDepth: toModeDepth('free'),
    longResponses: PLAN_CONTRACTS.free.maxOutputLength !== 'short',
    features: {
      micro_readings: PLAN_CONTRACTS.free.features.microReadings,
      menu_navigation: PLAN_CONTRACTS.free.features.menuNavigation,
      advanced_memory: PLAN_CONTRACTS.free.features.advancedMemory,
      deep_analysis: PLAN_CONTRACTS.free.features.deepAnalysis,
      practitioner_structure: PLAN_CONTRACTS.free.features.practitionerStructure,
      client_usage: PLAN_CONTRACTS.free.features.clientUsage,
      science_menu: PLAN_CONTRACTS.free.features.scienceMenu,
    },
  },
  essential: {
    mode: PLAN_CONTRACTS.essential.mode,
    maxDepth: toModeDepth('essential'),
    longResponses: PLAN_CONTRACTS.essential.maxOutputLength !== 'short',
    features: {
      micro_readings: PLAN_CONTRACTS.essential.features.microReadings,
      menu_navigation: PLAN_CONTRACTS.essential.features.menuNavigation,
      advanced_memory: PLAN_CONTRACTS.essential.features.advancedMemory,
      deep_analysis: PLAN_CONTRACTS.essential.features.deepAnalysis,
      practitioner_structure: PLAN_CONTRACTS.essential.features.practitionerStructure,
      client_usage: PLAN_CONTRACTS.essential.features.clientUsage,
      science_menu: PLAN_CONTRACTS.essential.features.scienceMenu,
    },
  },
  premium: {
    mode: PLAN_CONTRACTS.premium.mode,
    maxDepth: toModeDepth('premium'),
    longResponses: PLAN_CONTRACTS.premium.maxOutputLength !== 'short',
    features: {
      micro_readings: PLAN_CONTRACTS.premium.features.microReadings,
      menu_navigation: PLAN_CONTRACTS.premium.features.menuNavigation,
      advanced_memory: PLAN_CONTRACTS.premium.features.advancedMemory,
      deep_analysis: PLAN_CONTRACTS.premium.features.deepAnalysis,
      practitioner_structure: PLAN_CONTRACTS.premium.features.practitionerStructure,
      client_usage: PLAN_CONTRACTS.premium.features.clientUsage,
      science_menu: PLAN_CONTRACTS.premium.features.scienceMenu,
    },
  },
  practitioner: {
    mode: PLAN_CONTRACTS.practitioner.mode,
    maxDepth: toModeDepth('practitioner'),
    longResponses: PLAN_CONTRACTS.practitioner.maxOutputLength !== 'short',
    features: {
      micro_readings: PLAN_CONTRACTS.practitioner.features.microReadings,
      menu_navigation: PLAN_CONTRACTS.practitioner.features.menuNavigation,
      advanced_memory: PLAN_CONTRACTS.practitioner.features.advancedMemory,
      deep_analysis: PLAN_CONTRACTS.practitioner.features.deepAnalysis,
      practitioner_structure: PLAN_CONTRACTS.practitioner.features.practitionerStructure,
      client_usage: PLAN_CONTRACTS.practitioner.features.clientUsage,
      science_menu: PLAN_CONTRACTS.practitioner.features.scienceMenu,
    },
  },
}

export function getModeForPlan(plan: PlanKey): HexastraMode {
  return PLAN_MODE_MAP[plan]?.mode ?? 'libre'
}

export function canAccessFeature(plan: PlanKey, feature: FeatureKey): boolean {
  return PLAN_MODE_MAP[plan]?.features[feature] ?? false
}

import type { PlanKey } from '@/lib/plans'
import type { HexastraMode } from '@/lib/hexastra/types'

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

export const PLAN_MODE_MAP: Record<PlanKey, PlanModeConfig> = {
  free: {
    mode: 'libre',
    maxDepth: 'deep',
    longResponses: true,
    features: {
      micro_readings: true,
      menu_navigation: true,
      advanced_memory: false,
      deep_analysis: false,
      practitioner_structure: false,
      client_usage: false,
      science_menu: false,
    },
  },
  essential: {
    mode: 'libre_avance',
    maxDepth: 'deep',
    longResponses: true,
    features: {
      micro_readings: true,
      menu_navigation: true,
      advanced_memory: true,
      deep_analysis: false,
      practitioner_structure: false,
      client_usage: false,
      science_menu: true,
    },
  },
  premium: {
    mode: 'libre_approfondi',
    maxDepth: 'deep',
    longResponses: true,
    features: {
      micro_readings: true,
      menu_navigation: true,
      advanced_memory: true,
      deep_analysis: true,
      practitioner_structure: false,
      client_usage: false,
      science_menu: true,
    },
  },
  practitioner: {
    mode: 'praticien',
    maxDepth: 'expert',
    longResponses: true,
    features: {
      micro_readings: true,
      menu_navigation: true,
      advanced_memory: true,
      deep_analysis: true,
      practitioner_structure: true,
      client_usage: true,
      science_menu: true,
    },
  },
}

export function getModeForPlan(plan: PlanKey): HexastraMode {
  return PLAN_MODE_MAP[plan]?.mode ?? 'libre'
}

export function canAccessFeature(plan: PlanKey, feature: FeatureKey): boolean {
  return PLAN_MODE_MAP[plan]?.features[feature] ?? false
}

import type { EmotionalState, FlowStep, PrecisionLevel, TimingIntensity, UiAction } from '@/lib/hexastra/types'

export function detectPrecision(message: string): PrecisionLevel {
  const trimmed = message.trim()
  if (!trimmed) return 'vague'
  if (trimmed.length < 35) return 'vague'
  if (trimmed.length < 140) return 'medium'
  return 'precise'
}

export function computeFlowStep(args: {
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  uiAction?: UiAction
  latestUserMessage: string
  hasBirthData: boolean
  hasShownMicroReadings: boolean
  practitionerNeedsUsage: boolean
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  emotionalState: EmotionalState
  timing: TimingIntensity
  precision: PrecisionLevel
  /** When true, skip micro_profile even if birthData is present and micro readings haven't been shown */
  blockMicroProfile?: boolean
}): FlowStep {
  if (args.practitionerNeedsUsage && args.requestType === 'chat') return 'practitioner_usage'
  if (!args.hasBirthData && args.requestType === 'chat') return 'birthdata'

  if (args.requestType === 'micro_profile') return 'micro_profile'
  if (args.requestType === 'micro_year') return 'micro_year'
  if (args.requestType === 'micro_month') return 'micro_month'

  if (args.uiAction === 'open_menu' || args.uiAction === 'restart_flow') return 'menu'

  // micro_profile is ONLY triggered by explicit requestType === 'micro_profile' (lines 29-31 above).
  // It must NEVER auto-fire based on hasShownMicroReadings — this caused micro_profile to appear
  // on every new session regardless of what the user was asking.

  if (args.emotionalState === 'surcharge' || args.timing === 'high_tension') {
    return 'sensitive_support'
  }

  if (args.selectedSubmenuKey) {
    if (/(analyse complète|lecture complète|approfondir|détaill|detail)/i.test(args.latestUserMessage)) {
      return 'deep_reading'
    }
    return 'analysis'
  }

  if (args.selectedMenuKey && args.precision === 'vague') return 'clarification'

  if (/(je dois choisir|j['’]hésite|que faire|quelle option|trancher)/i.test(args.latestUserMessage)) {
    return 'decision'
  }

  if (/(analyse complète|lecture complète|approfondir|détaill|detail)/i.test(args.latestUserMessage)) {
    return 'deep_reading'
  }

  if (args.precision === 'vague' && !args.selectedMenuKey) return 'menu'
  if (args.precision === 'medium' && !args.selectedSubmenuKey) return 'clarification'

  return 'analysis'
}

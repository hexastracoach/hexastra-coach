import type { BootstrapStep } from './bootstrapTypes'

export type BootstrapOverlayKind = 'none' | 'practitioner_usage'
export type BootstrapMicroRequestType = 'micro_profile' | 'micro_year' | 'micro_month'

const MICRO_REQUEST_BY_STEP: Partial<Record<BootstrapStep, BootstrapMicroRequestType>> = {
  micro_profile_pending: 'micro_profile',
  micro_year_pending: 'micro_year',
  micro_month_pending: 'micro_month',
}

const OVERLAY_BY_STEP: Partial<Record<BootstrapStep, BootstrapOverlayKind>> = {
  practitioner_usage_needed: 'practitioner_usage',
}

export function getBootstrapMicroRequestType(step: BootstrapStep): BootstrapMicroRequestType | null {
  return MICRO_REQUEST_BY_STEP[step] ?? null
}

export function isMicroBootstrapStep(step: BootstrapStep): boolean {
  return Boolean(getBootstrapMicroRequestType(step))
}

export function resolveBootstrapUiState(step: BootstrapStep) {
  const overlayKind = OVERLAY_BY_STEP[step] ?? 'none'
  const isMicroPending = isMicroBootstrapStep(step)
  const chatReady = step !== 'loading'

  return {
    step,
    chatStep: chatReady ? 'conversation_ready' : 'loading',
    chatReady,
    isMicroPending,
    microRequestType: getBootstrapMicroRequestType(step),
    overlayKind,
    showOverlay: overlayKind !== 'none',
    showBirthFormByPolicy: step === 'birthdata_missing',
    isPractitionerUsageRequired: step === 'practitioner_usage_needed',
  } as const
}

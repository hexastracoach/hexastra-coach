import type { PlanKey } from '@/types/subscription'
import { getPlanContract } from './planContracts'

export type MissingChoice = 'analysis_mode' | 'render_mode' | 'practitioner_context'

export type PractitionerChoiceResolution = {
  /** Choices still required before analysis can start */
  missingChoices: MissingChoice[]
  /** The single next question to ask (most-priority missing choice) */
  nextChoice: MissingChoice | null
  /** True when all required choices are collected */
  choicesResolved: boolean
}

/**
 * Pure function — given plan + current user choices,
 * returns which choices are still missing and what to ask next.
 *
 * Priority: practitioner_context > analysis_mode > render_mode
 */
export function resolvePractitionerChoices(params: {
  plan: PlanKey
  analysisMode: 'science_by_science' | 'hexastra_fusion' | null
  renderMode: 'simple' | 'approfondie' | 'praticien' | null
  practitionerContext: 'self' | 'client' | 'duo' | null
}): PractitionerChoiceResolution {
  const { plan, analysisMode, renderMode, practitionerContext } = params
  const contract = getPlanContract(plan)
  const { features } = contract

  const missing: MissingChoice[] = []

  // 1. PractitionerContext: required when plan allows it
  if (features.allowsPractitionerContext && !practitionerContext) {
    missing.push('practitioner_context')
  }

  // 2. AnalysisMode: required when plan allows at least one mode
  if (features.allowedAnalysisModes.length > 0 && !analysisMode) {
    missing.push('analysis_mode')
  }

  // 3. RenderMode: required when plan allows at least one mode
  if (features.allowedRenderModes.length > 0 && !renderMode) {
    missing.push('render_mode')
  }

  return {
    missingChoices: missing,
    nextChoice: missing[0] ?? null,
    choicesResolved: missing.length === 0,
  }
}

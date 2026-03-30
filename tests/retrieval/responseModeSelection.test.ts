import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { buildExactDataRequestFromRetrievalPlan } from '@/lib/hexastra/retrieval/exactDataHintMapper'
import { prioritizeStructuredSignals } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildStructuredSignals } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { isReliableExactData } from '@/lib/exact-data/reliability'
import {
  HEXASTRA_PIPELINE_EVAL_CASES,
  type HexastraPipelineEvalCase,
} from '../evals/hexastraPipelineEvalCases'

function getEvalCase(id: string): HexastraPipelineEvalCase {
  const evalCase = HEXASTRA_PIPELINE_EVAL_CASES.find((entry) => entry.id === id)
  if (!evalCase) {
    throw new Error(`Missing eval case: ${id}`)
  }
  return evalCase
}

function asRawRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function buildSelection(id: string) {
  const evalCase = getEvalCase(id)
  const classification = classifyMessage(evalCase.query)
  const userIntent = classifyUserIntent(evalCase.query)
  const context = {
    hasBirthData: evalCase.hasBirthData ?? true,
    domainRoute: classification.domainRoute,
    selectedSubCategory: classification.subcategory,
    flowType: classification.intent,
  }
  const retrievalPlan = buildRetrievalPlanFromQuery(evalCase.query, context)
  const exactDataRequest = buildExactDataRequestFromRetrievalPlan(retrievalPlan)
  const normalizedExactData = normalizeFusionExactDataWithDiagnostics(evalCase.rawExactData ?? null)
  const structuredSignals = buildStructuredSignals({
    retrievalPlan,
    retrievalResults: evalCase.retrievalResults,
    exactData: evalCase.rawExactData ?? null,
    normalizedExactData: normalizedExactData.exactData,
    exactDataDiagnostics: normalizedExactData.diagnostics,
  })
  const prioritized = prioritizeStructuredSignals({
    structuredSignals,
    retrievalPlan,
    intent: userIntent,
  })
  const rawRecord = asRawRecord(evalCase.rawExactData)
  const reliability = rawRecord
    ? isReliableExactData(classification.science, classification.subcategory, rawRecord)
    : null
  const exactDataResolved =
    prioritized.signals.some((signal) => signal.sourceType === 'exact_data') ||
    Boolean(reliability && reliability.completeness > 0)

  const selection = selectResponseModeSelection({
    userMessage: evalCase.query,
    requestKind: classification.requestKind,
    subcategory: classification.subcategory,
    plan: 'premium',
    exactDataResolved,
    exactDataReliable: reliability?.reliable,
    isPedagogical: classification.requestKind === 'clarification',
    isFusionIntent: isFusionIntent(userIntent),
    retrievalPlan,
    structuredSignals: prioritized.signals,
    scoredSignals: prioritized.scoredSignals,
    normalizedExactData: normalizedExactData.exactData,
    intent: userIntent,
  })

  return {
    evalCase,
    retrievalPlan,
    exactDataRequest,
    prioritized,
    selection,
  }
}

describe('selectResponseModeSelection', () => {
  it('keeps a fusion mode while allowing an exact timing opening for a broad current-life question', () => {
    const { selection } = buildSelection('decision_current_state')

    expect(selection.responseMode).toBe('concise_fusion_answer')
    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningSubCategory).toBe('astro_transits_current')
  })

  it('keeps a stable fusion opening for "qu est-ce que je traverse"', () => {
    const { selection } = buildSelection('energy_what_i_am_crossing')

    expect(selection.responseMode).toBe('concise_fusion_answer')
    expect(selection.dominantOpeningScience).toBe('fusion')
    expect(selection.dominantOpeningSubCategory).toBe('fusion_life_situation')
  })

  it('opens a solar return question with the astro exact-data block', () => {
    const { selection } = buildSelection('timing_solar_return')

    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningScience).toBe('astro')
    expect(selection.dominantOpeningSubCategory).toBe('astro_solar_return')
  })

  it('opens a progressions question with the astro progressions block', () => {
    const { selection } = buildSelection('timing_progressions')

    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningSubCategory).toBe('astro_progressions')
  })

  it('opens a personal year question with numerology exact data', () => {
    const { selection } = buildSelection('timing_personal_year')

    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningScience).toBe('numerology')
    expect(selection.dominantOpeningSubCategory).toBe('num_personal_year')
  })

  it('keeps direct HD knowledge grounded in the HD exact block', () => {
    const { selection } = buildSelection('direct_hd_type')

    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningScience).toBe('human_design')
    expect(selection.dominantOpeningSubCategory).toBe('hd_type')
  })

  it('opens Kua directions with the exact Kua block', () => {
    const { selection } = buildSelection('kua_favorable_directions')

    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningScience).toBe('kua')
    expect(selection.dominantOpeningSubCategory).toBe('kua_favorable_directions')
  })

  it('keeps "mon type" soft without forcing an opening dominant science', () => {
    const { selection } = buildSelection('ambiguous_type')

    expect(selection.responseMode).toBe('concise_fusion_answer')
    expect(selection.dominantOpeningScience).toBeNull()
    expect(selection.dominantOpeningSubCategory).toBeNull()
  })

  it('keeps "ma compatibilite" in a flexible mode without over-forcing a hard opening', () => {
    const { selection } = buildSelection('relationship_compatibility_generic')

    expect(selection.responseMode).toBe('concise_fusion_answer')
    expect(['fusion', null]).toContain(selection.dominantOpeningScience)
  })
})

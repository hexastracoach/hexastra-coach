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

  it('forces the yearly priority answer mode with an exact annual opening', () => {
    const retrievalPlan = {
      sciences: ['fusion', 'astro', 'numerology', 'human_design', 'kua'],
      subCategories: [
        'annual_guidance',
        'astro_annual_themes',
        'astro_solar_return',
        'astro_progressions',
        'num_personal_year',
        'hd_current_transits',
        'kua_annual_influence',
      ],
      vectorNamespaces: ['ks_fusion_globaux'],
      scienceTags: ['global', 'transverse'],
      exactDataHints: [
        'include_transits',
        'include_progressions',
        'include_solar_return',
        'include_lunar_return',
        'include_human_design_transits',
        'include_numerology_cycles',
        'include_kua_directions',
      ],
      weightedMatches: [
        { subCategory: 'annual_guidance', science: 'fusion', score: 9.4, retrievalPriority: 92 },
        { subCategory: 'astro_annual_themes', science: 'astro', score: 8.7, retrievalPriority: 75 },
        { subCategory: 'astro_progressions', science: 'astro', score: 8.3, retrievalPriority: 70 },
        { subCategory: 'num_personal_year', science: 'numerology', score: 8.1, retrievalPriority: 90 },
      ],
      preferredTopK: 8,
      fallbackUsed: false,
      dominantScience: 'fusion',
      dominantSubCategory: 'annual_guidance',
      ambiguities: [],
    }

    expect(buildExactDataRequestFromRetrievalPlan(retrievalPlan)).toMatchObject({
      includeTransits: true,
      includeProgressions: true,
      includeSolarReturn: true,
      includeLunarReturn: true,
      includeHumanDesignTransits: true,
      includeNumerologyCycles: true,
      includeKuaDirections: true,
    })

    const annualSignal = {
      science: 'fusion',
      subCategory: 'annual_guidance',
      sourceType: 'exact_data' as const,
      exactDataSection: 'solarReturn' as const,
      value: { annual_theme: 'consolidation et simplification' },
    }

    const selection = selectResponseModeSelection({
      userMessage: 'quelles sont mes priorites pour 2026 ?',
      requestKind: 'yearly_priorities',
      subcategory: 'annual_guidance',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
      isFusionIntent: true,
      retrievalPlan,
      structuredSignals: [
        annualSignal,
        {
          science: 'astro',
          subCategory: 'astro_annual_themes',
          sourceType: 'exact_data',
          exactDataSection: 'solarReturn',
          value: { annual_theme: 'consolidation et simplification' },
        },
        {
          science: 'numerology',
          subCategory: 'num_personal_year',
          sourceType: 'exact_data',
          exactDataSection: 'numerologyCycles',
          value: { yearly: { personalYearNumber: 8 } },
        },
      ],
      scoredSignals: [
        {
          ...annualSignal,
          priorityScore: 12.4,
        },
      ],
      intent: 'fusion_general_question',
    })

    expect(selection.responseMode).toBe('yearly_priority_answer')
    expect(selection.dominantOpeningSource).toBe('exact_data')
    expect(selection.dominantOpeningSubCategory).toBe('annual_guidance')
    expect(selection.reasoningTags).toEqual(
      expect.arrayContaining([
        'yearly_priority_override',
        'exact_data_backed_interpretive_query',
        'yearly_priority_exact_opening',
      ]),
    )
  })

  it.each([
    'quel axe choisir ?',
    'quel axe je dois vraiment choisir ?',
    'quel cap choisir ?',
    'quelle direction prendre ?',
    'ou je perds mon energie ?',
    'ou orienter mon energie ?',
    'ce que je dois laisser tomber',
  ])('keeps yearly strategic variants out of concise_fusion_answer: %s', (query) => {
    const classification = classifyMessage(query)
    const userIntent = classifyUserIntent(query)
    const annualSignal = {
      science: 'fusion',
      subCategory: 'annual_guidance',
      sourceType: 'exact_data' as const,
      exactDataSection: 'solarReturn' as const,
      value: { summary: 'tri strategique, recentrage du cap et fermeture des dispersions' },
    }

    const selection = selectResponseModeSelection({
      userMessage: query,
      requestKind: classification.requestKind,
      subcategory: classification.subcategory,
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
      isFusionIntent: isFusionIntent(userIntent),
      retrievalPlan: {
        sciences: ['fusion', 'astro', 'numerology', 'human_design', 'kua'],
        subCategories: [
          'annual_guidance',
          'astro_solar_return',
          'astro_progressions',
          'num_personal_year',
          'hd_current_transits',
          'kua_annual_influence',
        ],
        vectorNamespaces: ['ks_fusion_globaux'],
        scienceTags: ['global', 'transverse'],
        exactDataHints: [
          'include_transits',
          'include_progressions',
          'include_solar_return',
          'include_lunar_return',
          'include_human_design_transits',
          'include_numerology_cycles',
          'include_kua_directions',
        ],
        weightedMatches: [
          { subCategory: 'annual_guidance', science: 'fusion', score: 9.2, retrievalPriority: 92 },
          { subCategory: 'astro_solar_return', science: 'astro', score: 8.1, retrievalPriority: 75 },
        ],
        preferredTopK: 8,
        fallbackUsed: false,
        dominantScience: 'fusion',
        dominantSubCategory: 'annual_guidance',
        ambiguities: [],
      },
      structuredSignals: [
        annualSignal,
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          exactDataSection: 'humanDesignTransits',
          value: { current_cycle: 'engager ton energie sur moins de fronts' },
        },
      ],
      scoredSignals: [
        {
          ...annualSignal,
          priorityScore: 12.1,
        },
      ],
      intent: userIntent,
    })

    expect(classification.requestKind).toBe('yearly_priorities')
    expect(classification.subcategory).toBe('annual_guidance')
    expect(selection.responseMode).toBe('yearly_priority_answer')
    expect(selection.responseMode).not.toBe('concise_fusion_answer')
    expect(selection.reasoningTags).toEqual(
      expect.arrayContaining([
        'yearly_priority_override',
        'exact_data_backed_interpretive_query',
      ]),
    )
  })
})

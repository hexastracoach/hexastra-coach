import { describe, expect, it } from 'vitest'
import { prioritizeStructuredSignals } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import type { RetrievalPlan } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'

function makePlan(overrides?: Partial<RetrievalPlan>): RetrievalPlan {
  return {
    sciences: ['astro', 'numerology', 'fusion'],
    subCategories: ['astro_transits_current', 'num_personal_year', 'fusion_general'],
    vectorNamespaces: ['astrologie/transits', 'numerologie/cycles', 'ks_fusion_globaux'],
    scienceTags: ['astrolex', 'numerologie', 'global'],
    exactDataHints: ['include_transits', 'include_numerology_cycles'],
    weightedMatches: [
      { subCategory: 'astro_transits_current', science: 'astro', score: 9.4, retrievalPriority: 96 },
      { subCategory: 'num_personal_year', science: 'numerology', score: 7.8, retrievalPriority: 90 },
      { subCategory: 'fusion_general', science: 'fusion', score: 5.1, retrievalPriority: 70 },
    ],
    preferredTopK: 7,
    fallbackUsed: false,
    dominantScience: 'astro',
    dominantSubCategory: 'astro_transits_current',
    ambiguities: [],
    ...overrides,
  }
}

describe('prioritizeStructuredSignals', () => {
  it('moves dominant exactData signals before weaker retrieval and fusion blocks', () => {
    const structuredSignals: StructuredSignal[] = [
      {
        science: 'fusion',
        subCategory: 'fusion_general',
        score: 5.1,
        sourceType: 'fusion',
        value: { summary: 'global' },
      },
      {
        science: 'numerology',
        subCategory: 'num_personal_year',
        score: 7.8,
        sourceType: 'retrieval',
        value: { documents: [] },
      },
      {
        science: 'astro',
        subCategory: 'astro_transits_current',
        score: 9.4,
        sourceType: 'exact_data',
        exactDataSection: 'transits',
        value: { saturn: 'active' },
      },
    ]

    const prioritized = prioritizeStructuredSignals({
      structuredSignals,
      retrievalPlan: makePlan(),
      intent: 'timing',
    })

    expect(prioritized.signals[0]?.subCategory).toBe('astro_transits_current')
    expect(prioritized.signals[1]?.subCategory).toBe('num_personal_year')
    expect(prioritized.signals[2]?.subCategory).toBe('fusion_general')
  })

  it('does not let a weak retrieval signal outrank a dominant exactData block from the same intent', () => {
    const structuredSignals: StructuredSignal[] = [
      {
        science: 'numerology',
        subCategory: 'num_personal_year',
        score: 4.3,
        sourceType: 'retrieval',
        value: { documents: [] },
      },
      {
        science: 'astro',
        subCategory: 'astro_transits_current',
        score: 8.6,
        sourceType: 'exact_data',
        exactDataSection: 'transits',
        value: { mars: 'activation' },
      },
    ]

    const prioritized = prioritizeStructuredSignals({
      structuredSignals,
      retrievalPlan: makePlan({
        weightedMatches: [
          { subCategory: 'astro_transits_current', science: 'astro', score: 8.6, retrievalPriority: 96 },
          { subCategory: 'num_personal_year', science: 'numerology', score: 4.3, retrievalPriority: 90 },
        ],
      }),
      intent: 'timing_decision',
    })

    expect(prioritized.signals[0]?.subCategory).toBe('astro_transits_current')
  })

  it('pushes a generic fusion energy retrieval block behind a more relevant exact-data current-state signal', () => {
    const structuredSignals: StructuredSignal[] = [
      {
        science: 'fusion',
        subCategory: 'fusion_energy_state',
        score: 7.4,
        sourceType: 'retrieval',
        value: { documents: [] },
      },
      {
        science: 'human_design',
        subCategory: 'hd_current_transits',
        score: 6.8,
        sourceType: 'exact_data',
        exactDataSection: 'humanDesignTransits',
        value: { active_gates: ['57'] },
      },
      {
        science: 'astro',
        subCategory: 'astro_transits_current',
        score: 6.4,
        sourceType: 'exact_data',
        exactDataSection: 'transits',
        value: { moon: 'activation' },
      },
    ]

    const prioritized = prioritizeStructuredSignals({
      structuredSignals,
      retrievalPlan: makePlan({
        sciences: ['fusion', 'human_design', 'astro'],
        subCategories: ['fusion_energy_state', 'hd_current_transits', 'astro_transits_current'],
        weightedMatches: [
          { subCategory: 'fusion_energy_state', science: 'fusion', score: 7.4, retrievalPriority: 74 },
          { subCategory: 'hd_current_transits', science: 'human_design', score: 6.8, retrievalPriority: 88 },
          { subCategory: 'astro_transits_current', science: 'astro', score: 6.4, retrievalPriority: 86 },
        ],
        dominantScience: 'fusion',
        dominantSubCategory: null,
      }),
      intent: 'inner_state',
    })

    expect(prioritized.signals[0]?.subCategory).toBe('hd_current_transits')
    expect(prioritized.signals[1]?.subCategory).toBe('astro_transits_current')
    expect(prioritized.signals[2]?.subCategory).toBe('fusion_energy_state')
  })
})

import { describe, expect, it } from 'vitest'
import { getFusionFallbackCopy } from '@/lib/hexastra/rendering/getFusionFallbackCopy'

describe('getFusionFallbackCopy', () => {
  it('adapts timing_fusion to timing_strategic_response', () => {
    const copy = getFusionFallbackCopy({
      subCategory: 'timing_fusion',
      responseMode: 'timing_strategic_response',
    })

    expect(copy.opening.toLowerCase()).toContain('bon moment')
    expect(copy.explanation.toLowerCase()).toContain('fenetre claire')
  })

  it('adapts timing_fusion to fusion_general style', () => {
    const copy = getFusionFallbackCopy({
      subCategory: 'timing_fusion',
      responseMode: 'concise_fusion_answer',
    })

    expect(copy.opening.toLowerCase()).toContain('rythme actuel')
    expect(copy.explanation.toLowerCase()).toContain('temps juste')
  })

  it('adapts timing_fusion to interpretive_reading style', () => {
    const copy = getFusionFallbackCopy({
      subCategory: 'timing_fusion',
      responseMode: 'interpretive_reading',
    })

    expect(copy.opening.toLowerCase()).toContain('clarte')
    expect(copy.explanation.toLowerCase()).toContain('murit en toi')
  })

  it('keeps the same subcategory readable but more factual in calculated_reading', () => {
    const copy = getFusionFallbackCopy({
      subCategory: 'timing_fusion',
      responseMode: 'calculated_reading',
    })

    expect(copy.opening.toLowerCase()).toContain('signal actuel')
    expect(copy.explanation.toLowerCase()).toContain('fait le plus utile')
  })

  it('falls back to the base copy when no mode variant exists', () => {
    const copy = getFusionFallbackCopy({
      subCategory: 'fusion_relationships',
      responseMode: 'timing_strategic_response',
    })

    expect(copy.opening).toBe(
      'La dynamique relationnelle du moment demande plus de clarte que de reaction immediate.',
    )
  })
})

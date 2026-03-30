import { describe, expect, it } from 'vitest'
import { normalizeUserPlan } from '@/lib/hexastra/rendering/normalizeUserPlan'
import { selectRenderProfile } from '@/lib/hexastra/rendering/selectRenderProfile'

describe('selectRenderProfile', () => {
  it('implements the exact requested matrix', () => {
    expect(selectRenderProfile({ responseMode: 'direct_answer', userPlan: 'free' }).format).toBe('concise')
    expect(selectRenderProfile({ responseMode: 'fusion_general', userPlan: 'premium' }).format).toBe('storytelling')
    expect(selectRenderProfile({ responseMode: 'interpretive_reading', userPlan: 'praticien' }).format).toBe('deep')
    expect(selectRenderProfile({ responseMode: 'timing_strategic_response', userPlan: 'essentiel' }).format).toBe('enriched')
    expect(selectRenderProfile({ responseMode: 'calculated_reading', userPlan: 'premium' }).tone).toBe('premium')
  })

  it('maps concise, enriched, storytelling and deep to the expected tones', () => {
    expect(selectRenderProfile({ responseMode: 'direct_answer', userPlan: 'free' }).tone).toBe('direct')
    expect(selectRenderProfile({ responseMode: 'direct_answer', userPlan: 'essentiel' }).tone).toBe('fluid')
    expect(selectRenderProfile({ responseMode: 'fusion_general', userPlan: 'premium' }).tone).toBe('premium')
    expect(selectRenderProfile({ responseMode: 'fusion_general', userPlan: 'praticien' }).tone).toBe('practitioner')
  })

  it('treats concise_fusion_answer as fusion_general for backward compatibility', () => {
    expect(
      selectRenderProfile({ responseMode: 'concise_fusion_answer', userPlan: 'premium' }).format,
    ).toBe('storytelling')
  })
})

describe('normalizeUserPlan', () => {
  it('normalizes english and french plan variants', () => {
    expect(normalizeUserPlan('free')).toBe('free')
    expect(normalizeUserPlan('gratuit')).toBe('free')
    expect(normalizeUserPlan('essential')).toBe('essentiel')
    expect(normalizeUserPlan('essentiel')).toBe('essentiel')
    expect(normalizeUserPlan('premium')).toBe('premium')
    expect(normalizeUserPlan('practitioner')).toBe('praticien')
    expect(normalizeUserPlan('praticien')).toBe('praticien')
    expect(normalizeUserPlan('discovery')).toBe('free')
  })
})

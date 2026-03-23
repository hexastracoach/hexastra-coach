/**
 * Tests - Response Modes
 */
import { describe, it, expect } from 'vitest'
import { selectResponseMode, buildResponseModeDirective } from '@/lib/hexastra/orchestration/responseModes'

describe('selectResponseMode - pedagogical_explanation', () => {
  it('returns pedagogical_explanation for clarification requestKind', () => {
    expect(selectResponseMode({
      requestKind: 'clarification',
      subcategory: null,
      plan: 'premium',
    })).toBe('pedagogical_explanation')
  })

  it('returns pedagogical_explanation when isPedagogical=true regardless of requestKind', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'essential',
      isPedagogical: true,
    })).toBe('pedagogical_explanation')
  })
})

describe('selectResponseMode - guided_exploration', () => {
  it('returns guided_exploration on timeout risk', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'planetes',
      plan: 'premium',
      isTimeoutRisk: true,
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration for free plan + exact_fact', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'free',
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration for free plan + exact_profile', () => {
    expect(selectResponseMode({
      requestKind: 'exact_profile',
      subcategory: null,
      plan: 'free',
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration when exact_fact but data not resolved', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'premium',
      exactDataResolved: false,
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration when exact_fact data is resolved but unreliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: false,
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration for guidance requestKind', () => {
    expect(selectResponseMode({
      requestKind: 'guidance',
      subcategory: null,
      plan: 'free',
    })).toBe('guided_exploration')
  })
})

describe('selectResponseMode - calculated_reading', () => {
  it('returns calculated_reading for exact_fact + data resolved + reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'planetes',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns calculated_reading for exact_fact + data resolved when reliability is unspecified', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'essential',
      exactDataResolved: true,
    })).toBe('calculated_reading')
  })

  it('returns calculated_reading for exact_profile + data resolved + reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_profile',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })
})

describe('selectResponseMode - interpretive_reading', () => {
  it('returns interpretive_reading for synthesis', () => {
    expect(selectResponseMode({
      requestKind: 'synthesis',
      subcategory: null,
      plan: 'premium',
    })).toBe('interpretive_reading')
  })

  it('returns interpretive_reading for interpretation', () => {
    expect(selectResponseMode({
      requestKind: 'interpretation',
      subcategory: 'ascendant',
      plan: 'essential',
    })).toBe('interpretive_reading')
  })

  it('returns interpretive_reading for mixed', () => {
    expect(selectResponseMode({
      requestKind: 'mixed',
      subcategory: null,
      plan: 'premium',
    })).toBe('interpretive_reading')
  })
})

describe('selectResponseMode - fallback', () => {
  it('returns calculated_reading when data resolved + unknown kind + reliable', () => {
    expect(selectResponseMode({
      requestKind: 'unknown',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns guided_exploration when data not resolved + unknown kind', () => {
    expect(selectResponseMode({
      requestKind: 'unknown',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: false,
    })).toBe('guided_exploration')
  })

  it('returns guided_exploration when data is resolved but unreliable + unknown kind', () => {
    expect(selectResponseMode({
      requestKind: 'unknown',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: false,
    })).toBe('guided_exploration')
  })
})

describe('buildResponseModeDirective', () => {
  it('calculated_reading directive mentions LECTURE CALCULEE', () => {
    expect(buildResponseModeDirective('calculated_reading')).toContain('LECTURE CALCULEE')
  })

  it('interpretive_reading directive mentions LECTURE INTERPRETATIVE', () => {
    expect(buildResponseModeDirective('interpretive_reading')).toContain('LECTURE INTERPRETATIVE')
  })

  it('guided_exploration directive mentions EXPLORATION GUIDEE', () => {
    expect(buildResponseModeDirective('guided_exploration')).toContain('EXPLORATION GUIDEE')
  })

  it('pedagogical_explanation directive mentions EXPLICATION PEDAGOGIQUE', () => {
    expect(buildResponseModeDirective('pedagogical_explanation')).toContain('EXPLICATION PEDAGOGIQUE')
  })
})

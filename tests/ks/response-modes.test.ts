/**
 * Tests — Response Modes
 *
 * Validates selectResponseMode() for all 4 modes:
 * - calculated_reading     when data resolved + reliable + exact request
 * - interpretive_reading   when data resolved but unreliable, or synthesis request
 * - guided_exploration     when no exact data, or guidance, or free plan constrained
 * - pedagogical_explanation when clarification/conceptual question
 */
import { describe, it, expect } from 'vitest'
import { selectResponseMode, buildResponseModeDirective } from '@/lib/hexastra/orchestration/responseModes'

// ─── pedagogical_explanation ─────────────────────────────────────────────────

describe('selectResponseMode — pedagogical_explanation', () => {
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

// ─── guided_exploration (compact) ────────────────────────────────────────────

describe('selectResponseMode — guided_exploration', () => {
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

  it('returns guided_exploration for guidance requestKind', () => {
    expect(selectResponseMode({
      requestKind: 'guidance',
      subcategory: null,
      plan: 'free',
    })).toBe('guided_exploration')
  })

  it('does NOT return guided_exploration for free plan + interpretation', () => {
    expect(selectResponseMode({
      requestKind: 'interpretation',
      subcategory: 'ascendant',
      plan: 'free',
    })).toBe('interpretive_reading')
  })
})

// ─── calculated_reading ───────────────────────────────────────────────────────

describe('selectResponseMode — calculated_reading', () => {
  it('returns calculated_reading for exact_fact + data resolved + reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'planetes',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns calculated_reading for exact_fact + data resolved (reliable not specified = true)', () => {
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

  it('returns calculated_reading for type_hd subcategory with resolved reliable data', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns calculated_reading for chemin_de_vie subcategory with resolved reliable data', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'chemin_de_vie',
      plan: 'essential',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })
})

// ─── interpretive_reading ─────────────────────────────────────────────────────

describe('selectResponseMode — interpretive_reading', () => {
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

  it('returns interpretive_reading when exact_fact + data resolved but NOT reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: false,
    })).toBe('interpretive_reading')
  })
})

// ─── Fallback behavior ────────────────────────────────────────────────────────

describe('selectResponseMode — fallback', () => {
  it('returns calculated_reading when data resolved + unknown kind', () => {
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
})

// ─── buildResponseModeDirective ───────────────────────────────────────────────

describe('buildResponseModeDirective', () => {
  it('calculated_reading directive mentions LECTURE CALCULÉE', () => {
    expect(buildResponseModeDirective('calculated_reading')).toContain('LECTURE CALCULÉE')
  })

  it('interpretive_reading directive mentions LECTURE INTERPRÉTATIVE', () => {
    expect(buildResponseModeDirective('interpretive_reading')).toContain('LECTURE INTERPRÉTATIVE')
  })

  it('guided_exploration directive mentions EXPLORATION GUIDÉE', () => {
    expect(buildResponseModeDirective('guided_exploration')).toContain('EXPLORATION GUIDÉE')
  })

  it('pedagogical_explanation directive mentions EXPLICATION PÉDAGOGIQUE', () => {
    expect(buildResponseModeDirective('pedagogical_explanation')).toContain('EXPLICATION PÉDAGOGIQUE')
  })

  it('calculated_reading directive forbids inventing values', () => {
    const directive = buildResponseModeDirective('calculated_reading')
    expect(directive.toLowerCase()).toContain("n'invente")
  })

  it('guided_exploration directive stays concise (mentions 4-8 lignes)', () => {
    expect(buildResponseModeDirective('guided_exploration')).toContain('4-8 lignes')
  })
})

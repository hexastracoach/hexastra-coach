/**
 * Tests — Response Modes
 *
 * Validates selectResponseMode() for all combinations:
 * - compact_timeout_safe when timeout risk or free+exact
 * - exact_list for list subcategories
 * - exact_card for card subcategories
 * - interpretive_reading for synthesis/interpretation/guidance
 * - Fallback behavior
 */
import { describe, it, expect } from 'vitest'
import { selectResponseMode, buildResponseModeDirective } from '@/lib/hexastra/orchestration/responseModes'

// ─── compact_timeout_safe ────────────────────────────────────────────────────

describe('selectResponseMode — compact_timeout_safe', () => {
  it('forces compact on timeout risk', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'planetes',
      plan: 'premium',
      isTimeoutRisk: true,
    })).toBe('compact_timeout_safe')
  })

  it('forces compact for free plan + exact_fact', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'free',
    })).toBe('compact_timeout_safe')
  })

  it('forces compact for free plan + exact_profile', () => {
    expect(selectResponseMode({
      requestKind: 'exact_profile',
      subcategory: null,
      plan: 'free',
    })).toBe('compact_timeout_safe')
  })

  it('does NOT force compact for free plan + interpretation', () => {
    expect(selectResponseMode({
      requestKind: 'interpretation',
      subcategory: 'ascendant',
      plan: 'free',
    })).toBe('interpretive_reading')
  })
})

// ─── exact_list ───────────────────────────────────────────────────────────────

describe('selectResponseMode — exact_list', () => {
  it('returns exact_list for planetes subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'planetes',
      plan: 'premium',
    })).toBe('exact_list')
  })

  it('returns exact_list for maisons subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'maisons',
      plan: 'essential',
    })).toBe('exact_list')
  })

  it('returns exact_list for centres_hd subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'centres_hd',
      plan: 'essential',
    })).toBe('exact_list')
  })

  it('returns exact_list for portes_hd subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'portes_hd',
      plan: 'premium',
    })).toBe('exact_list')
  })

  it('falls back to exact_list when no subcategory matches', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: null,
      plan: 'premium',
    })).toBe('exact_list')
  })
})

// ─── exact_card ───────────────────────────────────────────────────────────────

describe('selectResponseMode — exact_card', () => {
  it('returns exact_card for ascendant subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'ascendant',
      plan: 'essential',
    })).toBe('exact_card')
  })

  it('returns exact_card for type_hd subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
    })).toBe('exact_card')
  })

  it('returns exact_card for chemin_de_vie subcategory', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'chemin_de_vie',
      plan: 'essential',
    })).toBe('exact_card')
  })

  it('returns exact_card for exact_profile requestKind', () => {
    expect(selectResponseMode({
      requestKind: 'exact_profile',
      subcategory: null,
      plan: 'premium',
    })).toBe('exact_card')
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

  it('returns interpretive_reading for guidance', () => {
    expect(selectResponseMode({
      requestKind: 'guidance',
      subcategory: null,
      plan: 'free',
    })).toBe('interpretive_reading')
  })

  it('returns interpretive_reading for mixed', () => {
    expect(selectResponseMode({
      requestKind: 'mixed',
      subcategory: null,
      plan: 'premium',
    })).toBe('interpretive_reading')
  })

  it('returns interpretive_reading for clarification', () => {
    expect(selectResponseMode({
      requestKind: 'clarification',
      subcategory: null,
      plan: 'premium',
    })).toBe('interpretive_reading')
  })
})

// ─── Fallback ─────────────────────────────────────────────────────────────────

describe('selectResponseMode — fallback', () => {
  it('returns exact_card when data resolved + unknown kind', () => {
    expect(selectResponseMode({
      requestKind: 'unknown',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: true,
    })).toBe('exact_card')
  })

  it('returns interpretive_reading when data not resolved + unknown kind', () => {
    expect(selectResponseMode({
      requestKind: 'unknown',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: false,
    })).toBe('interpretive_reading')
  })
})

// ─── buildResponseModeDirective ───────────────────────────────────────────────

describe('buildResponseModeDirective', () => {
  it('exact_list directive mentions LISTE FACTUELLE', () => {
    expect(buildResponseModeDirective('exact_list')).toContain('LISTE FACTUELLE')
  })

  it('exact_card directive mentions CARTE FACTUELLE', () => {
    expect(buildResponseModeDirective('exact_card')).toContain('CARTE FACTUELLE')
  })

  it('interpretive_reading directive mentions LECTURE INTERPRÉTATIVE', () => {
    expect(buildResponseModeDirective('interpretive_reading')).toContain('LECTURE INTERPRÉTATIVE')
  })

  it('compact_timeout_safe directive mentions COMPACT', () => {
    expect(buildResponseModeDirective('compact_timeout_safe')).toContain('COMPACT')
  })
})

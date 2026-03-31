/**
 * Tests — Vector Store Policy
 *
 * Validates shouldUseVectorEnrichment() rules:
 * - exact_fact/profile + resolved → skip
 * - exact_fact/profile + unresolved → skip (calculation priority)
 * - synthesis + resolved → enrich
 * - synthesis + unresolved → skip
 * - interpretation/guidance/clarification → always enrich
 * - mixed → enrich iff resolved
 */
import { describe, it, expect } from 'vitest'
import { shouldUseVectorEnrichment } from '@/lib/hexastra/vector/vectorPolicy'

// ─── exact_fact ───────────────────────────────────────────────────────────────

describe('vector policy — exact_fact', () => {
  it('skips when data resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'exact_fact',
      science: 'astrology',
      subcategory: 'ascendant',
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(false)
    expect(result.reason).toContain('VECTOR_SEARCH_SKIPPED_FOR_EXACT_QUERY')
  })

  it('skips when data NOT resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'exact_fact',
      science: 'astrology',
      subcategory: 'ascendant',
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(false)
    expect(result.reason).toContain('VECTOR_SEARCH_SKIPPED_FOR_EXACT_QUERY')
  })
})

// ─── exact_profile ────────────────────────────────────────────────────────────

describe('vector policy — exact_profile', () => {
  it('skips when data resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'exact_profile',
      science: 'human_design',
      subcategory: 'type_hd',
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(false)
  })

  it('skips when data NOT resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'exact_profile',
      science: 'human_design',
      subcategory: null,
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(false)
  })
})

// ─── synthesis ────────────────────────────────────────────────────────────────

describe('vector policy — synthesis', () => {
  it('enriches when data resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'synthesis',
      science: 'fusion',
      subcategory: null,
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(true)
    expect(result.reason).toContain('VECTOR_ENRICHMENT_ENABLED')
  })

  it('skips when data NOT resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'synthesis',
      science: 'fusion',
      subcategory: null,
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(false)
    expect(result.reason).toContain('VECTOR_SEARCH_SKIPPED')
  })
})

// ─── interpretation ───────────────────────────────────────────────────────────

describe('vector policy — interpretation', () => {
  it('always enriches (resolved)', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'interpretation',
      science: 'astrology',
      subcategory: 'ascendant',
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(true)
  })

  it('always enriches (not resolved)', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'interpretation',
      science: 'astrology',
      subcategory: 'ascendant',
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(true)
  })
})

// ─── guidance ─────────────────────────────────────────────────────────────────

describe('vector policy — guidance', () => {
  it('always enriches', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'guidance',
      science: 'general',
      subcategory: null,
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(true)
  })
})

// ─── clarification ────────────────────────────────────────────────────────────

describe('vector policy — clarification', () => {
  it('always enriches', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'clarification',
      science: 'general',
      subcategory: null,
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(true)
  })
})

// ─── mixed ────────────────────────────────────────────────────────────────────

describe('vector policy — mixed', () => {
  it('enriches when resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'mixed',
      science: 'general',
      subcategory: null,
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(true)
  })

  it('skips when not resolved', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'mixed',
      science: 'general',
      subcategory: null,
      exactDataResolved: false,
    })
    expect(result.shouldEnrich).toBe(false)
  })
})

// ─── unknown ──────────────────────────────────────────────────────────────────

describe('vector policy — unknown', () => {
  it('skips by default', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'unknown',
      science: 'general',
      subcategory: null,
      exactDataResolved: true,
    })
    expect(result.shouldEnrich).toBe(false)
  })
})

describe('vector policy - yearly priorities', () => {
  it('enriches because the query is interpretive even when backed by exact data', () => {
    const result = shouldUseVectorEnrichment({
      requestKind: 'yearly_priorities',
      science: 'fusion',
      subcategory: 'annual_guidance',
      exactDataResolved: true,
    })

    expect(result.shouldEnrich).toBe(true)
    expect(result.reason).toContain('exact-data-backed interpretive query')
  })
})

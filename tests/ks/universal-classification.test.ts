/**
 * Tests — classifyMessage (universalClassification)
 *
 * Validates that classifyMessage correctly resolves:
 * - intent (SemanticContextType)
 * - science (Science)
 * - subcategory
 * - requestKind
 * - needsExactData / needsVectorEnrichment
 */
import { describe, it, expect } from 'vitest'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'

// ─── Astrology ────────────────────────────────────────────────────────────────

describe('classifyMessage — astrology exact', () => {
  it('detects ascendant query → astrology / exact_fact', () => {
    const result = classifyMessage('quel est mon ascendant')
    expect(result.science).toBe('astrology')
    expect(result.requestKind).toBe('exact_fact')
    expect(result.needsExactData).toBe(true)
    expect(result.subcategory).toBe('ascendant')
  })

  it('detects planètes query → astrology / exact_fact / planetes', () => {
    const result = classifyMessage('donne-moi mes planètes')
    expect(result.science).toBe('astrology')
    expect(result.requestKind).toBe('exact_fact')
    expect(result.subcategory).toBe('planetes')
  })

  it('detects thème natal complet → astrology / synthesis', () => {
    const result = classifyMessage('montre mon thème natal complet')
    expect(result.science).toBe('astrology')
    expect(result.requestKind).toBe('synthesis')
  })
})

// ─── Human Design ─────────────────────────────────────────────────────────────

describe('classifyMessage — human design', () => {
  it('detects "quel est mon design humain" → human_design / exact_fact', () => {
    const result = classifyMessage('quel est mon design humain')
    expect(result.science).toBe('human_design')
    expect(result.needsExactData).toBe(true)
  })

  it('detects "mon type HD" → human_design', () => {
    const result = classifyMessage('mon type HD')
    expect(result.science).toBe('human_design')
  })

  it('detects "mes centres définis" → human_design / centres_hd', () => {
    const result = classifyMessage('quels sont mes centres définis')
    expect(result.science).toBe('human_design')
    expect(result.subcategory).toMatch(/centres_hd|human_design_exact/)
  })
})

// ─── Numerology ───────────────────────────────────────────────────────────────

describe('classifyMessage — numerology', () => {
  it('detects "mon chemin de vie" → numerology / exact_fact', () => {
    const result = classifyMessage('quel est mon chemin de vie')
    expect(result.science).toBe('numerology')
    expect(result.requestKind).toBe('exact_fact')
    expect(result.subcategory).toBe('chemin_de_vie')
  })

  it('detects "mon année personnelle" → numerology', () => {
    const result = classifyMessage("quelle est mon année personnelle")
    expect(result.science).toBe('numerology')
    expect(result.subcategory).toBe('annee_personnelle')
  })
})

// ─── Interpretation ───────────────────────────────────────────────────────────

describe('classifyMessage — interpretation', () => {
  it('detects interpretation request → needsVectorEnrichment', () => {
    const result = classifyMessage("qu'est-ce que ça signifie, mon profil ?")
    expect(result.requestKind).toBe('interpretation')
    expect(result.needsInterpretation).toBe(true)
    expect(result.needsVectorEnrichment).toBe(true)
  })

  it('detects guidance → needsVectorEnrichment', () => {
    const result = classifyMessage('que faire dans cette période difficile')
    expect(result.requestKind).toBe('guidance')
    expect(result.needsVectorEnrichment).toBe(true)
  })
})

// ─── Synthesis ────────────────────────────────────────────────────────────────

describe('classifyMessage — synthesis', () => {
  it('detects synthesis → interpretive_reading expected', () => {
    const result = classifyMessage('fais-moi une synthèse de mon profil complet')
    expect(result.requestKind).toBe('synthesis')
  })
})

// ─── Confidence ───────────────────────────────────────────────────────────────

describe('classifyMessage — confidence', () => {
  it('returns a confidence between 0 and 1', () => {
    const result = classifyMessage('quel est mon ascendant')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })
})

// ─── Fallback ─────────────────────────────────────────────────────────────────

describe('classifyMessage — fallback / general', () => {
  it('handles empty string without throwing', () => {
    expect(() => classifyMessage('')).not.toThrow()
  })

  it('handles off-topic message gracefully', () => {
    const result = classifyMessage('bonjour')
    expect(result.science).toBeDefined()
    expect(result.requestKind).toBeDefined()
  })
})

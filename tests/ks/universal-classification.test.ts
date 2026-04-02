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
  it('detects natural career wording as career guidance instead of unknown', () => {
    const result = classifyMessage('quel sont les metier que je peut faire ?')
    expect(result.domainRoute).toBe('career')
    expect(result.subcategory).toBe('career_guidance')
    expect(result.requestKind).toBe('career_orientation')
    expect(result.needsExactData).toBe(true)
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
    expect(result.requestKind).not.toBe('yearly_priorities')
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

  it('detects career guidance routing for "quel metier est fait pour moi"', () => {
    const result = classifyMessage('quel métier est fait pour moi ?')
    expect(result.domainRoute).toBe('career')
    expect(result.subcategory).toBe('career_guidance')
    expect(result.requestKind).toBe('career_orientation')
    expect(result.needsInterpretation).toBe(true)
  })

  it('detects natural career wording as career guidance instead of unknown', () => {
    const result = classifyMessage('quel sont les metier que je peut faire ?')
    expect(result.domainRoute).toBe('career')
    expect(result.subcategory).toBe('career_guidance')
    expect(result.requestKind).toBe('career_orientation')
    expect(result.needsExactData).toBe(true)
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

describe('classifyMessage - yearly priorities', () => {
  it('routes annual priority questions as exact-data-backed interpretive fusion guidance', () => {
    const result = classifyMessage('quelles sont mes priorites pour 2026 ?')

    expect(result.intent).toBe('strategic_priority')
    expect(result.science).toBe('fusion')
    expect(result.subcategory).toBe('annual_guidance')
    expect(result.requestKind).toBe('yearly_priorities')
    expect(result.needsExactData).toBe(true)
    expect(result.needsInterpretation).toBe(true)
    expect(result.domainRoute).toBe('fusion')
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it.each([
    'sur quoi je dois me concentrer cette annee ?',
    'qu est-ce que je dois arreter en 2026 ?',
    'quel axe choisir ?',
    'quel axe je dois vraiment choisir ?',
    'quel cap choisir ?',
    'quelle direction prendre ?',
    'ou je perds mon energie ?',
    'ou orienter mon energie ?',
    'comment avancer cette annee ?',
  ])('routes close yearly strategic variants to annual guidance: %s', (query) => {
    const result = classifyMessage(query)

    expect(result.intent).toBe('strategic_priority')
    expect(result.science).toBe('fusion')
    expect(result.subcategory).toBe('annual_guidance')
    expect(result.requestKind).toBe('yearly_priorities')
    expect(result.needsExactData).toBe(true)
    expect(result.needsInterpretation).toBe(true)
    expect(result.domainRoute).toBe('fusion')
  })
})

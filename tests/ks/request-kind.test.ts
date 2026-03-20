/**
 * Tests — classifyRequestKind
 *
 * Validates that each RequestKind is correctly detected from user messages.
 */
import { describe, it, expect } from 'vitest'
import { classifyRequestKind, requestKindNeedsExactData, requestKindNeedsInterpretation, requestKindAllowsVectorEnrichment } from '@/lib/hexastra/orchestration/requestKinds'

// ─── exact_fact ───────────────────────────────────────────────────────────────

describe('classifyRequestKind — exact_fact', () => {
  it('detects "quel est mon ascendant"', () => {
    expect(classifyRequestKind('quel est mon ascendant')).toBe('exact_fact')
  })
  it('detects "quelles sont mes planètes"', () => {
    expect(classifyRequestKind('quelles sont mes planètes')).toBe('exact_fact')
  })
  it('detects "donne-moi mon signe lunaire"', () => {
    expect(classifyRequestKind('donne-moi mon signe lunaire')).toBe('exact_fact')
  })
  it('detects "quelles sont mes maisons"', () => {
    expect(classifyRequestKind('quelles sont mes maisons')).toBe('exact_fact')
  })
  it('detects "quel est mon chemin de vie"', () => {
    expect(classifyRequestKind('quel est mon chemin de vie')).toBe('exact_fact')
  })
  it('detects "liste mes aspects"', () => {
    expect(classifyRequestKind('liste mes aspects')).toBe('exact_fact')
  })
})

// ─── exact_profile ────────────────────────────────────────────────────────────

describe('classifyRequestKind — exact_profile', () => {
  it('detects "quel est mon profil complet"', () => {
    expect(classifyRequestKind('quel est mon profil complet')).toBe('exact_profile')
  })
  it('detects "quel est mon type HD"', () => {
    expect(classifyRequestKind('quel est mon type HD')).toBe('exact_profile')
  })
  it('detects "mon design humain"', () => {
    expect(classifyRequestKind('mon design humain')).toBe('exact_profile')
  })
})

// ─── interpretation ───────────────────────────────────────────────────────────

describe('classifyRequestKind — interpretation', () => {
  it('detects "qu\'est-ce que ça signifie mon profil"', () => {
    expect(classifyRequestKind("qu'est-ce que ça signifie mon profil")).toBe('interpretation')
  })
  it('detects "comment interpréter mon profil 3/5"', () => {
    expect(classifyRequestKind('comment interpréter mon profil 3/5')).toBe('interpretation')
  })
  it('detects "ça dit quoi mon profil HD"', () => {
    expect(classifyRequestKind('ça dit quoi mon profil HD')).toBe('interpretation')
  })
})

// ─── synthesis ────────────────────────────────────────────────────────────────

describe('classifyRequestKind — synthesis', () => {
  it('detects "fais-moi une lecture complète"', () => {
    expect(classifyRequestKind('fais-moi une lecture complète')).toBe('synthesis')
  })
  it('detects "donne-moi une analyse globale"', () => {
    expect(classifyRequestKind('donne-moi une analyse globale')).toBe('synthesis')
  })
  it('detects "qui suis-je ?"', () => {
    expect(classifyRequestKind('qui suis-je ?')).toBe('synthesis')
  })
})

// ─── guidance ─────────────────────────────────────────────────────────────────

describe('classifyRequestKind — guidance', () => {
  it('detects "que faire dans cette situation"', () => {
    expect(classifyRequestKind('que faire dans cette situation')).toBe('guidance')
  })
  it('detects "comment avancer"', () => {
    expect(classifyRequestKind('comment avancer')).toBe('guidance')
  })
  it('detects "comment me améliorer"', () => {
    expect(classifyRequestKind('comment me améliorer')).toBe('guidance')
  })
})

// ─── clarification ────────────────────────────────────────────────────────────

describe('classifyRequestKind — clarification', () => {
  it('detects "c\'est quoi exactement"', () => {
    expect(classifyRequestKind("c'est quoi exactement")).toBe('clarification')
  })
  it('detects "explique-moi le concept d\'autorité"', () => {
    expect(classifyRequestKind("explique-moi le concept d'autorité")).toBe('clarification')
  })
  it('detects "qu\'est-ce que signifie le terme profil"', () => {
    expect(classifyRequestKind("qu'est-ce que signifie le terme profil")).toBe('clarification')
  })
})

// ─── Flags ────────────────────────────────────────────────────────────────────

describe('requestKind flags', () => {
  it('exact_fact needs exact data', () => {
    expect(requestKindNeedsExactData('exact_fact')).toBe(true)
  })
  it('exact_profile needs exact data', () => {
    expect(requestKindNeedsExactData('exact_profile')).toBe(true)
  })
  it('interpretation does not need exact data', () => {
    expect(requestKindNeedsExactData('interpretation')).toBe(false)
  })
  it('interpretation needs interpretation', () => {
    expect(requestKindNeedsInterpretation('interpretation')).toBe(true)
  })
  it('exact_fact does not need interpretation', () => {
    expect(requestKindNeedsInterpretation('exact_fact')).toBe(false)
  })
  it('interpretation allows vector enrichment', () => {
    expect(requestKindAllowsVectorEnrichment('interpretation')).toBe(true)
  })
  it('exact_fact does not allow vector enrichment', () => {
    expect(requestKindAllowsVectorEnrichment('exact_fact')).toBe(false)
  })
  it('guidance allows vector enrichment', () => {
    expect(requestKindAllowsVectorEnrichment('guidance')).toBe(true)
  })
})

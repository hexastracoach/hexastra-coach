/**
 * Tests — isActionableDirectRequest
 *
 * Validates that the direct request detector correctly distinguishes:
 * - Complete requests that must be executed immediately (true)
 * - Vague/incomplete requests where framing is allowed (false)
 *
 * Anti-regression:
 * - No "Contexte actif" message for a complete request
 * - No "Pose ta vraie question" if the user already asked a real question
 */
import { describe, it, expect } from 'vitest'
import { isActionableDirectRequest } from '@/lib/hexastra/orchestration/directRequest'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'

// ─── Helper: classify then check ─────────────────────────────────────────────

function check(message: string): boolean {
  return isActionableDirectRequest(message, classifyMessage(message))
}

// ─── Human Design — direct requests ──────────────────────────────────────────

describe('isActionableDirectRequest — Human Design direct', () => {
  it('"fais moi mon profil human design" → true', () => {
    expect(check('fais moi mon profil human design')).toBe(true)
  })

  it('"donne moi mon design humain" → true', () => {
    expect(check('donne moi mon design humain')).toBe(true)
  })

  it('"quel est mon profil human design" → true', () => {
    expect(check('quel est mon profil human design')).toBe(true)
  })

  it('"donne moi mon type HD" → true', () => {
    expect(check('donne moi mon type HD')).toBe(true)
  })

  it('"explique mon profil 3/5" → true', () => {
    expect(check('explique mon profil 3/5')).toBe(true)
  })
})

// ─── Astrology — direct requests ─────────────────────────────────────────────

describe('isActionableDirectRequest — Astrology direct', () => {
  it('"quel est mon ascendant" → true', () => {
    expect(check('quel est mon ascendant')).toBe(true)
  })

  it('"quelles sont les planètes de mon thème natal" → true', () => {
    expect(check('quelles sont les planètes de mon thème natal')).toBe(true)
  })

  it('"donne moi mon soleil lune ascendant" → true', () => {
    expect(check('donne moi mon soleil lune ascendant')).toBe(true)
  })

  it('"quelles sont mes maisons astrologiques" → true', () => {
    expect(check('quelles sont mes maisons astrologiques')).toBe(true)
  })
})

// ─── Numerology — direct requests ────────────────────────────────────────────

describe('isActionableDirectRequest — Numerology direct', () => {
  it('"donne moi mon chemin de vie" → true', () => {
    expect(check('donne moi mon chemin de vie')).toBe(true)
  })

  it('"quel est mon chemin de vie" → true', () => {
    expect(check('quel est mon chemin de vie')).toBe(true)
  })
})

// ─── Vague / incomplete — framing allowed ────────────────────────────────────

describe('isActionableDirectRequest — vague requests (framing allowed)', () => {
  it('"human design" → false (2 words, no intent)', () => {
    expect(check('human design')).toBe(false)
  })

  it('"astrologie" → false (single keyword)', () => {
    expect(check('astrologie')).toBe(false)
  })

  it('"numérologie" → false (single keyword)', () => {
    expect(check('numérologie')).toBe(false)
  })

  it('"analyse moi" → false (no science detected, vague)', () => {
    expect(check('analyse moi')).toBe(false)
  })

  it('"aide moi" → false (no science, no intent)', () => {
    expect(check('aide moi')).toBe(false)
  })

  it('"je veux une lecture" → false (no science specified)', () => {
    expect(check('je veux une lecture')).toBe(false)
  })
})

// ─── Word count boundary ─────────────────────────────────────────────────────

describe('isActionableDirectRequest — word count boundary', () => {
  it('2-word science keyword → false', () => {
    // "human design" is 2 words — should not be treated as direct
    expect(check('human design')).toBe(false)
  })

  it('3+ words with known science + intent → true', () => {
    // "quel est mon ascendant" = 4 words, science=astrology, requestKind=exact_fact
    expect(check('quel est mon ascendant')).toBe(true)
  })
})

// ─── Anti-regression: no framing for complete questions ──────────────────────

describe('anti-regression — framing must be skipped for these messages', () => {
  const directMessages = [
    'fais moi mon profil human design',
    'donne moi mon design humain',
    'quel est mon ascendant',
    'quelles sont les planètes de mon thème natal',
    'donne moi mon chemin de vie',
    'quel est mon chemin de vie',
    'explique mon profil 3/5',
  ]

  for (const msg of directMessages) {
    it(`"${msg}" → must NOT trigger framing (isActionableDirectRequest = true)`, () => {
      expect(check(msg)).toBe(true)
    })
  }
})

// ─── Pure function: classif passed explicitly ─────────────────────────────────

describe('isActionableDirectRequest — explicit classif', () => {
  it('science=unknown → false regardless of other factors', () => {
    expect(isActionableDirectRequest('quel est mon profil HD', {
      science: 'unknown',
      requestKind: 'exact_profile',
      subcategory: 'type_hd',
      intent: 'unknown',
      needsExactData: true,
      needsInterpretation: false,
      needsVectorEnrichment: false,
      domainRoute: 'general',
      confidence: 0.9,
    })).toBe(false)
  })

  it('requestKind=unknown → false regardless of other factors', () => {
    expect(isActionableDirectRequest('fais moi mon profil human design', {
      science: 'human_design',
      requestKind: 'unknown',
      subcategory: 'type_hd',
      intent: 'human_design_exact',
      needsExactData: false,
      needsInterpretation: false,
      needsVectorEnrichment: false,
      domainRoute: 'general',
      confidence: 0.5,
    })).toBe(false)
  })

  it('science=human_design + requestKind=exact_profile + 5 words → true', () => {
    expect(isActionableDirectRequest('fais moi mon profil human design', {
      science: 'human_design',
      requestKind: 'exact_profile',
      subcategory: 'type_hd',
      intent: 'human_design_exact',
      needsExactData: true,
      needsInterpretation: false,
      needsVectorEnrichment: false,
      domainRoute: 'general',
      confidence: 0.9,
    })).toBe(true)
  })

  it('science=general → false', () => {
    expect(isActionableDirectRequest('donne moi mon profil complet', {
      science: 'general',
      requestKind: 'exact_profile',
      subcategory: null,
      intent: 'profile',
      needsExactData: true,
      needsInterpretation: false,
      needsVectorEnrichment: false,
      domainRoute: 'general',
      confidence: 0.4,
    })).toBe(false)
  })
})

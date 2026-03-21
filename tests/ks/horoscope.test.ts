/**
 * Tests — HexAstra Horoscope
 *
 * Validates:
 * 1. isHoroscopeRequest — correct detection of daily/weekly horoscope intent
 * 2. detectHoroscopeVariant — daily vs weekly discrimination
 * 3. buildHoroscopeDataBlock — data block structure
 * 4. validateHoroscopeOutput — required blocks checker
 *
 * Anti-regression:
 * - Horoscope messages must NOT route to micro_profile or generic framing
 * - isHoroscopeRequest must return true for all official trigger phrases
 * - validateHoroscopeOutput must detect missing required blocks
 */
import { describe, it, expect } from 'vitest'
import {
  isHoroscopeRequest,
  detectHoroscopeVariant,
} from '@/lib/hexastra/orchestration/horoscopeClassifier'
import {
  buildHoroscopeDataBlock,
  validateHoroscopeOutput,
  DAILY_REQUIRED_BLOCKS,
  WEEKLY_REQUIRED_BLOCKS,
} from '@/lib/hexastra/prompts/horoscopePrompt'

// ── isHoroscopeRequest — daily triggers ──────────────────────────────────────

describe('isHoroscopeRequest — daily triggers', () => {
  it('"mon horoscope" → true', () => {
    expect(isHoroscopeRequest('mon horoscope')).toBe(true)
  })

  it('"horoscope du jour" → true', () => {
    expect(isHoroscopeRequest("horoscope du jour")).toBe(true)
  })

  it('"mon horoscope d\'aujourd\'hui" → true', () => {
    expect(isHoroscopeRequest("mon horoscope d'aujourd'hui")).toBe(true)
  })

  it('"hexastra horoscope" → true', () => {
    expect(isHoroscopeRequest('hexastra horoscope')).toBe(true)
  })

  it('"horoscope hexastra" → true', () => {
    expect(isHoroscopeRequest('horoscope hexastra')).toBe(true)
  })

  it('"scan du jour" → true', () => {
    expect(isHoroscopeRequest('scan du jour')).toBe(true)
  })

  it('"énergie du jour" → true', () => {
    expect(isHoroscopeRequest('énergie du jour')).toBe(true)
  })

  it('"energie du jour" → true', () => {
    expect(isHoroscopeRequest('energie du jour')).toBe(true)
  })

  it('"horoscope personnalisé" → true', () => {
    expect(isHoroscopeRequest('horoscope personnalisé')).toBe(true)
  })
})

// ── isHoroscopeRequest — weekly triggers ─────────────────────────────────────

describe('isHoroscopeRequest — weekly triggers', () => {
  it('"horoscope de la semaine" → true', () => {
    expect(isHoroscopeRequest('horoscope de la semaine')).toBe(true)
  })

  it('"horoscope hebdomadaire" → true', () => {
    expect(isHoroscopeRequest('horoscope hebdomadaire')).toBe(true)
  })

  it('"scan de la semaine" → true', () => {
    expect(isHoroscopeRequest('scan de la semaine')).toBe(true)
  })

  it('"lecture sur 7 jours" → true', () => {
    expect(isHoroscopeRequest('lecture sur 7 jours')).toBe(true)
  })

  it('"prévisions pour la semaine" → true', () => {
    expect(isHoroscopeRequest('prévisions pour la semaine')).toBe(true)
  })

  it('"7 jours" → true', () => {
    expect(isHoroscopeRequest('7 jours')).toBe(true)
  })
})

// ── isHoroscopeRequest — non-horoscope messages ───────────────────────────────

describe('isHoroscopeRequest — non-horoscope (should return false)', () => {
  it('"quel est mon ascendant" → false', () => {
    expect(isHoroscopeRequest('quel est mon ascendant')).toBe(false)
  })

  it('"fais moi mon profil human design" → false', () => {
    expect(isHoroscopeRequest('fais moi mon profil human design')).toBe(false)
  })

  it('"quel est mon chemin de vie" → false', () => {
    expect(isHoroscopeRequest('quel est mon chemin de vie')).toBe(false)
  })

  it('"aide moi" → false', () => {
    expect(isHoroscopeRequest('aide moi')).toBe(false)
  })

  it('"je veux une lecture" → false', () => {
    expect(isHoroscopeRequest('je veux une lecture')).toBe(false)
  })

  it('"analyse mon thème natal" → false', () => {
    expect(isHoroscopeRequest('analyse mon thème natal')).toBe(false)
  })
})

// ── detectHoroscopeVariant ────────────────────────────────────────────────────

describe('detectHoroscopeVariant', () => {
  it('"mon horoscope" → daily', () => {
    expect(detectHoroscopeVariant('mon horoscope')).toBe('daily')
  })

  it('"horoscope du jour" → daily', () => {
    expect(detectHoroscopeVariant('horoscope du jour')).toBe('daily')
  })

  it('"scan du jour" → daily', () => {
    expect(detectHoroscopeVariant('scan du jour')).toBe('daily')
  })

  it('"horoscope de la semaine" → weekly', () => {
    expect(detectHoroscopeVariant('horoscope de la semaine')).toBe('weekly')
  })

  it('"horoscope hebdomadaire" → weekly', () => {
    expect(detectHoroscopeVariant('horoscope hebdomadaire')).toBe('weekly')
  })

  it('"7 jours" → weekly', () => {
    expect(detectHoroscopeVariant('7 jours')).toBe('weekly')
  })

  it('"lecture sur sept jours" → weekly', () => {
    expect(detectHoroscopeVariant('lecture sur sept jours')).toBe('weekly')
  })

  it('ambiguous → defaults to daily', () => {
    expect(detectHoroscopeVariant('donne moi quelque chose')).toBe('daily')
  })
})

// ── buildHoroscopeDataBlock ───────────────────────────────────────────────────

describe('buildHoroscopeDataBlock', () => {
  it('includes current date', () => {
    const block = buildHoroscopeDataBlock(null, null, null, 'daily')
    expect(block).toMatch(/DATE ACTUELLE/i)
  })

  it('includes first name when provided', () => {
    const block = buildHoroscopeDataBlock('Alice', null, null, 'daily')
    expect(block).toContain('Alice')
  })

  it('includes birth date when provided', () => {
    const block = buildHoroscopeDataBlock(
      'Alice',
      { date: '1990-05-15', birthDateISO: '1990-05-15T00:00:00Z' },
      null,
      'daily',
    )
    expect(block).toMatch(/1990|15.*mai|mai.*15/i)
  })

  it('daily block does not include week days list', () => {
    const block = buildHoroscopeDataBlock(null, null, null, 'daily')
    expect(block).not.toMatch(/JOURS DE LA SEMAINE/i)
  })

  it('weekly block includes JOURS DE LA SEMAINE', () => {
    const block = buildHoroscopeDataBlock(null, null, null, 'weekly')
    expect(block).toMatch(/JOURS DE LA SEMAINE/i)
  })

  it('does not throw when all params are null', () => {
    expect(() => buildHoroscopeDataBlock(null, null, null, 'daily')).not.toThrow()
  })
})

// ── DAILY_REQUIRED_BLOCKS — nouvelle structure ────────────────────────────────

describe('DAILY_REQUIRED_BLOCKS — nouvelle structure de rendu', () => {
  it('contient exactement 11 blocs titrés ##', () => {
    expect(DAILY_REQUIRED_BLOCKS).toHaveLength(11)
  })

  it('contient ÉNERGIE DU JOUR', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('ÉNERGIE DU JOUR')
  })

  it('contient MIROIR INTÉRIEUR', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('MIROIR INTÉRIEUR')
  })

  it('contient MIROIR EXTÉRIEUR', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('MIROIR EXTÉRIEUR')
  })

  it('contient POINT DE TENSION', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('POINT DE TENSION')
  })

  it('contient OUVERTURE', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('OUVERTURE')
  })

  it('contient ACTION INCARNÉE', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('ACTION INCARNÉE')
  })

  it('contient ACTION SUBTILE', () => {
    expect(DAILY_REQUIRED_BLOCKS).toContain('ACTION SUBTILE')
  })

  it('ne contient plus CLIMAT GÉNÉRAL (ancienne structure)', () => {
    expect(DAILY_REQUIRED_BLOCKS).not.toContain('CLIMAT GÉNÉRAL')
  })

  it('ne contient plus COMPORTEMENT INCARNÉ (ancienne structure)', () => {
    expect(DAILY_REQUIRED_BLOCKS).not.toContain('COMPORTEMENT INCARNÉ')
  })

  it('ne contient plus COMPORTEMENT SI DÉSINCARNÉ (ancienne structure)', () => {
    expect(DAILY_REQUIRED_BLOCKS).not.toContain('COMPORTEMENT SI DÉSINCARNÉ')
  })

  it('ne contient plus POINT DE VIGILANCE (ancienne structure)', () => {
    expect(DAILY_REQUIRED_BLOCKS).not.toContain('POINT DE VIGILANCE')
  })

  it('ne contient plus CLÉ DE COMPORTEMENT GÉNÉRAL (ancienne structure)', () => {
    expect(DAILY_REQUIRED_BLOCKS).not.toContain('CLÉ DE COMPORTEMENT GÉNÉRAL')
  })
})

// ── validateHoroscopeOutput — daily ──────────────────────────────────────────

describe('validateHoroscopeOutput — daily', () => {
  it('returns valid=true when all daily blocks are present', () => {
    const fullOutput = DAILY_REQUIRED_BLOCKS.map((b) => `## ${b}\nContenu du bloc.`).join('\n\n')
    const result = validateHoroscopeOutput(fullOutput, 'daily')
    expect(result.valid).toBe(true)
    expect(result.missingBlocks).toHaveLength(0)
  })

  it('returns valid=false when blocks are missing', () => {
    // Only 2 of the 11 required blocks — others are missing
    const partialOutput = '## ÉNERGIE DU JOUR\nTexte ici.\n## MIROIR INTÉRIEUR\nTexte.'
    const result = validateHoroscopeOutput(partialOutput, 'daily')
    expect(result.valid).toBe(false)
    expect(result.missingBlocks.length).toBeGreaterThan(0)
  })

  it('detects specific missing blocks — SANTÉ and HUMEUR', () => {
    const outputWithoutSome = DAILY_REQUIRED_BLOCKS
      .filter((b) => b !== 'SANTÉ' && b !== 'HUMEUR')
      .map((b) => `## ${b}\nContenu.`)
      .join('\n\n')
    const result = validateHoroscopeOutput(outputWithoutSome, 'daily')
    expect(result.missingBlocks).toContain('SANTÉ')
    expect(result.missingBlocks).toContain('HUMEUR')
  })

  it('detects specific missing blocks — POINT DE TENSION and OUVERTURE', () => {
    const outputWithoutSome = DAILY_REQUIRED_BLOCKS
      .filter((b) => b !== 'POINT DE TENSION' && b !== 'OUVERTURE')
      .map((b) => `## ${b}\nContenu.`)
      .join('\n\n')
    const result = validateHoroscopeOutput(outputWithoutSome, 'daily')
    expect(result.missingBlocks).toContain('POINT DE TENSION')
    expect(result.missingBlocks).toContain('OUVERTURE')
  })

  it('detects specific missing blocks — ACTION INCARNÉE and ACTION SUBTILE', () => {
    const outputWithoutSome = DAILY_REQUIRED_BLOCKS
      .filter((b) => b !== 'ACTION INCARNÉE' && b !== 'ACTION SUBTILE')
      .map((b) => `## ${b}\nContenu.`)
      .join('\n\n')
    const result = validateHoroscopeOutput(outputWithoutSome, 'daily')
    expect(result.missingBlocks).toContain('ACTION INCARNÉE')
    expect(result.missingBlocks).toContain('ACTION SUBTILE')
  })

  it('returns valid=false for empty string', () => {
    const result = validateHoroscopeOutput('', 'daily')
    expect(result.valid).toBe(false)
    expect(result.missingBlocks.length).toBeGreaterThan(0)
  })

  it('ÉNERGIE DU JOUR appears before MIROIR INTÉRIEUR in a valid output', () => {
    const fullOutput = DAILY_REQUIRED_BLOCKS.map((b) => `## ${b}\nContenu du bloc.`).join('\n\n')
    const energiePos = fullOutput.indexOf('ÉNERGIE DU JOUR')
    const miroirPos = fullOutput.indexOf('MIROIR INTÉRIEUR')
    expect(energiePos).toBeLessThan(miroirPos)
  })

  it('POINT DE TENSION appears before OUVERTURE in a valid output', () => {
    const fullOutput = DAILY_REQUIRED_BLOCKS.map((b) => `## ${b}\nContenu du bloc.`).join('\n\n')
    const tensionPos = fullOutput.indexOf('POINT DE TENSION')
    const ouverturePos = fullOutput.indexOf('OUVERTURE')
    expect(tensionPos).toBeLessThan(ouverturePos)
  })
})

// ── validateHoroscopeOutput — weekly ─────────────────────────────────────────

describe('validateHoroscopeOutput — weekly', () => {
  it('returns valid=true when all weekly blocks are present', () => {
    const fullOutput = WEEKLY_REQUIRED_BLOCKS.map((b) => `## ${b}\nContenu du bloc.`).join('\n\n')
    const result = validateHoroscopeOutput(fullOutput, 'weekly')
    expect(result.valid).toBe(true)
    expect(result.missingBlocks).toHaveLength(0)
  })

  it('returns valid=false when weekly blocks are missing', () => {
    const partialOutput = '## INTRODUCTION\nTexte.\n## ÉNERGIE DU JOUR\nTexte.'
    const result = validateHoroscopeOutput(partialOutput, 'weekly')
    expect(result.valid).toBe(false)
    expect(result.missingBlocks.length).toBeGreaterThan(0)
  })
})

// ── Anti-regression: horoscope messages must not be treated as vague ──────────

describe('anti-regression — horoscope always detected as horoscope', () => {
  const horoscopeMessages = [
    'mon horoscope',
    'horoscope du jour',
    "horoscope d'aujourd'hui",
    'hexastra horoscope',
    'horoscope hexastra',
    'scan du jour',
    'énergie du jour',
    'horoscope de la semaine',
    'horoscope hebdomadaire',
    '7 jours',
  ]

  for (const msg of horoscopeMessages) {
    it(`"${msg}" → isHoroscopeRequest=true`, () => {
      expect(isHoroscopeRequest(msg)).toBe(true)
    })
  }
})

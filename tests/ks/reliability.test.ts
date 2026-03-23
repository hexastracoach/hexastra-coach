/**
 * Tests — isReliableExactData
 *
 * Validates per-science data reliability checks.
 * RULE: honest fallback when data is missing — never invent.
 */
import { describe, it, expect } from 'vitest'
import { isReliableExactData } from '@/lib/exact-data/reliability'

// ─── Astrology ────────────────────────────────────────────────────────────────

describe('isReliableExactData — astrology', () => {
  it('reliable when sun + moon present', () => {
    const result = isReliableExactData('astrology', null, {
      sun: 'Taureau',
      moon: 'Scorpion',
    })
    expect(result.reliable).toBe(true)
    expect(result.missingFields).not.toContain('sun')
    expect(result.missingFields).not.toContain('moon')
  })

  it('reliable even without ascendant (unknown birth time)', () => {
    const result = isReliableExactData('astrology', null, {
      sun: 'Bélier',
      moon: 'Cancer',
    })
    expect(result.reliable).toBe(true)
  })

  it('unreliable when sun is missing', () => {
    const result = isReliableExactData('astrology', null, {
      moon: 'Gémeaux',
      ascendant: 'Lion',
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('sun')
  })

  it('unreliable when moon is missing', () => {
    const result = isReliableExactData('astrology', null, {
      sun: 'Vierge',
      ascendant: 'Capricorne',
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('moon')
  })

  it('unreliable when raw data is null', () => {
    const result = isReliableExactData('astrology', null, null)
    expect(result.reliable).toBe(false)
    expect(result.completeness).toBe(0)
  })

  it('handles nested tropical block', () => {
    const result = isReliableExactData('astrology', null, {
      tropical: {
        sun: 'Sagittaire',
        moon: 'Verseau',
        ascendant: 'Balance',
      },
    })
    expect(result.reliable).toBe(true)
  })

  it('requires the ascendant itself for ascendant-specific requests', () => {
    const result = isReliableExactData('astrology', 'ascendant', {
      tropical: {
        sun: { sign: 'Sagittaire', degree: 14.2 },
        moon: { sign: 'Verseau', degree: 2.4 },
      },
    })
    expect(result.reliable).toBe(false)
    expect(result.completeness).toBe(0)
    expect(result.missingFields).toContain('ascendant')
  })

  it('accepts longitude-only tropical data when the ascendant object is present', () => {
    const result = isReliableExactData('astrology', 'ascendant', {
      tropical: {
        sun: { lon: 280.038993374667 },
        moon: { lon: 155.9921878541953 },
        ascendant: { lon: 205.3 },
      },
    })
    expect(result.reliable).toBe(true)
    expect(result.missingFields).not.toContain('ascendant')
  })

  it('detects missing houses for maisons subcategory', () => {
    const result = isReliableExactData('astrology', 'maisons', {
      sun: 'Lion',
      moon: 'Poissons',
      // no houses
    })
    expect(result.missingFields).toContain('houses')
  })
})

// ─── Human Design ─────────────────────────────────────────────────────────────

describe('isReliableExactData — human_design', () => {
  it('reliable when type_hd + authority present', () => {
    // Reliability rule: type AND (authority OR strategy)
    const result = isReliableExactData('human_design', null, {
      type_hd: 'Projecteur',
      profil_hd: '3/5',
      authority: 'Émotionnelle',
    })
    expect(result.reliable).toBe(true)
  })

  it('reliable when type_hd + strategy present (no authority)', () => {
    const result = isReliableExactData('human_design', null, {
      type_hd: 'Générateur Manifestant',
      strategy: 'Répondre et informer',
    })
    expect(result.reliable).toBe(true)
  })

  it('unreliable when type_hd missing', () => {
    const result = isReliableExactData('human_design', null, {
      profil_hd: '2/4',
      authority: 'Splénique',
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('type_hd')
  })

  it('unreliable when type present but neither authority nor strategy', () => {
    const result = isReliableExactData('human_design', null, {
      type_hd: 'Générateur',
      // no authority, no strategy
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('autorite_ou_strategie')
  })

  it('still marks profil_hd missing when absent (enrichment field)', () => {
    const result = isReliableExactData('human_design', null, {
      type_hd: 'Générateur',
      authority: 'Sacrale',
    })
    expect(result.missingFields).toContain('profil_hd')
    expect(result.reliable).toBe(true)
  })

  it('detects missing centres for centres_hd subcategory', () => {
    const result = isReliableExactData('human_design', 'centres_hd', {
      type_hd: 'Manifesteur',
      profil_hd: '1/3',
      authority: 'Émotionnelle',
      // no centres
    })
    expect(result.missingFields).toContain('centres_hd')
  })

  it('handles nested human_design block with authority', () => {
    const result = isReliableExactData('human_design', null, {
      human_design: {
        type_hd: 'Réflecteur',
        profil_hd: '6/2',
        authority: 'Lunaire',
      },
    })
    expect(result.reliable).toBe(true)
  })
})

// ─── Numerology ───────────────────────────────────────────────────────────────

describe('isReliableExactData — numerology', () => {
  it('reliable when chemin_de_vie present', () => {
    const result = isReliableExactData('numerology', null, {
      chemin_de_vie: 7,
    })
    expect(result.reliable).toBe(true)
  })

  it('unreliable when chemin_de_vie missing', () => {
    const result = isReliableExactData('numerology', null, {
      expression: 3,
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('chemin_de_vie')
  })

  it('requires annee_personnelle when that subcategory is requested', () => {
    const result = isReliableExactData('numerology', 'annee_personnelle', {
      chemin_de_vie: 5,
      // no annee_personnelle
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('annee_personnelle')
  })

  it('accepts nested numerology fields from /chart/fusion blocks', () => {
    const result = isReliableExactData('numerology', ['annee_personnelle', 'chemin_de_vie'], {
      numerology: {
        core: {
          lifePathNumber: 8,
        },
        yearly: {
          personalYearNumber: 3,
        },
      },
    })
    expect(result.reliable).toBe(true)
    expect(result.completeness).toBe(1)
    expect(result.missingFields).toHaveLength(0)
  })

  it('fails a multi numerology request when one requested field is missing', () => {
    const result = isReliableExactData('numerology', ['annee_personnelle', 'chemin_de_vie'], {
      numerology: {
        yearly: {
          personalYearNumber: 4,
        },
      },
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('chemin_de_vie')
    expect(result.missingFields).not.toContain('annee_personnelle')
  })
})

// ─── Kua ──────────────────────────────────────────────────────────────────────

describe('isReliableExactData — kua', () => {
  it('reliable when nombre_kua present', () => {
    const result = isReliableExactData('kua', null, {
      nombre_kua: 3,
    })
    expect(result.reliable).toBe(true)
    expect(result.completeness).toBe(1)
  })

  it('unreliable when nombre_kua missing', () => {
    const result = isReliableExactData('kua', null, {
      direction: 'Nord',
    })
    expect(result.reliable).toBe(false)
    expect(result.completeness).toBe(0)
  })
})

// ─── Enneagram ────────────────────────────────────────────────────────────────

describe('isReliableExactData — enneagram', () => {
  it('reliable when type_enn present', () => {
    const result = isReliableExactData('enneagram', null, {
      type_enn: 4,
    })
    expect(result.reliable).toBe(true)
  })

  it('unreliable when type_enn missing', () => {
    const result = isReliableExactData('enneagram', null, {
      aile: '3',
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('type_enn')
  })

  it('requires wing data when aile_enn is explicitly requested', () => {
    const result = isReliableExactData('enneagram', ['type_enn', 'aile_enn'], {
      enneagram: {
        type_enn: 8,
      },
    })
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('aile_enn')
  })
})

// ─── General/Unknown ──────────────────────────────────────────────────────────

describe('isReliableExactData — general', () => {
  it('reliable when >= 5 keys present', () => {
    const result = isReliableExactData('general', null, {
      a: 1, b: 2, c: 3, d: 4, e: 5,
    })
    expect(result.reliable).toBe(true)
  })

  it('unreliable when < 5 keys present', () => {
    const result = isReliableExactData('general', null, {
      a: 1, b: 2,
    })
    expect(result.reliable).toBe(false)
  })

  it('unreliable when raw is empty object', () => {
    const result = isReliableExactData('general', null, {})
    expect(result.reliable).toBe(false)
  })
})

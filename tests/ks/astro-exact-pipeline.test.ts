/**
 * Tests — Astro Exact Pipeline
 *
 * Validates the full astrology exact extraction chain:
 * 1. resolveAstroSource() — handles tropical / tropical.planets / capitalized keys
 * 2. extractCoreAstroPlacements() — sun/moon/rising via resolved source
 * 3. buildCompactNatalReadingContext() — planets + compact block from nested raw
 * 4. isReliableExactData() — reliability check with nested tropical structure
 * 5. buildLocalAstroFallback() — deterministic fallback when OpenAI times out
 */

import { describe, it, expect } from 'vitest'
import { resolveAstroSource, extractCoreAstroPlacements, buildLocalAstroFallback } from '@/lib/hexastra/guards/extractCoreAstro'
import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'
import { isReliableExactData } from '@/lib/exact-data/reliability'

// ── Factories — simulate actual Railway /chart/fusion response shapes ─────────

/** Structure: raw.tropical.planets.{planet} (most common Railway shape) */
function makeFusionWithPlanetsNested(overrides: Record<string, unknown> = {}) {
  return {
    input: { firstName: 'Alice' },
    resolvedLocation: { city: 'Paris' },
    tropical: {
      planets: {
        sun:      { sign: 'Aries',   degree: 5.2,  retrograde: false },
        moon:     { sign: 'Cancer',  degree: 14.3, retrograde: false },
        mercury:  { sign: 'Pisces',  degree: 28.1, retrograde: true  },
        venus:    { sign: 'Taurus',  degree: 10.5, retrograde: false },
        mars:     { sign: 'Gemini',  degree: 3.7,  retrograde: false },
        jupiter:  { sign: 'Gemini',  degree: 25.0, retrograde: false },
        saturn:   { sign: 'Aquarius',degree: 17.2, retrograde: false },
      },
      ascendant: { sign: 'Virgo', degree: 22.1 },
      houses:    [{ number: 1, sign: 'Virgo' }, { number: 2, sign: 'Libra' }],
      aspects:   ['Sun sextile Moon', 'Mercury conjunct Venus'],
    },
    humanDesign: { type_hd: 'Generator', profil_hd: '3/5' },
    numerology:  { chemin_de_vie: 7 },
    publicSummary: 'Synthèse de la lecture.',
    ...overrides,
  }
}

/** Structure: raw.tropical.{planet} directly (flat tropical) */
function makeFusionWithFlatTropical() {
  return {
    tropical: {
      sun:       { sign: 'Leo',    degree: 12.0 },
      moon:      { sign: 'Scorpio',degree: 8.5  },
      ascendant: { sign: 'Libra', degree: 5.0   },
      mercury:   { sign: 'Virgo', degree: 4.2   },
      venus:     { sign: 'Leo',   degree: 22.0  },
      mars:      { sign: 'Cancer',degree: 18.7  },
      jupiter:   { sign: 'Pisces',degree: 11.3  },
      saturn:    { sign: 'Aquarius',degree: 3.0 },
    },
    humanDesign: { type_hd: 'Projector' },
  }
}

/** Structure: raw.tropical with capitalized planet keys */
function makeFusionWithCapitalizedKeys() {
  return {
    tropical: {
      Sun:       { sign: 'Sagittarius', degree: 7.4 },
      Moon:      { sign: 'Pisces',      degree: 2.1 },
      Ascendant: { sign: 'Capricorn',   degree: 15.6 },
      Mercury:   { sign: 'Sagittarius', degree: 20.0 },
      Venus:     { sign: 'Scorpio',     degree: 9.9  },
      Mars:      { sign: 'Virgo',       degree: 14.5 },
    },
    numerology: { chemin_de_vie: 3 },
  }
}

/** Structure: flat raw root (no tropical key — fallback path) */
function makeFusionFlatRoot() {
  return {
    sun:       { sign: 'Gemini', degree: 18.0 },
    moon:      { sign: 'Libra', degree: 25.2  },
    ascendant: { sign: 'Aries', degree: 0.5   },
  }
}

/** Structure: tropical planets provide only absolute longitudes (actual Railway fallback shape) */
function makeFusionWithLongitudesOnly() {
  return {
    tropical: {
      sun: { lon: 280.038993374667, lat: 0.00016201670210021107 },
      moon: { lon: 155.9921878541953, lat: 3.5675548479243115 },
      ascendant: { lon: 205.3 },
      mercury: { lon: 294.7 },
    },
  }
}

function makeFusionWithDataEnvelope() {
  return {
    data: {
      tropical: {
        planets: {
          sun: { sign: 'Aries', degree: 5.2 },
          moon: { sign: 'Cancer', degree: 14.3 },
        },
        ascendant: { sign: 'Virgo', degree: 22.1, lon: 172.1, zodiac_mode: 'tropical' },
      },
    },
    tropical: {
      ascendant: { sign: 'Wrong', degree: 1.1 },
    },
  }
}

function makeFusionWithDataEnvelopePlanetsAscendant() {
  return {
    data: {
      tropical: {
        planets: {
          sun: { sign: 'Aries', degree: 5.2 },
          moon: { sign: 'Cancer', degree: 14.3 },
          ascendant: { sign: 'Libra', degree: 7.7, lon: 187.7 },
        },
      },
    },
  }
}

// ── resolveAstroSource ────────────────────────────────────────────────────────

describe('resolveAstroSource — path detection', () => {
  it('resolves tropical.planets structure → path contains "tropical+tropical.planets"', () => {
    const raw = makeFusionWithPlanetsNested()
    const { path } = resolveAstroSource(raw)
    expect(path).toContain('tropical')
  })

  it('resolves flat tropical structure → path is "tropical"', () => {
    const raw = makeFusionWithFlatTropical()
    const { path } = resolveAstroSource(raw)
    expect(path).toBe('tropical')
  })

  it('resolves capitalized keys → path is "tropical"', () => {
    const raw = makeFusionWithCapitalizedKeys()
    const { path } = resolveAstroSource(raw)
    expect(path).toBe('tropical')
  })

  it('falls back to root when no tropical/astrology block', () => {
    const raw = makeFusionFlatRoot()
    const { path } = resolveAstroSource(raw)
    expect(path).toBe('root')
  })

  it('prefers data.tropical when the API wraps astrology under data', () => {
    const { path } = resolveAstroSource(makeFusionWithDataEnvelope())
    expect(path).toBe('data.tropical+data.tropical.planets')
  })
})

describe('resolveAstroSource — source contents', () => {
  it('source contains sun key when planets are nested under tropical.planets', () => {
    const { source } = resolveAstroSource(makeFusionWithPlanetsNested())
    expect(source).toHaveProperty('sun')
    expect(source).toHaveProperty('moon')
    expect(source).toHaveProperty('ascendant')
  })

  it('source contains sun key when tropical is flat', () => {
    const { source } = resolveAstroSource(makeFusionWithFlatTropical())
    expect(source).toHaveProperty('sun')
    expect(source).toHaveProperty('moon')
  })

  it('source contains Sun (capital) key when tropical uses capitalized keys', () => {
    const { source } = resolveAstroSource(makeFusionWithCapitalizedKeys())
    expect(source).toHaveProperty('Sun')
  })

  it('tropical root keys (ascendant, houses) win over planets sub-keys', () => {
    // If both tropical.ascendant and tropical.planets.ascendant exist,
    // tropical root (blockObj) should win since it spreads last
    const raw = {
      tropical: {
        planets: { sun: { sign: 'Aries' }, ascendant: { sign: 'WRONG' } },
        ascendant: { sign: 'Virgo', degree: 22.1 },
      },
    }
    const { source } = resolveAstroSource(raw)
    const asc = source.ascendant as Record<string, unknown>
    expect(asc?.sign).toBe('Virgo')
  })

  it('data.tropical root ascendant wins over data.tropical.planets.ascendant', () => {
    const { source } = resolveAstroSource(makeFusionWithDataEnvelope())
    const asc = source.ascendant as Record<string, unknown>
    expect(asc?.sign).toBe('Virgo')
  })
})

// ── extractCoreAstroPlacements ────────────────────────────────────────────────

describe('extractCoreAstroPlacements — with tropical.planets structure', () => {
  it('extracts sun, moon, rising from tropical.planets nested raw', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithPlanetsNested())
    expect(placements.sun?.sign).toBe('Bélier')    // "Aries" normalized to French
    expect(placements.moon?.sign).toBe('Cancer')
    expect(placements.rising?.sign).toBe('Vierge') // "Virgo" → Vierge
    expect(placements.allResolved).toBe(true)
    expect(placements.missing).toHaveLength(0)
  })

  it('extracts sun, moon, rising from flat tropical', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithFlatTropical())
    expect(placements.sun?.sign).toBe('Lion')       // "Leo" → Lion
    expect(placements.moon?.sign).toBe('Scorpion')  // "Scorpio" → Scorpion
    expect(placements.rising?.sign).toBe('Balance') // "Libra" → Balance
    expect(placements.allResolved).toBe(true)
  })

  it('extracts sun and moon from capitalized key tropical', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithCapitalizedKeys())
    expect(placements.sun?.sign).toBeTruthy()
    expect(placements.moon?.sign).toBeTruthy()
  })

  it('returns correct degrees', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithPlanetsNested())
    expect(placements.sun?.degree).toBe(5.2)
    expect(placements.moon?.degree).toBe(14.3)
  })

  it('derives signs and in-sign degrees from longitude-only planetary objects', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithLongitudesOnly())
    expect(placements.sun?.sign).toBe('Capricorne')
    expect(placements.sun?.degree).toBe(10)
    expect(placements.moon?.sign).toBe('Vierge')
    expect(placements.moon?.degree).toBe(6)
    expect(placements.rising?.sign).toBe('Balance')
    expect(placements.rising?.degree).toBe(25.3)
  })

  it('returns null for all when raw is null', () => {
    const placements = extractCoreAstroPlacements(null)
    expect(placements.sun).toBeNull()
    expect(placements.moon).toBeNull()
    expect(placements.rising).toBeNull()
    expect(placements.allResolved).toBe(false)
    expect(placements.missing).toContain('sun')
  })

  it('extracts rising from data.tropical.ascendant before other candidates', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithDataEnvelope())
    expect(placements.rising?.sign).toBe('Vierge')
    expect(placements.rising?.degree).toBe(22.1)
    expect(placements.rising?.lon).toBe(172.1)
    expect(placements.rising?.signIndex).toBe(5)
    expect(placements.rising?.zodiacMode).toBe('tropical')
  })

  it('extracts rising from data.tropical.planets.ascendant when tropical.ascendant is absent', () => {
    const placements = extractCoreAstroPlacements(makeFusionWithDataEnvelopePlanetsAscendant())
    expect(placements.rising?.sign).toBe('Balance')
    expect(placements.rising?.degree).toBe(7.7)
    expect(placements.rising?.lon).toBe(187.7)
  })
})

// ── buildCompactNatalReadingContext ───────────────────────────────────────────

describe('buildCompactNatalReadingContext — nested tropical.planets', () => {
  it('extracts sunSign from nested tropical.planets structure (not null)', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithPlanetsNested())
    expect(ctx.sunSign).not.toBeNull()
    expect(ctx.sunSign).toBeTruthy()
  })

  it('extracts moonSign from nested tropical.planets structure', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithPlanetsNested())
    expect(ctx.moonSign).not.toBeNull()
    expect(ctx.moonSign).toBeTruthy()
  })

  it('extracts risingSign from tropical.ascendant when planets are nested', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithPlanetsNested())
    expect(ctx.risingSign).not.toBeNull()
    expect(ctx.risingSign).toBeTruthy()
  })

  it('compact data block contains SOLEIL and LUNE labels', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithPlanetsNested())
    expect(ctx.compactDataBlock).toContain('SOLEIL')
    expect(ctx.compactDataBlock).toContain('LUNE')
  })

  it('compact data block is non-empty and under 2000 chars by default', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithPlanetsNested())
    expect(ctx.compactDataBlock.length).toBeGreaterThan(50)
    expect(ctx.compactDataBlock.length).toBeLessThanOrEqual(2000)
  })

  it('works with flat tropical structure', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithFlatTropical())
    expect(ctx.sunSign).not.toBeNull()
    expect(ctx.moonSign).not.toBeNull()
    expect(ctx.risingSign).not.toBeNull()
  })

  it('extracts sun/moon/rising from longitude-only tropical objects', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithLongitudesOnly())
    expect(ctx.sunSign).toBe('Capricorne')
    expect(ctx.moonSign).toBe('Vierge')
    expect(ctx.risingSign).toBe('Balance')
    expect(ctx.sunDegree).toBe(10)
    expect(ctx.moonDegree).toBe(6)
    expect(ctx.risingDegree).toBe(25.3)
  })

  it('tracks the ascendant source and raw payload when the API responds under data.tropical', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithDataEnvelope())
    expect(ctx.risingSign).toBe('Vierge')
    expect(ctx.fieldSources.ascendant).toBe('data.tropical.ascendant')
    expect(ctx.risingRaw?.sign).toBe('Vierge')
    expect(ctx.risingRaw?.lon).toBe(172.1)
    expect(ctx.compactDataBlock).toContain('ASCENDANT: Vierge')
  })

  it('falls back to data.tropical.planets.ascendant when needed and keeps the compact block coherent', () => {
    const ctx = buildCompactNatalReadingContext(makeFusionWithDataEnvelopePlanetsAscendant())
    expect(ctx.risingSign).toBe('Balance')
    expect(ctx.fieldSources.ascendant).toBe('data.tropical.planets.ascendant')
    expect(ctx.compactDataBlock).toContain('ASCENDANT: Balance')
  })
})

// ── isReliableExactData — astrology ──────────────────────────────────────────

describe('isReliableExactData — astrology with nested tropical.planets', () => {
  it('returns reliable=true for tropical.planets structure (sun + moon present)', () => {
    const raw = makeFusionWithPlanetsNested() as Record<string, unknown>
    const result = isReliableExactData('astrology', 'theme_natal', raw)
    expect(result.reliable).toBe(true)
    expect(result.missingFields).not.toContain('sun')
    expect(result.missingFields).not.toContain('moon')
  })

  it('returns reliable=true for flat tropical structure', () => {
    const raw = makeFusionWithFlatTropical() as Record<string, unknown>
    const result = isReliableExactData('astrology', 'theme_natal', raw)
    expect(result.reliable).toBe(true)
  })

  it('returns reliable=false when raw is empty', () => {
    const result = isReliableExactData('astrology', 'theme_natal', {})
    expect(result.reliable).toBe(false)
    expect(result.missingFields).toContain('sun')
    expect(result.missingFields).toContain('moon')
  })

  it('returns reliable=true even when ascendant is missing (birth time unknown)', () => {
    const raw = {
      tropical: {
        planets: {
          sun:  { sign: 'Aries',  degree: 5.2 },
          moon: { sign: 'Cancer', degree: 14.3 },
          // no ascendant — birth time unknown
        },
      },
    } as Record<string, unknown>
    const result = isReliableExactData('astrology', 'signe_lunaire', raw)
    // Reliable because sun + moon present; ascendant absence is acceptable
    expect(result.reliable).toBe(true)
    expect(result.missingFields).toContain('ascendant')
    expect(result.missingFields).not.toContain('sun')
    expect(result.missingFields).not.toContain('moon')
  })

  it('returns reliable=false for ascendant subcategory when ascendant is missing', () => {
    const raw = {
      tropical: {
        planets: {
          sun: { sign: 'Aries', degree: 5.2 },
          moon: { sign: 'Cancer', degree: 14.3 },
        },
      },
    } as Record<string, unknown>
    const result = isReliableExactData('astrology', 'ascendant', raw)
    expect(result.reliable).toBe(false)
    expect(result.completeness).toBe(0)
    expect(result.missingFields).toContain('ascendant')
  })

  it('lists all missing planets for theme_natal when only sun present', () => {
    const raw = {
      tropical: {
        sun: { sign: 'Aries', degree: 5.2 },
        moon: { sign: 'Cancer', degree: 14.3 },
      },
    } as Record<string, unknown>
    const result = isReliableExactData('astrology', 'theme_natal', raw)
    // mercury, venus, mars, jupiter, saturn should be missing
    expect(result.missingFields.length).toBeGreaterThan(3)
  })
})

// ── buildLocalAstroFallback ───────────────────────────────────────────────────

describe('buildLocalAstroFallback — timeout fallback', () => {
  it('returns a non-empty string when data is available', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionWithPlanetsNested() as Record<string, unknown>,
      'fr',
      'Alice',
    )
    expect(fallback).toBeTruthy()
    expect(fallback.length).toBeGreaterThan(20)
  })

  it('includes first name when provided', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionWithPlanetsNested() as Record<string, unknown>,
      'fr',
      'Marie',
    )
    expect(fallback).toContain('Marie')
  })

  it('contains Soleil/Lune/Ascendant labels in French', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionWithPlanetsNested() as Record<string, unknown>,
      'fr',
      null,
    )
    expect(fallback).toContain('Soleil')
    expect(fallback).toContain('Lune')
    expect(fallback).toContain('Ascendant')
  })

  it('contains Sun/Moon/Rising labels in English', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionWithPlanetsNested() as Record<string, unknown>,
      'en',
      null,
    )
    expect(fallback).toContain('Sun')
    expect(fallback).toContain('Moon')
    expect(fallback).toContain('Rising')
  })

  it('contains retry invitation in French', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionWithPlanetsNested() as Record<string, unknown>,
      'fr',
      null,
    )
    expect(fallback).toContain('renvoie')
  })

  it('returns graceful degradation message when raw has no recognisable astro data', () => {
    const fallback = buildLocalAstroFallback({ input: {}, fusionMeta: {} }, 'fr', null)
    expect(fallback).toBeTruthy()
    expect(fallback.length).toBeGreaterThan(10)
  })

  it('works with flat root structure (no tropical key)', () => {
    const fallback = buildLocalAstroFallback(
      makeFusionFlatRoot() as Record<string, unknown>,
      'fr',
      null,
    )
    expect(fallback).toContain('Soleil')
  })
})

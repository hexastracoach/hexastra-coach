/**
 * extractCoreAstroPlacements — Hexastra Coach
 *
 * Deterministic extraction of Sun / Moon / Rising from /chart/fusion raw data.
 *
 * Rules:
 * - Never invent or guess values
 * - Read directly from the raw JSON — no interpretation
 * - If a field is absent, return null and log clearly
 * - If present, normalize to a capitalised sign name
 *
 * The /chart/fusion endpoint may return signs under several key conventions
 * (English camelCase, French snake_case, nested objects, flat strings).
 * All known variants are handled below.
 */

export type CoreAstroPlacement = {
  sign: string | null          // Normalised sign name e.g. "Taureau", "Cancer", "Scorpion"
  degree: number | null        // Ecliptic degree within the sign (0–29.99)
  retrograde?: boolean | null  // Whether the body is retrograde (planets only)
  rawValue?: unknown           // Original raw value for traceability
}

export type CoreAstroPlacements = {
  sun: CoreAstroPlacement | null
  moon: CoreAstroPlacement | null
  rising: CoreAstroPlacement | null    // ascendant
  /** True when all three were resolved from raw data */
  allResolved: boolean
  /** Keys that could not be found in raw data */
  missing: string[]
}

// ── Known key variants for each body ─────────────────────────────────────────
// Order matters: first match wins
const SUN_KEYS   = ['sun', 'soleil', 'Sun', 'Soleil', 'SUN', 'sol']
const MOON_KEYS  = ['moon', 'lune', 'Moon', 'Lune', 'MOON', 'luna']
const RISING_KEYS = [
  'ascendant', 'rising', 'asc', 'Ascendant', 'Rising', 'ASC',
  'ascendant_sign', 'rising_sign', 'maison_1', 'house_1_sign',
]

// Sign normalisation map — handles API responses in English or French
const SIGN_NORMALISATION: Record<string, string> = {
  // French
  'bélier': 'Bélier',   'belier': 'Bélier',
  'taureau': 'Taureau',
  'gémeaux': 'Gémeaux', 'gemeaux': 'Gémeaux',
  'cancer': 'Cancer',
  'lion': 'Lion',
  'vierge': 'Vierge',
  'balance': 'Balance',
  'scorpion': 'Scorpion',
  'sagittaire': 'Sagittaire',
  'capricorne': 'Capricorne',
  'verseau': 'Verseau',
  'poissons': 'Poissons',
  // English
  'aries': 'Bélier',
  'taurus': 'Taureau',
  'gemini': 'Gémeaux',
  // cancer same
  'leo': 'Lion',
  'virgo': 'Vierge',
  'libra': 'Balance',
  'scorpio': 'Scorpion',
  'sagittarius': 'Sagittaire',
  'capricorn': 'Capricorne',
  'aquarius': 'Verseau',
  'pisces': 'Poissons',
}

function normaliseSign(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw !== 'string') return null
  const lower = raw.toLowerCase().trim()
  return SIGN_NORMALISATION[lower] ?? (raw.trim() || null)
}

function extractDegree(obj: Record<string, unknown>): number | null {
  const candidates = ['degree', 'degre', 'deg', 'longitude_in_sign', 'pos']
  for (const k of candidates) {
    const v = obj[k]
    if (typeof v === 'number' && !isNaN(v)) return Math.round(v * 10) / 10
    if (typeof v === 'string') {
      const parsed = parseFloat(v)
      if (!isNaN(parsed)) return Math.round(parsed * 10) / 10
    }
  }
  return null
}

function extractRetrograde(obj: Record<string, unknown>): boolean | null {
  const candidates = ['retrograde', 'is_retrograde', 'retro', 'rx']
  for (const k of candidates) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === 'R' || v === 'r'
  }
  return null
}

/**
 * Attempt to resolve a single celestial body from a raw API object.
 * Handles:
 *   - flat string:   { sun: "Taureau" }
 *   - object:        { sun: { sign: "Taurus", degree: 14.5 } }
 *   - nested sign:   { sun: { sign_name: "Taureau" } }
 *   - flat degree:   { sun_degree: 14.5, sun_sign: "Taurus" } — resolved separately
 */
function resolvePlacement(raw: Record<string, unknown>, keys: string[]): CoreAstroPlacement | null {
  for (const key of keys) {
    const value = raw[key]
    if (value === undefined || value === null) continue

    // Flat string value — sign name directly
    if (typeof value === 'string') {
      const sign = normaliseSign(value)
      if (sign) return { sign, degree: null, rawValue: value }
    }

    // Object value — extract sign + degree
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>
      const signRaw =
        obj.sign ?? obj.sign_name ?? obj.signe ?? obj.name ?? obj.label ?? obj.zodiac_sign ?? null
      const sign = normaliseSign(signRaw)
      if (sign) {
        return {
          sign,
          degree: extractDegree(obj),
          retrograde: extractRetrograde(obj),
          rawValue: value,
        }
      }
    }
  }

  // Flat key variants: e.g. sun_sign + sun_degree at root level
  for (const key of keys) {
    const signKey = `${key}_sign`
    const signRaw = raw[signKey]
    if (signRaw) {
      const sign = normaliseSign(signRaw)
      if (sign) {
        const degreeKey = `${key}_degree`
        const degRaw = raw[degreeKey]
        const degree = typeof degRaw === 'number' ? degRaw : null
        return { sign, degree, rawValue: signRaw }
      }
    }
  }

  return null
}

/**
 * Extract Sun, Moon and Rising sign from /chart/fusion raw data.
 * Returns a structured, deterministic result — never guesses.
 *
 * Usage: call this before building the system prompt when the question
 * explicitly targets sun / moon / ascendant. Inject the result as a
 * pinned fact block so the LLM cannot drift.
 */
export function extractCoreAstroPlacements(
  raw: Record<string, unknown> | null | undefined,
): CoreAstroPlacements {
  const missing: string[] = []

  if (!raw || typeof raw !== 'object') {
    console.warn('[ASTRO_CORE] extracting core placements — raw data is null/undefined')
    return { sun: null, moon: null, rising: null, allResolved: false, missing: ['sun', 'moon', 'rising'] }
  }

  console.log('[ASTRO_CORE] extracting core placements', {
    availableKeys: Object.keys(raw).slice(0, 20),
  })

  const sun   = resolvePlacement(raw, SUN_KEYS)
  const moon  = resolvePlacement(raw, MOON_KEYS)
  const rising = resolvePlacement(raw, RISING_KEYS)

  if (!sun)    missing.push('sun')
  if (!moon)   missing.push('moon')
  if (!rising) missing.push('rising')

  const allResolved = missing.length === 0

  console.log('[ASTRO_CORE] extracted', {
    sun:    sun    ? { sign: sun.sign,    degree: sun.degree }    : null,
    moon:   moon   ? { sign: moon.sign,   degree: moon.degree }   : null,
    rising: rising ? { sign: rising.sign, degree: rising.degree } : null,
    allResolved,
    missing,
  })

  if (missing.length > 0) {
    console.warn('[ASTRO_CORE] missing field(s)', {
      missing,
      availableKeys: Object.keys(raw).slice(0, 40),
      hint: 'Check /chart/fusion response structure',
    })
  }

  return { sun, moon, rising, allResolved, missing }
}

/**
 * Format core astro placements as a pinned deterministic block for the system prompt.
 * Inject this ABOVE the raw exactDataBlock when the user asks for sun/moon/rising.
 * The LLM must cite these values exactly — no reformulation.
 */
export function formatCoreAstroBlock(placements: CoreAstroPlacements, language = 'fr'): string {
  const isFr = (language || 'fr').slice(0, 2).toLowerCase() !== 'en'

  const lines: string[] = [
    isFr
      ? 'VALEURS DÉTERMINISTES — SOLEIL / LUNE / ASCENDANT (source de vérité absolue — citer ces valeurs exactes, ne jamais substituer):'
      : 'DETERMINISTIC VALUES — SUN / MOON / RISING (absolute source of truth — cite exactly, never substitute):',
  ]

  if (placements.sun?.sign) {
    const deg = placements.sun.degree !== null ? ` (${placements.sun.degree}°)` : ''
    lines.push(isFr ? `- Signe solaire : ${placements.sun.sign}${deg}` : `- Sun sign: ${placements.sun.sign}${deg}`)
  } else {
    lines.push(isFr ? '- Signe solaire : non disponible dans les données calculées' : '- Sun sign: not available in calculated data')
  }

  if (placements.moon?.sign) {
    const deg = placements.moon.degree !== null ? ` (${placements.moon.degree}°)` : ''
    lines.push(isFr ? `- Signe lunaire : ${placements.moon.sign}${deg}` : `- Moon sign: ${placements.moon.sign}${deg}`)
  } else {
    lines.push(isFr ? '- Signe lunaire : non disponible dans les données calculées' : '- Moon sign: not available in calculated data')
  }

  if (placements.rising?.sign) {
    const deg = placements.rising.degree !== null ? ` (${placements.rising.degree}°)` : ''
    lines.push(isFr ? `- Ascendant : ${placements.rising.sign}${deg}` : `- Rising sign: ${placements.rising.sign}${deg}`)
  } else {
    lines.push(isFr ? '- Ascendant : non disponible (heure de naissance requise)' : '- Rising sign: not available (birth time required)')
  }

  lines.push('')
  lines.push(
    isFr
      ? 'RÈGLE ABSOLUE : citer ces trois valeurs telles quelles dans la réponse. Ne pas estimer, ne pas reformuler, ne pas substituer d\'autres valeurs.'
      : 'ABSOLUTE RULE: cite these three values exactly in the response. Do not estimate, rephrase or substitute.',
  )

  return lines.join('\n')
}

/**
 * Detect whether the user is asking specifically for sun/moon/rising placement.
 * Used to decide whether to inject the deterministic core block.
 */
export function asksForCorePlacements(message: string): boolean {
  const text = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return /(signe solaire|signe lunaire|ascendant|sun sign|moon sign|rising sign|my rising|my moon|my sun|soleil.{0,15}lune|lune.{0,15}ascendant|soleil.{0,15}ascendant|sun.{0,15}moon|moon.{0,15}rising|quels? sont (mon|mes|ton|tes) (signe|signes|placements?)|quel est (mon|ton) (signe|ascendant|soleil|lune))/.test(text)
}

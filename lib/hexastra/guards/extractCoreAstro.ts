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
const SUN_KEYS     = ['sun', 'soleil', 'Sun', 'Soleil', 'SUN', 'sol']
const MOON_KEYS    = ['moon', 'lune', 'Moon', 'Lune', 'MOON', 'luna']
const RISING_KEYS  = [
  'ascendant', 'rising', 'asc', 'Ascendant', 'Rising', 'ASC',
  'ascendant_sign', 'rising_sign', 'maison_1', 'house_1_sign',
]
const MERCURY_KEYS = ['mercury', 'mercure', 'Mercury', 'Mercure', 'MERCURY']
const VENUS_KEYS   = ['venus', 'venus_planet', 'Venus', 'Vénus', 'VENUS']
const MARS_KEYS    = ['mars', 'Mars', 'MARS']
const JUPITER_KEYS = ['jupiter', 'Jupiter', 'JUPITER']
const SATURN_KEYS  = ['saturn', 'saturne', 'Saturn', 'Saturne', 'SATURN']

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

const ZODIAC_SIGNS_FR = [
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
  'Capricorne',
  'Verseau',
  'Poissons',
] as const

function normaliseSign(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw !== 'string') return null
  const lower = raw.toLowerCase().trim()
  return SIGN_NORMALISATION[lower] ?? (raw.trim() || null)
}

function parseFiniteNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeLongitude(raw: unknown): number | null {
  const parsed = parseFiniteNumber(raw)
  if (parsed === null) return null
  const wrapped = ((parsed % 360) + 360) % 360
  return Math.round(wrapped * 1000) / 1000
}

function deriveSignFromLongitude(raw: unknown): string | null {
  const longitude = normalizeLongitude(raw)
  if (longitude === null) return null
  return ZODIAC_SIGNS_FR[Math.floor(longitude / 30)] ?? null
}

function deriveDegreeFromLongitude(raw: unknown): number | null {
  const longitude = normalizeLongitude(raw)
  if (longitude === null) return null
  return Math.round((longitude % 30) * 10) / 10
}

function extractDegree(obj: Record<string, unknown>): number | null {
  const candidates = ['degree', 'degre', 'deg', 'longitude_in_sign', 'pos']
  for (const k of candidates) {
    const parsed = parseFiniteNumber(obj[k])
    if (parsed !== null) return Math.round(parsed * 10) / 10
  }
  return deriveDegreeFromLongitude(obj.lon ?? obj.longitude ?? obj.lng ?? obj.ecliptic_longitude)
}

function extractSign(obj: Record<string, unknown>): string | null {
  const signRaw =
    obj.sign ??
    obj.sign_name ?? obj.signName ??
    obj.signe ??
    obj.sign_fr ?? obj.signFr ?? obj.signFR ??
    obj.zodiac_sign ?? obj.zodiacSign ??
    obj.constellation ??
    obj.name ?? obj.label ??
    null
  return normaliseSign(signRaw) ?? deriveSignFromLongitude(obj.lon ?? obj.longitude ?? obj.lng ?? obj.ecliptic_longitude)
}

function extractFlatPlacement(raw: Record<string, unknown>, key: string): CoreAstroPlacement | null {
  const signKeyCandidates = [`${key}_sign`, `${key}Sign`, `${key}_signe`]
  for (const signKey of signKeyCandidates) {
    const sign = normaliseSign(raw[signKey])
    if (!sign) continue
    const degree =
      parseFiniteNumber(raw[`${key}_degree`]) ??
      parseFiniteNumber(raw[`${key}Degree`]) ??
      parseFiniteNumber(raw[`${key}_degre`]) ??
      null
    return { sign, degree: degree !== null ? Math.round(degree * 10) / 10 : null, rawValue: raw[signKey] }
  }

  const longitude =
    raw[`${key}_lon`] ??
    raw[`${key}_longitude`] ??
    raw[`${key}Longitude`] ??
    raw[`${key}_lng`] ??
    null
  const sign = deriveSignFromLongitude(longitude)
  if (!sign) return null
  return {
    sign,
    degree: deriveDegreeFromLongitude(longitude),
    rawValue: longitude,
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
      const sign = extractSign(obj)
      if (sign) {
        return {
          sign,
          degree: extractDegree(obj),
          retrograde: extractRetrograde(obj),
          rawValue: value,
        }
      }
      // Log the raw object structure when sign extraction fails — helps diagnose new API formats
      console.warn('[ASTRO_CORE] resolvePlacement: object found but no sign extracted', {
        key,
        objectKeys: Object.keys(obj),
        objectSample: JSON.stringify(obj).slice(0, 200),
      })
    }
  }

  // Flat key variants: e.g. sun_sign + sun_degree at root level
  for (const key of keys) {
    const flat = extractFlatPlacement(raw, key)
    if (flat) return flat
  }

  return null
}

// ── Astro source resolver ─────────────────────────────────────────────────────

/**
 * Resolve the canonical astrology data source from a /chart/fusion raw response.
 *
 * Railway returns planets nested under `raw.tropical` (and optionally under
 * `raw.tropical.planets`). This function normalises all known structures into
 * a single flat object where `sun`, `moon`, `ascendant`, etc. are top-level keys.
 *
 * Merge priority (highest wins):
 *   tropical root keys (ascendant, houses, aspects…) > tropical.planets > root
 */
export function resolveAstroSource(raw: Record<string, unknown>): {
  source: Record<string, unknown>
  /** Dot-path string showing where data was found — useful for logging */
  path: string
} {
  const TOP_KEYS = ['tropical', 'astrology', 'natal', 'chart'] as const

  for (const topKey of TOP_KEYS) {
    const block = raw[topKey]
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue
    const blockObj = block as Record<string, unknown>

    // Check for nested "planets" sub-object (e.g. tropical.planets.sun)
    const planetsBlock = blockObj.planets ?? blockObj.Planets
    if (planetsBlock && typeof planetsBlock === 'object' && !Array.isArray(planetsBlock)) {
      // planets spread first (lower priority), blockObj overrides
      // → ascendant/houses/aspects from tropical root win
      return {
        source: { ...(planetsBlock as Record<string, unknown>), ...blockObj },
        path: `${topKey}+${topKey}.planets`,
      }
    }

    // Planets are at block root level (e.g. tropical.sun or tropical.Sun)
    return { source: blockObj, path: topKey }
  }

  // No nested astro block found — use root as last resort
  return { source: raw, path: 'root' }
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

  const { source, path } = resolveAstroSource(raw)

  console.log('[ASTRO_CORE] extracting core placements', {
    rootKeys: Object.keys(raw).slice(0, 20),
    resolvedPath: path,
    sourceKeys: Object.keys(source).slice(0, 30),
  })

  // Log raw structure of key bodies — critical for diagnosing new Railway response shapes
  for (const [label, keys] of [['sun', SUN_KEYS], ['moon', MOON_KEYS], ['ascendant', RISING_KEYS]] as [string, string[]][]) {
    const rawVal = keys.map(k => source[k]).find(v => v !== undefined && v !== null)
    if (rawVal !== undefined && typeof rawVal === 'object' && !Array.isArray(rawVal)) {
      console.log(`[ASTRO_CORE] raw ${label} object structure`, {
        keys: Object.keys(rawVal as Record<string, unknown>),
        sample: JSON.stringify(rawVal).slice(0, 300),
      })
    }
  }

  const sun    = resolvePlacement(source, SUN_KEYS)
  const moon   = resolvePlacement(source, MOON_KEYS)
  const rising = resolvePlacement(source, RISING_KEYS)

  if (!sun)    missing.push('sun')
  if (!moon)   missing.push('moon')
  if (!rising) missing.push('rising')

  const allResolved = missing.length === 0

  console.log('[ASTRO_CORE] extracted', {
    path,
    sun:    sun    ? { sign: sun.sign,    degree: sun.degree }    : null,
    moon:   moon   ? { sign: moon.sign,   degree: moon.degree }   : null,
    rising: rising ? { sign: rising.sign, degree: rising.degree } : null,
    allResolved,
    missing,
    fieldsExtracted: 3 - missing.length,
  })

  if (missing.length > 0) {
    console.warn('[ASTRO_CORE] missing field(s)', {
      missing,
      resolvedPath: path,
      sourceKeys: Object.keys(source).slice(0, 40),
      hint: 'Check /chart/fusion response — expected nested under tropical or tropical.planets',
    })
  }

  return { sun, moon, rising, allResolved, missing }
}

// ── Local fallback builder ────────────────────────────────────────────────────

/**
 * Build a local fallback response when OpenAI times out but Railway data is available.
 * Presents raw calculated facts without LLM interpretation — never invents.
 * The user is invited to retry for the full reading.
 */
export function buildLocalAstroFallback(
  raw: Record<string, unknown>,
  language: string,
  firstName: string | null,
): string {
  const isFr = !language.startsWith('en')
  const { source, path } = resolveAstroSource(raw)

  const sun     = resolvePlacement(source, SUN_KEYS)
  const moon    = resolvePlacement(source, MOON_KEYS)
  const rising  = resolvePlacement(source, RISING_KEYS)
  const mercury = resolvePlacement(source, MERCURY_KEYS)
  const venus   = resolvePlacement(source, VENUS_KEYS)
  const mars    = resolvePlacement(source, MARS_KEYS)

  const foundFields = [sun, moon, rising, mercury, venus, mars].filter(Boolean).length

  console.log('[LOCAL_ASTRO_FALLBACK] building local fallback', {
    path,
    foundFields,
    hasSun: Boolean(sun),
    hasMoon: Boolean(moon),
    hasRising: Boolean(rising),
  })

  const name = firstName ? `, ${firstName}` : ''

  // No fields at all — graceful degradation
  if (foundFields === 0) {
    return isFr
      ? "Tes données ont bien été calculées. La lecture complète sera disponible dans un instant — renvoie ton message."
      : "Your data has been calculated. The full reading will be available shortly — please resend your message."
  }

  const lines: string[] = []

  if (isFr) {
    lines.push(`Voici tes placements calculés${name} :`)
    lines.push('')
    if (sun?.sign)     lines.push(`**Soleil** en ${sun.sign}${sun.degree !== null ? ` (${sun.degree}°)` : ''}`)
    if (moon?.sign)    lines.push(`**Lune** en ${moon.sign}${moon.degree !== null ? ` (${moon.degree}°)` : ''}`)
    if (rising?.sign)  lines.push(`**Ascendant** ${rising.sign}${rising.degree !== null ? ` (${rising.degree}°)` : ''}`)
    if (mercury?.sign) lines.push(`Mercure en ${mercury.sign}`)
    if (venus?.sign)   lines.push(`Vénus en ${venus.sign}`)
    if (mars?.sign)    lines.push(`Mars en ${mars.sign}`)
    lines.push('')
    lines.push('_Lecture complète momentanément indisponible — renvoie ton message pour obtenir l\'analyse complète._')
  } else {
    lines.push(`Here are your calculated placements${name}:`)
    lines.push('')
    if (sun?.sign)     lines.push(`**Sun** in ${sun.sign}${sun.degree !== null ? ` (${sun.degree}°)` : ''}`)
    if (moon?.sign)    lines.push(`**Moon** in ${moon.sign}${moon.degree !== null ? ` (${moon.degree}°)` : ''}`)
    if (rising?.sign)  lines.push(`**Rising** ${rising.sign}${rising.degree !== null ? ` (${rising.degree}°)` : ''}`)
    if (mercury?.sign) lines.push(`Mercury in ${mercury.sign}`)
    if (venus?.sign)   lines.push(`Venus in ${venus.sign}`)
    if (mars?.sign)    lines.push(`Mars in ${mars.sign}`)
    lines.push('')
    lines.push('_Full reading temporarily unavailable — resend your message for the complete analysis._')
  }

  return lines.join('\n')
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

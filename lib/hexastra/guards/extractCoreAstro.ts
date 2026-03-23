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

export type StrictAstroPlacementKey =
  | 'sun'
  | 'moon'
  | 'ascendant'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'

export type StrictAstroPlacementResult = {
  key: StrictAstroPlacementKey
  placement: CoreAstroPlacement | null
  sourcePath: string | null
}

export type StrictAstroContext = {
  source: Record<string, unknown>
  path: string
  usesTropical: boolean
  placements: Record<StrictAstroPlacementKey, StrictAstroPlacementResult>
  missingFields: StrictAstroPlacementKey[]
}

export function normalizeAstroSign(raw: unknown): string | null {
  return normaliseSign(raw)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function placementFromValue(value: unknown): CoreAstroPlacement | null {
  if (value === undefined || value === null) return null

  if (typeof value === 'string') {
    const sign = normaliseSign(value)
    return sign ? { sign, degree: null, rawValue: value } : null
  }

  const obj = asRecord(value)
  if (!obj) return null

  const sign = extractSign(obj)
  if (!sign) return null

  return {
    sign,
    degree: extractDegree(obj),
    retrograde: extractRetrograde(obj),
    rawValue: value,
  }
}

function capitalizeKey(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
}

function resolveStrictSource(raw: Record<string, unknown>): {
  source: Record<string, unknown>
  path: string
  usesTropical: boolean
  tropicalBlock: Record<string, unknown> | null
} {
  const tropical = asRecord(raw.tropical)
  if (tropical) {
    const planetsBlock = asRecord(tropical.planets ?? tropical.Planets)
    return {
      source: planetsBlock ? { ...planetsBlock, ...tropical } : tropical,
      path: planetsBlock ? 'tropical+tropical.planets' : 'tropical',
      usesTropical: true,
      tropicalBlock: tropical,
    }
  }

  const { source, path } = resolveAstroSource(raw)
  return {
    source,
    path,
    usesTropical: false,
    tropicalBlock: null,
  }
}

function resolvePlacementFromBlock(params: {
  baseBlock: Record<string, unknown>
  basePath: string
  canonicalKey: string
  keys: string[]
}): StrictAstroPlacementResult {
  const { baseBlock, basePath, canonicalKey, keys } = params
  const planetsBlock = asRecord(baseBlock.planets ?? baseBlock.Planets)

  for (const key of keys) {
    const direct = placementFromValue(baseBlock[key])
    if (direct) {
      return {
        key: canonicalKey as StrictAstroPlacementKey,
        placement: direct,
        sourcePath: `${basePath}.${key}`,
      }
    }
  }

  for (const key of keys) {
    const nested = planetsBlock ? placementFromValue(planetsBlock[key]) : null
    if (nested) {
      return {
        key: canonicalKey as StrictAstroPlacementKey,
        placement: nested,
        sourcePath: `${basePath}.planets.${key}`,
      }
    }
  }

  const flatDirect = extractFlatPlacement(baseBlock, canonicalKey)
  if (flatDirect) {
    return {
      key: canonicalKey as StrictAstroPlacementKey,
      placement: flatDirect,
      sourcePath: `${basePath}.${canonicalKey}_sign`,
    }
  }

  const flatNested = planetsBlock ? extractFlatPlacement(planetsBlock, canonicalKey) : null
  if (flatNested) {
    return {
      key: canonicalKey as StrictAstroPlacementKey,
      placement: flatNested,
      sourcePath: `${basePath}.planets.${canonicalKey}_sign`,
    }
  }

  return {
    key: canonicalKey as StrictAstroPlacementKey,
    placement: null,
    sourcePath: null,
  }
}

function resolveHouseOneCandidate(
  value: unknown,
  sourcePath: string,
): { placement: CoreAstroPlacement; sourcePath: string } | null {
  if (Array.isArray(value)) {
    const houseOne = value.find((item, index) => {
      if (index === 0) return true
      const record = asRecord(item)
      const houseNumber = record?.number ?? record?.house ?? record?.index ?? record?.id
      return houseNumber === 1 || houseNumber === '1'
    })

    if (!houseOne) return null

    const placement = placementFromValue(houseOne)
    return placement ? { placement, sourcePath: `${sourcePath}[1]` } : null
  }

  const obj = asRecord(value)
  if (!obj) return null

  const directKeys = ['1', 'house_1', 'house1', 'maison_1', 'maison1', 'cusp_1', 'cusp1']
  for (const key of directKeys) {
    const placement = placementFromValue(obj[key])
    if (placement) return { placement, sourcePath: `${sourcePath}.${key}` }
  }

  return null
}

function resolveAscendantFromBlock(params: {
  baseBlock: Record<string, unknown>
  basePath: string
}): StrictAstroPlacementResult {
  const { baseBlock, basePath } = params
  const planetsBlock = asRecord(baseBlock.planets ?? baseBlock.Planets)
  const anglesBlock = asRecord(baseBlock.angles)
  const housesBlock = baseBlock.houses ?? baseBlock.maisons
  const cuspsBlock = baseBlock.house_cusps ?? baseBlock.houseCusps ?? baseBlock.cusps

  const orderedCandidates: Array<{ sourcePath: string; value: unknown }> = [
    { sourcePath: `${basePath}.ascendant`, value: baseBlock.ascendant },
    { sourcePath: `${basePath}.Ascendant`, value: baseBlock.Ascendant },
    { sourcePath: `${basePath}.planets.ascendant`, value: planetsBlock?.ascendant },
    { sourcePath: `${basePath}.planets.Ascendant`, value: planetsBlock?.Ascendant },
    { sourcePath: `${basePath}.angles.ascendant`, value: anglesBlock?.ascendant },
    { sourcePath: `${basePath}.angles.asc`, value: anglesBlock?.asc },
  ]

  for (const candidate of orderedCandidates) {
    const placement = placementFromValue(candidate.value)
    if (placement) {
      return {
        key: 'ascendant',
        placement,
        sourcePath: candidate.sourcePath,
      }
    }
  }

  const housesAscendant = asRecord(housesBlock)?.ascendant
  const housesAscPlacement = placementFromValue(housesAscendant)
  if (housesAscPlacement) {
    return {
      key: 'ascendant',
      placement: housesAscPlacement,
      sourcePath: `${basePath}.houses.ascendant`,
    }
  }

  const houseOne = resolveHouseOneCandidate(housesBlock, `${basePath}.houses`)
  if (houseOne) {
    return {
      key: 'ascendant',
      placement: houseOne.placement,
      sourcePath: houseOne.sourcePath,
    }
  }

  const cuspOne = resolveHouseOneCandidate(cuspsBlock, `${basePath}.house_cusps`)
  if (cuspOne) {
    return {
      key: 'ascendant',
      placement: cuspOne.placement,
      sourcePath: cuspOne.sourcePath,
    }
  }

  return {
    key: 'ascendant',
    placement: null,
    sourcePath: null,
  }
}

export function resolveStrictAstroContext(raw: Record<string, unknown>): StrictAstroContext {
  const strictSource = resolveStrictSource(raw)
  const baseBlock = strictSource.tropicalBlock ?? strictSource.source
  const basePath = strictSource.usesTropical ? 'tropical' : strictSource.path

  const placements: StrictAstroContext['placements'] = {
    sun: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'sun', keys: SUN_KEYS }),
    moon: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'moon', keys: MOON_KEYS }),
    ascendant: resolveAscendantFromBlock({ baseBlock, basePath }),
    mercury: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'mercury', keys: MERCURY_KEYS }),
    venus: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'venus', keys: VENUS_KEYS }),
    mars: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'mars', keys: MARS_KEYS }),
    jupiter: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'jupiter', keys: JUPITER_KEYS }),
    saturn: resolvePlacementFromBlock({ baseBlock, basePath, canonicalKey: 'saturn', keys: SATURN_KEYS }),
  }

  const missingFields = (Object.entries(placements) as [StrictAstroPlacementKey, StrictAstroPlacementResult][])
    .filter(([, result]) => !result.placement?.sign)
    .map(([key]) => key)

  return {
    source: strictSource.source,
    path: strictSource.path,
    usesTropical: strictSource.usesTropical,
    placements,
    missingFields,
  }
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

  const strictAstro = resolveStrictAstroContext(raw)
  const { source, path, placements } = strictAstro

  console.log('[ASTRO_CORE] extracting core placements', {
    rootKeys: Object.keys(raw).slice(0, 20),
    resolvedPath: path,
    usesTropical: strictAstro.usesTropical,
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

  const sun = placements.sun.placement
  const moon = placements.moon.placement
  const rising = placements.ascendant.placement

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
      fieldSources: {
        sun: placements.sun.sourcePath,
        moon: placements.moon.sourcePath,
        ascendant: placements.ascendant.sourcePath,
      },
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
  const strictAstro = resolveStrictAstroContext(raw)
  const { path, placements } = strictAstro
  const sun = placements.sun.placement
  const moon = placements.moon.placement
  const rising = placements.ascendant.placement
  const mercury = placements.mercury.placement
  const venus = placements.venus.placement
  const mars = placements.mars.placement

  const foundFields = [sun, moon, rising, mercury, venus, mars].filter(Boolean).length

  console.log('[LOCAL_ASTRO_FALLBACK] building local fallback', {
    path,
    usesTropical: strictAstro.usesTropical,
    foundFields,
    hasSun: Boolean(sun),
    hasMoon: Boolean(moon),
    hasRising: Boolean(rising),
    fieldSources: {
      sun: placements.sun.sourcePath,
      moon: placements.moon.sourcePath,
      ascendant: placements.ascendant.sourcePath,
      mercury: placements.mercury.sourcePath,
      venus: placements.venus.sourcePath,
      mars: placements.mars.sourcePath,
    },
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
    lines.push(`Voici les placements exacts validés${name} :`)
    lines.push('')
    lines.push(`- Soleil: ${sun?.sign ? `${sun.sign}${sun.degree !== null ? ` (${sun.degree}°)` : ''}` : 'indisponible'}`)
    lines.push(`- Lune: ${moon?.sign ? `${moon.sign}${moon.degree !== null ? ` (${moon.degree}°)` : ''}` : 'indisponible'}`)
    lines.push(`- Ascendant: ${rising?.sign ? `${rising.sign}${rising.degree !== null ? ` (${rising.degree}°)` : ''}` : 'indisponible'}`)
    lines.push(`- Mercure: ${mercury?.sign ?? 'indisponible'}`)
    lines.push(`- Vénus: ${venus?.sign ?? 'indisponible'}`)
    lines.push(`- Mars: ${mars?.sign ?? 'indisponible'}`)
    lines.push('')
    lines.push('_Lecture complète momentanément indisponible. Je n’ajoute aucune valeur absente de la source tropicale exacte._')
    lines.push('_renvoie ton message pour obtenir l’analyse complète._')
  } else {
    lines.push(`Here are your validated exact placements${name}:`)
    lines.push('')
    lines.push(`- Sun: ${sun?.sign ? `${sun.sign}${sun.degree !== null ? ` (${sun.degree}°)` : ''}` : 'unavailable'}`)
    lines.push(`- Moon: ${moon?.sign ? `${moon.sign}${moon.degree !== null ? ` (${moon.degree}°)` : ''}` : 'unavailable'}`)
    lines.push(`- Rising: ${rising?.sign ? `${rising.sign}${rising.degree !== null ? ` (${rising.degree}°)` : ''}` : 'unavailable'}`)
    lines.push(`- Mercury: ${mercury?.sign ?? 'unavailable'}`)
    lines.push(`- Venus: ${venus?.sign ?? 'unavailable'}`)
    lines.push(`- Mars: ${mars?.sign ?? 'unavailable'}`)
    lines.push('')
    lines.push('_Full reading temporarily unavailable. I am not adding any value that is absent from the exact tropical source._')
    lines.push('_Resend your message for the complete analysis._')
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

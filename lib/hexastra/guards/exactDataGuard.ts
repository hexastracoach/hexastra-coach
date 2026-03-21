/**
 * Exact Data Guard — Hexastra Coach
 *
 * Subcategories in EXACT_DATA_REQUIRED must NEVER be answered by LLM inference alone.
 * They require validated, calculated data from the HexAstra API before any interpretation.
 *
 * Rule: Calculation first, interpretation after. Never hallucinate.
 */

import { resolveAstroSource } from './extractCoreAstro'

/** All subcategory keys where deterministic API data is mandatory */
export const EXACT_DATA_REQUIRED_SUBCATEGORIES = new Set<string>([
  // ── Astrology ───────────────────────────────────────────────────────────
  'ascendant',        // Ascendant sign — requires precise birth time + location
  'theme_natal',      // Full birth chart — requires birth date, time, city
  'maisons',          // Houses — require precise birth time + location
  'signe_lunaire',    // Moon sign — sensitive to birth date precision
  'planetes',         // Planetary positions — require birth data
  'transits',         // Current transits — require birth data + current date
  'aspects',          // Aspects — require calculated positions
  'cycle',            // Solar return / progressions — require birth data
  'retrograde',       // Retrograde state — requires current planetary positions

  // ── Numerology ──────────────────────────────────────────────────────────
  'chemin_de_vie',    // Life path number — requires exact birth date
  'expression',       // Expression number — requires full name
  'ame',              // Soul number — requires first name vowels
  'personnalite_num', // Personality number — requires name consonants
  'annee_personnelle',// Personal year — requires birth date + current year
  'mois_personnel',   // Personal month — requires birth date + current month
  'jour_personnel',   // Personal day — requires birth date + current date

  // ── Human Design ────────────────────────────────────────────────────────
  'human_design_exact', // HD full chart catch-all ("design humain", "mon hd", "bodygraph")
  'type_hd',          // HD Type — requires birth date, time, location
  'strategie_hd',     // HD Strategy — derived from type (requires type first)
  'autorite_hd',      // HD Authority — requires birth chart calculation
  'profil_hd',        // HD Profile — requires gate calculation
  'centres_hd',       // HD Centers — defined/undefined — requires full chart
  'portes_hd',        // HD Gates — requires full chart
  'canaux_hd',        // HD Channels — derived from gates
  'croix_incarnation',// Incarnation Cross — requires gates 1,2,3,4
  'definition_hd',    // HD Definition (single/split/etc) — requires full chart
  'transits_hd',      // HD Transits — requires birth data + current sky positions

  // ── Kua ─────────────────────────────────────────────────────────────────
  'nombre_kua',       // Kua number — requires birth year + gender
  'direction_kua',    // Favorable directions — derived from Kua number
  'orientation_habitat', // Space orientation — requires Kua number
  'orientation_bureau',  // Desk orientation — requires Kua number
  'direction_sommeil',   // Sleeping direction — requires Kua number
])

/** Whether a subcategory requires exact calculated API data */
export function requiresExactData(subcategory: string | null | undefined): boolean {
  if (!subcategory) return false
  return EXACT_DATA_REQUIRED_SUBCATEGORIES.has(subcategory)
}

/** Whether a specializedResult contains actual resolved data (not a fallback) */
export function hasResolvedExactData(specializedResult: {
  raw: Record<string, unknown> | null
  publicSummary?: string
} | null | undefined): boolean {
  if (!specializedResult) return false
  if (specializedResult.raw === null || specializedResult.raw === undefined) return false
  return Object.keys(specializedResult.raw).length > 0
}

/**
 * Format available raw data as a structured fact block for the system prompt.
 * Only call this when hasResolvedExactData() = true.
 */
export function formatExactDataBlock(raw: Record<string, unknown>): string {
  const lines: string[] = ['DONNÉES EXACTES CALCULÉES (source de vérité — ne jamais contredire ni compléter par invention):']

  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined || value === '') continue
    const formattedKey = key.replace(/_/g, ' ').toUpperCase()
    const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    lines.push(`- ${formattedKey}: ${formattedValue}`)
  }

  return lines.join('\n')
}

/**
 * Keys that carry interpretive value for astro/HD/numerology/Kua readings.
 * Listed first when building the capped block — everything else is secondary.
 */
const PRIORITY_EXACT_KEYS = new Set([
  // Astrology — core positions
  'sun', 'moon', 'ascendant', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron',
  'soleil', 'lune', 'mercure', 'mars_planet',
  // Astrology — structure
  'houses', 'maisons', 'house_cusps',
  'aspects', 'aspects_principaux', 'major_aspects',
  'dominant_signs', 'dominant_elements', 'dominant_modalities',
  'stelliums', 'chart_shape',
  // Transits
  'transits', 'current_transits', 'transits_actifs',
  // Numerology
  'chemin_de_vie', 'life_path', 'expression', 'ame', 'soul',
  'annee_personnelle', 'personal_year', 'mois_personnel', 'personal_month',
  // Human Design
  'type_hd', 'hd_type', 'type', 'autorite_hd', 'authority',
  'profil_hd', 'profile', 'centres_hd', 'defined_centers',
  'croix_incarnation', 'incarnation_cross',
  // Kua
  'nombre_kua', 'kua_number', 'kua', 'direction_kua',
  // Summary fields (may already be compacted by Railway)
  'publicsummary', 'publicSummary', 'summary', 'synthese', 'synthesis',
  'reading', 'interpretation', 'bilan',
])

/**
 * Capped version of formatExactDataBlock.
 * Prioritises the most interpretively relevant keys, truncates at maxChars.
 * Use this in place of formatExactDataBlock for the system prompt — avoids
 * injecting 30 000+ char API dumps that blow up the OpenAI context window.
 */
export function formatExactDataBlockCapped(
  raw: Record<string, unknown>,
  maxChars = 4000,
): string {
  const header = 'DONNÉES EXACTES CALCULÉES (source de vérité — ne jamais contredire ni compléter par invention):'
  const lines: string[] = [header]

  const entries = Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== '')
  const priority = entries.filter(([k]) => PRIORITY_EXACT_KEYS.has(k) || PRIORITY_EXACT_KEYS.has(k.toLowerCase()))
  const secondary = entries.filter(([k]) => !PRIORITY_EXACT_KEYS.has(k) && !PRIORITY_EXACT_KEYS.has(k.toLowerCase()))

  for (const [key, value] of [...priority, ...secondary]) {
    const formattedKey = key.replace(/_/g, ' ').toUpperCase()
    let formattedValue: string
    if (typeof value === 'object') {
      const json = JSON.stringify(value)
      // Nested objects: keep first 400 chars to preserve structure but avoid explosion
      formattedValue = json.length > 400 ? json.slice(0, 400) + '…' : json
    } else {
      formattedValue = String(value)
    }
    lines.push(`- ${formattedKey}: ${formattedValue}`)

    if (lines.join('\n').length >= maxChars) {
      lines.push(`…[${entries.length - lines.length + 1} champs supplémentaires disponibles — non affichés pour limiter le contexte]`)
      break
    }
  }

  return lines.join('\n')
}

// ── Astro-only keys for compact natal reading context ────────────────────────
// HD, numerology, kua fields are excluded — not needed for natal chart readings.
const NATAL_ASTRO_KEYS = new Set([
  'sun', 'moon', 'ascendant', 'rising', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron',
  'soleil', 'lune', 'ascendant_sign', 'rising_sign',
  'houses', 'maisons', 'house_cusps',
  'aspects', 'aspects_principaux', 'major_aspects',
  'dominant_signs', 'dominant_elements', 'dominant_modalities',
  'stelliums', 'chart_shape',
  'publicSummary', 'publicsummary', 'summary', 'synthese', 'reading',
])

export type CompactNatalContext = {
  sunSign: string | null
  sunDegree: number | null
  moonSign: string | null
  moonDegree: number | null
  risingSign: string | null
  risingDegree: number | null
  dominantSigns: string[]
  dominantElements: string[]
  dominantModalities: string[]
  stelliums: string[]
  keyAspects: string[]
  dominantHouses: string[]
  chartShape: string | null
  natalSummarySeeds: string[]
  /** Raw data block filtered to astro-only fields, capped at maxChars */
  compactDataBlock: string
}

function extractStr(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = v as Record<string, unknown>
      const sign = nested.sign ?? nested.signe ?? nested.sign_name ?? nested.name
      if (typeof sign === 'string' && sign.trim()) return sign.trim()
    }
  }
  return null
}

function extractNum(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && !isNaN(v)) return Math.round(v * 10) / 10
    if (typeof v === 'string') {
      const n = parseFloat(v)
      if (!isNaN(n)) return Math.round(n * 10) / 10
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = v as Record<string, unknown>
      const deg = nested.degree ?? nested.degre ?? nested.pos
      if (typeof deg === 'number') return Math.round(deg * 10) / 10
    }
  }
  return null
}

function extractList(obj: Record<string, unknown>, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = obj[k]
    if (Array.isArray(v)) {
      return v
        .map((item) => (typeof item === 'string' ? item : typeof item === 'object' && item ? JSON.stringify(item).slice(0, 80) : null))
        .filter(Boolean) as string[]
    }
    if (typeof v === 'string' && v.includes(',')) return v.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

/**
 * Extract a minimal, astrology-only context from /chart/fusion raw data.
 * Used for the `astro_exact_compact` rendering path to dramatically reduce
 * the OpenAI payload size — ignores HD, numerology, Kua fields entirely.
 *
 * Handles all Railway /chart/fusion nested structures:
 * - raw.tropical.sun (planets at tropical root)
 * - raw.tropical.planets.sun (planets under nested "planets" key)
 * - raw.tropical.Sun (capitalized keys)
 *
 * @param raw    Raw /chart/fusion response object
 * @param maxChars  Max chars for the compact data block (default 2000)
 */
export function buildCompactNatalReadingContext(
  raw: Record<string, unknown>,
  maxChars = 2000,
): CompactNatalContext {
  // ── Resolve astro source — handles tropical, tropical.planets, capitalized keys
  const { source: astro, path: astroPath } = resolveAstroSource(raw)

  const fieldsInSource = Object.keys(astro).length
  console.log('[COMPACT_NATAL] resolved astro source', {
    astroPath,
    fieldsInSource,
    sampleKeys: Object.keys(astro).slice(0, 15),
  })

  // ── Extract core positions ─────────────────────────────────────────────
  const sunSign    = extractStr(astro, 'sun', 'Sun', 'soleil', 'Soleil')
  const sunDegree  = extractNum(astro, 'sun', 'Sun', 'soleil')
  const moonSign   = extractStr(astro, 'moon', 'Moon', 'lune', 'Lune')
  const moonDegree = extractNum(astro, 'moon', 'Moon', 'lune')
  const risingSign = extractStr(astro, 'ascendant', 'Ascendant', 'rising', 'Rising', 'asc', 'ascending_sign', 'rising_sign')
  const risingDegree = extractNum(astro, 'ascendant', 'Ascendant', 'rising', 'asc')
  const mercurySign = extractStr(astro, 'mercury', 'Mercury', 'mercure', 'Mercure')
  const venusSign   = extractStr(astro, 'venus', 'Venus', 'Vénus')
  const marsSign    = extractStr(astro, 'mars', 'Mars')
  const jupiterSign = extractStr(astro, 'jupiter', 'Jupiter')
  const saturnSign  = extractStr(astro, 'saturn', 'Saturn', 'saturne', 'Saturne')

  console.log('[COMPACT_NATAL] extracted core placements', {
    astroPath,
    sunSign, moonSign, risingSign, mercurySign, venusSign, marsSign, jupiterSign, saturnSign,
    extractedCount: [sunSign, moonSign, risingSign, mercurySign, venusSign, marsSign, jupiterSign, saturnSign].filter(Boolean).length,
  })

  // ── Extract structural data — check both astro source and raw root ─────
  const dominantSigns    = extractList(astro, 'dominant_signs', 'signes_dominants', 'dominant_sign')
    .concat(extractList(raw, 'dominant_signs', 'signes_dominants', 'dominant_sign')).slice(0, 5)
  const dominantElements = extractList(astro, 'dominant_elements', 'elements_dominants', 'dominant_element')
    .concat(extractList(raw, 'dominant_elements', 'elements_dominants')).slice(0, 4)
  const dominantModalities = extractList(astro, 'dominant_modalities', 'modalites_dominantes', 'dominant_modality')
    .concat(extractList(raw, 'dominant_modalities', 'modalites_dominantes')).slice(0, 3)
  const stelliums = extractList(astro, 'stelliums', 'stellium')
    .concat(extractList(raw, 'stelliums', 'stellium')).slice(0, 3)
  const chartShape = extractStr(astro, 'chart_shape', 'forme_theme', 'chart_pattern')
    ?? extractStr(raw, 'chart_shape', 'forme_theme', 'chart_pattern') ?? null

  // ── Extract key aspects (cap at 5) ────────────────────────────────────
  const aspectsRaw = astro.aspects ?? astro.aspects_principaux ?? astro.major_aspects
    ?? raw.aspects ?? raw.aspects_principaux ?? raw.major_aspects
  const keyAspects: string[] = []
  if (Array.isArray(aspectsRaw)) {
    aspectsRaw.slice(0, 5).forEach((a) => {
      if (typeof a === 'string') keyAspects.push(a)
      else if (typeof a === 'object' && a) keyAspects.push(JSON.stringify(a).slice(0, 100))
    })
  }

  // ── Extract dominant houses (cap at 3) ────────────────────────────────
  const housesRaw = astro.houses ?? astro.maisons ?? astro.house_cusps
    ?? raw.houses ?? raw.maisons ?? raw.house_cusps
  const dominantHouses: string[] = []
  if (Array.isArray(housesRaw)) {
    housesRaw.slice(0, 3).forEach((h) => {
      if (typeof h === 'string') dominantHouses.push(h)
      else if (typeof h === 'object' && h) dominantHouses.push(JSON.stringify(h).slice(0, 80))
    })
  }

  // ── Extract summary seeds (from raw root — Railway puts them there) ───
  const natalSummarySeeds: string[] = []
  for (const k of ['publicSummary', 'publicsummary', 'summary', 'synthese', 'reading', 'interpretation', 'bilan']) {
    const v = raw[k] ?? astro[k]
    if (typeof v === 'string' && v.trim()) {
      natalSummarySeeds.push(v.slice(0, 300))
      break
    }
  }

  // ── Build compact data block — prioritise resolved planets ────────────
  // We build the block from the resolved astro source (not raw root) so that
  // sun/moon/ascendant values appear first, readable, and are not buried in
  // a deeply nested JSON dump.
  const blockLines = ['DONNÉES THÈME NATAL (source de vérité — citer exactement):']

  // Inject resolved planet values explicitly at the top
  if (sunSign)     blockLines.push(`- SOLEIL: ${sunSign}${sunDegree !== null ? ` (${sunDegree}°)` : ''}`)
  if (moonSign)    blockLines.push(`- LUNE: ${moonSign}${moonDegree !== null ? ` (${moonDegree}°)` : ''}`)
  if (risingSign)  blockLines.push(`- ASCENDANT: ${risingSign}${risingDegree !== null ? ` (${risingDegree}°)` : ''}`)
  if (mercurySign) blockLines.push(`- MERCURE: ${mercurySign}`)
  if (venusSign)   blockLines.push(`- VÉNUS: ${venusSign}`)
  if (marsSign)    blockLines.push(`- MARS: ${marsSign}`)
  if (jupiterSign) blockLines.push(`- JUPITER: ${jupiterSign}`)
  if (saturnSign)  blockLines.push(`- SATURNE: ${saturnSign}`)
  if (keyAspects.length > 0) blockLines.push(`- ASPECTS CLÉS: ${keyAspects.join(' | ')}`)
  if (dominantSigns.length > 0) blockLines.push(`- SIGNES DOMINANTS: ${dominantSigns.join(', ')}`)
  if (dominantElements.length > 0) blockLines.push(`- ÉLÉMENTS: ${dominantElements.join(', ')}`)
  if (natalSummarySeeds.length > 0) blockLines.push(`- SYNTHÈSE: ${natalSummarySeeds[0]}`)

  // Add remaining raw astro-only fields up to the cap
  const astroOnlyEntries = Object.entries(astro).filter(([k]) =>
    NATAL_ASTRO_KEYS.has(k) || NATAL_ASTRO_KEYS.has(k.toLowerCase()),
  )
  for (const [key, value] of astroOnlyEntries) {
    if (blockLines.join('\n').length >= maxChars) {
      blockLines.push(`…[données supplémentaires disponibles — non affichées pour limiter le contexte]`)
      break
    }
    const formattedKey = key.replace(/_/g, ' ').toUpperCase()
    const raw_str = typeof value === 'object' ? JSON.stringify(value).slice(0, 200) : String(value)
    blockLines.push(`- ${formattedKey}: ${raw_str}`)
  }

  const compactDataBlock = blockLines.join('\n')
  console.log('[COMPACT_NATAL] block built', {
    blockChars: compactDataBlock.length,
    linesCount: blockLines.length,
    astroPath,
  })

  return {
    sunSign, sunDegree,
    moonSign, moonDegree,
    risingSign, risingDegree,
    dominantSigns, dominantElements, dominantModalities,
    stelliums, keyAspects, dominantHouses,
    chartShape,
    natalSummarySeeds,
    compactDataBlock,
  }
}

/**
 * Logs the data source audit for a given request.
 * Returns a log-friendly object — log it externally with your logger.
 */
export function buildExactDataAuditLog(params: {
  subcategory: string | null
  requiresExact: boolean
  resolvedExact: boolean
  hasRaw: boolean
  specializedSource: string | null
  birthDataPresent: boolean
  birthDataFields: string[]
}): Record<string, unknown> {
  return {
    exact_data_required: params.requiresExact,
    exact_data_resolved: params.resolvedExact,
    has_raw_data: params.hasRaw,
    subcategory: params.subcategory,
    specialized_source: params.specializedSource,
    birth_data_present: params.birthDataPresent,
    birth_data_fields: params.birthDataFields,
  }
}

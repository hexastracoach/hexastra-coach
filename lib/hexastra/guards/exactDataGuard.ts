/**
 * Exact Data Guard — Hexastra Coach
 *
 * Subcategories in EXACT_DATA_REQUIRED must NEVER be answered by LLM inference alone.
 * They require validated, calculated data from the HexAstra API before any interpretation.
 *
 * Rule: Calculation first, interpretation after. Never hallucinate.
 */

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

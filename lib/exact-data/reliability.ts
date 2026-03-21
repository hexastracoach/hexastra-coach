/**
 * Exact Data Reliability — Hexastra Coach
 *
 * Validates whether raw API data is sufficient and reliable
 * for the given science + subcategory before the LLM references it.
 *
 * RULE: if unreliable → fallback honnête (honest fallback), never invent.
 */

import type { Science } from '@/lib/hexastra/orchestration/universalClassification'
import { resolveAstroSource } from '@/lib/hexastra/guards/extractCoreAstro'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReliabilityResult = {
  reliable: boolean
  missingFields: string[]
  errors: string[]
  /** Completeness 0–1 relative to expected fields for this science/subcategory */
  completeness: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasValue(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = obj[key]
    if (v !== null && v !== undefined && v !== '' && v !== false) return true
  }
  return false
}

function safeStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return null
}

/**
 * Like safeStr, but also extracts a string from a nested object.
 * Handles e.g. { type: { name: "Generator", label: "..." } } → "Generator"
 */
function safeStrDeep(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>
    for (const k of ['name', 'label', 'value', 'text', 'title', 'fr', 'en', 'id']) {
      if (typeof obj[k] === 'string' && (obj[k] as string).trim()) return (obj[k] as string).trim()
    }
  }
  return null
}

function mergeNested(raw: Record<string, unknown>, ...nestKeys: string[]): Record<string, unknown> {
  for (const key of nestKeys) {
    const block = raw[key]
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue
    const blockObj = block as Record<string, unknown>

    // Handle two-level nesting: e.g. raw.tropical.planets.sun
    // Railway /chart/fusion may nest planets under a "planets" sub-key
    const planetsBlock = blockObj.planets ?? blockObj.Planets
    if (planetsBlock && typeof planetsBlock === 'object' && !Array.isArray(planetsBlock)) {
      // planets spread first (lower priority), blockObj overrides (ascendant, houses at tropical root win)
      return { ...(planetsBlock as Record<string, unknown>), ...blockObj, ...raw }
    }

    // Standard one-level nesting: raw.tropical.sun
    return { ...blockObj, ...raw }
  }
  return raw
}

/**
 * Merge ALL known Human Design source objects from a raw /chart/fusion response.
 * Railway may split data across humanDesign (summary) and humanDesignFull (chart).
 * Later sources override earlier ones; raw root wins over everything.
 */
function mergeHDSources(raw: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  // Order: humanDesign first (lower priority), humanDesignFull overrides, hd last
  for (const key of ['human_design', 'hd', 'HD', 'humanDesign', 'humanDesignFull']) {
    const block = raw[key]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      Object.assign(merged, block as Record<string, unknown>)
    }
  }
  // Root-level raw overrides nested (e.g. explicit top-level type_hd field)
  return { ...merged, ...raw }
}

/**
 * Merge ALL known Numerology source objects from a raw /chart/fusion response.
 */
function mergeNumerologySources(raw: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const key of ['numerologie', 'numerology', 'numerologie_complete', 'numbers']) {
    const block = raw[key]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      Object.assign(merged, block as Record<string, unknown>)
    }
  }
  return { ...merged, ...raw }
}

// ── Per-science checkers ───────────────────────────────────────────────────────

function checkAstroReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  // Use the canonical astro resolver — handles tropical.planets / tropical / flat root
  const { source: astro, path: astroPath } = resolveAstroSource(raw)

  const sunOk  = hasValue(astro, 'sun', 'Sun', 'signe_solaire', 'sun_sign', 'soleil')
  const moonOk = hasValue(astro, 'moon', 'Moon', 'signe_lunaire', 'moon_sign', 'lune')
  const ascOk  = hasValue(astro, 'ascendant', 'Ascendant', 'rising', 'Rising', 'rising_sign', 'asc')

  if (!sunOk)  missing.push('sun')
  if (!moonOk) missing.push('moon')
  if (!ascOk)  missing.push('ascendant')

  if (subcategory === 'theme_natal' || subcategory === 'planetes') {
    const planetChecks: [string, string[]][] = [
      ['mercury', ['mercury', 'Mercury', 'mercure', 'mercury_sign']],
      ['venus',   ['venus',   'Venus',   'Vénus',   'venus_sign']],
      ['mars',    ['mars',    'Mars',    'mars_sign']],
      ['jupiter', ['jupiter', 'Jupiter', 'jupiter_sign']],
      ['saturn',  ['saturn',  'Saturn',  'saturne', 'Saturne', 'saturn_sign']],
    ]
    for (const [label, keys] of planetChecks) {
      if (!hasValue(astro, ...keys)) missing.push(label)
    }
  }

  if (subcategory === 'maisons') {
    if (!hasValue(astro, 'houses', 'maisons', 'house_1', 'maison_1')) missing.push('houses')
  }

  if (subcategory === 'aspects') {
    if (!hasValue(astro, 'aspects', 'major_aspects')) missing.push('aspects')
  }

  const total = subcategory === 'theme_natal' ? 8 : 3
  const completeness = Math.max(0, (total - missing.length) / total)
  const reliable = !missing.includes('sun') && !missing.includes('moon')

  console.log('[ASTRO_RELIABILITY]', {
    astroPath,
    sourceKeys: Object.keys(astro).slice(0, 15),
    sunOk, moonOk, ascOk,
    missingFields: missing,
    completeness,
    reliable,
  })

  return { reliable, missingFields: missing, errors, completeness }
}

function checkHDReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  // Merge ALL HD sources: humanDesign + humanDesignFull + human_design + hd
  // Railway splits summary (humanDesign) and full chart (humanDesignFull)
  const merged = mergeHDSources(raw)

  // safeStrDeep handles both string values and nested objects like { name: "Generator" }
  const typeOk =
    safeStrDeep(merged.type_hd) ?? safeStrDeep(merged.hd_type) ?? safeStrDeep(merged.type) ??
    safeStrDeep(merged.hdType) ?? safeStrDeep(merged.type_label) ?? safeStrDeep(merged.type_name)

  const profileOk =
    safeStrDeep(merged.profil_hd) ?? safeStrDeep(merged.profile_hd) ?? safeStrDeep(merged.profile) ??
    safeStrDeep(merged.profil) ?? safeStrDeep(merged.hdProfile) ?? safeStrDeep(merged.profileLine) ??
    safeStrDeep(merged.profile_line) ?? safeStrDeep(merged.personality_line)

  const authorityOk =
    safeStrDeep(merged.autorite_hd) ?? safeStrDeep(merged.authority) ??
    safeStrDeep(merged.inner_authority) ?? safeStrDeep(merged.innerAuthority) ??
    safeStrDeep(merged.hdAuthority)

  const strategyOk =
    safeStrDeep(merged.strategie_hd) ?? safeStrDeep(merged.strategy) ??
    safeStrDeep(merged.hdStrategy)

  if (!typeOk) missing.push('type_hd')
  // Profile is enrichment: noted if absent but never blocks reliability
  if (!profileOk) missing.push('profil_hd')
  if (!authorityOk && !strategyOk) missing.push('autorite_ou_strategie')

  if (subcategory === 'autorite_hd' && !authorityOk) missing.push('autorite_hd')

  if (subcategory === 'centres_hd' || subcategory === 'human_design_exact') {
    if (!hasValue(merged,
      'centres_hd', 'centers', 'defined_centers', 'definedCenters',
      'openCenters', 'centres_definis',
    )) {
      missing.push('centres_hd')
    }
  }

  if (subcategory === 'portes_hd') {
    if (!hasValue(merged,
      'portes_hd', 'gates', 'activated_gates', 'activatedGates', 'portes_actives',
    )) {
      missing.push('portes_hd')
    }
  }

  if (subcategory === 'canaux_hd') {
    if (!hasValue(merged,
      'canaux_hd', 'channels', 'defined_channels', 'definedChannels',
    )) {
      missing.push('canaux_hd')
    }
  }

  const total = subcategory === 'human_design_exact' ? 5 : 3
  const completeness = Math.max(0, (total - missing.length) / total)
  // Reliable when type + (authority OR strategy) — ensures data is usable for a real HD reading
  const reliable = Boolean(typeOk) && (Boolean(authorityOk) || Boolean(strategyOk))

  console.log('[HD_RELIABILITY]', {
    sourcesFound: ['human_design', 'hd', 'HD', 'humanDesign', 'humanDesignFull'].filter(k => !!raw[k]),
    typeOk, profileOk, authorityOk, strategyOk,
    missingFields: missing,
    completeness,
    reliable,
  })

  return { reliable, missingFields: missing, errors, completeness }
}

function checkNumerologyReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  // Merge ALL numerology sources — Railway may use different key names
  const merged = mergeNumerologySources(raw)

  const lifePathOk = hasValue(
    merged,
    'chemin_de_vie', 'life_path', 'lifePath', 'cheminVie', 'chemin_vie',
    'lifePathNumber', 'life_path_number', 'lifepath', 'life_path_no',
    'numero_chemin', 'cheminDeVie', 'path', 'nombre_chemin',
  )
  if (!lifePathOk) missing.push('chemin_de_vie')

  // Personal year is checked only when relevant subcategory — not required for basic reliability
  if (subcategory === 'annee_personnelle') {
    if (!hasValue(merged, 'annee_personnelle', 'personal_year', 'personalYear', 'personal_year_number', 'personalYearNumber', 'anneePersonnelle', 'year_number')) {
      missing.push('annee_personnelle')
    }
  }

  if (subcategory === 'expression') {
    if (!hasValue(merged, 'expression', 'expression_number', 'expressionNumber', 'nombre_expression')) {
      missing.push('expression')
    }
  }

  if (subcategory === 'ame') {
    if (!hasValue(merged, 'ame', 'soul', 'soul_number', 'soulUrge', 'soul_urge', 'soulUrgeNumber', 'nombre_ame')) {
      missing.push('ame')
    }
  }

  if (subcategory === 'mois_personnel') {
    if (!hasValue(merged, 'mois_personnel', 'personal_month', 'personalMonth', 'personal_month_number')) {
      missing.push('mois_personnel')
    }
  }

  // Reliable when life path is present — sufficient for most numerology readings
  const completeness = missing.includes('chemin_de_vie') ? 0 : Math.max(0.5, (1 - (missing.length - 0) / 5))
  const reliable = lifePathOk

  console.log('[NUMEROLOGY_RELIABILITY]', {
    lifePathOk,
    missingFields: missing,
    completeness,
    reliable,
  })

  return { reliable, missingFields: missing, errors, completeness }
}

function checkKuaReliability(raw: Record<string, unknown>): ReliabilityResult {
  const missing: string[] = []
  const merged = mergeNested(raw, 'kua')

  if (!hasValue(merged, 'nombre_kua', 'kua', 'kua_number', 'numero_kua')) {
    missing.push('nombre_kua')
  }

  return {
    reliable: missing.length === 0,
    missingFields: missing,
    errors: [],
    completeness: missing.length === 0 ? 1 : 0,
  }
}

function checkEnneagramReliability(raw: Record<string, unknown>): ReliabilityResult {
  const missing: string[] = []
  const merged = mergeNested(raw, 'enneagram', 'enneagramme')

  if (!hasValue(merged, 'type_enn', 'type', 'enneagram_type')) {
    missing.push('type_enn')
  }

  return {
    reliable: missing.length === 0,
    missingFields: missing,
    errors: [],
    completeness: missing.length === 0 ? 1 : 0,
  }
}

// ── Universal reliability check ────────────────────────────────────────────────

/**
 * Universal reliability check for any science + subcategory combination.
 *
 * @param science      The resolved science domain
 * @param subcategory  The fine-grained subcategory (or null)
 * @param raw          Raw API data from /chart/fusion
 */
export function isReliableExactData(
  science: Science,
  subcategory: string | null,
  raw: Record<string, unknown> | null | undefined,
): ReliabilityResult {
  if (!raw || typeof raw !== 'object') {
    return {
      reliable: false,
      missingFields: ['all'],
      errors: ['No raw data provided'],
      completeness: 0,
    }
  }

  switch (science) {
    case 'astrology':
      return checkAstroReliability(raw, subcategory)
    case 'human_design':
      return checkHDReliability(raw, subcategory)
    case 'numerology':
      return checkNumerologyReliability(raw, subcategory)
    case 'kua':
      return checkKuaReliability(raw)
    case 'enneagram':
      return checkEnneagramReliability(raw)
    default:
      // For fusion / general / unknown — we can't validate field by field
      // Treat as unreliable unless raw has substantial content
      const keyCount = Object.keys(raw).length
      return {
        reliable: keyCount >= 5,
        missingFields: [],
        errors: keyCount < 5 ? [`Insufficient raw data for science: ${science} (${keyCount} keys)`] : [],
        completeness: Math.min(1, keyCount / 10),
      }
  }
}

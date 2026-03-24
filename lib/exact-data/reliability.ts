/**
 * Exact Data Reliability — Hexastra Coach
 *
 * Validates whether raw API data is sufficient and reliable
 * for the given science + subcategory before the LLM references it.
 *
 * RULE: if unreliable → fallback honnête (honest fallback), never invent.
 */

import type { Science } from '@/lib/hexastra/orchestration/universalClassification'
import { resolveStrictAstroContext } from '@/lib/hexastra/guards/extractCoreAstro'
import {
  mergeHumanDesignSources,
  resolveHumanDesignCoreFields,
} from '@/lib/humandesign/fieldResolver'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReliabilityResult = {
  reliable: boolean
  missingFields: string[]
  errors: string[]
  /** Completeness 0–1 relative to expected fields for this science/subcategory */
  completeness: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasMeaningfulValue(
  value: unknown,
  seen = new Set<object>(),
  depth = 0,
): boolean {
  if (value === null || value === undefined || value === '' || value === false) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return value
  if (depth >= 6) return true

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item, seen, depth + 1))
  }

  if (value && typeof value === 'object') {
    if (seen.has(value as object)) return false
    seen.add(value as object)
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulValue(item, seen, depth + 1),
    )
  }

  return true
}

function hasValue(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = obj[key]
    if (hasMeaningfulValue(v)) return true
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
 * Merge ALL known Numerology source objects from a raw /chart/fusion response.
 */
function mergeNumerologySources(raw: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const key of [
    'numerologie',
    'numerology',
    'numerologie_complete',
    'numerologieComplete',
    'numerology_complete',
    'numerologyComplete',
    'numerologyFull',
    'numbers',
  ]) {
    const block = raw[key]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      Object.assign(merged, block as Record<string, unknown>)
    }
  }
  return { ...merged, ...raw }
}

function findPresentAliasDeep(
  value: unknown,
  aliases: readonly string[],
  seen = new Set<object>(),
  depth = 0,
): string | null {
  if (!value || typeof value !== 'object') return null
  if (seen.has(value as object)) return null
  if (depth >= 6) return null

  seen.add(value as object)

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPresentAliasDeep(item, aliases, seen, depth + 1)
      if (found) return found
    }
    return null
  }

  const obj = value as Record<string, unknown>
  for (const [key, nested] of Object.entries(obj)) {
    if (aliases.includes(key) && hasMeaningfulValue(nested)) return key
    const found = findPresentAliasDeep(nested, aliases, seen, depth + 1)
    if (found) return found
  }

  return null
}

function getObjectCandidate(raw: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = raw[key]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function findPresentAliasInSources(
  raw: Record<string, unknown>,
  aliases: readonly string[],
  sourceKeys: readonly string[],
): string | null {
  for (const alias of aliases) {
    if (hasValue(raw, alias)) return alias
  }

  for (const key of sourceKeys) {
    const block = getObjectCandidate(raw, key)
    if (!block) continue

    for (const alias of aliases) {
      if (hasValue(block, alias)) return alias
    }

    const nestedAlias = findPresentAliasDeep(block, aliases)
    if (nestedAlias) return nestedAlias
  }

  return null
}

function normalizeSubcategories(subcategory: string | string[] | null | undefined): string[] {
  if (Array.isArray(subcategory)) return subcategory.filter(Boolean)
  if (typeof subcategory === 'string' && subcategory.trim()) return [subcategory]
  return []
}

// ── Per-science checkers ───────────────────────────────────────────────────────

function checkAstroReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  // Use the canonical astro resolver — handles tropical.planets / tropical / flat root
  const strictAstro = resolveStrictAstroContext(raw)
  const astro = strictAstro.source
  const astroPath = strictAstro.path

  const sunOk = Boolean(strictAstro.placements.sun.placement?.sign)
  const moonOk = Boolean(strictAstro.placements.moon.placement?.sign)
  const ascOk = Boolean(strictAstro.placements.ascendant.placement?.sign)

  if (!sunOk)  missing.push('sun')
  if (!moonOk) missing.push('moon')
  if (!ascOk)  missing.push('ascendant')

  if (subcategory === 'theme_natal' || subcategory === 'planetes') {
    const planetChecks: Array<[string, boolean | string[]]> = [
      ['mercury', Boolean(strictAstro.placements.mercury.placement?.sign)],
      ['venus',   ['venus',   'Venus',   'Vénus',   'venus_sign']],
      ['mars', Boolean(strictAstro.placements.mars.placement?.sign)],
      ['jupiter', Boolean(strictAstro.placements.jupiter.placement?.sign)],
      ['saturn', Boolean(strictAstro.placements.saturn.placement?.sign)],
    ]
    const normalizedPlanetChecks: Array<[string, boolean]> = planetChecks.map(([label, value]) => {
      if (label === 'venus') return [label, Boolean(strictAstro.placements.venus.placement?.sign)]
      return [label, Boolean(value)]
    })
    for (const [label, isPresent] of normalizedPlanetChecks) {
      if (!isPresent) missing.push(label)
    }
  }

  if (subcategory === 'maisons') {
    if (!hasValue(astro, 'houses', 'maisons', 'house_cusps', 'house_1', 'maison_1')) missing.push('houses')
  }

  if (subcategory === 'aspects') {
    if (!hasValue(astro, 'aspects', 'major_aspects')) missing.push('aspects')
  }

  let expectedFields: string[]
  switch (subcategory) {
    case 'ascendant':
      expectedFields = ['ascendant']
      break
    case 'signe_lunaire':
      expectedFields = ['moon']
      break
    case 'maisons':
      expectedFields = ['houses']
      break
    case 'aspects':
      expectedFields = ['aspects']
      break
    case 'planetes':
      expectedFields = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']
      break
    case 'theme_natal':
      expectedFields = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'ascendant']
      break
    default:
      expectedFields = ['sun', 'moon']
      break
  }

  const expectedMissing = expectedFields.filter((field) => missing.includes(field))
  const completeness = Math.max(0, (expectedFields.length - expectedMissing.length) / expectedFields.length)
  const reliable = expectedMissing.length === 0

  console.log('[ASTRO_RELIABILITY]', {
    astroPath,
    usesTropical: strictAstro.usesTropical,
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

  const merged = mergeHumanDesignSources(raw)
  const normalizedCore = resolveHumanDesignCoreFields(raw)
  const typeOk = normalizedCore.hdType.value
  const profileOk = normalizedCore.hdProfile.value
  const authorityOk = normalizedCore.hdAuthority.value
  const strategyOk = normalizedCore.hdStrategy.value

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
    sourcesFound: normalizedCore.sourcesFound,
    hdType: normalizedCore.hdType,
    hdProfile: normalizedCore.hdProfile,
    hdAuthority: normalizedCore.hdAuthority,
    hdStrategy: normalizedCore.hdStrategy,
    typeOk,
    profileOk,
    authorityOk,
    strategyOk,
    missingFields: missing,
    completeness,
    reliable,
  })

  return { reliable, missingFields: missing, errors, completeness }
}

function checkNumerologyReliability(
  raw: Record<string, unknown>,
  subcategory: string | string[] | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  const merged = mergeNumerologySources(raw)
  const numerologySourceKeys = [
    'numerologie',
    'numerology',
    'numerologie_complete',
    'numerologieComplete',
    'numerology_complete',
    'numerologyComplete',
    'numerologyFull',
    'numbers',
  ] as const

  const aliasGroups = {
    chemin_de_vie: [
      'chemin_de_vie', 'life_path', 'lifePath', 'cheminVie', 'chemin_vie',
      'lifePathNumber', 'life_path_number', 'lifepath', 'life_path_no',
      'numero_chemin', 'cheminDeVie', 'nombre_chemin',
    ],
    annee_personnelle: [
      'annee_personnelle', 'personal_year', 'personalYear', 'personal_year_number',
      'personalYearNumber', 'anneePersonnelle', 'year_number',
    ],
    expression: [
      'expression', 'expression_number', 'expressionNumber', 'nombre_expression',
    ],
    ame: [
      'ame', 'soul', 'soul_number', 'soulUrge', 'soul_urge', 'soulUrgeNumber', 'nombre_ame',
    ],
    mois_personnel: [
      'mois_personnel', 'personal_month', 'personalMonth', 'personal_month_number', 'personalMonthNumber',
    ],
    jour_personnel: [
      'jour_personnel', 'personal_day', 'personalDay', 'personal_day_number', 'personalDayNumber',
    ],
    personnalite_num: [
      'personnalite_num', 'personality_number', 'personalityNumber', 'nombre_personnalite',
    ],
  } as const

  const subcategories = normalizeSubcategories(subcategory)
  const requestedKeys = subcategories.filter((key): key is keyof typeof aliasGroups => key in aliasGroups)
  const requiredKeys = requestedKeys.length > 0 ? requestedKeys : ['chemin_de_vie']

  const matchedAliases = Object.fromEntries(
    Object.entries(aliasGroups).map(([field, aliases]) => [
      field,
      findPresentAliasInSources(merged, aliases, numerologySourceKeys),
    ]),
  ) as Record<keyof typeof aliasGroups, string | null>

  for (const key of requiredKeys) {
    if (!matchedAliases[key]) missing.push(key)
  }

  const foundCount = requiredKeys.length - missing.length
  const completeness = requiredKeys.length > 0 ? foundCount / requiredKeys.length : 0
  const reliable = missing.length === 0

  console.log('[NUMEROLOGY_RELIABILITY]', {
    requestedFields: requiredKeys,
    matchedAliases,
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

function checkEnneagramReliability(
  raw: Record<string, unknown>,
  subcategory: string | string[] | null,
): ReliabilityResult {
  const missing: string[] = []
  const merged = mergeNested(raw, 'enneagram', 'enneagramme')
  const subcategories = normalizeSubcategories(subcategory)
  const requestedWing = subcategories.includes('aile_enn')

  const typeOk = hasValue(merged, 'type_enn', 'type', 'enneagram_type')
  const wingOk = hasValue(merged, 'aile_enn', 'wing', 'enneagram_wing', 'aile')

  if (!typeOk) missing.push('type_enn')
  if (requestedWing && !wingOk) missing.push('aile_enn')

  const expectedFields = requestedWing ? 2 : 1
  const completeness = Math.max(0, (expectedFields - missing.length) / expectedFields)

  return {
    reliable: missing.length === 0,
    missingFields: missing,
    errors: [],
    completeness,
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
  subcategory: string | string[] | null,
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
      return checkAstroReliability(raw, normalizeSubcategories(subcategory)[0] ?? null)
    case 'human_design':
      return checkHDReliability(raw, normalizeSubcategories(subcategory)[0] ?? null)
    case 'numerology':
      return checkNumerologyReliability(raw, subcategory)
    case 'kua':
      return checkKuaReliability(raw)
    case 'enneagram':
      return checkEnneagramReliability(raw, subcategory)
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

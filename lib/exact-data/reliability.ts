/**
 * Exact Data Reliability — Hexastra Coach
 *
 * Validates whether raw API data is sufficient and reliable
 * for the given science + subcategory before the LLM references it.
 *
 * RULE: if unreliable → fallback honnête (honest fallback), never invent.
 */

import type { Science } from '@/lib/hexastra/orchestration/universalClassification'

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

function mergeNested(raw: Record<string, unknown>, ...nestKeys: string[]): Record<string, unknown> {
  for (const key of nestKeys) {
    if (raw[key] && typeof raw[key] === 'object' && !Array.isArray(raw[key])) {
      return { ...(raw[key] as Record<string, unknown>), ...raw }
    }
  }
  return raw
}

// ── Per-science checkers ───────────────────────────────────────────────────────

function checkAstroReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  // Look for nested tropical/astrology block first
  const astro = mergeNested(raw, 'tropical', 'astrology', 'natal')

  const sunOk = hasValue(astro, 'sun', 'signe_solaire', 'sun_sign', 'soleil')
  const moonOk = hasValue(astro, 'moon', 'signe_lunaire', 'moon_sign', 'lune')
  const ascOk = hasValue(astro, 'ascendant', 'rising', 'rising_sign', 'asc')

  if (!sunOk) missing.push('sun')
  if (!moonOk) missing.push('moon')
  if (!ascOk) missing.push('ascendant')

  if (subcategory === 'theme_natal' || subcategory === 'planetes') {
    for (const p of ['mercury', 'venus', 'mars', 'jupiter', 'saturn']) {
      if (!hasValue(astro, p, `${p}_sign`, `${p}e`)) missing.push(p)
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
  // Reliable if we have sun + moon (ascendant can be absent when time is unknown)
  const reliable = !missing.includes('sun') && !missing.includes('moon')

  return { reliable, missingFields: missing, errors, completeness }
}

function checkHDReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  const merged = mergeNested(raw, 'human_design', 'humanDesign', 'hd')

  const typeOk = safeStr(merged.type_hd) ?? safeStr(merged.hd_type) ?? safeStr(merged.type)
  const profileOk = safeStr(merged.profil_hd) ?? safeStr(merged.profile) ?? safeStr(merged.profil)
  const authorityOk = safeStr(merged.autorite_hd) ?? safeStr(merged.authority) ?? safeStr(merged.inner_authority)

  if (!typeOk) missing.push('type_hd')
  if (!profileOk) missing.push('profil_hd')

  if (subcategory === 'autorite_hd' && !authorityOk) missing.push('autorite_hd')

  if (subcategory === 'centres_hd' || subcategory === 'human_design_exact') {
    if (!hasValue(merged, 'centres_hd', 'centers', 'defined_centers')) missing.push('centres_hd')
  }

  if (subcategory === 'portes_hd') {
    if (!hasValue(merged, 'portes_hd', 'gates', 'activated_gates')) missing.push('portes_hd')
  }

  if (subcategory === 'canaux_hd') {
    if (!hasValue(merged, 'canaux_hd', 'channels', 'defined_channels')) missing.push('canaux_hd')
  }

  const total = subcategory === 'human_design_exact' ? 5 : 2
  const completeness = Math.max(0, (total - missing.length) / total)
  const reliable = !missing.includes('type_hd') && !missing.includes('profil_hd')

  return { reliable, missingFields: missing, errors, completeness }
}

function checkNumerologyReliability(
  raw: Record<string, unknown>,
  subcategory: string | null,
): ReliabilityResult {
  const missing: string[] = []
  const errors: string[] = []

  const merged = mergeNested(raw, 'numerology', 'numerologie')

  const lifePathOk = hasValue(merged, 'chemin_de_vie', 'life_path', 'lifePath', 'cheminVie')
  if (!lifePathOk) missing.push('chemin_de_vie')

  if (subcategory === 'expression' && !hasValue(merged, 'expression', 'expression_number')) {
    missing.push('expression')
  }
  if (subcategory === 'ame' && !hasValue(merged, 'ame', 'soul', 'soul_number')) {
    missing.push('ame')
  }
  if (subcategory === 'annee_personnelle' && !hasValue(merged, 'annee_personnelle', 'personal_year')) {
    missing.push('annee_personnelle')
  }
  if (subcategory === 'mois_personnel' && !hasValue(merged, 'mois_personnel', 'personal_month')) {
    missing.push('mois_personnel')
  }

  const completeness = missing.length === 0 ? 1 : 0.5
  const reliable = missing.length === 0

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

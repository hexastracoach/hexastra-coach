/**
 * Compact Human Design Context Builder — Hexastra Coach
 *
 * Extracts only HD-relevant fields from raw /chart/fusion data.
 * Used in the HD exact compact route to avoid injecting thousands of chars
 * of unrelated astro/numerology data into the system prompt.
 *
 * Mirrors buildCompactNatalReadingContext from exactDataGuard.ts
 * but filtered for Human Design fields exclusively.
 */

import {
  resolveHumanDesignCoreFields,
  resolveHumanDesignValue,
} from '@/lib/humandesign/fieldResolver'
import { extractHDProfileFromRaw } from '@/lib/humandesign/profile'

// ── HD-only keys to include ───────────────────────────────────────────────────
const HD_KEYS = new Set([
  // Type / Profile / Authority
  'type_hd', 'hd_type', 'type', 'profil_hd', 'profile', 'profil',
  'profile_hd', 'hdType', 'hdProfile', 'designType',
  'autorite_hd', 'authority', 'inner_authority', 'autorite', 'authority_hd',
  'innerAuthority', 'hdAuthority',
  'strategie_hd', 'strategy', 'strategie', 'strategy_hd',
  'hdStrategy',
  // Signature / Not-self theme
  'signature', 'signature_hd',
  'hdSignature',
  'not_self_theme', 'notSelfTheme', 'not_self', 'theme_non_soi',
  'hdNotSelfTheme',
  // Centers
  'centres_hd', 'centers', 'defined_centers', 'undefined_centers', 'open_centers',
  'definedCenters', 'openCenters',
  'centre_sacral', 'centre_gorge', 'centre_tete', 'centre_ajna',
  'centre_plexus', 'centre_ego', 'centre_g', 'centre_racine',
  // Gates / Channels
  'portes_hd', 'gates', 'activated_gates', 'portes_actives',
  'activatedGates',
  'canaux_hd', 'channels', 'defined_channels',
  'definedChannels',
  // Incarnation Cross / Definition
  'croix_incarnation', 'incarnation_cross',
  'incarnationCross',
  'definition_hd', 'definition',
  'hdDefinition',
  // Top-level HD object
  'human_design', 'humanDesign', 'humanDesignFull', 'hd',
  // Summary
  'publicSummary', 'publicsummary', 'summary', 'synthese',
])

// ── Non-HD keys to always exclude (even if in HD_KEYS namespace) ──────────────
const EXCLUDE_KEYS = new Set([
  'chemin_de_vie', 'life_path', 'expression', 'ame', 'soul',
  'annee_personnelle', 'personal_year',
  'nombre_kua', 'kua', 'kua_number', 'direction_kua',
  'sun', 'moon', 'ascendant', 'rising', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron',
  'houses', 'maisons', 'aspects', 'transits', 'retrograde',
  'dominant_signs', 'dominant_elements', 'dominant_modalities', 'stelliums', 'chart_shape',
])

function safeStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return null
}

const HD_SOURCE_KEYS = new Set(['human_design', 'humanDesign', 'humanDesignFull', 'hd', 'HD'])
const ROOT_SUMMARY_KEYS = new Set(['publicSummary', 'publicsummary', 'summary', 'synthese'])

function resolveHDValueDeep(
  value: unknown,
  aliases: readonly string[],
  seen = new Set<object>(),
): string | null {
  if (!value || typeof value !== 'object') return null
  if (seen.has(value as object)) return null
  seen.add(value as object)

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = resolveHDValueDeep(item, aliases, seen)
      if (found) return found
    }
    return null
  }

  const obj = value as Record<string, unknown>
  for (const [key, nested] of Object.entries(obj)) {
    if (aliases.includes(key)) {
      const direct = resolveHumanDesignValue(nested)
      if (direct) return direct
    }
    const found = resolveHDValueDeep(nested, aliases, seen)
    if (found) return found
  }

  return null
}

function safeArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  // Accept both string arrays ("Gate 1") and number arrays (1) — convert numbers to strings
  return v
    .filter((x) => (typeof x === 'string' && x.trim()) || typeof x === 'number')
    .map((x) => String(x).trim())
    .filter(Boolean)
}

function containsProfilePattern(value: string | null | undefined): boolean {
  if (!value) return false
  return /\b(?:profil|profile)\b[^\n]{0,30}\b[1-6]\/[1-6]\b|\b[1-6]\/[1-6]\b/i.test(value)
}

export type CompactHDContext = {
  hdType: string | null
  hdProfile: string | null
  hdAuthority: string | null
  hdStrategy: string | null
  hdSignature: string | null
  hdNotSelfTheme: string | null
  hdDefinition: string | null
  hdIncarnationCross: string | null
  hdDefinedCenters: string[]
  hdOpenCenters: string[]
  hdActivatedGates: string[]
  hdDefinedChannels: string[]
  hdSummarySeeds: string[]
  /** Capped text block ready for system prompt injection */
  compactDataBlock: string
}

/**
 * Extract HD-only fields from raw /chart/fusion data.
 * Non-HD fields (astro, numerology, kua) are excluded.
 *
 * @param raw     Raw fusion API response
 * @param maxChars Max chars for compactDataBlock (default 1800)
 */
export function buildCompactHumanDesignContext(
  raw: Record<string, unknown>,
  maxChars = 1800,
): CompactHDContext {
  // Merge ALL HD source objects — Railway may split data across humanDesign (summary)
  // and humanDesignFull (full chart). Later sources override earlier ones.
  // Order: humanDesign (low priority) → humanDesignFull (high priority) → raw root (highest)
  const hdAggregated: Record<string, unknown> = {}
  for (const key of ['human_design', 'hd', 'HD', 'humanDesign', 'humanDesignFull']) {
    const block = raw[key]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      Object.assign(hdAggregated, block as Record<string, unknown>)
    }
  }
  const rootHdOnly = Object.fromEntries(
    Object.entries(raw).filter(([key]) => {
      if (HD_SOURCE_KEYS.has(key) || ROOT_SUMMARY_KEYS.has(key) || EXCLUDE_KEYS.has(key)) return false
      return HD_KEYS.has(key) || HD_KEYS.has(key.toLowerCase())
    }),
  )
  const merged: Record<string, unknown> = { ...hdAggregated, ...rootHdOnly }

  const sourcesFound = ['human_design', 'hd', 'HD', 'humanDesign', 'humanDesignFull'].filter(k => !!raw[k])
  // Identify which source took precedence (last found = highest priority after Object.assign loop)
  const primarySource = sourcesFound.slice().reverse().find(k => !!raw[k]) ?? 'root'
  console.log('[HD_COMPACT] resolving sources', {
    sourcesFound,
    primarySource,
    mergedKeyCount: Object.keys(hdAggregated).length,
  })

  const normalizedCore = resolveHumanDesignCoreFields(raw)
  const deterministicProfile = extractHDProfileFromRaw(raw)
  const hdType = normalizedCore.hdType.value
  const hdAuthority = normalizedCore.hdAuthority.value
  const hdStrategy = normalizedCore.hdStrategy.value
  const hdProfile =
    deterministicProfile.calculated && deterministicProfile.profile
      ? deterministicProfile.profile
      : normalizedCore.hdProfile.value
  const hdProfileResolution =
    deterministicProfile.calculated && deterministicProfile.profile
      ? {
          value: deterministicProfile.profile,
          alias: 'calculated_profile',
          source: deterministicProfile.source,
          path: deterministicProfile.source,
          calculated: true,
        }
      : {
          value: normalizedCore.hdProfile.value,
          alias: normalizedCore.hdProfile.alias,
          source: normalizedCore.hdProfile.source,
          path: normalizedCore.hdProfile.path,
          calculated: false,
        }
  const hdDefinition =
    resolveHumanDesignValue(merged.definition_hd) ?? resolveHumanDesignValue(merged.definition) ?? resolveHumanDesignValue(merged.hdDefinition) ??
    resolveHDValueDeep(merged, ['definition_hd', 'definition', 'hdDefinition'])
  const hdIncarnationCross =
    resolveHumanDesignValue(merged.croix_incarnation) ?? resolveHumanDesignValue(merged.incarnation_cross) ??
    resolveHumanDesignValue(merged.incarnationCross) ??
    resolveHDValueDeep(merged, ['croix_incarnation', 'incarnation_cross', 'incarnationCross'])
  const hdSignature =
    resolveHumanDesignValue(merged.signature_hd) ?? resolveHumanDesignValue(merged.signature) ?? resolveHumanDesignValue(merged.hdSignature) ??
    resolveHDValueDeep(merged, ['signature_hd', 'signature', 'hdSignature'])
  const hdNotSelfTheme =
    resolveHumanDesignValue(merged.not_self_theme) ?? resolveHumanDesignValue(merged.notSelfTheme) ??
    resolveHumanDesignValue(merged.not_self) ?? resolveHumanDesignValue(merged.theme_non_soi) ?? resolveHumanDesignValue(merged.hdNotSelfTheme) ??
    resolveHDValueDeep(merged, ['not_self_theme', 'notSelfTheme', 'not_self', 'theme_non_soi', 'hdNotSelfTheme'])

  console.log('[HD_COMPACT] normalized core field resolution', {
    hdType: normalizedCore.hdType,
    hdProfile: hdProfileResolution,
    hdAuthority: normalizedCore.hdAuthority,
    hdStrategy: normalizedCore.hdStrategy,
    extractedCount: [hdType, hdProfile, hdAuthority, hdStrategy, hdSignature, hdDefinition].filter(Boolean).length,
  })

  // ── Centers ─────────────────────────────────────────────────────────────
  const hdDefinedCenters: string[] = (() => {
    const raw_centers =
      merged.centres_hd ?? merged.centers ?? merged.defined_centers ?? merged.definedCenters
    if (Array.isArray(raw_centers)) return safeArr(raw_centers)
    if (raw_centers && typeof raw_centers === 'object') {
      // Object format: { sacral: true, head: false, ... }
      return Object.entries(raw_centers as Record<string, unknown>)
        .filter(([, v]) => v === true || v === 'defined')
        .map(([k]) => k)
    }
    return []
  })().slice(0, 9)

  const hdOpenCenters: string[] = (() => {
    const raw_open = merged.open_centers ?? merged.openCenters ?? merged.undefined_centers
    if (Array.isArray(raw_open)) return safeArr(raw_open).slice(0, 9)
    const raw_centers = merged.centres_hd ?? merged.centers ?? merged.definedCenters
    if (raw_centers && typeof raw_centers === 'object' && !Array.isArray(raw_centers)) {
      return Object.entries(raw_centers as Record<string, unknown>)
        .filter(([, v]) => v === false || v === 'open' || v === 'undefined')
        .map(([k]) => k)
    }
    return []
  })().slice(0, 9)

  // ── Gates ────────────────────────────────────────────────────────────────
  const hdActivatedGates: string[] = (() => {
    const raw_gates =
      merged.portes_hd ?? merged.gates ?? merged.activated_gates ??
      merged.activatedGates ?? merged.portes_actives
    return safeArr(raw_gates).slice(0, 26)
  })()

  // ── Channels ─────────────────────────────────────────────────────────────
  const hdDefinedChannels: string[] = (() => {
    const raw_channels =
      merged.canaux_hd ?? merged.channels ?? merged.defined_channels ?? merged.definedChannels
    return safeArr(raw_channels).slice(0, 10)
  })()

  // ── Summary seeds ─────────────────────────────────────────────────────────
  const hdSummarySeeds: string[] = (() => {
    const s =
      safeStr(hdAggregated.publicSummary) ??
      safeStr(hdAggregated.publicsummary) ??
      safeStr(hdAggregated.summary) ??
      safeStr(hdAggregated.synthese)
    if (containsProfilePattern(s)) return []
    return s ? [s] : []
  })()

  // ── Compact data block (capped) ───────────────────────────────────────────
  const blockLines: string[] = ['DONNÉES HUMAN DESIGN (source de vérité — ne jamais contredire):']
  if (hdType) blockLines.push(`- TYPE: ${hdType}`)
  if (hdProfile) blockLines.push(`- PROFIL: ${hdProfile}`)
  if (hdAuthority) blockLines.push(`- AUTORITÉ: ${hdAuthority}`)
  if (hdStrategy) blockLines.push(`- STRATÉGIE: ${hdStrategy}`)
  if (hdSignature) blockLines.push(`- SIGNATURE: ${hdSignature}`)
  if (hdNotSelfTheme) blockLines.push(`- THÈME NON-SOI: ${hdNotSelfTheme}`)
  if (hdDefinition) blockLines.push(`- DÉFINITION: ${hdDefinition}`)
  if (hdIncarnationCross) blockLines.push(`- CROIX D'INCARNATION: ${hdIncarnationCross}`)
  if (hdDefinedCenters.length) blockLines.push(`- CENTRES DÉFINIS: ${hdDefinedCenters.join(', ')}`)
  if (hdOpenCenters.length) blockLines.push(`- CENTRES OUVERTS: ${hdOpenCenters.join(', ')}`)
  if (hdDefinedChannels.length) blockLines.push(`- CANAUX DÉFINIS: ${hdDefinedChannels.join(', ')}`)
  if (hdActivatedGates.length) blockLines.push(`- PORTES ACTIVES (top): ${hdActivatedGates.slice(0, 10).join(', ')}`)

  // Also scan remaining HD_KEYS from merged (covers humanDesignFull fields not yet extracted)
  const alreadyCovered = new Set([
    'type_hd', 'hd_type', 'type', 'hdType', 'designType',
    'profil_hd', 'profile_hd', 'profile', 'profil', 'hdProfile', 'profileLine',
    'autorite_hd', 'authority', 'inner_authority', 'innerAuthority', 'hdAuthority', 'autorite', 'authority_hd',
    'strategie_hd', 'strategy', 'hdStrategy', 'strategie', 'strategy_hd',
    'signature', 'signature_hd', 'hdSignature',
    'not_self_theme', 'notSelfTheme', 'not_self', 'theme_non_soi', 'hdNotSelfTheme',
    'definition_hd', 'definition', 'hdDefinition',
    'croix_incarnation', 'incarnation_cross', 'incarnationCross',
    'centres_hd', 'centers', 'defined_centers', 'definedCenters', 'undefined_centers', 'open_centers',
    'canaux_hd', 'channels', 'defined_channels', 'definedChannels',
    'portes_hd', 'gates', 'activated_gates', 'activatedGates', 'portes_actives',
    'human_design', 'humanDesign', 'humanDesignFull', 'hd', 'HD',
    'publicSummary', 'publicsummary', 'summary', 'synthese',
  ])
  for (const [key, value] of Object.entries(merged)) {
    if (EXCLUDE_KEYS.has(key) || alreadyCovered.has(key)) continue
    if (!HD_KEYS.has(key) && !HD_KEYS.has(key.toLowerCase())) continue
    if (value === null || value === undefined) continue
    const formatted = typeof value === 'object' ? JSON.stringify(value).slice(0, 200) : String(value)
    const line = `- ${key.replace(/_/g, ' ').toUpperCase()}: ${formatted}`
    if (blockLines.join('\n').length + line.length >= maxChars) {
      blockLines.push('…[données supplémentaires HD disponibles — non affichées pour limiter le contexte]')
      break
    }
    blockLines.push(line)
  }

  if (hdSummarySeeds.length) {
    const summaryLine = `- SYNTHÈSE: ${hdSummarySeeds[0].slice(0, 300)}`
    if (blockLines.join('\n').length + summaryLine.length < maxChars) {
      blockLines.push(summaryLine)
    }
  }

  const compactDataBlock = blockLines.join('\n')
  console.log('[HD_COMPACT] block built', {
    primarySource,
    blockChars: compactDataBlock.length,
    linesCount: blockLines.length,
    hdType, hdProfile, hdAuthority, hdStrategy,
    hdDefinedCentersCount: hdDefinedCenters.length,
    hdActivatedGatesCount: hdActivatedGates.length,
  })

  return {
    hdType,
    hdProfile,
    hdAuthority,
    hdStrategy,
    hdSignature,
    hdNotSelfTheme,
    hdDefinition,
    hdIncarnationCross,
    hdDefinedCenters,
    hdOpenCenters,
    hdActivatedGates,
    hdDefinedChannels,
    hdSummarySeeds,
    compactDataBlock,
  }
}

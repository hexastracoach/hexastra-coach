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

// ── HD-only keys to include ───────────────────────────────────────────────────
const HD_KEYS = new Set([
  // Type / Profile / Authority
  'type_hd', 'hd_type', 'type', 'profil_hd', 'profile', 'profil',
  'autorite_hd', 'authority', 'inner_authority',
  'strategie_hd', 'strategy',
  // Signature / Not-self theme
  'signature', 'signature_hd',
  'not_self_theme', 'notSelfTheme', 'not_self', 'theme_non_soi',
  // Centers
  'centres_hd', 'centers', 'defined_centers', 'undefined_centers', 'open_centers',
  'centre_sacral', 'centre_gorge', 'centre_tete', 'centre_ajna',
  'centre_plexus', 'centre_ego', 'centre_g', 'centre_racine',
  // Gates / Channels
  'portes_hd', 'gates', 'activated_gates', 'portes_actives',
  'canaux_hd', 'channels', 'defined_channels',
  // Incarnation Cross / Definition
  'croix_incarnation', 'incarnation_cross',
  'definition_hd', 'definition',
  // Top-level HD object
  'human_design', 'humanDesign', 'hd',
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

/**
 * Extract a string from either a primitive or a nested object.
 * Handles e.g. { type: { name: "Generator" } } or { type: "Generator" }
 */
function resolveHDValue(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>
    for (const k of ['name', 'label', 'value', 'text', 'title', 'fr', 'en', 'id']) {
      if (typeof obj[k] === 'string' && (obj[k] as string).trim()) return (obj[k] as string).trim()
    }
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
  const merged: Record<string, unknown> = { ...hdAggregated, ...raw }

  const sourcesFound = ['human_design', 'hd', 'HD', 'humanDesign', 'humanDesignFull'].filter(k => !!raw[k])
  // Identify which source took precedence (last found = highest priority after Object.assign loop)
  const primarySource = sourcesFound.slice().reverse().find(k => !!raw[k]) ?? 'root'
  console.log('[HD_COMPACT] resolving sources', {
    sourcesFound,
    primarySource,
    mergedKeyCount: Object.keys(hdAggregated).length,
  })

  // ── Extract top-level HD fields — resolveHDValue handles nested objects ──
  const hdType =
    resolveHDValue(merged.type_hd) ?? resolveHDValue(merged.hd_type) ?? resolveHDValue(merged.type) ??
    resolveHDValue(merged.hdType) ?? resolveHDValue(merged.type_label) ?? resolveHDValue(merged.type_name)
  const hdProfile =
    resolveHDValue(merged.profil_hd) ?? resolveHDValue(merged.profile_hd) ?? resolveHDValue(merged.profile) ??
    resolveHDValue(merged.profil) ?? resolveHDValue(merged.hdProfile) ?? resolveHDValue(merged.profileLine)
  const hdAuthority =
    resolveHDValue(merged.autorite_hd) ?? resolveHDValue(merged.authority) ??
    resolveHDValue(merged.inner_authority) ?? resolveHDValue(merged.innerAuthority) ?? resolveHDValue(merged.hdAuthority)
  const hdStrategy =
    resolveHDValue(merged.strategie_hd) ?? resolveHDValue(merged.strategy) ?? resolveHDValue(merged.hdStrategy)
  const hdDefinition =
    resolveHDValue(merged.definition_hd) ?? resolveHDValue(merged.definition) ?? resolveHDValue(merged.hdDefinition)
  const hdIncarnationCross =
    resolveHDValue(merged.croix_incarnation) ?? resolveHDValue(merged.incarnation_cross) ??
    resolveHDValue(merged.incarnationCross)
  const hdSignature =
    resolveHDValue(merged.signature_hd) ?? resolveHDValue(merged.signature) ?? resolveHDValue(merged.hdSignature)
  const hdNotSelfTheme =
    resolveHDValue(merged.not_self_theme) ?? resolveHDValue(merged.notSelfTheme) ??
    resolveHDValue(merged.not_self) ?? resolveHDValue(merged.theme_non_soi) ?? resolveHDValue(merged.hdNotSelfTheme)

  console.log('[HD_COMPACT] extracted core fields', {
    hdType, hdProfile, hdAuthority, hdStrategy,
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
    const s = safeStr(merged.publicSummary) ?? safeStr(merged.publicsummary) ?? safeStr(merged.summary) ?? safeStr(merged.synthese)
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
    'type_hd', 'hd_type', 'type', 'profil_hd', 'profile_hd', 'profile', 'profil', 'hdProfile', 'profileLine',
    'autorite_hd', 'authority', 'inner_authority', 'innerAuthority', 'hdAuthority',
    'strategie_hd', 'strategy', 'hdStrategy',
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

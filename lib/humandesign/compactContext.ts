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

function safeArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === 'string' && x.trim()).map((x) => String(x).trim())
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
  // Merge root-level fields with the nested human_design / hd object
  const hdRoot =
    (raw.human_design && typeof raw.human_design === 'object' ? raw.human_design : null) ??
    (raw.humanDesign && typeof raw.humanDesign === 'object' ? raw.humanDesign : null) ??
    (raw.hd && typeof raw.hd === 'object' ? raw.hd : null) ??
    {}

  const merged: Record<string, unknown> = {
    ...(hdRoot as Record<string, unknown>),
    ...raw,
  }

  // ── Extract top-level HD fields ─────────────────────────────────────────
  const hdType =
    safeStr(merged.type_hd) ?? safeStr(merged.hd_type) ?? safeStr(merged.type)
  const hdProfile =
    safeStr(merged.profil_hd) ?? safeStr(merged.profile) ?? safeStr(merged.profil)
  const hdAuthority =
    safeStr(merged.autorite_hd) ?? safeStr(merged.authority) ?? safeStr(merged.inner_authority)
  const hdStrategy =
    safeStr(merged.strategie_hd) ?? safeStr(merged.strategy)
  const hdDefinition =
    safeStr(merged.definition_hd) ?? safeStr(merged.definition)
  const hdIncarnationCross =
    safeStr(merged.croix_incarnation) ?? safeStr(merged.incarnation_cross)
  const hdSignature =
    safeStr(merged.signature_hd) ?? safeStr(merged.signature)
  const hdNotSelfTheme =
    safeStr(merged.not_self_theme) ?? safeStr(merged.notSelfTheme) ?? safeStr(merged.not_self) ?? safeStr(merged.theme_non_soi)

  // ── Centers ─────────────────────────────────────────────────────────────
  const hdDefinedCenters: string[] = (() => {
    const raw_centers = merged.centres_hd ?? merged.centers ?? merged.defined_centers
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
    const raw_open = merged.open_centers ?? merged.undefined_centers
    if (Array.isArray(raw_open)) return safeArr(raw_open).slice(0, 9)
    const raw_centers = merged.centres_hd ?? merged.centers
    if (raw_centers && typeof raw_centers === 'object' && !Array.isArray(raw_centers)) {
      return Object.entries(raw_centers as Record<string, unknown>)
        .filter(([, v]) => v === false || v === 'open' || v === 'undefined')
        .map(([k]) => k)
    }
    return []
  })().slice(0, 9)

  // ── Gates ────────────────────────────────────────────────────────────────
  const hdActivatedGates: string[] = (() => {
    const raw_gates = merged.portes_hd ?? merged.gates ?? merged.activated_gates ?? merged.portes_actives
    return safeArr(raw_gates).slice(0, 26)
  })()

  // ── Channels ─────────────────────────────────────────────────────────────
  const hdDefinedChannels: string[] = (() => {
    const raw_channels = merged.canaux_hd ?? merged.channels ?? merged.defined_channels
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

  // Also scan remaining HD_KEYS not yet covered
  for (const [key, value] of Object.entries(raw)) {
    if (EXCLUDE_KEYS.has(key) || !HD_KEYS.has(key)) continue
    if (['type_hd', 'hd_type', 'type', 'profil_hd', 'profile', 'profil',
         'autorite_hd', 'authority', 'inner_authority', 'strategie_hd', 'strategy',
         'signature', 'signature_hd', 'not_self_theme', 'notSelfTheme', 'not_self', 'theme_non_soi',
         'definition_hd', 'definition', 'croix_incarnation', 'incarnation_cross',
         'centres_hd', 'centers', 'defined_centers', 'undefined_centers', 'open_centers',
         'canaux_hd', 'channels', 'defined_channels',
         'portes_hd', 'gates', 'activated_gates', 'portes_actives',
         'human_design', 'humanDesign', 'hd',
         'publicSummary', 'publicsummary', 'summary', 'synthese'].includes(key)) continue
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
    compactDataBlock: blockLines.join('\n'),
  }
}

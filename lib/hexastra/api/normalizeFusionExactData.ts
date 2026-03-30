export type NormalizedFusionExactData = {
  transits: unknown | null
  progressions: unknown | null
  solarReturn: unknown | null
  lunarReturn: unknown | null
  humanDesignTransits: unknown | null
  numerologyCycles: unknown | null
  kuaDirections: unknown | null
}

export type NormalizedFusionExactDataSection = keyof NormalizedFusionExactData

export type FusionExactDataSectionSource = 'exactData' | 'alias' | 'none'

export type FusionExactDataSectionResolution = {
  section: NormalizedFusionExactDataSection
  source: FusionExactDataSectionSource
  key: string | null
  value: unknown | null
}

export type FusionExactDataDiagnostics = {
  detectedSections: NormalizedFusionExactDataSection[]
  exactDataSections: NormalizedFusionExactDataSection[]
  aliasFallbackSections: NormalizedFusionExactDataSection[]
  missingSections: NormalizedFusionExactDataSection[]
  sourceBySection: Record<NormalizedFusionExactDataSection, FusionExactDataSectionSource>
}

export const FUSION_EXACT_DATA_SECTION_KEYS = [
  'transits',
  'progressions',
  'solarReturn',
  'lunarReturn',
  'humanDesignTransits',
  'numerologyCycles',
  'kuaDirections',
] as const satisfies readonly NormalizedFusionExactDataSection[]

export const LEGACY_NUMEROLOGY_KEYS = [
  'numerologie',
  'numerology',
  'numerologie_complete',
  'numerologieComplete',
  'numerology_complete',
  'numerologyComplete',
  'numerologyFull',
  'numbers',
] as const

export const LEGACY_KUA_KEYS = ['kua'] as const

const EXACT_DATA_SECTION_KEYS: Record<NormalizedFusionExactDataSection, readonly string[]> = {
  transits: ['transits'],
  progressions: ['progressions'],
  solarReturn: ['solar_return', 'solarReturn'],
  lunarReturn: ['lunar_return', 'lunarReturn'],
  humanDesignTransits: ['human_design_transits', 'humanDesignTransits'],
  numerologyCycles: ['numerology_cycles', 'numerologyCycles'],
  kuaDirections: ['kua_directions', 'kuaDirections'],
}

const TOP_LEVEL_ALIAS_KEYS: Record<NormalizedFusionExactDataSection, readonly string[]> = {
  transits: ['transits', 'current_transits'],
  progressions: ['progressions', 'secondary_progressions'],
  solarReturn: ['solar_return', 'solarReturn'],
  lunarReturn: ['lunar_return', 'lunarReturn'],
  humanDesignTransits: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  numerologyCycles: ['numerology_cycles', 'numerologyCycles'],
  kuaDirections: ['kua_directions', 'kuaDirections'],
}

function hasOwn(source: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key)
}

export function toFusionRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

export function findFirstMatchingValueDeep(
  value: unknown,
  aliases: readonly string[],
  depth = 0,
  seen = new Set<object>(),
): unknown {
  if (value === null || value === undefined || value === '') return null
  if (depth >= 6) return null
  if (typeof value !== 'object') return null
  if (seen.has(value as object)) return null

  seen.add(value as object)

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstMatchingValueDeep(item, aliases, depth + 1, seen)
      if (found !== null && found !== undefined) return found
    }
    return null
  }

  const record = value as Record<string, unknown>
  for (const alias of aliases) {
    if (hasOwn(record, alias)) {
      const candidate = record[alias]
      if (candidate !== null && candidate !== undefined && candidate !== '') {
        return candidate
      }
    }
  }

  for (const nested of Object.values(record)) {
    const found = findFirstMatchingValueDeep(nested, aliases, depth + 1, seen)
    if (found !== null && found !== undefined) return found
  }

  return null
}

export function resolveFusionExactDataSection(
  raw: unknown,
  section: NormalizedFusionExactDataSection,
): FusionExactDataSectionResolution {
  const source = toFusionRecord(raw) ?? {}
  const exactData = toFusionRecord(source.exactData)

  for (const key of EXACT_DATA_SECTION_KEYS[section]) {
    if (exactData && hasOwn(exactData, key)) {
      return {
        section,
        source: 'exactData',
        key,
        value: exactData[key] ?? null,
      }
    }
  }

  for (const key of TOP_LEVEL_ALIAS_KEYS[section]) {
    if (hasOwn(source, key)) {
      return {
        section,
        source: 'alias',
        key,
        value: source[key] ?? null,
      }
    }
  }

  return {
    section,
    source: 'none',
    key: null,
    value: null,
  }
}

export function normalizeFusionExactDataWithDiagnostics(raw: unknown): {
  exactData: NormalizedFusionExactData
  diagnostics: FusionExactDataDiagnostics
} {
  const resolutions = Object.fromEntries(
    FUSION_EXACT_DATA_SECTION_KEYS.map((section) => [
      section,
      resolveFusionExactDataSection(raw, section),
    ]),
  ) as Record<NormalizedFusionExactDataSection, FusionExactDataSectionResolution>

  const exactData = {
    transits: resolutions.transits.value,
    progressions: resolutions.progressions.value,
    solarReturn: resolutions.solarReturn.value,
    lunarReturn: resolutions.lunarReturn.value,
    humanDesignTransits: resolutions.humanDesignTransits.value,
    numerologyCycles: resolutions.numerologyCycles.value,
    kuaDirections: resolutions.kuaDirections.value,
  } satisfies NormalizedFusionExactData

  const diagnostics: FusionExactDataDiagnostics = {
    detectedSections: FUSION_EXACT_DATA_SECTION_KEYS.filter(
      (section) => resolutions[section].source === 'exactData',
    ),
    exactDataSections: FUSION_EXACT_DATA_SECTION_KEYS.filter(
      (section) => resolutions[section].source === 'exactData',
    ),
    aliasFallbackSections: FUSION_EXACT_DATA_SECTION_KEYS.filter(
      (section) => resolutions[section].source === 'alias',
    ),
    missingSections: FUSION_EXACT_DATA_SECTION_KEYS.filter(
      (section) => resolutions[section].source === 'none',
    ),
    sourceBySection: Object.fromEntries(
      FUSION_EXACT_DATA_SECTION_KEYS.map((section) => [section, resolutions[section].source]),
    ) as Record<NormalizedFusionExactDataSection, FusionExactDataSectionSource>,
  }

  return { exactData, diagnostics }
}

export function normalizeFusionExactData(raw: unknown): NormalizedFusionExactData {
  return normalizeFusionExactDataWithDiagnostics(raw).exactData
}

export function mergeFusionExactSectionWithLegacy(
  raw: unknown,
  section: NormalizedFusionExactDataSection,
  legacyKeys: readonly string[],
): Record<string, unknown> {
  const source = toFusionRecord(raw) ?? {}
  const merged: Record<string, unknown> = {}

  for (const key of legacyKeys) {
    const legacyBlock = toFusionRecord(source[key])
    if (legacyBlock) {
      Object.assign(merged, legacyBlock)
    }
  }

  const sectionBlock = toFusionRecord(resolveFusionExactDataSection(source, section).value)
  if (sectionBlock) {
    Object.assign(merged, sectionBlock)
  }

  return merged
}

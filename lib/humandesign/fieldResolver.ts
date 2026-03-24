type HumanDesignNormalizedField = 'hdType' | 'hdStrategy' | 'hdAuthority' | 'hdProfile'

type HumanDesignSourceKey = 'humanDesign' | 'humanDesignFull' | 'human_design' | 'hd' | 'HD'

type HumanDesignSourceRef = HumanDesignSourceKey | 'root'

type HumanDesignFieldHit = {
  alias: string
  path: string
  rawValue: unknown
  value: string
}

export type HumanDesignFieldResolution = {
  field: HumanDesignNormalizedField
  value: string | null
  alias: string | null
  source: HumanDesignSourceRef | null
  path: string | null
  rawValue: unknown
}

export type HumanDesignCoreFieldResolutions = {
  hdType: HumanDesignFieldResolution
  hdStrategy: HumanDesignFieldResolution
  hdAuthority: HumanDesignFieldResolution
  hdProfile: HumanDesignFieldResolution
  sourcesFound: HumanDesignSourceKey[]
}

const HUMAN_DESIGN_FIELD_ALIASES: Record<HumanDesignNormalizedField, readonly string[]> = {
  hdType: ['type', 'hdType', 'type_hd', 'designType', 'hd_type', 'type_label', 'type_name'],
  hdStrategy: ['strategy', 'strategie', 'strategy_hd', 'strategie_hd', 'hdStrategy'],
  hdAuthority: ['authority', 'autorite', 'innerAuthority', 'authority_hd', 'autorite_hd', 'inner_authority', 'hdAuthority'],
  hdProfile: ['profile', 'profile_hd', 'profil', 'profil_hd', 'hdProfile'],
}

const HUMAN_DESIGN_SOURCE_PRIORITY: readonly HumanDesignSourceKey[] = [
  'humanDesign',
  'humanDesignFull',
  'human_design',
  'hd',
  'HD',
]

const HUMAN_DESIGN_MERGE_ORDER: readonly HumanDesignSourceKey[] = [
  'human_design',
  'hd',
  'HD',
  'humanDesign',
  'humanDesignFull',
]

const HUMAN_DESIGN_VALUE_KEYS = ['name', 'label', 'value', 'text', 'title', 'fr', 'en', 'id'] as const

function safeObj(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export function resolveHumanDesignValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)

  const obj = safeObj(value)
  if (!obj) return null

  for (const key of HUMAN_DESIGN_VALUE_KEYS) {
    if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key].trim()
    if (typeof obj[key] === 'number' && Number.isFinite(obj[key])) return String(obj[key])
  }

  return null
}

function findHumanDesignFieldHit(
  value: unknown,
  aliases: readonly string[],
  currentPath = '',
  depth = 0,
  seen = new Set<object>(),
): HumanDesignFieldHit | null {
  const obj = safeObj(value)
  if (!obj) return null
  if (depth >= 6) return null
  if (seen.has(obj)) return null

  seen.add(obj)

  for (const alias of aliases) {
    if (!(alias in obj)) continue

    const rawValue = obj[alias]
    const resolved = resolveHumanDesignValue(rawValue)
    if (!resolved) continue

    return {
      alias,
      path: currentPath ? `${currentPath}.${alias}` : alias,
      rawValue,
      value: resolved,
    }
  }

  for (const [key, nested] of Object.entries(obj)) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key
    const nestedHit = findHumanDesignFieldHit(nested, aliases, nextPath, depth + 1, seen)
    if (nestedHit) return nestedHit
  }

  return null
}

export function getHumanDesignSourceKeysFound(
  raw: Record<string, unknown> | null | undefined,
): HumanDesignSourceKey[] {
  if (!raw || typeof raw !== 'object') return []

  return HUMAN_DESIGN_SOURCE_PRIORITY.filter((sourceKey) => Boolean(safeObj(raw[sourceKey])))
}

export function mergeHumanDesignSources(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {}

  const merged: Record<string, unknown> = {}
  for (const sourceKey of HUMAN_DESIGN_MERGE_ORDER) {
    const block = safeObj(raw[sourceKey])
    if (block) Object.assign(merged, block)
  }

  return { ...merged, ...raw }
}

export function resolveHumanDesignField(
  raw: Record<string, unknown> | null | undefined,
  field: HumanDesignNormalizedField,
): HumanDesignFieldResolution {
  if (!raw || typeof raw !== 'object') {
    return {
      field,
      value: null,
      alias: null,
      source: null,
      path: null,
      rawValue: null,
    }
  }

  const aliases = HUMAN_DESIGN_FIELD_ALIASES[field]

  for (const sourceKey of HUMAN_DESIGN_SOURCE_PRIORITY) {
    const block = safeObj(raw[sourceKey])
    if (!block) continue

    const hit = findHumanDesignFieldHit(block, aliases, sourceKey)
    if (!hit) continue

    return {
      field,
      value: hit.value,
      alias: hit.alias,
      source: sourceKey,
      path: hit.path,
      rawValue: hit.rawValue,
    }
  }

  const rootHit = findHumanDesignFieldHit(raw, aliases)
  if (rootHit) {
    return {
      field,
      value: rootHit.value,
      alias: rootHit.alias,
      source: 'root',
      path: rootHit.path,
      rawValue: rootHit.rawValue,
    }
  }

  return {
    field,
    value: null,
    alias: null,
    source: null,
    path: null,
    rawValue: null,
  }
}

export function resolveHumanDesignCoreFields(
  raw: Record<string, unknown> | null | undefined,
): HumanDesignCoreFieldResolutions {
  return {
    hdType: resolveHumanDesignField(raw, 'hdType'),
    hdStrategy: resolveHumanDesignField(raw, 'hdStrategy'),
    hdAuthority: resolveHumanDesignField(raw, 'hdAuthority'),
    hdProfile: resolveHumanDesignField(raw, 'hdProfile'),
    sourcesFound: getHumanDesignSourceKeysFound(raw),
  }
}

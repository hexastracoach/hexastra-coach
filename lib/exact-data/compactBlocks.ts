import type { Science } from '@/lib/hexastra/orchestration/universalClassification'

type RequestedField = {
  id: string
  label: string
  aliases: string[]
}

function hasMeaningfulValue(value: unknown, depth = 0, seen = new Set<object>()): boolean {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  if (depth >= 5) return true

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item, depth + 1, seen))
  }

  if (value && typeof value === 'object') {
    if (seen.has(value as object)) return false
    seen.add(value as object)
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulValue(item, depth + 1, seen),
    )
  }

  return false
}

function normalizeRequestedSubcategories(
  requestedSubcategories: string[] | null | undefined,
): Set<string> {
  return new Set((requestedSubcategories ?? []).filter(Boolean))
}

function mergeNested(raw: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const block = raw[key]
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      return { ...(block as Record<string, unknown>), ...raw }
    }
  }
  return raw
}

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

function findFirstValueDeep(
  value: unknown,
  aliases: readonly string[],
  depth = 0,
  seen = new Set<object>(),
): unknown {
  if (!value || typeof value !== 'object') return null
  if (depth >= 6) return null
  if (seen.has(value as object)) return null

  seen.add(value as object)

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstValueDeep(item, aliases, depth + 1, seen)
      if (found !== null && found !== undefined) return found
    }
    return null
  }

  const obj = value as Record<string, unknown>
  for (const alias of aliases) {
    if (hasMeaningfulValue(obj[alias])) return obj[alias]
  }

  for (const nested of Object.values(obj)) {
    const found = findFirstValueDeep(nested, aliases, depth + 1, seen)
    if (found !== null && found !== undefined) return found
  }

  return null
}

function findSummarySeed(value: unknown): string | null {
  const found = findFirstValueDeep(value, [
    'publicSummary',
    'publicsummary',
    'summary',
    'synthese',
    'synthesis',
    'reading',
    'interpretation',
    'bilan',
  ])
  return typeof found === 'string' && found.trim() ? found.trim() : null
}

function formatObjectEntries(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj)
    .filter(([, value]) => hasMeaningfulValue(value))
    .slice(0, 6)
    .map(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return `${key}: ${String(value)}`
      }
      return `${key}: ${JSON.stringify(value).slice(0, 60)}`
    })

  return entries.join(' ; ')
}

function formatCompactValue(value: unknown): string | null {
  if (!hasMeaningfulValue(value)) return null
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => hasMeaningfulValue(item))
      .slice(0, 8)
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item).trim()
        }
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return formatObjectEntries(item as Record<string, unknown>)
        }
        return JSON.stringify(item).slice(0, 80)
      })
      .filter(Boolean)

    return items.length ? items.join(', ') : null
  }
  if (value && typeof value === 'object') {
    return formatObjectEntries(value as Record<string, unknown>) || JSON.stringify(value).slice(0, 180)
  }
  return null
}

function appendLine(lines: string[], line: string, maxChars: number): boolean {
  if (lines.join('\n').length + line.length >= maxChars) {
    lines.push('…[données exactes supplémentaires disponibles — non affichées pour limiter le contexte]')
    return false
  }

  lines.push(line)
  return true
}

function buildBlockFromFields(params: {
  header: string
  fields: RequestedField[]
  source: Record<string, unknown>
  requested: Set<string>
  maxChars: number
  summarySeed?: string | null
}): string | null {
  const { header, fields, source, requested, maxChars, summarySeed } = params
  const lines = [header]

  const requestedFirst = [
    ...fields.filter((field) => requested.has(field.id)),
    ...fields.filter((field) => !requested.has(field.id)),
  ]

  for (const field of requestedFirst) {
    const value = findFirstValueDeep(source, field.aliases)
    const formatted = formatCompactValue(value)

    if (formatted) {
      if (!appendLine(lines, `- ${field.label}: ${formatted}`, maxChars)) break
      continue
    }

    if (requested.has(field.id)) {
      if (!appendLine(lines, `- ${field.label}: non disponible`, maxChars)) break
    }
  }

  if (summarySeed) {
    appendLine(lines, `- SYNTHÈSE SOURCE: ${summarySeed.slice(0, 220)}`, maxChars)
  }

  return lines.length > 1 ? lines.join('\n') : null
}

export function buildCompactExactScienceBlock(params: {
  science: Science
  raw: Record<string, unknown>
  requestedSubcategories?: string[] | null
  maxChars?: number
}): string | null {
  const { science, raw, requestedSubcategories, maxChars = 1400 } = params
  const requested = normalizeRequestedSubcategories(requestedSubcategories)

  switch (science) {
    case 'numerology': {
      const merged = mergeNumerologySources(raw)
      const summarySeed = findSummarySeed(
        raw.numerology ?? raw.numerologie ?? raw.numerologyFull ?? raw.numbers ?? null,
      )

      return buildBlockFromFields({
        header: 'DONNÉES NUMÉROLOGIQUES (source de vérité — citer exactement):',
        source: merged,
        requested,
        maxChars,
        summarySeed,
        fields: [
          {
            id: 'chemin_de_vie',
            label: 'CHEMIN DE VIE',
            aliases: ['chemin_de_vie', 'life_path', 'lifePath', 'lifePathNumber', 'cheminVie'],
          },
          {
            id: 'annee_personnelle',
            label: 'ANNÉE PERSONNELLE',
            aliases: ['annee_personnelle', 'personal_year', 'personalYear', 'personalYearNumber'],
          },
          {
            id: 'mois_personnel',
            label: 'MOIS PERSONNEL',
            aliases: ['mois_personnel', 'personal_month', 'personalMonth', 'personalMonthNumber'],
          },
          {
            id: 'jour_personnel',
            label: 'JOUR PERSONNEL',
            aliases: ['jour_personnel', 'personal_day', 'personalDay', 'personalDayNumber'],
          },
          {
            id: 'expression',
            label: "NOMBRE D'EXPRESSION",
            aliases: ['expression', 'expression_number', 'expressionNumber'],
          },
          {
            id: 'ame',
            label: "NOMBRE D'ÂME",
            aliases: ['ame', 'soul', 'soul_number', 'soulNumber'],
          },
          {
            id: 'personnalite_num',
            label: 'NOMBRE DE PERSONNALITÉ',
            aliases: ['personnalite_num', 'personality', 'personality_number', 'personalityNumber'],
          },
        ],
      })
    }

    case 'kua': {
      const merged = mergeNested(raw, 'kua')
      const summarySeed = findSummarySeed(raw.kua ?? null)

      return buildBlockFromFields({
        header: 'DONNÉES KUA (source de vérité — citer exactement):',
        source: merged,
        requested,
        maxChars,
        summarySeed,
        fields: [
          {
            id: 'nombre_kua',
            label: 'NOMBRE KUA',
            aliases: ['nombre_kua', 'kua', 'kua_number', 'numero_kua'],
          },
          {
            id: 'direction_kua',
            label: 'DIRECTIONS FAVORABLES',
            aliases: [
              'direction_kua',
              'directions',
              'favorable_directions',
              'directions_favorables',
              'favorableDirections',
            ],
          },
          {
            id: 'orientation_habitat',
            label: 'ORIENTATION HABITAT',
            aliases: ['orientation_habitat', 'home_orientation', 'habitat_orientation'],
          },
          {
            id: 'orientation_bureau',
            label: 'ORIENTATION BUREAU',
            aliases: ['orientation_bureau', 'desk_orientation', 'office_orientation'],
          },
          {
            id: 'direction_sommeil',
            label: 'DIRECTION DE SOMMEIL',
            aliases: ['direction_sommeil', 'sleep_direction', 'sleeping_direction'],
          },
        ],
      })
    }

    case 'enneagram': {
      const merged = mergeNested(raw, 'enneagram', 'enneagramme')
      const summarySeed = findSummarySeed(raw.enneagram ?? raw.enneagramme ?? null)

      return buildBlockFromFields({
        header: 'DONNÉES ENNÉAGRAMME (source de vérité — citer exactement):',
        source: merged,
        requested,
        maxChars,
        summarySeed,
        fields: [
          {
            id: 'type_enn',
            label: 'TYPE',
            aliases: ['type_enn', 'type', 'enneagram_type'],
          },
          {
            id: 'aile_enn',
            label: 'AILE',
            aliases: ['aile_enn', 'wing', 'enneagram_wing', 'aile'],
          },
          {
            id: 'instinct_enn',
            label: 'INSTINCT',
            aliases: ['instinct_enn', 'instinct', 'instinctual_variant'],
          },
        ],
      })
    }

    default:
      return null
  }
}

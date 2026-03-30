function normalizeString(value: string): string | null {
  const cleaned = value.trim()
  return cleaned ? cleaned : null
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export type DisplayValue = string | number | string[] | null

export function unwrapDisplayValue(value: unknown): DisplayValue {
  if (typeof value === 'string') {
    return normalizeString(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    const parts = value.flatMap((entry) => {
      const unwrapped = unwrapDisplayValue(entry)
      if (typeof unwrapped === 'string') return [unwrapped]
      if (typeof unwrapped === 'number') return [String(unwrapped)]
      if (Array.isArray(unwrapped)) return unwrapped
      return []
    })

    const uniqueParts = uniq(parts)
    if (uniqueParts.length === 0) return null
    return uniqueParts.length === 1 ? uniqueParts[0] : uniqueParts
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>

    for (const key of [
      'number',
      'value',
      'label',
      'name',
      'title',
      'text',
      'sign',
      'direction',
      'summary',
    ]) {
      const unwrapped = unwrapDisplayValue(record[key])
      if (unwrapped !== null) return unwrapped
    }

    for (const key of [
      'directions',
      'favorableDirections',
      'favorable_directions',
      'values',
      'items',
      'list',
    ]) {
      const unwrapped = unwrapDisplayValue(record[key])
      if (unwrapped !== null) return unwrapped
    }
  }

  return null
}

export function unwrapDisplayText(value: unknown): string | null {
  const unwrapped = unwrapDisplayValue(value)
  if (typeof unwrapped === 'number') return String(unwrapped)
  if (typeof unwrapped === 'string') return unwrapped
  if (Array.isArray(unwrapped)) return unwrapped.join(', ')
  return null
}

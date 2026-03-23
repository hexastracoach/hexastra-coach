export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const GUEST_SCOPE = 'guest'

function normalizeScope(scopeKey: string | null | undefined): string | null {
  if (typeof scopeKey !== 'string') return null
  const trimmed = scopeKey.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function buildScopedStorageKey(baseKey: string, scopeKey?: string | null): string {
  return `${baseKey}:${normalizeScope(scopeKey) ?? GUEST_SCOPE}`
}

export function readScopedStorage(
  storage: StorageLike,
  baseKey: string,
  scopeKey?: string | null,
): string | null {
  const scopedValue = storage.getItem(buildScopedStorageKey(baseKey, scopeKey))
  if (scopedValue !== null) return scopedValue

  if (!normalizeScope(scopeKey)) {
    return storage.getItem(baseKey)
  }

  return null
}

export function writeScopedStorage(
  storage: StorageLike,
  baseKey: string,
  value: string,
  scopeKey?: string | null,
): string {
  const scopedKey = buildScopedStorageKey(baseKey, scopeKey)
  storage.setItem(scopedKey, value)

  if (!normalizeScope(scopeKey)) {
    storage.setItem(baseKey, value)
  }

  return scopedKey
}

export function removeScopedStorage(
  storage: StorageLike,
  baseKey: string,
  scopeKey?: string | null,
): void {
  storage.removeItem(buildScopedStorageKey(baseKey, scopeKey))

  if (!normalizeScope(scopeKey)) {
    storage.removeItem(baseKey)
  }
}

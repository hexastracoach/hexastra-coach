import { describe, expect, it } from 'vitest'
import {
  buildScopedStorageKey,
  readScopedStorage,
  removeScopedStorage,
  writeScopedStorage,
  type StorageLike,
} from '@/lib/chat/scopedLocalStorage'

function createStorage(initial: Record<string, string> = {}): StorageLike & { dump: () => Record<string, string> } {
  const values = new Map(Object.entries(initial))

  return {
    getItem(key) {
      return values.has(key) ? values.get(key)! : null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
    dump() {
      return Object.fromEntries(values.entries())
    },
  }
}

describe('scopedLocalStorage helpers', () => {
  it('uses per-user keys for authenticated scopes', () => {
    expect(buildScopedStorageKey('hexastra.birthData.v1', 'user-123')).toBe('hexastra.birthData.v1:user-123')
  })

  it('falls back to the legacy guest key only for guest scope', () => {
    const storage = createStorage({
      'hexastra.birthData.v1': 'legacy',
      'hexastra.birthData.v1:guest': 'guest',
      'hexastra.birthData.v1:user-123': 'scoped',
    })

    expect(readScopedStorage(storage, 'hexastra.birthData.v1', 'user-123')).toBe('scoped')
    expect(readScopedStorage(storage, 'hexastra.birthData.v1', null)).toBe('guest')
  })

  it('ignores the legacy guest key for authenticated users', () => {
    const storage = createStorage({
      'hexastra.birthData.v1': 'legacy',
    })

    expect(readScopedStorage(storage, 'hexastra.birthData.v1', 'user-123')).toBeNull()
  })

  it('mirrors guest writes to the legacy key for backward compatibility', () => {
    const storage = createStorage()

    writeScopedStorage(storage, 'hexastra.birthData.v1', 'guest-value', null)

    expect(storage.dump()).toEqual({
      'hexastra.birthData.v1': 'guest-value',
      'hexastra.birthData.v1:guest': 'guest-value',
    })
  })

  it('removes only the scoped key for authenticated users', () => {
    const storage = createStorage({
      'hexastra_conversation_id:user-123': 'conv-1',
      'hexastra_conversation_id': 'legacy-conv',
    })

    removeScopedStorage(storage, 'hexastra_conversation_id', 'user-123')

    expect(storage.dump()).toEqual({
      'hexastra_conversation_id': 'legacy-conv',
    })
  })
})

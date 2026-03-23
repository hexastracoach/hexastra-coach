import type { UserEvolutionProfile } from '@/types/evolution'
import { readScopedStorage, removeScopedStorage, writeScopedStorage } from '@/lib/chat/scopedLocalStorage'

const STORAGE_KEY = 'hexastra.evolution.v1'

export function loadEvolutionProfile(scopeKey?: string | null): UserEvolutionProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = readScopedStorage(window.localStorage, STORAGE_KEY, scopeKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as UserEvolutionProfile) : null
  } catch {
    return null
  }
}

export function saveEvolutionProfile(profile: UserEvolutionProfile, scopeKey?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    writeScopedStorage(window.localStorage, STORAGE_KEY, JSON.stringify(profile), scopeKey)
  } catch {
    // noop
  }
}

export function clearEvolutionProfile(scopeKey?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    removeScopedStorage(window.localStorage, STORAGE_KEY, scopeKey)
  } catch {
    // noop
  }
}

export function mergeAndSaveEvolutionProfile(
  current: UserEvolutionProfile | null,
  updates: Partial<UserEvolutionProfile>,
  scopeKey?: string | null,
): UserEvolutionProfile {
  const merged: UserEvolutionProfile = {
    ...(current ?? {}),
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  saveEvolutionProfile(merged, scopeKey)
  return merged
}

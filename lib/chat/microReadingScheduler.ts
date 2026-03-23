import type { BirthData } from '@/app/chat/_lib/chat'
import type { MicroReadings } from './bootstrapTypes'
import { BIRTH_AUTO_INTRO_STORAGE_KEY, MICRO_READINGS_STORAGE_KEY } from './bootstrapTypes'
import { birthDataProfileKey, currentMonthKey, currentYearKey } from './bootstrapMachine'
import { readScopedStorage, writeScopedStorage } from './scopedLocalStorage'

const EMPTY_MICRO_READINGS: MicroReadings = {
  profileKey: null,
  yearKey: null,
  monthKey: null,
}

export function loadMicroReadings(scopeKey?: string | null): MicroReadings {
  if (typeof window === 'undefined') return EMPTY_MICRO_READINGS

  try {
    const raw = readScopedStorage(window.localStorage, MICRO_READINGS_STORAGE_KEY, scopeKey)
    if (!raw) return EMPTY_MICRO_READINGS

    const parsed = JSON.parse(raw) as Partial<MicroReadings>
    return {
      profileKey: parsed.profileKey ?? null,
      yearKey: parsed.yearKey ?? null,
      monthKey: parsed.monthKey ?? null,
    }
  } catch {
    return EMPTY_MICRO_READINGS
  }
}

function persist(readings: MicroReadings, scopeKey?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    writeScopedStorage(window.localStorage, MICRO_READINGS_STORAGE_KEY, JSON.stringify(readings), scopeKey)
  } catch {
    // noop
  }
}

export function markProfileDone(
  readings: MicroReadings,
  birthData: BirthData,
  scopeKey?: string | null,
): MicroReadings {
  const next: MicroReadings = { ...readings, profileKey: birthDataProfileKey(birthData) }
  persist(next, scopeKey)
  return next
}

export function markYearDone(readings: MicroReadings, scopeKey?: string | null): MicroReadings {
  const next: MicroReadings = { ...readings, yearKey: currentYearKey() }
  persist(next, scopeKey)
  return next
}

export function markMonthDone(readings: MicroReadings, scopeKey?: string | null): MicroReadings {
  const next: MicroReadings = { ...readings, monthKey: currentMonthKey() }
  persist(next, scopeKey)
  return next
}

export function invalidateProfile(readings: MicroReadings, scopeKey?: string | null): MicroReadings {
  const next: MicroReadings = { ...readings, profileKey: null }
  persist(next, scopeKey)
  return next
}

export function resetMicroReadings(scopeKey?: string | null): MicroReadings {
  const next = { ...EMPTY_MICRO_READINGS }
  persist(next, scopeKey)
  return next
}

export function loadBirthAutoIntroCompleted(scopeKey?: string | null): boolean {
  if (typeof window === 'undefined') return false

  try {
    return readScopedStorage(window.localStorage, BIRTH_AUTO_INTRO_STORAGE_KEY, scopeKey) === '1'
  } catch {
    return false
  }
}

export function markBirthAutoIntroCompleted(scopeKey?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    writeScopedStorage(window.localStorage, BIRTH_AUTO_INTRO_STORAGE_KEY, '1', scopeKey)
  } catch {
    // noop
  }
}

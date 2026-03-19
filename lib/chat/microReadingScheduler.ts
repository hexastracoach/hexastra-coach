import type { BirthData } from '@/app/chat/_lib/chat'
import type { MicroReadings } from './bootstrapTypes'
import { BIRTH_AUTO_INTRO_STORAGE_KEY, MICRO_READINGS_STORAGE_KEY } from './bootstrapTypes'
import { birthDataProfileKey, currentYearKey, currentMonthKey } from './bootstrapMachine'

export function loadMicroReadings(): MicroReadings {
  try {
    const raw = localStorage.getItem(MICRO_READINGS_STORAGE_KEY)
    if (!raw) return { profileKey: null, yearKey: null, monthKey: null }
    const parsed = JSON.parse(raw) as Partial<MicroReadings>
    return {
      profileKey: parsed.profileKey ?? null,
      yearKey: parsed.yearKey ?? null,
      monthKey: parsed.monthKey ?? null,
    }
  } catch {
    return { profileKey: null, yearKey: null, monthKey: null }
  }
}

function persist(mr: MicroReadings): void {
  try {
    localStorage.setItem(MICRO_READINGS_STORAGE_KEY, JSON.stringify(mr))
  } catch { /* noop */ }
}

/** Call after the micro-profile response is received */
export function markProfileDone(mr: MicroReadings, bd: BirthData): MicroReadings {
  const next: MicroReadings = { ...mr, profileKey: birthDataProfileKey(bd) }
  persist(next)
  return next
}

/** Call after the micro-année response is received */
export function markYearDone(mr: MicroReadings): MicroReadings {
  const next: MicroReadings = { ...mr, yearKey: currentYearKey() }
  persist(next)
  return next
}

/** Call after the micro-mois response is received */
export function markMonthDone(mr: MicroReadings): MicroReadings {
  const next: MicroReadings = { ...mr, monthKey: currentMonthKey() }
  persist(next)
  return next
}

/**
 * Call when birth data changes significantly (different person, etc.)
 * Clears profile key so it's regenerated. Year/month keys remain
 * valid if data is still from the same year/month.
 */
export function invalidateProfile(mr: MicroReadings): MicroReadings {
  const next: MicroReadings = { ...mr, profileKey: null }
  persist(next)
  return next
}

/** Full reset — use when user explicitly clears data */
export function resetMicroReadings(): MicroReadings {
  const empty: MicroReadings = { profileKey: null, yearKey: null, monthKey: null }
  persist(empty)
  return empty
}

export function loadBirthAutoIntroCompleted(): boolean {
  try {
    return localStorage.getItem(BIRTH_AUTO_INTRO_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markBirthAutoIntroCompleted(): void {
  try {
    localStorage.setItem(BIRTH_AUTO_INTRO_STORAGE_KEY, '1')
  } catch {
    // noop
  }
}

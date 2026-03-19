import type { BirthData } from '@/app/chat/_lib/chat'
import type { PlanKey } from '@/lib/plans'
import type { PractitionerUsage, MicroReadings, BootstrapStep } from './bootstrapTypes'
import { getEntitlements } from './entitlements'

/** Minimum fields needed to generate a reading */
export function isBirthDataComplete(bd: BirthData): boolean {
  return !!(bd.firstName?.trim() && bd.birthDate?.trim() && bd.birthCity?.trim())
}

/**
 * Stable key for the birth data profile reading.
 * Changes only when meaningful birth fields change.
 */
export function birthDataProfileKey(bd: BirthData): string {
  return [
    bd.firstName?.trim().toLowerCase(),
    bd.birthDate,
    bd.birthTime || 'unknown',
    bd.birthCity?.trim().toLowerCase(),
    bd.birthCountryCode || '',
  ].join('|')
}

export function currentYearKey(): string {
  return String(new Date().getFullYear())
}

export function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Pure function — derives the current bootstrap step from state.
 * No side-effects, no storage access.
 */
export function computeBootstrapStep({
  planLoaded,
  plan,
  practitionerUsage,
  birthData,
  microReadings,
  allowAutomaticMicroReadings = false,
}: {
  planLoaded: boolean
  plan: PlanKey
  practitionerUsage: PractitionerUsage
  birthData: BirthData
  microReadings: MicroReadings
  allowAutomaticMicroReadings?: boolean
}): BootstrapStep {
  if (!planLoaded) return 'loading'

  const ents = getEntitlements(plan)

  // 1. Practitioner plan asks the usage first to mirror the guided GPT flow.
  if (ents.canAskPractitionerUsage && !practitionerUsage) {
    return 'practitioner_usage_needed'
  }

  // 2. Birth data stays mandatory before any real reading.
  if (!isBirthDataComplete(birthData)) return 'birthdata_missing'

  // 3. Automatic micro-readings only run during the one-shot welcome bootstrap.
  if (!allowAutomaticMicroReadings) return 'conversation_ready'

  // 4. Micro-readings in strict order
  const profileKey = birthDataProfileKey(birthData)
  if (microReadings.profileKey !== profileKey) return 'micro_profile_pending'

  if (microReadings.yearKey !== currentYearKey()) return 'micro_year_pending'

  if (microReadings.monthKey !== currentMonthKey()) return 'micro_month_pending'

  return 'conversation_ready'
}

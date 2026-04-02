import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { BirthProfile, PractitionerUsageHex, UserMemoryRecord } from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'
import { readUserMemory } from '@/lib/hexastra/memory/userMemory'
import { mapDbPlanToPlanKey } from '@/lib/permissions/plan'
import { getDefaultSubject } from '@/lib/hexastra/data/readingSubjectService'
import { logger } from '@/lib/utils/logger'

export type BirthDataSource =
  | 'frontend_payload'
  | 'reading_subject'
  | 'default_profile'
  | 'supabase_profile'
  | 'none'

export type HexastraUserContext = {
  userId: string | null
  firstName: string | null
  plan: PlanKey
  language: string
  birthData: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
  memory: UserMemoryRecord | null
  journeyEnabled: boolean
  profileRow: Record<string, unknown> | null
  birthDataSource?: BirthDataSource
  readingSubjectId?: string | null
}

function normalizeProfileBirth(row: Record<string, unknown> | null): BirthProfile | null {
  if (!row) return null

  const latRaw = row.birth_lat
  const lngRaw = row.birth_lng
  const lat = typeof latRaw === 'number' ? latRaw : (typeof latRaw === 'string' ? parseFloat(latRaw) : undefined)
  const lon = typeof lngRaw === 'number' ? lngRaw : (typeof lngRaw === 'string' ? parseFloat(lngRaw) : undefined)

  const birth: BirthProfile = {
    firstName: typeof row.first_name === 'string' ? row.first_name : undefined,
    date: typeof row.birth_date === 'string' ? row.birth_date : undefined,
    time: typeof row.birth_time === 'string' ? row.birth_time : undefined,
    place: typeof row.birth_location === 'string' ? row.birth_location : undefined,
    country: typeof row.birth_country_code === 'string' ? row.birth_country_code : undefined,
    lat: lat !== undefined && !isNaN(lat) ? lat : undefined,
    lon: lon !== undefined && !isNaN(lon) ? lon : undefined,
    birthTimeKnown: typeof row.birth_time_known === 'boolean' ? row.birth_time_known : undefined,
    gender: typeof row.gender === 'string' ? row.gender : undefined,
  }
  return birth.firstName || birth.date || birth.place ? birth : null
}

function hasMeaningfulBirthData(birth: BirthProfile | null | undefined): birth is BirthProfile {
  if (!birth) return false

  return Boolean(
    birth.firstName ||
    birth.date ||
    birth.birthDateISO ||
    birth.time ||
    birth.place ||
    birth.country ||
    birth.gender ||
    birth.lat !== undefined ||
    birth.lon !== undefined,
  )
}

function toBirthProfileFromResolvedSubject(subject: Awaited<ReturnType<typeof getDefaultSubject>>): BirthProfile | null {
  if (!subject) return null

  return {
    firstName: subject.firstName,
    date: subject.birthData.birthDate,
    time: subject.birthData.birthTime ?? undefined,
    place: subject.birthData.birthPlace,
    lat: subject.birthData.birthLat,
    lon: subject.birthData.birthLng,
  }
}

export async function buildUserContext({
  supabase,
  user,
  fallbackPlan,
  fallbackLanguage,
  birthData,
  practitionerUsage,
}: {
  supabase: SupabaseClient | null
  user: User | null
  fallbackPlan: PlanKey
  fallbackLanguage: string
  birthData: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
}): Promise<HexastraUserContext> {
  let profileRow: Record<string, unknown> | null = null
  let resolvedSubject: Awaited<ReturnType<typeof getDefaultSubject>> | null = null

  if (supabase && user?.id) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      profileRow = (data as Record<string, unknown> | null) ?? null
    } catch {
      profileRow = null
    }
  }

  if (user?.id) {
    try {
      resolvedSubject = await getDefaultSubject(user.id)
    } catch (readingSubjectError) {
      logger.warn('BIRTH_DATA_READING_SUBJECT_UNAVAILABLE', {
        userId: user.id,
        error:
          readingSubjectError instanceof Error
            ? readingSubjectError.message
            : String(readingSubjectError),
      })
      resolvedSubject = null
    }
  }

  // Normalise la valeur brute DB (ex: 'essentiel' → 'essential') pour éviter que
  // normalizePlan() en aval retombe sur 'free' faute de correspondance.
  // fallbackPlan est déjà normalisé par route.ts — il a priorité si présent.
  const rawDbPlan = typeof profileRow?.plan === 'string'
    ? profileRow.plan
    : (typeof user?.user_metadata?.plan === 'string' ? user.user_metadata.plan : undefined)
  const plan: PlanKey | undefined = fallbackPlan !== 'free'
    ? fallbackPlan                          // plan résolu par route.ts → priorité absolue
    : (rawDbPlan !== undefined ? mapDbPlanToPlanKey(rawDbPlan) : undefined)
  const language =
    (typeof profileRow?.language === 'string' ? profileRow.language : undefined) ||
    (typeof user?.user_metadata?.language === 'string' ? user.user_metadata.language : undefined) ||
    fallbackLanguage ||
    'fr'

  const profileBirth = normalizeProfileBirth(profileRow)
  const readingSubjectBirth = toBirthProfileFromResolvedSubject(resolvedSubject)
  const frontendBirth = hasMeaningfulBirthData(birthData) ? birthData : null

  const lockedBirthSource: BirthDataSource =
    frontendBirth
      ? 'frontend_payload'
      : resolvedSubject?.source === 'reading_subject'
        ? 'reading_subject'
        : resolvedSubject?.source === 'default_profile'
          ? 'default_profile'
          : profileBirth
            ? 'supabase_profile'
            : 'none'

  const mergedBirth =
    frontendBirth ??
    readingSubjectBirth ??
    profileBirth ??
    null

  logger.info('BIRTH_DATA_SOURCE_LOCKED', {
    userId: user?.id ?? null,
    source: lockedBirthSource,
    hasFrontendBirth: Boolean(frontendBirth),
    hasReadingSubjectBirth: Boolean(readingSubjectBirth),
    hasProfileBirth: Boolean(profileBirth),
    readingSubjectSource: resolvedSubject?.source ?? null,
    readingSubjectId: resolvedSubject?.subjectId ?? null,
    mergedBirthDate: mergedBirth?.date ?? mergedBirth?.birthDateISO ?? null,
    mergedBirthPlace: mergedBirth?.place ?? null,
    mergedBirthHasLat: mergedBirth?.lat !== undefined,
  })

  const memory = await readUserMemory(supabase, user?.id)
  const journeyEnabled =
    typeof profileRow?.journey_enabled === 'boolean'
      ? (profileRow.journey_enabled as boolean)
      : typeof profileRow?.journeyEnabled === 'boolean'
        ? (profileRow.journeyEnabled as boolean)
        : false

  return {
    userId: user?.id ?? null,
    firstName: mergedBirth?.firstName ?? (typeof profileRow?.first_name === 'string' ? profileRow.first_name : null),
    plan: plan ?? fallbackPlan,
    language,
    birthData: mergedBirth,
    practitionerUsage: practitionerUsage ?? ((profileRow?.practitioner_usage as PractitionerUsageHex | undefined) ?? null),
    memory,
    journeyEnabled,
    profileRow,
    birthDataSource: lockedBirthSource,
    readingSubjectId: resolvedSubject?.subjectId ?? null,
  }
}

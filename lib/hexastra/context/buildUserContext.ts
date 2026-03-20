import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { BirthProfile, PractitionerUsageHex, UserMemoryRecord } from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'
import { readUserMemory } from '@/lib/hexastra/memory/userMemory'

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

  if (supabase && user?.id) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      profileRow = (data as Record<string, unknown> | null) ?? null
    } catch {
      profileRow = null
    }
  }

  const plan = (typeof profileRow?.plan === 'string' ? profileRow.plan : user?.user_metadata?.plan) as PlanKey | undefined
  const language =
    (typeof profileRow?.language === 'string' ? profileRow.language : undefined) ||
    (typeof user?.user_metadata?.language === 'string' ? user.user_metadata.language : undefined) ||
    fallbackLanguage ||
    'fr'

  const profileBirth = normalizeProfileBirth(profileRow)
  const mergedBirth = birthData ?? profileBirth

  console.log('[BIRTH_DATA] buildUserContext', {
    userId: user?.id ?? null,
    sourceUsed: birthData ? 'frontend_payload' : (profileBirth ? 'supabase_profile' : 'none'),
    hasFrontendBirth: !!birthData,
    hasProfileBirth: !!profileBirth,
    profileBirthHasLat: profileBirth?.lat !== undefined,
    mergedBirthDate: mergedBirth?.date ?? null,
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
  }
}

/**
 * POST /api/profile/birth
 *
 * Persists birth data to the authenticated user's profiles row.
 * Called fire-and-forget from ChatPageClient after localStorage save.
 * Never blocks the chat flow — errors are logged server-side only.
 *
 * Error codes returned in JSON:
 *   unauthenticated       — no session
 *   no_fields             — body contained no valid fields
 *   column_missing        — Supabase schema cache error (migration not applied)
 *   db_error              — other Supabase update error
 *   internal_error        — unexpected exception
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callN8nBirthWebhook, isN8nBirthWebhookEnabled } from '@/lib/n8n/chatWebhook'

/** Supabase error message patterns that indicate a missing column */
const COLUMN_MISSING_PATTERNS = [
  'column of',
  'schema cache',
  'does not exist',
  'unknown column',
  'no column',
]

function isColumnMissingError(message: string): boolean {
  const lower = message.toLowerCase()
  return COLUMN_MISSING_PATTERNS.some((pattern) => lower.includes(pattern))
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function normalizePartnerBirthData(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value)
  return Object.keys(record).some((key) => {
    const field = record[key]
    return typeof field === 'string' ? field.trim().length > 0 : field !== null && field !== undefined
  })
    ? record
    : null
}

async function notifyBirthWebhook(params: {
  userId: string | null
  savedMode: 'full' | 'core_only' | 'local_only'
  updatedFields: string[]
  birthData: Record<string, unknown>
  partnerBirthData: Record<string, unknown> | null
}) {
  if (!isN8nBirthWebhookEnabled()) return

  try {
    await callN8nBirthWebhook({
      source: 'hexastra-web',
      event: 'birth_profile_saved',
      userId: params.userId,
      savedMode: params.savedMode,
      updatedFields: params.updatedFields,
      birthData: params.birthData,
      partnerBirthData: params.partnerBirthData,
      savedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[BIRTH_DATA] n8n birth webhook failed (non-critical)', {
      userId: params.userId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

function getSubmittedFieldNames(record: Record<string, unknown>) {
  return Object.keys(record).filter((key) => {
    const value = record[key]
    return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ ok: false, reason: 'unauthenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'first_name, birth_date, birth_time, birth_time_known, birth_location, birth_country_code, birth_lat, birth_lng, gender',
      )
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[BIRTH_DATA] profile fetch failed', {
        userId: user.id,
        error: error.message,
      })
      return NextResponse.json({ ok: false, reason: 'db_error', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      profile: data ?? null,
    })
  } catch (err) {
    console.error('[BIRTH_DATA] unexpected error in GET /api/profile/birth', err)
    return NextResponse.json({ ok: false, reason: 'internal_error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const bodyRecord = asRecord(body)
    const birthDataRecord = asRecord(bodyRecord.birthData)
    const primaryBirthData = Object.keys(birthDataRecord).length > 0 ? birthDataRecord : bodyRecord
    const partnerBirthData = normalizePartnerBirthData(bodyRecord.partnerBirthData)

    let userId: string | null = null
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null

    try {
      supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch (err) {
      console.warn('[BIRTH_DATA] auth lookup failed, continuing in local_only mode', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (!userId || !supabase) {
      const updatedFields = getSubmittedFieldNames(primaryBirthData)

      if (updatedFields.length === 0) {
        console.warn('[BIRTH_DATA] no valid local fields to notify')
        return NextResponse.json({ ok: false, reason: 'no_fields' })
      }

      await notifyBirthWebhook({
        userId: null,
        savedMode: 'local_only',
        updatedFields,
        birthData: primaryBirthData,
        partnerBirthData,
      })

      return NextResponse.json({
        ok: true,
        updated: updatedFields.length,
        mode: 'local_only',
      })
    }

    const {
      firstName,
      birthDate,
      birthTime,
      birthTimeKnown,
      birthCity,
      birthCountryName,
      birthCountryCode,
      birthLat,
      birthLng,
      gender,
    } = primaryBirthData as {
      firstName?: string
      birthDate?: string
      birthTime?: string
      birthTimeKnown?: boolean
      birthCity?: string
      birthCountryName?: string
      birthCountryCode?: string
      birthLat?: string | number
      birthLng?: string | number
      gender?: string
    }

    // Compose birth_location as "City, Country" for display / legacy lookup.
    const birthLocation =
      birthCity && birthCountryName
        ? `${birthCity}, ${birthCountryName}`
        : (birthCity ?? birthCountryName ?? null)

    // Core fields (always-present in profiles table since 20260314 migration).
    const coreUpdates: Record<string, unknown> = {}
    if (firstName !== undefined && firstName !== '') coreUpdates.first_name = firstName
    if (birthDate !== undefined && birthDate !== '') coreUpdates.birth_date = birthDate
    if (birthTime !== undefined) coreUpdates.birth_time = birthTime || null
    if (birthLocation) coreUpdates.birth_location = birthLocation

    // Extended fields (present only after 20260320 migration).
    const extendedUpdates: Record<string, unknown> = {}
    if (birthTimeKnown !== undefined) extendedUpdates.birth_time_known = birthTimeKnown
    if (birthCountryCode !== undefined && birthCountryCode !== '') {
      extendedUpdates.birth_country_code = birthCountryCode
    }
    if (birthLat !== undefined && birthLat !== '') {
      const lat = typeof birthLat === 'string' ? parseFloat(birthLat) : birthLat
      if (!isNaN(lat)) extendedUpdates.birth_lat = lat
    }
    if (birthLng !== undefined && birthLng !== '') {
      const lng = typeof birthLng === 'string' ? parseFloat(birthLng) : birthLng
      if (!isNaN(lng)) extendedUpdates.birth_lng = lng
    }
    if (gender !== undefined && gender !== '') extendedUpdates.gender = gender

    const allUpdates = { ...coreUpdates, ...extendedUpdates }

    if (Object.keys(allUpdates).length === 0) {
      console.warn('[BIRTH_DATA] no valid fields to save', { userId })
      return NextResponse.json({ ok: false, reason: 'no_fields' })
    }

    console.log('[BIRTH_DATA] saving to profiles', {
      userId,
      fields: Object.keys(allUpdates),
      coreFields: Object.keys(coreUpdates),
      extendedFields: Object.keys(extendedUpdates),
    })

    // Attempt 1: full update (core + extended).
    const { error: fullError } = await supabase
      .from('profiles')
      .update(allUpdates)
      .eq('id', userId)

    if (!fullError) {
      console.log('[BIRTH_DATA] saved ok (full)', {
        userId,
        fields: Object.keys(allUpdates),
      })
      await notifyBirthWebhook({
        userId,
        savedMode: 'full',
        updatedFields: Object.keys(allUpdates),
        birthData: primaryBirthData,
        partnerBirthData,
      })
      return NextResponse.json({ ok: true, updated: Object.keys(allUpdates).length, mode: 'full' })
    }

    // Attempt 2: if extended fields caused a column_missing error, retry core only.
    if (isColumnMissingError(fullError.message) && Object.keys(coreUpdates).length > 0) {
      console.warn('[BIRTH_DATA] extended columns missing — migration 20260320 not applied', {
        userId,
        dbError: fullError.message,
        missingFields: Object.keys(extendedUpdates),
        hint: 'Run: supabase db push OR apply migration 20260320_birth_extended_fields.sql manually',
      })

      const { error: coreError } = await supabase
        .from('profiles')
        .update(coreUpdates)
        .eq('id', userId)

      if (!coreError) {
        console.log('[BIRTH_DATA] saved ok (core only — extended columns missing)', {
          userId,
          savedFields: Object.keys(coreUpdates),
          skippedFields: Object.keys(extendedUpdates),
        })
        await notifyBirthWebhook({
          userId,
          savedMode: 'core_only',
          updatedFields: Object.keys(coreUpdates),
          birthData: primaryBirthData,
          partnerBirthData,
        })
        return NextResponse.json({
          ok: true,
          updated: Object.keys(coreUpdates).length,
          mode: 'core_only',
          warning: 'extended_columns_missing — run migration 20260320',
        })
      }

      // Core also failed — genuine DB error.
      console.error('[BIRTH_DATA] core update also failed', {
        userId,
        error: coreError.message,
      })
      return NextResponse.json({ ok: false, reason: 'db_error', detail: coreError.message }, { status: 500 })
    }

    // Non-column error on full update.
    console.error('[BIRTH_DATA] profiles update failed', {
      userId,
      error: fullError.message,
      isColumnMissing: isColumnMissingError(fullError.message),
    })
    return NextResponse.json({ ok: false, reason: 'db_error', detail: fullError.message }, { status: 500 })
  } catch (err) {
    console.error('[BIRTH_DATA] unexpected error in /api/profile/birth', err)
    return NextResponse.json({ ok: false, reason: 'internal_error' }, { status: 500 })
  }
}

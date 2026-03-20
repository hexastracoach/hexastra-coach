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
  return COLUMN_MISSING_PATTERNS.some((p) => lower.includes(p))
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      console.warn('[BIRTH_DATA] unauthenticated call to /api/profile/birth — skipping')
      return NextResponse.json({ ok: false, reason: 'unauthenticated' }, { status: 401 })
    }

    const body = await req.json()
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
    } = body as {
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

    // Compose birth_location as "City, Country" for display / legacy lookup
    const birthLocation =
      birthCity && birthCountryName
        ? `${birthCity}, ${birthCountryName}`
        : (birthCity ?? birthCountryName ?? null)

    // ── Core fields (always-present in profiles table since 20260314 migration) ──
    const coreUpdates: Record<string, unknown> = {}
    if (firstName !== undefined && firstName !== '') coreUpdates.first_name = firstName
    if (birthDate !== undefined && birthDate !== '') coreUpdates.birth_date = birthDate
    if (birthTime !== undefined) coreUpdates.birth_time = birthTime || null
    if (birthLocation) coreUpdates.birth_location = birthLocation

    // ── Extended fields (present only after 20260320 migration) ──
    const extendedUpdates: Record<string, unknown> = {}
    if (birthTimeKnown !== undefined) extendedUpdates.birth_time_known = birthTimeKnown
    if (birthCountryCode !== undefined && birthCountryCode !== '') extendedUpdates.birth_country_code = birthCountryCode
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
      console.warn('[BIRTH_DATA] no valid fields to save', { userId: user.id })
      return NextResponse.json({ ok: false, reason: 'no_fields' })
    }

    console.log('[BIRTH_DATA] saving to profiles', {
      userId: user.id,
      fields: Object.keys(allUpdates),
      coreFields: Object.keys(coreUpdates),
      extendedFields: Object.keys(extendedUpdates),
    })

    // ── Attempt 1: full update (core + extended) ──────────────────────────────
    const { error: fullError } = await supabase
      .from('profiles')
      .update(allUpdates)
      .eq('id', user.id)

    if (!fullError) {
      console.log('[BIRTH_DATA] saved ok (full)', {
        userId: user.id,
        fields: Object.keys(allUpdates),
      })
      return NextResponse.json({ ok: true, updated: Object.keys(allUpdates).length, mode: 'full' })
    }

    // ── Attempt 2: if extended fields caused a column_missing error, retry core only ──
    if (isColumnMissingError(fullError.message) && Object.keys(coreUpdates).length > 0) {
      console.warn('[BIRTH_DATA] extended columns missing — migration 20260320 not applied', {
        userId: user.id,
        dbError: fullError.message,
        missingFields: Object.keys(extendedUpdates),
        hint: 'Run: supabase db push  OR apply migration 20260320_birth_extended_fields.sql manually',
      })

      const { error: coreError } = await supabase
        .from('profiles')
        .update(coreUpdates)
        .eq('id', user.id)

      if (!coreError) {
        console.log('[BIRTH_DATA] saved ok (core only — extended columns missing)', {
          userId: user.id,
          savedFields: Object.keys(coreUpdates),
          skippedFields: Object.keys(extendedUpdates),
        })
        return NextResponse.json({
          ok: true,
          updated: Object.keys(coreUpdates).length,
          mode: 'core_only',
          warning: 'extended_columns_missing — run migration 20260320',
        })
      }

      // Core also failed — genuine DB error
      console.error('[BIRTH_DATA] core update also failed', {
        userId: user.id,
        error: coreError.message,
      })
      return NextResponse.json({ ok: false, reason: 'db_error', detail: coreError.message }, { status: 500 })
    }

    // ── Non-column error on full update ──────────────────────────────────────
    console.error('[BIRTH_DATA] profiles update failed', {
      userId: user.id,
      error: fullError.message,
      isColumnMissing: isColumnMissingError(fullError.message),
    })
    return NextResponse.json({ ok: false, reason: 'db_error', detail: fullError.message }, { status: 500 })
  } catch (err) {
    console.error('[BIRTH_DATA] unexpected error in /api/profile/birth', err)
    return NextResponse.json({ ok: false, reason: 'internal_error' }, { status: 500 })
  }
}

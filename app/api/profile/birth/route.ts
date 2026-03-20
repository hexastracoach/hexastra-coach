/**
 * POST /api/profile/birth
 *
 * Persists birth data to the authenticated user's profiles row.
 * Called fire-and-forget from ChatPageClient after localStorage save.
 * Never blocks the chat flow — errors are logged server-side only.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      // Not authenticated — silently ignore (guest user)
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

    const updates: Record<string, unknown> = {}
    if (firstName !== undefined && firstName !== '') updates.first_name = firstName
    if (birthDate !== undefined && birthDate !== '') updates.birth_date = birthDate
    if (birthTime !== undefined) updates.birth_time = birthTime || null
    if (birthTimeKnown !== undefined) updates.birth_time_known = birthTimeKnown
    if (birthLocation) updates.birth_location = birthLocation
    if (birthCountryCode !== undefined && birthCountryCode !== '') updates.birth_country_code = birthCountryCode
    if (birthLat !== undefined && birthLat !== '') {
      const lat = typeof birthLat === 'string' ? parseFloat(birthLat) : birthLat
      if (!isNaN(lat)) updates.birth_lat = lat
    }
    if (birthLng !== undefined && birthLng !== '') {
      const lng = typeof birthLng === 'string' ? parseFloat(birthLng) : birthLng
      if (!isNaN(lng)) updates.birth_lng = lng
    }
    if (gender !== undefined && gender !== '') updates.gender = gender

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, updated: 0 })
    }

    console.log('[BIRTH_DATA] saving to profiles', { userId: user.id, fields: Object.keys(updates) })

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

    if (error) {
      console.error('[BIRTH_DATA] profiles update failed', { userId: user.id, error: error.message })
      return NextResponse.json({ ok: false, reason: error.message }, { status: 500 })
    }

    console.log('[BIRTH_DATA] saved ok', { userId: user.id, fields: Object.keys(updates) })
    return NextResponse.json({ ok: true, updated: Object.keys(updates).length })
  } catch (err) {
    console.error('[BIRTH_DATA] unexpected error', err)
    return NextResponse.json({ ok: false, reason: 'internal_error' }, { status: 500 })
  }
}

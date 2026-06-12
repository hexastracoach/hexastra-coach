import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { getOrCreateProfile } from '@/lib/profiles/getOrCreateProfile'
import { logger } from '@/lib/utils/logger'
import { ok, unauthorized, internalError } from '@/lib/utils/apiResponse'

export async function POST() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return unauthorized('Unauthorized')
  }

  const firstName = typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name.trim() : ''
  const lastName = typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name.trim() : ''
  const fullName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
    ''

  try {
    const { profile } = await getOrCreateProfile({
      id: user.id,
      email: user.email,
      full_name: fullName,
    })

    // Ensure name/email up to date
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email: user.email ?? profile.email, full_name: fullName || profile.full_name })
      .eq('id', user.id)

    if (updateError) {
      logger.error('[sync-profile] update failed', { updateError })
      return internalError('Profile update failed')
    }

    return ok({ ok: true })
  } catch (error) {
    logger.error('[sync-profile] fatal', { error })
    return internalError('Erreur interne profil')
  }
}

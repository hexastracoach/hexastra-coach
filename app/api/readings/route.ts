import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { logger } from '@/lib/utils/logger'
import { badRequest, internalError, ok, unauthorized } from '@/lib/utils/apiResponse'

export async function DELETE() {
  try {
    const supabase = createSupabaseServer()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return unauthorized()

    const { error: deleteError } = await supabase.from('readings').delete().eq('user_id', user.id)

    if (deleteError) {
      logger.error('[readings][delete] failed', { userId: user.id, error: deleteError })
      return internalError('Impossible de supprimer les lectures pour le moment.')
    }

    return ok({ cleared: true })
  } catch (err) {
    logger.error('[readings][delete] fatal', { err })
    return badRequest('Requête invalide')
  }
}

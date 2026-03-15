import { NextResponse } from 'next/server'
import { logger } from './logger'

export function handleApiError(error: unknown, message = 'Erreur interne', status = 500) {
  logger.error(message, { error })
  return NextResponse.json({ error: message }, { status })
}

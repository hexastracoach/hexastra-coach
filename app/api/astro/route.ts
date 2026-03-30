import { NextRequest } from 'next/server'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, internalError, ok } from '@/lib/utils/apiResponse'
import { logger } from '@/lib/utils/logger'
import {
  DEFAULT_HEXASTRA_API_BASE_URL,
  normalizeApiBaseUrl,
} from '@/lib/hexastra/api/normalizeApiBaseUrl'

export const runtime = 'nodejs'

const NORMALIZED_API_BASE = normalizeApiBaseUrl(process.env.HEXASTRA_API_URL, {
  fallback: DEFAULT_HEXASTRA_API_BASE_URL,
})
const API_URL = NORMALIZED_API_BASE.url

if (
  NORMALIZED_API_BASE.input &&
  (NORMALIZED_API_BASE.warning === 'missing_protocol' ||
    NORMALIZED_API_BASE.warning === 'invalid_url')
) {
  logger.warn('[astro] HEXASTRA_API_URL normalized', {
    rawValue: NORMALIZED_API_BASE.input,
    normalizedUrl: NORMALIZED_API_BASE.url,
    warning: NORMALIZED_API_BASE.warning,
    usedFallback: NORMALIZED_API_BASE.usedFallback,
  })
}

export async function POST(req: NextRequest) {
  validateEnv({
    HEXASTRA_API_URL: {},
    HEXASTRA_API_KEY: {},
  })

  const apiKey = process.env.HEXASTRA_API_KEY!

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return badRequest('Corps invalide')
  }

  try {
    const response = await fetch(`${API_URL}/astro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      logger.error('[astro] backend error', { status: response.status, err })
      return internalError('Service temporairement indisponible')
    }

    const data = await response.json()
    return ok(data)
  } catch (e) {
    logger.error('Astro proxy error', { error: e })
    return internalError('Erreur serveur')
  }
}

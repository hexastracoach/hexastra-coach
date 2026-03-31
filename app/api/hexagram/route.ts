import { NextRequest } from 'next/server'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, internalError, ok } from '@/lib/utils/apiResponse'
import { logger } from '@/lib/utils/logger'
import {
  DEFAULT_HEXASTRA_API_BASE_URL,
  normalizeApiBaseUrl,
} from '@/lib/hexastra/api/normalizeApiBaseUrl'
import { buildHexastraApiJsonPostRequest } from '@/lib/hexastra/api/buildHexastraApiJsonPostRequest'

export const runtime = 'nodejs'

const NORMALIZED_API_BASE = normalizeApiBaseUrl(process.env.HEXASTRA_API_URL, {
  fallback: DEFAULT_HEXASTRA_API_BASE_URL,
})
const API_URL = NORMALIZED_API_BASE.url

if (NORMALIZED_API_BASE.warning === 'railway_http_upgraded_to_https') {
  logger.warn('api_url_upgraded_to_https_for_railway', {
    scope: 'hexagram',
    rawValue: NORMALIZED_API_BASE.input,
    normalizedUrl: NORMALIZED_API_BASE.url,
  })
} else if (
  NORMALIZED_API_BASE.input &&
  (NORMALIZED_API_BASE.warning === 'missing_protocol' ||
    NORMALIZED_API_BASE.warning === 'invalid_url')
) {
  logger.warn('[hexagram] HEXASTRA_API_URL normalized', {
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
    const url = `${API_URL}/hexagram`
    const request = buildHexastraApiJsonPostRequest(payload, apiKey)
    const response = await fetch(url, {
      ...request.init,
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      logger.error('[hexagram] backend error', {
        url,
        method: request.debug.method,
        status: response.status,
        statusText: response.statusText,
        allow: response.headers.get('allow'),
        hasBody: request.debug.hasBody,
        bodyBytes: request.debug.bodyBytes,
        err,
      })
      return internalError('Service temporairement indisponible')
    }

    const data = await response.json()
    return ok(data)
  } catch (e) {
    logger.error('Hexagram proxy error', { error: e })
    return internalError('Erreur serveur')
  }
}

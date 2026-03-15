import { NextRequest } from 'next/server'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, internalError, ok } from '@/lib/utils/apiResponse'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

const API_URL = (process.env.HEXASTRA_API_URL || 'https://hexastra-api-production.up.railway.app').replace(/\/$/, '')

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
    const response = await fetch(`${API_URL}/chart/fusion`, {
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
      logger.error('[fusion] backend error', { status: response.status, err })
      return internalError('Service temporairement indisponible')
    }

    const data = await response.json()
    return ok(data)
  } catch (e) {
    logger.error('Fusion proxy error', { error: e })
    return internalError('Erreur serveur')
  }
}

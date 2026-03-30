import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildHexastraApiJsonPostRequest } from '@/lib/hexastra/api/buildHexastraApiJsonPostRequest'

describe('buildHexastraApiJsonPostRequest', () => {
  it('always builds a POST json request with a serialized body', () => {
    const payload = { birthDateISO: '1990-01-01T00:00:00Z', lat: 48.8566, lon: 2.3522 }
    const request = buildHexastraApiJsonPostRequest(payload, 'secret-key')

    expect(request.init.method).toBe('POST')
    expect(request.init.body).toBe(JSON.stringify(payload))
    expect(request.init.headers).toEqual({
      'Content-Type': 'application/json',
      'x-api-key': 'secret-key',
    })
    expect(request.debug).toEqual({
      method: 'POST',
      hasBody: true,
      bodyBytes: JSON.stringify(payload).length,
      hasApiKey: true,
    })
  })
})

async function invokeProxyRoute(
  loadRouteModule: () => Promise<{ POST: (req: Request) => Promise<Response> }>,
  urlPath: string,
  payload: Record<string, unknown>,
) {
  vi.resetModules()
  process.env.HEXASTRA_API_URL = 'hexastra-api-production.up.railway.app/'
  process.env.HEXASTRA_API_KEY = 'test-api-key'

  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)

  const routeModule = await loadRouteModule()
  const { NextRequest } = await import('next/server')
  const req = new NextRequest(`http://localhost${urlPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const response = await routeModule.POST(req)
  return { fetchMock, response }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  delete process.env.HEXASTRA_API_URL
  delete process.env.HEXASTRA_API_KEY
})

describe('app/api/fusion proxy', () => {
  it('relays /chart/fusion with POST and a JSON body', async () => {
    const payload = {
      birthDateISO: '1990-01-01T12:00:00Z',
      lat: 48.8566,
      lon: 2.3522,
      question: 'que se passe-t-il pour moi ?',
    }

    const { fetchMock, response } = await invokeProxyRoute(
      () => import('@/app/api/fusion/route'),
      '/api/fusion',
      payload,
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://hexastra-api-production.up.railway.app/chart/fusion')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify(payload))
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'x-api-key': 'test-api-key',
    })
    expect(response.status).toBe(200)
  })
})

describe('specialized proxies remain on the same POST json contract', () => {
  it('keeps the astro proxy on POST with JSON body', async () => {
    const payload = {
      birthDateISO: '1990-01-01T12:00:00Z',
      lat: 48.8566,
      lon: 2.3522,
    }

    const { fetchMock, response } = await invokeProxyRoute(
      () => import('@/app/api/astro/route'),
      '/api/astro',
      payload,
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://hexastra-api-production.up.railway.app/astro')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify(payload))
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'x-api-key': 'test-api-key',
    })
    expect(response.status).toBe(200)
  })
})

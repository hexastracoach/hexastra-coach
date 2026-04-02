import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { retrieveKnowledge } from '@/lib/vectorSearch'

describe('retrieveKnowledge', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('uses ranking_options instead of the legacy reranking field', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            file_id: 'file_1',
            filename: 'ks-doc.txt',
            score: 0.92,
            content: [
              {
                type: 'text',
                text: 'Contenu de retrieval suffisamment long pour passer le filtre final de longueur.',
              },
            ],
          },
        ],
      }),
    }))

    global.fetch = fetchMock as typeof global.fetch

    await retrieveKnowledge({
      query: 'comment avancer cette annee ? | exact data hints: annual_cycle, strategic_priority',
      plan: 'premium',
      vectorStoreId: 'vs_test',
      apiKey: 'sk_test',
      domainRoute: 'fusion',
    })

    const [, request] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((request as RequestInit).body))

    expect(body.ranking_options).toEqual({ ranker: 'auto' })
    expect(body.rewrite_query).toBe(true)
    expect(body.reranking).toBeUndefined()
  })

  it('logs a non-blocking annual skip instead of a noisy 400 warning', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'bad request' } }),
    }))
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    global.fetch = fetchMock as typeof global.fetch

    const results = await retrieveKnowledge({
      query: 'comment avancer cette annee ? | exact data hints: annual_cycle, strategic_priority, include_solar_return',
      plan: 'premium',
      vectorStoreId: 'vs_test',
      apiKey: 'sk_test',
      domainRoute: 'fusion',
    })

    expect(results).toEqual([])
    expect(infoSpy).toHaveBeenCalledWith(
      '[vectorSearch] VECTOR_DISABLED_FOR_ANNUAL_GUIDANCE',
      expect.objectContaining({
        status: 400,
        domainRoute: 'fusion',
      }),
    )
  })
})

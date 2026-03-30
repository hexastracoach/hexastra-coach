import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/vectorSearch', () => ({
  retrieveKnowledge: vi.fn(async ({ query }: { query: string }) => {
    const normalizedQuery = String(query)

    if (normalizedQuery.includes('science focus: human_design')) {
      return [
        {
          fileId: 'hd-focus',
          filename: 'Vivre de son desgin Humain.pdf',
          score: 0.72,
          text: 'Autorite et strategie en Human Design, avec application concrete a la decision.',
        },
      ]
    }

    if (normalizedQuery.includes('knowledge block: ks fusion v13')) {
      return [
        {
          fileId: 'fusion',
          filename: 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
          score: 0.68,
          text: 'Prompt maitre KS Fusion V13 et synthese transversale pour arbitrage.',
        },
      ]
    }

    return [
      {
        fileId: 'base',
        filename: 'PROMPT_PORTEUM.txt',
        score: 0.7,
        text: 'Prompt de lecture Human Design general, centres, strategie et type.',
      },
    ]
  }),
}))

import { retrieveKnowledge } from '@/lib/vectorSearch'
import {
  multiLayerRetrieval,
  multiLayerRetrievalWithPlan,
} from '@/lib/hexastra/retrieval/multiLayerRetrieval'

const mockedRetrieveKnowledge = vi.mocked(retrieveKnowledge)

describe('multiLayerRetrieval', () => {
  beforeEach(() => {
    mockedRetrieveKnowledge.mockClear()
  })

  it('returns a structured retrieval plan while keeping focus-aware retrieval calls', async () => {
    const result = await multiLayerRetrievalWithPlan({
      query: 'mon type hd',
      plan: 'premium',
      vectorStoreId: 'vs_test',
      apiKey: 'sk_test',
      domainRoute: 'science',
      intent: 'identity',
    })

    expect(result.retrievalPlan.subCategories).toContain('hd_type')
    expect(result.retrievalPlan.sciences).toContain('human_design')
    expect(result.results[0]?.scienceTag).toBe('human_design')
    expect(
      mockedRetrieveKnowledge.mock.calls.some(([args]) =>
        String(args.query).includes('science focus: human_design'),
      ),
    ).toBe(true)
    expect(
      mockedRetrieveKnowledge.mock.calls.some(([args]) => typeof args.topKOverride === 'number'),
    ).toBe(true)
    expect(
      mockedRetrieveKnowledge.mock.calls.some(
        ([args]) =>
          Array.isArray(args.providerFilters?.vectorNamespaces) &&
          args.providerFilters.vectorNamespaces.length > 0,
      ),
    ).toBe(true)
  })

  it('keeps the legacy array return shape for existing callers', async () => {
    const results = await multiLayerRetrieval({
      query: 'que dois-je faire maintenant',
      plan: 'essential',
      vectorStoreId: 'vs_test',
      apiKey: 'sk_test',
      domainRoute: 'decision',
      intent: 'decision',
    })

    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toMatchObject({
      source: expect.any(String),
      text: expect.any(String),
      score: expect.any(Number),
    })
  })
})

import { describe, expect, it } from 'vitest'
import { buildRetrievalPlanFromQuery, type RetrievalPlan } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildExactDataRequestFromRetrievalPlan } from '@/lib/hexastra/retrieval/exactDataHintMapper'

function makePlan(overrides?: Partial<RetrievalPlan>): RetrievalPlan {
  return {
    sciences: ['kua'],
    subCategories: ['kua_profile'],
    vectorNamespaces: ['kua'],
    scienceTags: ['kua'],
    exactDataHints: [],
    weightedMatches: [
      { subCategory: 'kua_profile', science: 'kua', score: 6.4, retrievalPriority: 78 },
    ],
    preferredTopK: 5,
    fallbackUsed: false,
    dominantScience: 'kua',
    dominantSubCategory: 'kua_profile',
    ambiguities: [],
    ...overrides,
  }
}

describe('buildExactDataRequestFromRetrievalPlan', () => {
  it('includes Kua directions for "mon nombre kua"', () => {
    const request = buildExactDataRequestFromRetrievalPlan(
      buildRetrievalPlanFromQuery('mon nombre kua'),
    )

    expect(request.includeKuaDirections).toBe(true)
  })

  it('keeps Kua profile and favorable directions connected to includeKuaDirections', () => {
    const profileRequest = buildExactDataRequestFromRetrievalPlan(makePlan())
    const directionRequest = buildExactDataRequestFromRetrievalPlan(
      buildRetrievalPlanFromQuery('mes directions favorables'),
    )

    expect(profileRequest.includeKuaDirections).toBe(true)
    expect(directionRequest.includeKuaDirections).toBe(true)
  })
})

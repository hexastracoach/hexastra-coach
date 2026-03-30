/**
 * Vector Search - adaptive retrieval from OpenAI Vector Store.
 *
 * Strategy:
 * - retrieval is guided by plan + routed domain, not a static top_k ceiling
 * - specialized routes enrich the query so the search surfaces the right KS corpus
 * - results remain bounded by context budgets to avoid noisy prompt stuffing
 * - provider-side metadata filters stay optional and fail open
 */

import { getAdaptiveRetrievalConfig, normalizePlanKey, type PlanKey } from './retrievalPolicy'
import type { DomainRoute } from '@/lib/hexastra/types'

export type SearchResult = {
  fileId: string
  filename: string
  score: number
  text: string
}

export type RetrievalProviderFilters = {
  vectorNamespaces?: string[]
  scienceTags?: string[]
}

type ApiContentBlock = {
  type: string
  text?: string
}

type ApiSearchResult = {
  file_id: string
  filename: string
  score: number
  content: ApiContentBlock[]
}

type ApiSearchResponse = {
  data: ApiSearchResult[]
  object?: string
}

type OpenAiMetadataFilter =
  | {
      type: 'eq'
      key: string
      value: string
    }
  | {
      type: 'and' | 'or'
      filters: OpenAiMetadataFilter[]
    }

function extractText(content: ApiContentBlock[]): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('\n')
    .trim()
}

function buildDomainBiasedQuery(query: string, domainRoute?: DomainRoute): string {
  const trimmed = query.trim().slice(0, 1200)
  const bias =
    domainRoute === 'gps_kua'
      ? 'KS HexAstra GPS Kua orientation direction NeuroKua equilibre energetique boussole'
      : domainRoute === 'neurokua'
        ? 'KS NeuroKua equilibre rythme fatigue surcharge recuperation clarte stabilisation'
        : domainRoute === 'fusion'
          ? 'KS FUSION V13 orchestrateur executable signal envelope fusion engine arbiter sentinel'
          : domainRoute === 'relationship'
            ? 'relations amour dynamique relationnelle levier'
            : domainRoute === 'career'
              ? 'travail argent professionnel positionnement strategie'
              : domainRoute === 'decision'
                ? 'decision timing levier risque arbitrage'
                : domainRoute === 'timing'
                  ? 'timing cycle phase transition stabilisation expansion'
                  : domainRoute === 'science'
                    ? 'science module sous-module analyse specialisee'
                    : 'HexAstra KS guidance strategique'

  return `${trimmed}\n\nPriorite documentaire: ${bias}`
}

function uniq(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

function buildEqualityFilter(
  key: string,
  values: string[],
): OpenAiMetadataFilter | null {
  if (values.length === 0) {
    return null
  }

  if (values.length === 1) {
    return {
      type: 'eq',
      key,
      value: values[0],
    }
  }

  return {
    type: 'or',
    filters: values.map((value) => ({
      type: 'eq',
      key,
      value,
    })),
  }
}

function buildProviderMetadataFilter(
  providerFilters?: RetrievalProviderFilters,
): OpenAiMetadataFilter | null {
  const filterMode = (
    process.env.OPENAI_VECTOR_SEARCH_FILTER_MODE ??
    process.env.OPENAI_VECTOR_STORE_FILTER_MODE ??
    'disabled'
  )
    .trim()
    .toLowerCase()

  if (filterMode !== 'openai_metadata' || !providerFilters) {
    return null
  }

  const namespaceKey =
    process.env.OPENAI_VECTOR_FILTER_NAMESPACE_KEY?.trim() || 'namespace'
  const scienceTagKey =
    process.env.OPENAI_VECTOR_FILTER_SCIENCE_TAG_KEY?.trim() || 'science_tag'

  const filters = [
    buildEqualityFilter(namespaceKey, uniq(providerFilters.vectorNamespaces).slice(0, 6)),
    buildEqualityFilter(scienceTagKey, uniq(providerFilters.scienceTags).slice(0, 6)),
  ].filter((filter): filter is OpenAiMetadataFilter => Boolean(filter))

  if (filters.length === 0) {
    return null
  }

  return filters.length === 1
    ? filters[0]
    : {
        type: 'and',
        filters,
      }
}

async function searchVectorStore(args: {
  vectorStoreId: string
  apiKey: string
  body: Record<string, unknown>
}) {
  return fetch(`https://api.openai.com/v1/vector_stores/${args.vectorStoreId}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify(args.body),
    signal: AbortSignal.timeout(8000),
  })
}

export async function retrieveKnowledge({
  query,
  plan,
  vectorStoreId,
  apiKey,
  domainRoute,
  topKOverride,
  providerFilters,
}: {
  query: string
  plan: PlanKey | string
  vectorStoreId: string
  apiKey: string
  domainRoute?: DomainRoute
  topKOverride?: number
  providerFilters?: RetrievalProviderFilters
}): Promise<SearchResult[]> {
  if (!query.trim() || !vectorStoreId || !apiKey) return []

  const config = getAdaptiveRetrievalConfig({
    plan: normalizePlanKey(plan),
    domainRoute,
    query,
  })
  const topK =
    typeof topKOverride === 'number' ? Math.max(1, Math.round(topKOverride)) : config.topK

  try {
    const requestBody: Record<string, unknown> = {
      query: buildDomainBiasedQuery(query, domainRoute),
      max_num_results: topK,
      reranking: { ranker: 'auto' },
    }
    const providerMetadataFilter = buildProviderMetadataFilter(providerFilters)

    const res = await searchVectorStore({
      vectorStoreId,
      apiKey,
      body: providerMetadataFilter
        ? {
            ...requestBody,
            filters: providerMetadataFilter,
          }
        : requestBody,
    })

    const effectiveResponse =
      !res.ok && providerMetadataFilter
        ? await searchVectorStore({
            vectorStoreId,
            apiKey,
            body: requestBody,
          })
        : res

    if (!res.ok && providerMetadataFilter && effectiveResponse.ok) {
      console.warn(
        '[vectorSearch] provider metadata filters rejected, retried without filters',
      )
    }

    if (!effectiveResponse.ok) {
      console.warn(
        `[vectorSearch] API error ${effectiveResponse.status} - skipping retrieval`,
      )
      return []
    }

    const data: ApiSearchResponse = await effectiveResponse.json()
    if (!Array.isArray(data?.data)) return []

    return data.data
      .filter((result) => typeof result.score === 'number' && result.score >= config.scoreThreshold)
      .map((result) => ({
        fileId: result.file_id ?? '',
        filename: result.filename ?? '',
        score: result.score,
        text: extractText(result.content ?? []),
      }))
      .filter((result) => result.text.length > 40)
  } catch (err) {
    console.warn('[vectorSearch] retrieval failed - skipping:', err)
    return []
  }
}

/**
 * Vector Search — adaptive retrieval from OpenAI Vector Store.
 *
 * Strategy:
 * - retrieval is guided by plan + routed domain, not a static top_k ceiling
 * - specialized routes enrich the query so the search surfaces the right KS corpus
 * - results remain bounded by context budgets to avoid noisy prompt stuffing
 */

import { getAdaptiveRetrievalConfig, normalizePlanKey, type PlanKey } from './retrievalPolicy'
import type { DomainRoute } from '@/lib/hexastra/types'

export type SearchResult = {
  fileId: string
  filename: string
  score: number
  text: string
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

function extractText(content: ApiContentBlock[]): string {
  return content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim()
}

function buildDomainBiasedQuery(query: string, domainRoute?: DomainRoute): string {
  const trimmed = query.trim().slice(0, 1200)
  const bias =
    domainRoute === 'gps_kua'
      ? 'KS HexAstra GPS Kua orientation direction NeuroKua équilibre énergétique boussole'
      : domainRoute === 'neurokua'
      ? 'KS NeuroKua équilibre rythme fatigue surcharge récupération clarté stabilisation'
      : domainRoute === 'fusion'
      ? 'KS FUSION V13 orchestrateur exécutable signal envelope fusion engine arbiter sentinel'
      : domainRoute === 'relationship'
      ? 'relations amour dynamique relationnelle levier'
      : domainRoute === 'career'
      ? 'travail argent professionnel positionnement stratégie'
      : domainRoute === 'decision'
      ? 'décision timing levier risque arbitrage'
      : domainRoute === 'timing'
      ? 'timing cycle phase transition stabilisation expansion'
      : domainRoute === 'science'
      ? 'science module sous-module analyse spécialisée'
      : 'HexAstra KS guidance stratégique'

  return `${trimmed}\n\nPriorité documentaire: ${bias}`
}

export async function retrieveKnowledge({
  query,
  plan,
  vectorStoreId,
  apiKey,
  domainRoute,
  topKOverride,
}: {
  query: string
  plan: PlanKey | string
  vectorStoreId: string
  apiKey: string
  domainRoute?: DomainRoute
  topKOverride?: number
}): Promise<SearchResult[]> {
  if (!query.trim() || !vectorStoreId || !apiKey) return []

  const config = getAdaptiveRetrievalConfig({
    plan: normalizePlanKey(plan),
    domainRoute,
    query,
  })
  const topK = typeof topKOverride === 'number' ? Math.max(1, Math.round(topKOverride)) : config.topK

  try {
    const res = await fetch(
      `https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          query: buildDomainBiasedQuery(query, domainRoute),
          max_num_results: topK,
          reranking: { ranker: 'auto' },
        }),
        signal: AbortSignal.timeout(8000),
      },
    )

    if (!res.ok) {
      console.warn(`[vectorSearch] API error ${res.status} — skipping retrieval`)
      return []
    }

    const data: ApiSearchResponse = await res.json()
    if (!Array.isArray(data?.data)) return []

    return data.data
      .filter((r) => typeof r.score === 'number' && r.score >= config.scoreThreshold)
      .map((r) => ({
        fileId: r.file_id ?? '',
        filename: r.filename ?? '',
        score: r.score,
        text: extractText(r.content ?? []),
      }))
      .filter((r) => r.text.length > 40)
  } catch (err) {
    console.warn('[vectorSearch] retrieval failed — skipping:', err)
    return []
  }
}

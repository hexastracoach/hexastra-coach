import { retrieveKnowledge } from '@/lib/vectorSearch'
import type { DomainRoute } from '@/lib/hexastra/types'

export type LayerResult = {
  source: string
  fileId?: string
  filename?: string
  text: string
  score: number
}

function pushLayer(
  target: LayerResult[],
  source: string,
  items: Awaited<ReturnType<typeof retrieveKnowledge>>,
  scoreBoost = 0,
) {
  target.push(
    ...items.map((item) => ({
      source,
      fileId: item.fileId,
      filename: item.filename,
      text: item.text,
      score: item.score + scoreBoost,
    })),
  )
}

function dedupeResults(results: LayerResult[]) {
  const seen = new Set<string>()
  return results.filter((result) => {
    const key = `${result.fileId ?? ''}::${result.filename ?? ''}::${result.text.slice(0, 120)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function multiLayerRetrieval({
  query,
  plan,
  vectorStoreId,
  apiKey,
  domainRoute,
}: {
  query: string
  plan: string
  vectorStoreId: string
  apiKey: string
  domainRoute?: DomainRoute
}) {
  const normalizedQuery = query.trim() || 'lecture HexAstra'
  const layers: LayerResult[] = []

  const knowledge = await retrieveKnowledge({
    query: normalizedQuery,
    plan,
    vectorStoreId,
    apiKey,
    domainRoute,
  })
  pushLayer(layers, 'knowledge', knowledge, 0)

  if (domainRoute) {
    const domain = await retrieveKnowledge({
      query: `${normalizedQuery} ${domainRoute}`,
      plan,
      vectorStoreId,
      apiKey,
      domainRoute,
    })
    pushLayer(layers, 'domain', domain, 0.06)
  }

  const fusionQuery =
    domainRoute && domainRoute !== 'general'
      ? `${normalizedQuery} KS Fusion V13 ${domainRoute}`
      : `${normalizedQuery} KS Fusion V13`

  const fusion = await retrieveKnowledge({
    query: fusionQuery,
    plan,
    vectorStoreId,
    apiKey,
    domainRoute: 'fusion',
  })
  pushLayer(layers, 'ks_fusion', fusion, 0.04)

  const capped =
    plan === 'free'
      ? 6
      : plan === 'essential'
        ? 8
        : plan === 'premium'
          ? 10
          : 12

  return dedupeResults(layers)
    .sort((a, b) => b.score - a.score)
    .slice(0, capped)
}

import { retrieveKnowledge } from "@/lib/vectorSearch"
import type { DomainRoute } from '@/lib/hexastra/types'

export type LayerResult = {
  source: string
  fileId?: string
  filename?: string
  text: string
  score: number
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

  const isFree = plan === 'free'
  const isEssential = plan === 'essential'

  const layers: LayerResult[] = []

  // Layer 1 — Knowledge principal
  const knowledge = await retrieveKnowledge({
    query,
    plan,
    vectorStoreId,
    apiKey,
    domainRoute
  })

  layers.push(
    ...knowledge.map(k => ({
      source: "knowledge",
      fileId: k.fileId,
      filename: k.filename,
      text: k.text,
      score: k.score
    }))
  )

  // Layer 2 — KS Fusion (réservé premium/praticien ou requête explicite)
  if (
    !isFree &&
    (plan === 'premium' || plan === 'practitioner' || query.toLowerCase().includes("ks") || query.toLowerCase().includes("fusion"))
  ) {

    const fusion = await retrieveKnowledge({
      query: `${query} KS Fusion V13 système`,
      plan,
      vectorStoreId,
      apiKey,
      domainRoute: "fusion"
    })

    layers.push(
      ...fusion.map(k => ({
        source: "ks_fusion",
        fileId: k.fileId,
        filename: k.filename,
        text: k.text,
        score: k.score + 0.1
      }))
    )
  }

  // Layer 3 — Domaine spécialisé (pas pour free)
  if (domainRoute && !isFree) {

    const domain = await retrieveKnowledge({
      query,
      plan,
      vectorStoreId,
      apiKey,
      domainRoute
    })

    layers.push(
      ...domain.map(k => ({
        source: "domain",
        fileId: k.fileId,
        filename: k.filename,
        text: k.text,
        score: k.score + 0.05
      }))
    )
  }

  const cap =
    isFree ? 6 :
    isEssential ? 8 :
    plan === 'premium' ? 10 : 12

  return layers
    .sort((a, b) => b.score - a.score)
    .slice(0, cap)
}

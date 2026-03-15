import { retrieveKnowledge } from "@/lib/vectorSearch"

type LayerResult = {
  source: string
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
  domainRoute?: string
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

import { retrieveKnowledge } from '@/lib/vectorSearch'
import type { DomainRoute } from '@/lib/hexastra/types'
import type { DocumentScienceTag } from '@/lib/hexastra/vector/documentRegistry'
import { lookupDocumentRegistry } from '@/lib/hexastra/vector/documentRegistry'
import { buildEnrichedRetrievalQuery } from '@/lib/hexastra/retrieval/scienceQueryBuilder'
import {
  buildRetrievalPlanFromQuery,
  buildRetrievalQueryHints,
  type RetrievalPlan,
} from './retrievalPlanBuilder'
import { resolveSubCategoryRetrievalConfig } from './subCategoryRetrievalMap'

export type LayerResult = {
  source: string
  fileId?: string
  filename?: string
  text: string
  score: number
  scienceTag?: DocumentScienceTag | null
  retrievalFocus?: string | null
}

export type MultiLayerRetrievalResult = {
  results: LayerResult[]
  retrievalPlan: RetrievalPlan
}

type FocusedScienceRetrieval = {
  science: string
  subCategories: string[]
  vectorNamespaces: string[]
  scienceTags: DocumentScienceTag[]
  exactDataHints: string[]
  score: number
  preferredTopK: number
  retrievalPriority: number
  allowFusionFallback: boolean
}

const DEFAULT_QUERY = 'lecture HexAstra'

const SCIENCE_TAG_TO_SCIENCE: Partial<Record<DocumentScienceTag, string>> = {
  astrolex: 'astro',
  human_design: 'human_design',
  numerologie: 'numerology',
  enneagramme: 'enneagram',
  kua: 'kua',
  global: 'fusion',
  transverse: 'fusion',
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, ' ')
    .replace(/[_/+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolvePlanCap(plan: string) {
  return plan === 'free'
    ? 6
    : plan === 'essential'
      ? 8
      : plan === 'premium'
        ? 10
        : 12
}

function buildBaseQuery(query: string, intent?: string) {
  const trimmedQuery = query.trim() || DEFAULT_QUERY
  return intent
    ? buildEnrichedRetrievalQuery({ baseQuery: trimmedQuery, intent })
    : trimmedQuery
}

function buildFocusedScienceRetrievals(
  retrievalPlan: RetrievalPlan,
  limit = 3,
): FocusedScienceRetrieval[] {
  const grouped = new Map<string, FocusedScienceRetrieval>()

  for (const match of retrievalPlan.weightedMatches) {
    const config = resolveSubCategoryRetrievalConfig(match.subCategory)
    const existing = grouped.get(match.science)

    if (!existing) {
      grouped.set(match.science, {
        science: match.science,
        subCategories: [match.subCategory],
        vectorNamespaces: [...(config.vectorNamespaces ?? [])],
        scienceTags: [...(config.scienceTags ?? [])],
        exactDataHints: [...(config.exactDataHints ?? [])],
        score: match.score,
        preferredTopK: config.preferredTopK ?? retrievalPlan.preferredTopK,
        retrievalPriority: config.retrievalPriority ?? 50,
        allowFusionFallback: config.allowFusionFallback ?? true,
      })
      continue
    }

    existing.subCategories = uniq([...existing.subCategories, match.subCategory])
    existing.vectorNamespaces = uniq([
      ...existing.vectorNamespaces,
      ...(config.vectorNamespaces ?? []),
    ])
    existing.scienceTags = uniq([...existing.scienceTags, ...(config.scienceTags ?? [])])
    existing.exactDataHints = uniq([
      ...existing.exactDataHints,
      ...(config.exactDataHints ?? []),
    ])
    existing.score = Math.max(existing.score, match.score)
    existing.preferredTopK = Math.max(existing.preferredTopK, config.preferredTopK ?? 5)
    existing.retrievalPriority = Math.max(
      existing.retrievalPriority,
      config.retrievalPriority ?? 50,
    )
    existing.allowFusionFallback =
      existing.allowFusionFallback || (config.allowFusionFallback ?? true)
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.retrievalPriority - a.retrievalPriority
    })
    .slice(0, limit)
}

function buildFocusedQuery(baseQuery: string, hints: string, focus: FocusedScienceRetrieval) {
  const focusSubCategories = focus.subCategories
    .slice(0, 4)
    .map((subCategory) => subCategory.replace(/_/g, ' '))
    .join(', ')
  const namespaces = focus.vectorNamespaces.slice(0, 4).join(', ')
  const exactHints = focus.exactDataHints.slice(0, 4).join(', ')

  return [
    baseQuery,
    hints,
    `science focus: ${focus.science}`,
    `sub categories: ${focusSubCategories}`,
    namespaces ? `vector namespaces: ${namespaces}` : null,
    exactHints ? `exact data hints: ${exactHints}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
}

function buildFusionQuery(
  baseQuery: string,
  hints: string,
  domainRoute?: DomainRoute,
) {
  return [
    baseQuery,
    hints,
    'science focus: fusion',
    domainRoute && domainRoute !== 'general' ? `domain route: ${domainRoute}` : null,
    'knowledge block: ks fusion v13',
  ]
    .filter(Boolean)
    .join(' | ')
}

function computeFocusedTopK(args: {
  focusedRetrieval: FocusedScienceRetrieval
  retrievalPlan: RetrievalPlan
  planCap: number
  topScore: number
}) {
  const scoreFactor = clamp(args.focusedRetrieval.score / Math.max(args.topScore, 1), 0.55, 1.15)
  const candidate = Math.round(
    Math.max(
      args.focusedRetrieval.preferredTopK,
      args.retrievalPlan.preferredTopK * scoreFactor,
    ),
  )

  return clamp(candidate, 4, Math.max(args.planCap, 12))
}

function computeLayerBoost(source: string) {
  if (source.startsWith('science_focus:')) return 0.1
  if (source === 'domain') return 0.06
  if (source === 'ks_fusion') return 0.04
  return 0
}

function computePlanScoreBoost(args: {
  item: Awaited<ReturnType<typeof retrieveKnowledge>>[number]
  source: string
  retrievalPlan: RetrievalPlan
  focusScience?: string
}) {
  const registryEntry = lookupDocumentRegistry(args.item.filename)
  const haystack = normalize(
    [args.item.filename, registryEntry?.subscienceFocus, args.item.text.slice(0, 500)].join(' '),
  )

  let boost = computeLayerBoost(args.source)

  if (registryEntry) {
    if (args.retrievalPlan.scienceTags.includes(registryEntry.scienceTag)) {
      boost += 0.12
    }

    if (
      args.focusScience &&
      SCIENCE_TAG_TO_SCIENCE[registryEntry.scienceTag] === args.focusScience
    ) {
      boost += 0.12
    }

    if (
      args.source === 'ks_fusion' &&
      (registryEntry.scienceTag === 'global' || registryEntry.scienceTag === 'transverse')
    ) {
      boost += 0.05
    }
  }

  if (
    args.focusScience &&
    haystack.includes(args.focusScience.replace(/_/g, ' '))
  ) {
    boost += 0.04
  }

  for (const hint of args.retrievalPlan.exactDataHints.slice(0, 5)) {
    const normalizedHint = normalize(hint.replace(/_/g, ' '))
    if (normalizedHint && haystack.includes(normalizedHint)) {
      boost += 0.03
    }
  }

  return {
    boost: Number(boost.toFixed(3)),
    scienceTag: registryEntry?.scienceTag ?? null,
    retrievalFocus: registryEntry?.subscienceFocus ?? args.focusScience ?? null,
  }
}

function pushLayer(args: {
  target: LayerResult[]
  source: string
  items: Awaited<ReturnType<typeof retrieveKnowledge>>
  retrievalPlan: RetrievalPlan
  focusScience?: string
}) {
  args.target.push(
    ...args.items.map((item) => {
      const metadata = computePlanScoreBoost({
        item,
        source: args.source,
        retrievalPlan: args.retrievalPlan,
        focusScience: args.focusScience,
      })

      return {
        source: args.source,
        fileId: item.fileId,
        filename: item.filename,
        text: item.text,
        score: Number((item.score + metadata.boost).toFixed(3)),
        scienceTag: metadata.scienceTag,
        retrievalFocus: metadata.retrievalFocus,
      }
    }),
  )
}

function dedupeResults(results: LayerResult[]) {
  const byKey = new Map<string, LayerResult>()

  for (const result of results) {
    const key = `${result.fileId ?? ''}::${result.filename ?? ''}::${result.text.slice(0, 120)}`
    const existing = byKey.get(key)

    if (!existing || result.score > existing.score) {
      byKey.set(key, result)
    }
  }

  return [...byKey.values()]
}

export async function multiLayerRetrievalWithPlan({
  query,
  plan,
  vectorStoreId,
  apiKey,
  domainRoute,
  intent,
}: {
  query: string
  plan: string
  vectorStoreId: string
  apiKey: string
  domainRoute?: DomainRoute
  intent?: string
}): Promise<MultiLayerRetrievalResult> {
  const retrievalPlan = buildRetrievalPlanFromQuery(query)

  if (!vectorStoreId || !apiKey) {
    return {
      results: [],
      retrievalPlan,
    }
  }

  const baseQuery = buildBaseQuery(query, intent)
  const retrievalHints = buildRetrievalQueryHints(retrievalPlan)
  const focusedRetrievals = buildFocusedScienceRetrievals(retrievalPlan)
  const planCap = resolvePlanCap(plan)
  const topScore = retrievalPlan.weightedMatches[0]?.score ?? retrievalPlan.preferredTopK
  const baseTopK = Math.max(planCap, retrievalPlan.preferredTopK)
  const layers: LayerResult[] = []

  const retrievalTasks: Array<Promise<{ source: string; items: Awaited<ReturnType<typeof retrieveKnowledge>>; focusScience?: string }>> = [
    retrieveKnowledge({
      query: `${baseQuery} | ${retrievalHints}`,
      plan,
      vectorStoreId,
      apiKey,
      domainRoute,
      topKOverride: baseTopK,
    }).then((items) => ({ source: 'knowledge', items })),
  ]

  if (domainRoute) {
    retrievalTasks.push(
      retrieveKnowledge({
        query: `${baseQuery} | ${retrievalHints} | domain route: ${domainRoute}`,
        plan,
        vectorStoreId,
        apiKey,
        domainRoute,
        topKOverride: Math.max(planCap, retrievalPlan.preferredTopK - 1),
      }).then((items) => ({ source: 'domain', items })),
    )
  }

  for (const focusedRetrieval of focusedRetrievals) {
    retrievalTasks.push(
      retrieveKnowledge({
        query: buildFocusedQuery(baseQuery, retrievalHints, focusedRetrieval),
        plan,
        vectorStoreId,
        apiKey,
        domainRoute:
          focusedRetrieval.science === 'fusion' ? 'fusion' : domainRoute,
        topKOverride: computeFocusedTopK({
          focusedRetrieval,
          retrievalPlan,
          planCap,
          topScore,
        }),
      }).then((items) => ({
        source: `science_focus:${focusedRetrieval.science}`,
        items,
        focusScience: focusedRetrieval.science,
      })),
    )
  }

  const shouldQueryFusion =
    retrievalPlan.fallbackUsed ||
    focusedRetrievals.length === 0 ||
    focusedRetrievals.some((focusedRetrieval) => focusedRetrieval.allowFusionFallback)

  if (shouldQueryFusion) {
    retrievalTasks.push(
      retrieveKnowledge({
        query: buildFusionQuery(baseQuery, retrievalHints, domainRoute),
        plan,
        vectorStoreId,
        apiKey,
        domainRoute: 'fusion',
        topKOverride: Math.max(5, retrievalPlan.preferredTopK - 1),
      }).then((items) => ({ source: 'ks_fusion', items, focusScience: 'fusion' })),
    )
  }

  const retrievedLayers = await Promise.all(retrievalTasks)

  for (const retrievedLayer of retrievedLayers) {
    pushLayer({
      target: layers,
      source: retrievedLayer.source,
      items: retrievedLayer.items,
      retrievalPlan,
      focusScience: retrievedLayer.focusScience,
    })
  }

  return {
    results: dedupeResults(layers)
      .sort((a, b) => b.score - a.score)
      .slice(0, planCap),
    retrievalPlan,
  }
}

export async function multiLayerRetrieval(args: {
  query: string
  plan: string
  vectorStoreId: string
  apiKey: string
  domainRoute?: DomainRoute
  intent?: string
}) {
  const { results } = await multiLayerRetrievalWithPlan(args)
  return results
}

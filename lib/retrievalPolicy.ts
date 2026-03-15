import type { DomainRoute } from '@/lib/hexastra/types'

export type PlanKey = 'free' | 'essential' | 'premium' | 'practitioner'

export type RetrievalConfig = {
  /** Number of candidate documents to fetch from the vector store */
  topK: number
  /** Minimum relevance score [0-1] — lower = more permissive */
  scoreThreshold: number
  /** Max documents to keep after deduplication */
  maxDocsAfterDedup: number
  /** Max characters per individual document chunk */
  maxCharsPerDoc: number
  /** Max total characters for the entire injected knowledge block */
  maxContextChars: number
}

const BASE_CONFIGS: Record<PlanKey, RetrievalConfig> = {
  free: {
    topK: 4,
    scoreThreshold: 0.45,
    maxDocsAfterDedup: 3,
    maxCharsPerDoc: 900,
    maxContextChars: 3200,
  },
  essential: {
    topK: 8,
    scoreThreshold: 0.4,
    maxDocsAfterDedup: 5,
    maxCharsPerDoc: 1300,
    maxContextChars: 7000,
  },
  premium: {
    topK: 12,
    scoreThreshold: 0.35,
    maxDocsAfterDedup: 7,
    maxCharsPerDoc: 1600,
    maxContextChars: 11000,
  },
  practitioner: {
    topK: 16,
    scoreThreshold: 0.3,
    maxDocsAfterDedup: 9,
    maxCharsPerDoc: 2000,
    maxContextChars: 15000,
  },
}

const DOMAIN_MULTIPLIERS: Partial<Record<DomainRoute, { topK?: number; docs?: number; chars?: number }>> = {
  gps_kua: { topK: 8, docs: 2, chars: 5000 },
  neurokua: { topK: 6, docs: 2, chars: 3500 },
  fusion: { topK: 10, docs: 3, chars: 7000 },
  science: { topK: 6, docs: 2, chars: 3000 },
}

export function getRetrievalConfig(plan: PlanKey): RetrievalConfig {
  return BASE_CONFIGS[plan] ?? BASE_CONFIGS.free
}

export function getAdaptiveRetrievalConfig({
  plan,
  domainRoute,
  query,
}: {
  plan: PlanKey
  domainRoute?: DomainRoute
  query?: string
}): RetrievalConfig {
  const base = getRetrievalConfig(plan)
  const domain = domainRoute ? DOMAIN_MULTIPLIERS[domainRoute] : undefined
  const queryLength = (query ?? '').trim().length
  const complexityBoost = queryLength > 450 ? 4 : queryLength > 220 ? 2 : 0

  return {
    topK: Math.min(base.topK + (domain?.topK ?? 0) + complexityBoost, 20),
    scoreThreshold: base.scoreThreshold,
    maxDocsAfterDedup: Math.min(base.maxDocsAfterDedup + (domain?.docs ?? 0), 12),
    maxCharsPerDoc: Math.min(base.maxCharsPerDoc + Math.floor((domain?.chars ?? 0) / 4), 2600),
    maxContextChars: Math.min(base.maxContextChars + (domain?.chars ?? 0), 20000),
  }
}

/** Maps API plan strings (from route.ts body) to PlanKey */
export function normalizePlanKey(raw: string): PlanKey {
  if (raw === 'practitioner') return 'practitioner'
  if (raw === 'premium') return 'premium'
  if (raw === 'essential') return 'essential'
  return 'free'
}

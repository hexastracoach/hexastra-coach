import {
  buildScienceDetectionResult,
  type ScienceDetectionResult,
} from '@/lib/hexastra/engine/scienceQueryBuilder'
import { prepareQuery } from '@/lib/hexastra/taxonomy/scienceSynonyms'
import { SCIENCE_SUBCATEGORY_INDEX } from '@/lib/hexastra/taxonomy/scienceTaxonomy'
import {
  resolveSubCategoryRetrievalConfig,
  type SubCategoryRetrievalConfig,
} from './subCategoryRetrievalMap'

export type RetrievalPlan = {
  sciences: string[]
  subCategories: string[]
  vectorNamespaces: string[]
  scienceTags: string[]
  exactDataHints: string[]
  weightedMatches: Array<{
    subCategory: string
    science: string
    score: number
    retrievalPriority: number
  }>
  preferredTopK: number
  fallbackUsed: boolean
}

type WeightedEntry = RetrievalPlan['weightedMatches'][number] & {
  vectorNamespaces: string[]
  scienceTags: string[]
  exactDataHints: string[]
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function sortByWeight(items: Array<{ value: string; weight: number }>): string[] {
  const weightMap = new Map<string, number>()

  for (const item of items) {
    weightMap.set(item.value, Math.max(weightMap.get(item.value) ?? 0, item.weight))
  }

  return [...weightMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
}

function getExactKeywordBoost(subCategory: string, matchedTerms: string[]): number {
  const category = SCIENCE_SUBCATEGORY_INDEX[subCategory]
  if (!category || matchedTerms.length === 0) {
    return 0
  }

  const primaryKeywords = category.keywords
    .slice(0, 3)
    .map((keyword) => prepareQuery(keyword))

  if (matchedTerms.some((term) => primaryKeywords.includes(term))) {
    return 1
  }

  return matchedTerms.length > 1 ? 0.4 : 0
}

function getSyntheticScore(args: {
  topDirectScore: number
  position: number
  retrievalPriority: number
}): number {
  const base = Math.max(1.6, args.topDirectScore * 0.55 - args.position * 0.35)
  return Number((base + args.retrievalPriority / 220).toFixed(2))
}

function buildWeightedEntries(detection: ScienceDetectionResult): WeightedEntry[] {
  const directMatchBySubCategory = new Map(
    detection.matches.map((match) => [match.subCategory, match]),
  )
  const topDirectScore = detection.matches[0]?.score ?? 3

  return detection.subCategories
    .map((subCategory, position) => {
      const config = resolveSubCategoryRetrievalConfig(subCategory)
      const directMatch = directMatchBySubCategory.get(subCategory)
      const retrievalPriority = config.retrievalPriority ?? 50
      const score = directMatch
        ? directMatch.score + getExactKeywordBoost(subCategory, directMatch.matchedTerms) + retrievalPriority / 140
        : getSyntheticScore({ topDirectScore, position, retrievalPriority })

      return {
        subCategory,
        science: config.science,
        score: Number(score.toFixed(2)),
        retrievalPriority,
        vectorNamespaces: config.vectorNamespaces ?? [],
        scienceTags: (config.scienceTags ?? []) as string[],
        exactDataHints: config.exactDataHints ?? [],
      }
    })
    .sort((a, b) => b.score - a.score)
}

function computePreferredTopK(
  weightedEntries: WeightedEntry[],
  fallbackUsed: boolean,
): number {
  if (weightedEntries.length === 0) {
    return 5
  }

  const totalWeight = weightedEntries.reduce((sum, entry) => sum + entry.score, 0)
  const weightedAverage = weightedEntries.reduce((sum, entry) => {
    const config = resolveSubCategoryRetrievalConfig(entry.subCategory)
    const preferredTopK = config.preferredTopK ?? 5
    return sum + preferredTopK * entry.score
  }, 0) / totalWeight

  const diversityBonus = Math.min(2, uniq(weightedEntries.map((entry) => entry.science)).length - 1)
  const fallbackBonus = fallbackUsed ? 1 : 0

  return clamp(Math.round(weightedAverage + diversityBonus + fallbackBonus), 4, 12)
}

export function buildRetrievalPlanFromDetection(
  detection: ScienceDetectionResult,
): RetrievalPlan {
  const weightedEntries = buildWeightedEntries(detection)
  const fallbackUsed = detection.fallbackUsed || weightedEntries.length === 0

  const safeEntries =
    weightedEntries.length > 0
      ? weightedEntries
      : [
          {
            subCategory: 'fusion_general',
            science: 'fusion',
            score: 2.5,
            retrievalPriority: 60,
            vectorNamespaces: ['ks_fusion_globaux'],
            scienceTags: ['global', 'transverse'],
            exactDataHints: ['cross_science_synthesis'],
          },
        ]

  return {
    sciences: uniq(safeEntries.map((entry) => entry.science)),
    subCategories: uniq(safeEntries.map((entry) => entry.subCategory)),
    vectorNamespaces: sortByWeight(
      safeEntries.flatMap((entry) =>
        entry.vectorNamespaces.map((value) => ({ value, weight: entry.score })),
      ),
    ),
    scienceTags: sortByWeight(
      safeEntries.flatMap((entry) =>
        entry.scienceTags.map((value) => ({ value, weight: entry.score })),
      ),
    ),
    exactDataHints: sortByWeight(
      safeEntries.flatMap((entry) =>
        entry.exactDataHints.map((value) => ({ value, weight: entry.score })),
      ),
    ),
    weightedMatches: safeEntries.map((entry) => ({
      subCategory: entry.subCategory,
      science: entry.science,
      score: entry.score,
      retrievalPriority: entry.retrievalPriority,
    })),
    preferredTopK: computePreferredTopK(safeEntries, fallbackUsed),
    fallbackUsed,
  }
}

export function buildRetrievalPlanFromQuery(query: string): RetrievalPlan {
  return buildRetrievalPlanFromDetection(buildScienceDetectionResult(query))
}

export function buildRetrievalQueryHints(plan: RetrievalPlan): string {
  const focusMatches = plan.weightedMatches
    .slice(0, 4)
    .map((entry) => `${entry.science}:${entry.subCategory.replace(/_/g, ' ')}`)
    .join(' | ')

  const namespaceBlock = plan.vectorNamespaces.slice(0, 5).join(', ')
  const scienceTagBlock = plan.scienceTags.slice(0, 5).join(', ')
  const exactHintsBlock = plan.exactDataHints.slice(0, 5).join(', ')

  return [
    `sciences prioritaires: ${plan.sciences.join(', ')}`,
    `sous categories prioritaires: ${focusMatches}`,
    `namespaces cibles: ${namespaceBlock}`,
    `science tags cibles: ${scienceTagBlock}`,
    exactHintsBlock ? `exact data hints: ${exactHintsBlock}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
}

export function getTopWeightedConfigs(
  plan: RetrievalPlan,
  limit = 3,
): Array<SubCategoryRetrievalConfig & { score: number }> {
  return plan.weightedMatches.slice(0, limit).map((entry) => ({
    ...resolveSubCategoryRetrievalConfig(entry.subCategory),
    score: entry.score,
  }))
}

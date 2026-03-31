import type { UserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import type { ResponseMode } from '@/lib/hexastra/orchestration/responseModes'
import type { PrioritizedStructuredSignal } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import type { RetrievalPlan } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import type {
  StructuredSignal,
  StructuredSignalSourceType,
} from '@/lib/hexastra/retrieval/structuredSignalBuilder'

export type OpeningSignalSelection = {
  signal: StructuredSignal | null
  orderedSignals: StructuredSignal[]
  dominantOpeningSource: StructuredSignalSourceType
  dominantOpeningScience?: string | null
  dominantOpeningSubCategory?: string | null
  reasoningTags?: string[]
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSoftFusionSubCategory(subCategory: string): boolean {
  return /(annual_guidance|fusion_(general|timing|life_situation|blockage|energy_state|relationships|decision))/.test(
    subCategory,
  )
}

function isTimingStateSubCategory(subCategory: string): boolean {
  return /transits|current|timing|return|progression|cycle|period|energy|state/.test(subCategory)
}

function isAnnualPrioritySignal(subCategory: string): boolean {
  return /annual_guidance|annual|year|solar_return|lunar_return|progressions|transits|current_cycle|personal_year|kua_annual/.test(
    subCategory,
  )
}

function isExplicitScienceQuery(normalizedQuery: string): boolean {
  return /\b(astrologique|astrologie|human design|hd\b|enneagramme|ennea\b|kua\b|feng shui|numerologie|annee perso|chemin de vie)\b/.test(
    normalizedQuery,
  )
}

function isGlobalCurrentIntent(intent?: UserIntent | string | null): boolean {
  return /(fusion_general_question|inner_state|blocage|life_period|timing)/.test(
    (intent ?? '').toLowerCase(),
  )
}

function isGlobalCurrentQuery(normalizedQuery: string): boolean {
  return /que se passe-t-il|qu est-ce que je traverse|qu'est-ce que je traverse|bonne periode|bonne periode|en ce moment|periode actuelle|période actuelle|pourquoi je bloque/.test(
    normalizedQuery,
  )
}

function moveToFront(
  signals: StructuredSignal[],
  target: StructuredSignal | null,
): StructuredSignal[] {
  if (!target) return signals

  const index = signals.findIndex(
    (signal) =>
      signal.subCategory === target.subCategory &&
      signal.science === target.science &&
      signal.sourceType === target.sourceType,
  )

  if (index <= 0) {
    return signals
  }

  const clone = [...signals]
  const [picked] = clone.splice(index, 1)
  if (!picked) {
    return signals
  }

  clone.unshift(picked)
  return clone
}

function findFirst(
  signals: StructuredSignal[],
  predicate: (signal: StructuredSignal) => boolean,
): StructuredSignal | null {
  return signals.find(predicate) ?? null
}

function buildScoreMap(scoredSignals?: PrioritizedStructuredSignal[]): Map<string, number> {
  const map = new Map<string, number>()

  for (const signal of scoredSignals ?? []) {
    map.set(signal.subCategory, Math.max(map.get(signal.subCategory) ?? Number.NEGATIVE_INFINITY, signal.priorityScore))
  }

  return map
}

function getScore(
  scoreMap: Map<string, number>,
  signal: StructuredSignal | null,
  fallback: number,
): number {
  if (!signal) return fallback
  return scoreMap.get(signal.subCategory) ?? signal.score ?? fallback
}

export function selectOpeningSignal(args: {
  userMessage: string
  retrievalPlan: RetrievalPlan
  structuredSignals: StructuredSignal[]
  scoredSignals?: PrioritizedStructuredSignal[]
  responseMode: ResponseMode
  intent?: UserIntent | string | null
}): OpeningSignalSelection {
  const normalizedQuery = normalize(args.userMessage)
  const scoreMap = buildScoreMap(args.scoredSignals)
  const primarySignals = args.structuredSignals.slice(0, 6)
  const firstSignal = primarySignals[0] ?? null
  const dominantScience = args.retrievalPlan.dominantScience ?? null
  const ambiguityCount = args.retrievalPlan.ambiguities?.length ?? 0
  const explicitScienceQuery = isExplicitScienceQuery(normalizedQuery)
  const hasDominantExactLead =
    dominantScience !== null &&
    firstSignal?.science === dominantScience &&
    firstSignal?.sourceType === 'exact_data'
  const ambiguous =
    !dominantScience &&
    !explicitScienceQuery &&
    (ambiguityCount > 0 || args.retrievalPlan.sciences.length > 1)
  const monoScience =
    dominantScience !== null &&
    dominantScience !== 'fusion' &&
    (ambiguityCount === 0 || explicitScienceQuery || hasDominantExactLead)
  const globalCurrent =
    args.responseMode === 'concise_fusion_answer' &&
    !explicitScienceQuery &&
    (isGlobalCurrentIntent(args.intent) || isGlobalCurrentQuery(normalizedQuery))

  const exactSpecific = findFirst(
    primarySignals,
    (signal) => signal.sourceType === 'exact_data' && signal.science !== 'fusion',
  )
  const exactTiming = findFirst(
    primarySignals,
    (signal) =>
      signal.sourceType === 'exact_data' &&
      signal.science !== 'fusion' &&
      isTimingStateSubCategory(signal.subCategory),
  )
  const exactAnnual = findFirst(
    primarySignals,
    (signal) =>
      signal.sourceType === 'exact_data' &&
      isAnnualPrioritySignal(signal.subCategory),
  )
  const softFusion = findFirst(
    primarySignals,
    (signal) => signal.science === 'fusion' && isSoftFusionSubCategory(signal.subCategory),
  )
  const dominantScienceSignal = dominantScience
    ? findFirst(primarySignals, (signal) => signal.science === dominantScience)
    : null

  const baseSource = firstSignal?.sourceType ?? 'fusion'
  let chosenSignal: StructuredSignal | null = firstSignal
  const reasoningTags: string[] = []

  if (args.responseMode === 'yearly_priority_answer') {
    chosenSignal = exactAnnual ?? exactSpecific ?? softFusion ?? firstSignal
    reasoningTags.push(
      chosenSignal?.sourceType === 'exact_data'
        ? 'yearly_priority_exact_opening'
        : 'yearly_priority_fusion_opening',
    )
  } else if (ambiguous) {
    if (softFusion) {
      chosenSignal = softFusion
      reasoningTags.push('ambiguous_soft_fusion_opening')
    } else {
      chosenSignal = null
      reasoningTags.push('ambiguous_opening_deferred')
    }
  } else if (monoScience) {
    chosenSignal = exactSpecific ?? dominantScienceSignal ?? firstSignal
    reasoningTags.push('mono_science_specific_opening')
  } else if (globalCurrent) {
    if (softFusion && exactTiming) {
      const fusionScore = getScore(scoreMap, softFusion, 0)
      const exactScore = getScore(scoreMap, exactTiming, 0)

      if (
        exactScore >= fusionScore + 0.6 ||
        (firstSignal?.subCategory === exactTiming.subCategory && exactScore >= fusionScore - 0.1)
      ) {
        chosenSignal = exactTiming
        reasoningTags.push('global_current_exact_timing_opening')
      } else {
        chosenSignal = softFusion
        reasoningTags.push('global_current_fusion_opening')
      }
    } else {
      chosenSignal = softFusion ?? exactTiming ?? firstSignal
      reasoningTags.push(
        chosenSignal?.science === 'fusion'
          ? 'global_current_fusion_opening'
          : 'global_current_exact_timing_opening',
      )
    }
  } else if (
    args.responseMode === 'direct_answer' ||
    args.responseMode === 'calculated_reading'
  ) {
    chosenSignal = exactSpecific ?? dominantScienceSignal ?? firstSignal
    reasoningTags.push('exact_or_direct_opening')
  }

  return {
    signal: chosenSignal,
    orderedSignals: moveToFront(args.structuredSignals, chosenSignal),
    dominantOpeningSource: chosenSignal?.sourceType ?? baseSource,
    dominantOpeningScience: chosenSignal?.science ?? null,
    dominantOpeningSubCategory: chosenSignal?.subCategory ?? null,
    reasoningTags,
  }
}

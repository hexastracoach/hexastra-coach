import type { RetrievalPlan } from './retrievalPlanBuilder'
import type { StructuredSignal } from './structuredSignalBuilder'

export type PrioritizedStructuredSignal = StructuredSignal & {
  priorityScore: number
}

export type PrioritizedStructuredSignalsResult = {
  signals: StructuredSignal[]
  scoredSignals: PrioritizedStructuredSignal[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function inferIntentBoost(intent: string | null | undefined, subCategory: string): number {
  const normalizedIntent = (intent ?? '').toLowerCase()

  if (/timing|period|life_period|timing_decision/.test(normalizedIntent)) {
    return /transits|return|progression|cycle|timing/.test(subCategory) ? 0.95 : 0
  }

  if (/decision/.test(normalizedIntent)) {
    return /strategy|authority|decision|timing|direction/.test(subCategory) ? 0.9 : 0
  }

  if (/relationship|love/.test(normalizedIntent)) {
    return /synastry|compatibility|connection|relationship/.test(subCategory) ? 0.9 : 0
  }

  if (/identity|exact_profile|direct_knowledge_query/.test(normalizedIntent)) {
    return /type|profile|life_path|number|core/.test(subCategory) ? 0.8 : 0
  }

  if (/inner_state|blocage/.test(normalizedIntent)) {
    return /energy|transits|current|cycle/.test(subCategory) ? 0.65 : 0
  }

  return 0
}

function resolveSourceWeight(signal: StructuredSignal): number {
  switch (signal.sourceType) {
    case 'exact_data':
      return 2.6
    case 'retrieval':
      return 1.2
    case 'fusion':
      return 0.45
    default:
      return 0.35
  }
}

function isCurrentStateAxis(subCategory: string): boolean {
  return /energy|transits|current|cycle|timing|return|period|state/.test(subCategory)
}

function resolveGenericFusionRetrievalPenalty(args: {
  signal: StructuredSignal
  structuredSignals: StructuredSignal[]
  intent?: string | null
  dominantScience: string | null
}): number {
  const normalizedIntent = (args.intent ?? '').toLowerCase()

  if (args.signal.sourceType !== 'retrieval' || args.signal.science !== 'fusion') {
    return 0
  }

  if (!/fusion_(energy_state|timing|general)/.test(args.signal.subCategory)) {
    return 0
  }

  if (!/(inner_state|blocage|timing|life_period|fusion_general_question)/.test(normalizedIntent)) {
    return 0
  }

  const hasRelevantExactDataSignal = args.structuredSignals.some((candidate) => (
    candidate.sourceType === 'exact_data' &&
    candidate.science !== 'fusion' &&
    isCurrentStateAxis(candidate.subCategory)
  ))

  if (!hasRelevantExactDataSignal) {
    return 0
  }

  if (
    /fusion_general_question/.test(normalizedIntent) &&
    args.dominantScience === 'fusion' &&
    args.signal.subCategory === 'fusion_general'
  ) {
    return 0
  }

  if (args.signal.subCategory === 'fusion_energy_state') {
    return -1.35
  }

  if (args.signal.subCategory === 'fusion_timing') {
    return -0.8
  }

  return -0.55
}

function resolveWeakSignalPenalty(args: {
  signal: StructuredSignal
  topScore: number
  hasExactDataSignals: boolean
  dominantScience: string | null
}): number {
  let penalty = 0

  if ((args.signal.score ?? 0) < args.topScore - 2.5) {
    penalty -= 0.35
  }

  if (args.hasExactDataSignals && args.signal.sourceType === 'fusion') {
    penalty -= 0.4
  }

  if (
    args.hasExactDataSignals &&
    args.signal.sourceType === 'retrieval' &&
    args.dominantScience &&
    args.signal.science !== args.dominantScience
  ) {
    penalty -= 0.2
  }

  return penalty
}

export function prioritizeStructuredSignals(args: {
  structuredSignals: StructuredSignal[]
  retrievalPlan: RetrievalPlan
  intent?: string | null
}): PrioritizedStructuredSignalsResult {
  const weightedMatchBySubCategory = new Map(
    args.retrievalPlan.weightedMatches.map((match) => [match.subCategory, match]),
  )
  const topScore = args.retrievalPlan.weightedMatches[0]?.score ?? 0
  const hasExactDataSignals = args.structuredSignals.some((signal) => signal.sourceType === 'exact_data')
  const dominantScience = args.retrievalPlan.dominantScience ?? null
  const dominantSubCategory = args.retrievalPlan.dominantSubCategory ?? null

  const scoredSignals = args.structuredSignals.map((signal, index) => {
    const weightedMatch = weightedMatchBySubCategory.get(signal.subCategory)
    const weightedScore = signal.score ?? weightedMatch?.score ?? 0
    const retrievalPriority = weightedMatch?.retrievalPriority ?? 50
    const scienceBoost = dominantScience && signal.science === dominantScience ? 1.15 : 0
    const subCategoryBoost = dominantSubCategory && signal.subCategory === dominantSubCategory ? 1.85 : 0
    const exactSectionBoost = signal.exactDataSection ? 0.45 : 0
    const intentBoost = inferIntentBoost(args.intent, signal.subCategory)
    const weakSignalPenalty = resolveWeakSignalPenalty({
      signal,
      topScore,
      hasExactDataSignals,
      dominantScience,
    })
    const genericFusionRetrievalPenalty = resolveGenericFusionRetrievalPenalty({
      signal,
      structuredSignals: args.structuredSignals,
      intent: args.intent,
      dominantScience,
    })

    const priorityScore = Number(
      (
        weightedScore +
        retrievalPriority / 100 +
        resolveSourceWeight(signal) +
        scienceBoost +
        subCategoryBoost +
        exactSectionBoost +
        intentBoost +
        weakSignalPenalty +
        genericFusionRetrievalPenalty -
        index * 0.001
      ).toFixed(3),
    )

    return {
      ...signal,
      priorityScore: clamp(priorityScore, -5, 30),
    }
  })

  const ordered = [...scoredSignals]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map(({ priorityScore: _priorityScore, ...signal }) => signal)

  return {
    signals: ordered,
    scoredSignals,
  }
}

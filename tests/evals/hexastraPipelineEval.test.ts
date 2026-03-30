import { describe, expect, it, vi } from 'vitest'
import { buildScienceDetectionResult } from '@/lib/hexastra/engine/scienceQueryBuilder'
import { disambiguateDetectionResult } from '@/lib/hexastra/engine/disambiguateDetectionResult'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { isReliableExactData } from '@/lib/exact-data/reliability'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import type { ResponseMode } from '@/lib/hexastra/orchestration/responseModes'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildExactDataRequestFromRetrievalPlan } from '@/lib/hexastra/retrieval/exactDataHintMapper'
import {
  buildStructuredSignals,
  type StructuredSignal,
} from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { prioritizeStructuredSignals } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import {
  HEXASTRA_PIPELINE_EVAL_CASES,
  type HexastraPipelineEvalCase,
} from './hexastraPipelineEvalCases'

type EvalStatus = 'pass' | 'acceptable' | 'weak'

type EvalResult = {
  evalCase: HexastraPipelineEvalCase
  status: EvalStatus
  hardIssues: string[]
  softIssues: string[]
  falseDominant: string | null
  parasiteSignals: string[]
  detection: ReturnType<typeof buildScienceDetectionResult>
  disambiguation: ReturnType<typeof disambiguateDetectionResult>
  classification: ReturnType<typeof classifyMessage>
  userIntent: ReturnType<typeof classifyUserIntent>
  retrievalPlan: ReturnType<typeof buildRetrievalPlanFromQuery>
  exactDataRequest: ReturnType<typeof buildExactDataRequestFromRetrievalPlan>
  responseMode: ResponseMode
  dominantOpeningSource: 'fusion' | 'exact_data' | 'retrieval'
  dominantOpeningScience: string | null
  dominantOpeningSubCategory: string | null
  responseReasoningTags: string[]
  fallbackUsed: boolean
  topSignals: Array<{
    science: string
    subCategory: string
    sourceType: string
    priorityScore: number
  }>
}

const TOP_SIGNAL_WINDOW = 4

function asRawRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function includesAll(values: string[], expected: string[] | undefined): string[] {
  if (!expected?.length) return []
  return expected.filter((item) => !values.includes(item))
}

function includesNone(values: string[], expected: string[] | undefined): boolean {
  if (!expected?.length) return false
  return expected.every((item) => !values.includes(item))
}

function signalKey(signal: { science: string; subCategory: string; sourceType?: string | null }) {
  return `${signal.science}:${signal.subCategory}[${signal.sourceType ?? 'fusion'}]`
}

function sortScoredSignals(
  signals: ReturnType<typeof prioritizeStructuredSignals>['scoredSignals'],
) {
  return [...signals].sort((a, b) => b.priorityScore - a.priorityScore)
}

function findTopRelevantIndex(
  signals: StructuredSignal[],
  evalCase: HexastraPipelineEvalCase,
): number {
  const targetSubCategories = new Set([
    ...(evalCase.expectation.topSignalSubCategories ?? []),
    ...(evalCase.expectation.requiredSubCategories ?? []),
    ...(evalCase.expectation.oneOfSubCategories ?? []),
  ])
  const targetSciences = new Set([
    ...(evalCase.expectation.topSignalSciences ?? []),
    ...(evalCase.expectation.requiredSciences ?? []),
    ...(evalCase.expectation.oneOfSciences ?? []),
  ])

  if (targetSubCategories.size === 0 && targetSciences.size === 0) {
    return 0
  }

  return signals.findIndex((signal) =>
    targetSubCategories.has(signal.subCategory) || targetSciences.has(signal.science),
  )
}

function evaluateCase(evalCase: HexastraPipelineEvalCase): EvalResult {
  const classification = classifyMessage(evalCase.query)
  const userIntent = classifyUserIntent(evalCase.query)
  const detection = buildScienceDetectionResult(evalCase.query)
  const disambiguationContext = {
    hasBirthData: evalCase.hasBirthData ?? true,
    domainRoute: classification.domainRoute,
    selectedSubCategory: classification.subcategory,
    flowType: classification.intent,
  }
  const disambiguation = disambiguateDetectionResult(detection, disambiguationContext)
  const retrievalPlan = buildRetrievalPlanFromQuery(evalCase.query, disambiguationContext)
  const exactDataRequest = buildExactDataRequestFromRetrievalPlan(retrievalPlan)
  const normalizedExactData = normalizeFusionExactDataWithDiagnostics(evalCase.rawExactData ?? null)
  const structuredSignals = buildStructuredSignals({
    retrievalPlan,
    retrievalResults: evalCase.retrievalResults,
    exactData: evalCase.rawExactData ?? null,
    normalizedExactData: normalizedExactData.exactData,
    exactDataDiagnostics: normalizedExactData.diagnostics,
  })
  const prioritized = prioritizeStructuredSignals({
    structuredSignals,
    retrievalPlan,
    intent: userIntent,
  })
  const orderedScoredSignals = sortScoredSignals(prioritized.scoredSignals)
  const topSignals = orderedScoredSignals.slice(0, TOP_SIGNAL_WINDOW).map((signal) => ({
    science: signal.science,
    subCategory: signal.subCategory,
    sourceType: signal.sourceType ?? 'fusion',
    priorityScore: signal.priorityScore,
  }))

  const rawRecord = asRawRecord(evalCase.rawExactData)
  const reliability = rawRecord
    ? isReliableExactData(classification.science, classification.subcategory, rawRecord)
    : null
  const exactDataResolved =
    prioritized.signals.some((signal) => signal.sourceType === 'exact_data') ||
    Boolean(reliability && reliability.completeness > 0)
  const responseSelection = selectResponseModeSelection({
    userMessage: evalCase.query,
    requestKind: classification.requestKind,
    subcategory: classification.subcategory,
    plan: 'premium',
    exactDataResolved,
    exactDataReliable: reliability?.reliable,
    isPedagogical: classification.requestKind === 'clarification',
    isFusionIntent: isFusionIntent(userIntent),
    retrievalPlan,
    structuredSignals: prioritized.signals,
    scoredSignals: prioritized.scoredSignals,
    normalizedExactData: normalizedExactData.exactData,
    intent: userIntent,
  })
  const responseMode = responseSelection.responseMode

  const hardIssues: string[] = []
  const softIssues: string[] = []

  const missingPlanSciences = includesAll(retrievalPlan.sciences, evalCase.expectation.requiredSciences)
  if (missingPlanSciences.length) {
    hardIssues.push(`plan missing sciences: ${missingPlanSciences.join(', ')}`)
  }

  const missingPlanSubCategories = includesAll(
    retrievalPlan.subCategories,
    evalCase.expectation.requiredSubCategories,
  )
  if (missingPlanSubCategories.length) {
    hardIssues.push(`plan missing subCategories: ${missingPlanSubCategories.join(', ')}`)
  }

  if (includesNone(retrievalPlan.sciences, evalCase.expectation.oneOfSciences)) {
    hardIssues.push(`plan missing one-of sciences: ${(evalCase.expectation.oneOfSciences ?? []).join(', ')}`)
  }

  if (includesNone(retrievalPlan.subCategories, evalCase.expectation.oneOfSubCategories)) {
    hardIssues.push(`plan missing one-of subCategories: ${(evalCase.expectation.oneOfSubCategories ?? []).join(', ')}`)
  }

  const missingFlags = (evalCase.expectation.exactDataFlags ?? []).filter(
    (flag) => exactDataRequest[flag] !== true,
  )
  if (missingFlags.length) {
    hardIssues.push(`exactDataRequest missing flags: ${missingFlags.join(', ')}`)
  }

  const topSignalSubCategories = topSignals.map((signal) => signal.subCategory)
  if (
    evalCase.expectation.topSignalSubCategories?.length &&
    includesNone(topSignalSubCategories, evalCase.expectation.topSignalSubCategories)
  ) {
    hardIssues.push(
      `top signals missing one-of subCategories: ${evalCase.expectation.topSignalSubCategories.join(', ')}`,
    )
  }

  const topSignalSciences = topSignals.map((signal) => signal.science)
  if (
    evalCase.expectation.topSignalSciences?.length &&
    includesNone(topSignalSciences, evalCase.expectation.topSignalSciences)
  ) {
    hardIssues.push(
      `top signals missing one-of sciences: ${evalCase.expectation.topSignalSciences.join(', ')}`,
    )
  }

  if (
    evalCase.expectation.expectedDominantScience !== undefined &&
    retrievalPlan.dominantScience !== evalCase.expectation.expectedDominantScience
  ) {
    hardIssues.push(
      `dominantScience mismatch: expected ${String(evalCase.expectation.expectedDominantScience)} got ${String(retrievalPlan.dominantScience ?? null)}`,
    )
  }

  if (
    evalCase.expectation.expectedDominantSubCategory !== undefined &&
    retrievalPlan.dominantSubCategory !== evalCase.expectation.expectedDominantSubCategory
  ) {
    hardIssues.push(
      `dominantSubCategory mismatch: expected ${String(evalCase.expectation.expectedDominantSubCategory)} got ${String(retrievalPlan.dominantSubCategory ?? null)}`,
    )
  }

  if (
    evalCase.expectation.responseModes?.length &&
    !evalCase.expectation.responseModes.includes(responseMode)
  ) {
    hardIssues.push(
      `responseMode mismatch: expected one of ${evalCase.expectation.responseModes.join(', ')} got ${responseMode}`,
    )
  }

  if (evalCase.expectation.expectExactDataPrimary && topSignals[0]?.sourceType !== 'exact_data') {
    hardIssues.push(`expected exact_data primary, got ${topSignals[0]?.sourceType ?? 'none'}`)
  }

  if (
    evalCase.expectation.openingSources?.length &&
    !evalCase.expectation.openingSources.includes(responseSelection.dominantOpeningSource)
  ) {
    hardIssues.push(
      `opening source mismatch: expected one of ${evalCase.expectation.openingSources.join(', ')} got ${responseSelection.dominantOpeningSource}`,
    )
  }

  if (
    evalCase.expectation.openingSciences?.length &&
    !evalCase.expectation.openingSciences.includes(responseSelection.dominantOpeningScience ?? '')
  ) {
    hardIssues.push(
      `opening science mismatch: expected one of ${evalCase.expectation.openingSciences.join(', ')} got ${String(responseSelection.dominantOpeningScience ?? null)}`,
    )
  }

  if (
    evalCase.expectation.openingSubCategories?.length &&
    !evalCase.expectation.openingSubCategories.includes(responseSelection.dominantOpeningSubCategory ?? '')
  ) {
    hardIssues.push(
      `opening subCategory mismatch: expected one of ${evalCase.expectation.openingSubCategories.join(', ')} got ${String(responseSelection.dominantOpeningSubCategory ?? null)}`,
    )
  }

  const missingDetectionSciences = includesAll(detection.sciences, evalCase.expectation.requiredSciences)
  if (missingDetectionSciences.length) {
    softIssues.push(`detection missed sciences: ${missingDetectionSciences.join(', ')}`)
  }

  const missingDetectionSubCategories = includesAll(
    detection.subCategories,
    evalCase.expectation.requiredSubCategories,
  )
  if (missingDetectionSubCategories.length) {
    softIssues.push(`detection missed subCategories: ${missingDetectionSubCategories.join(', ')}`)
  }

  if (
    evalCase.expectation.oneOfSciences?.length &&
    includesNone(detection.sciences, evalCase.expectation.oneOfSciences)
  ) {
    softIssues.push(`detection missed one-of sciences: ${evalCase.expectation.oneOfSciences.join(', ')}`)
  }

  if (
    evalCase.expectation.oneOfSubCategories?.length &&
    includesNone(detection.subCategories, evalCase.expectation.oneOfSubCategories)
  ) {
    softIssues.push(
      `detection missed one-of subCategories: ${evalCase.expectation.oneOfSubCategories.join(', ')}`,
    )
  }

  const falseDominant =
    evalCase.expectation.preferNoDominant && (retrievalPlan.dominantScience || retrievalPlan.dominantSubCategory)
      ? `${String(retrievalPlan.dominantScience ?? null)} / ${String(retrievalPlan.dominantSubCategory ?? null)}`
      : null

  if (falseDominant) {
    softIssues.push(`dominant forced on ambiguous case: ${falseDominant}`)
  }

  const falseOpeningDominant =
    evalCase.expectation.preferNoOpeningDominant &&
    (responseSelection.dominantOpeningScience || responseSelection.dominantOpeningSubCategory)
      ? `${String(responseSelection.dominantOpeningScience ?? null)} / ${String(responseSelection.dominantOpeningSubCategory ?? null)}`
      : null

  if (falseOpeningDominant) {
    softIssues.push(`opening forced on ambiguous case: ${falseOpeningDominant}`)
  }

  const topRelevantIndex = findTopRelevantIndex(prioritized.signals.slice(0, TOP_SIGNAL_WINDOW), evalCase)
  const parasiteSignals =
    topRelevantIndex > 0
      ? prioritized.signals
          .slice(0, topRelevantIndex)
          .map((signal) => signalKey(signal))
      : []

  if (parasiteSignals.length) {
    softIssues.push(`parasite signals before relevant signal: ${parasiteSignals.join(' | ')}`)
  }

  const status: EvalStatus =
    hardIssues.length > 0 ? 'weak' : softIssues.length > 0 ? 'acceptable' : 'pass'

  return {
    evalCase,
    status,
    hardIssues,
    softIssues,
    falseDominant,
    parasiteSignals,
    detection,
    disambiguation,
    classification,
    userIntent,
    retrievalPlan,
    exactDataRequest,
    responseMode,
    dominantOpeningSource: responseSelection.dominantOpeningSource,
    dominantOpeningScience: responseSelection.dominantOpeningScience ?? null,
    dominantOpeningSubCategory: responseSelection.dominantOpeningSubCategory ?? null,
    responseReasoningTags: responseSelection.reasoningTags ?? [],
    fallbackUsed: retrievalPlan.fallbackUsed,
    topSignals,
  }
}

function formatCaseLine(result: EvalResult): string {
  const dominant =
    result.retrievalPlan.dominantScience || result.retrievalPlan.dominantSubCategory
      ? `${String(result.retrievalPlan.dominantScience ?? null)} / ${String(result.retrievalPlan.dominantSubCategory ?? null)}`
      : 'none'
  const opening =
    result.dominantOpeningScience || result.dominantOpeningSubCategory
      ? `${result.dominantOpeningSource}:${String(result.dominantOpeningScience ?? null)} / ${String(result.dominantOpeningSubCategory ?? null)}`
      : `${result.dominantOpeningSource}:none`
  const exactFlags = Object.keys(result.exactDataRequest)
  const issues = [...result.hardIssues, ...result.softIssues].slice(0, 2)
  const suffix = issues.length ? ` | notes=${issues.join(' ; ')}` : ''

  return [
    `- [${result.status.toUpperCase()}] ${result.evalCase.query}`,
    `detection=${result.detection.sciences.join(', ') || 'none'}`,
    `plan=${result.retrievalPlan.sciences.join(', ') || 'none'}`,
    `top=${result.topSignals.map((signal) => `${signal.subCategory}:${signal.sourceType}`).join(' | ') || 'none'}`,
    `dominant=${dominant}`,
    `opening=${opening}`,
    `flags=${exactFlags.join(', ') || 'none'}`,
    `fallback=${result.fallbackUsed ? 'yes' : 'no'}`,
    `mode=${result.responseMode}`,
  ].join(' | ') + suffix
}

function formatEvalReport(results: EvalResult[]): string {
  const passed = results.filter((result) => result.status === 'pass')
  const acceptable = results.filter((result) => result.status === 'acceptable')
  const weak = results.filter((result) => result.status === 'weak')
  const falseDominants = results.filter((result) => result.falseDominant)
  const parasiteCases = results.filter((result) => result.parasiteSignals.length > 0)
  const falseOpeningDominants = results.filter(
    (result) =>
      result.evalCase.expectation.preferNoOpeningDominant &&
      (result.dominantOpeningScience || result.dominantOpeningSubCategory),
  )

  const lines = [
    '',
    'HEXASTRA PIPELINE EVAL REPORT',
    `cases=${results.length} | pass=${passed.length} | acceptable=${acceptable.length} | weak=${weak.length}`,
    '',
    'RESULTS',
    ...results.map(formatCaseLine),
  ]

  if (acceptable.length) {
    lines.push('', 'ACCEPTABLE AMBIGUITIES')
    lines.push(...acceptable.map((result) => `- ${result.evalCase.query} -> ${result.softIssues.join(' ; ')}`))
  }

  if (weak.length) {
    lines.push('', 'WEAK CASES')
    lines.push(...weak.map((result) => `- ${result.evalCase.query} -> ${result.hardIssues.join(' ; ')}`))
  }

  if (falseDominants.length) {
    lines.push('', 'FALSE DOMINANTS')
    lines.push(
      ...falseDominants.map(
        (result) => `- ${result.evalCase.query} -> ${result.falseDominant}`,
      ),
    )
  }

  if (falseOpeningDominants.length) {
    lines.push('', 'FALSE OPENING DOMINANTS')
    lines.push(
      ...falseOpeningDominants.map(
        (result) =>
          `- ${result.evalCase.query} -> ${result.dominantOpeningSource}:${String(result.dominantOpeningScience ?? null)} / ${String(result.dominantOpeningSubCategory ?? null)}`,
      ),
    )
  }

  if (parasiteCases.length) {
    lines.push('', 'PARASITE SIGNALS')
    lines.push(
      ...parasiteCases.map(
        (result) => `- ${result.evalCase.query} -> ${result.parasiteSignals.join(' | ')}`,
      ),
    )
  }

  return lines.join('\n')
}

describe('hexastra pipeline evals', () => {
  it('covers representative business cases with soft functional expectations', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const results = HEXASTRA_PIPELINE_EVAL_CASES.map(evaluateCase)
    logSpy.mockRestore()

    const weakCases = results.filter((result) => result.status === 'weak')
    const nonWeakCases = results.filter((result) => result.status !== 'weak')

    console.log(formatEvalReport(results))

    expect(results).toHaveLength(HEXASTRA_PIPELINE_EVAL_CASES.length)
    expect(results.every((result) => result.topSignals.length > 0)).toBe(true)
    expect(nonWeakCases.length).toBeGreaterThanOrEqual(19)
    expect(weakCases.length).toBeLessThanOrEqual(6)
  })
})

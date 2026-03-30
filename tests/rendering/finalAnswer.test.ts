import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import { buildExactDataRequestFromRetrievalPlan } from '@/lib/hexastra/retrieval/exactDataHintMapper'
import { prioritizeStructuredSignals } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildStructuredSignals } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { isReliableExactData } from '@/lib/exact-data/reliability'
import {
  HEXASTRA_PIPELINE_EVAL_CASES,
  type HexastraPipelineEvalCase,
} from '../evals/hexastraPipelineEvalCases'

function getEvalCase(id: string): HexastraPipelineEvalCase {
  const evalCase = HEXASTRA_PIPELINE_EVAL_CASES.find((entry) => entry.id === id)
  if (!evalCase) {
    throw new Error(`Missing eval case: ${id}`)
  }
  return evalCase
}

function asRawRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function buildRenderedCase(id: string) {
  const evalCase = getEvalCase(id)
  const classification = classifyMessage(evalCase.query)
  const userIntent = classifyUserIntent(evalCase.query)
  const context = {
    hasBirthData: evalCase.hasBirthData ?? true,
    domainRoute: classification.domainRoute,
    selectedSubCategory: classification.subcategory,
    flowType: classification.intent,
  }
  const retrievalPlan = buildRetrievalPlanFromQuery(evalCase.query, context)
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
  const presentationSignals = responseSelection.orderedSignals ?? prioritized.signals
  const knowledgePacket = buildKnowledgePacket({
    results: evalCase.retrievalResults,
    domainRoute: classification.domainRoute,
    latestUserMessage: evalCase.query,
    retrievalPlan,
    exactData: evalCase.rawExactData ?? null,
    normalizedExactData: normalizedExactData.exactData,
    exactDataRequest,
    structuredSignals: presentationSignals,
    responseSelection: {
      responseMode: responseSelection.responseMode,
      dominantOpeningSource: responseSelection.dominantOpeningSource,
      dominantOpeningScience: responseSelection.dominantOpeningScience ?? null,
      dominantOpeningSubCategory: responseSelection.dominantOpeningSubCategory ?? null,
      reasoningTags: responseSelection.reasoningTags ?? [],
    },
    ksNarrativeBrief: 'Synthese de test.',
    fusionHints: retrievalPlan.subCategories.slice(0, 4),
  })

  if (!knowledgePacket) {
    throw new Error(`Missing knowledge packet for case ${id}`)
  }

  return buildFinalAnswer({
    userMessage: evalCase.query,
    responseMode: responseSelection.responseMode,
    openingSignal: responseSelection.openingSelection ?? null,
    prioritizedSignals: presentationSignals,
    knowledgePacket,
  })
}

function countSentences(value: string | undefined): number {
  return (value ?? '')
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length
}

describe('buildFinalAnswer', () => {
  it('renders a clear global current-state answer', () => {
    const answer = buildRenderedCase('decision_current_state')

    expect(answer.text).toContain('-> Ce qui se passe')
    expect(answer.text).toContain('-> Pourquoi')
    expect(answer.text).toContain('-> Ce que tu peux faire')
    expect(answer.text).toContain('-> Cle a retenir')
    expect(answer.sections?.opening).toMatch(/En ce moment|bouge|ressort/i)
    expect(countSentences(answer.sections?.opening)).toBeLessThanOrEqual(2)
  })

  it('renders a timing answer without a vague fusion opening', () => {
    const answer = buildRenderedCase('timing_solar_return')

    expect(answer.sections?.opening?.toLowerCase()).toContain('retour solaire')
    expect(answer.sections?.opening?.toLowerCase()).not.toContain('il y a des choses qui bougent')
  })

  it('renders a readable HD answer with a concrete opening', () => {
    const answer = buildRenderedCase('direct_hd_type')

    expect(answer.sections?.opening).toContain('Projector')
    expect(answer.sections?.explanation).not.toBe(answer.sections?.opening)
  })

  it('renders a numerology answer with the personal year in opening', () => {
    const answer = buildRenderedCase('timing_personal_year')

    expect(answer.sections?.opening?.toLowerCase()).toContain('annee personnelle 6')
  })

  it('renders a kua answer with an exact spatial cue', () => {
    const answer = buildRenderedCase('kua_favorable_directions')

    expect(answer.sections?.opening?.toLowerCase()).toContain('directions favorables')
    expect(answer.sections?.action?.toLowerCase()).toContain('repere spatial')
  })

  it('keeps an ambiguous question readable without forcing a hard opening', () => {
    const answer = buildRenderedCase('ambiguous_type')

    expect(answer.sections?.opening?.toLowerCase()).toContain('question reste ouverte')
    expect(answer.sections?.opening).not.toContain('Projector')
  })
})

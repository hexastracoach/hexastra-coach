import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { applyRenderProfile, buildRenderProfileText } from '@/lib/hexastra/rendering/applyRenderProfile'
import { applyShiloStyle } from '@/lib/hexastra/rendering/applyShiloStyle'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import { selectRenderProfile, type UserPlan } from '@/lib/hexastra/rendering/selectRenderProfile'
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

function buildRenderedCase(id: string, userPlan: UserPlan) {
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
    plan:
      userPlan === 'essentiel'
        ? 'essential'
        : userPlan === 'praticien'
          ? 'practitioner'
          : userPlan,
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

  const baseAnswer = buildFinalAnswer({
    userMessage: evalCase.query,
    responseMode: responseSelection.responseMode,
    openingSignal: responseSelection.openingSelection ?? null,
    prioritizedSignals: presentationSignals,
    knowledgePacket,
  })
  const renderProfile = selectRenderProfile({
    responseMode: responseSelection.responseMode,
    userPlan,
  })
  const profiledAnswer = applyRenderProfile({
    answer: baseAnswer,
    profile: renderProfile,
  })
  const styledSections = profiledAnswer.sections
    ? applyShiloStyle({
        opening: profiledAnswer.sections.opening ?? '',
        explanation: profiledAnswer.sections.explanation ?? '',
        action: profiledAnswer.sections.action ?? '',
        key: profiledAnswer.sections.key ?? '',
        responseMode: responseSelection.responseMode,
      })
    : profiledAnswer.sections

  return {
    baseAnswer,
    responseSelection,
    renderProfile,
    answer: {
      ...profiledAnswer,
      sections: styledSections,
      text: buildRenderProfileText({
        sections: styledSections,
        profile: renderProfile,
        fallbackText: profiledAnswer.text,
      }),
    },
  }
}

describe('applyRenderProfile', () => {
  it('keeps the same core answer while adapting depth across plans', () => {
    const freeAnswer = buildRenderedCase('decision_current_state', 'free')
    const premiumAnswer = buildRenderedCase('decision_current_state', 'premium')
    const practitionerAnswer = buildRenderedCase('decision_current_state', 'praticien')

    expect(freeAnswer.answer.text.length).toBeLessThan(premiumAnswer.answer.text.length)
    expect(practitionerAnswer.answer.text.length).toBeGreaterThan(premiumAnswer.answer.text.length)
    expect(freeAnswer.answer.sections?.action).toBeTruthy()
    expect(premiumAnswer.answer.sections?.key).toBeTruthy()
    expect(practitionerAnswer.answer.sections?.explanation).toBeTruthy()
  })

  it('keeps direct answers direct on the free plan', () => {
    const rendered = buildRenderedCase('direct_hd_type', 'free')

    expect(rendered.renderProfile.format).toBe('concise')
    expect(rendered.answer.text).toContain('-> L essentiel')
    expect(rendered.answer.text).toContain('-> Action')
    expect(rendered.answer.sections?.opening).toContain('Projector')
    expect(rendered.answer.sections?.opening?.startsWith('En ce moment')).toBe(false)
  })

  it('gives fusion general questions a storytelling premium render', () => {
    const rendered = buildRenderedCase('decision_current_state', 'premium')

    expect(rendered.renderProfile.format).toBe('storytelling')
    expect(rendered.answer.text).toContain('-> Ce qui se dessine')
    expect(rendered.answer.text).toContain('-> Ce que cela raconte')
    expect(rendered.answer.text).toContain('-> La cle')
  })

  it('handles partial sections and malformed profiles without breaking', () => {
    const rendered = applyRenderProfile({
      answer: {
        text: 'Texte brut.',
        sections: {
          opening: 'Actuellement, quelque chose bouge.',
          key: 'La clarte revient quand tu cesses de forcer.',
        },
      },
      profile: {
        format: 'unknown',
        tone: 'unknown',
        maxSections: 0,
      } as unknown as ReturnType<typeof selectRenderProfile>,
    })

    expect(rendered.text).toContain('Actuellement')
    expect(rendered.text).toContain('La clarte')
    expect(rendered.sections?.opening).toBeTruthy()
  })
})

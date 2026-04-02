import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { KnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import {
  detectYearlyPriorityFocusAngle,
  sanitizeYearlyPriorityRenderedText,
  validateYearlyPriorityAnswerFormat,
} from '@/lib/hexastra/rendering/buildYearlyPriorityAnswer'
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

function extractAnnualSentences(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim()
      if (!trimmed) return []
      if (/^(ORIENTATION\s+20\d{2}|TES\s+3\s+PRIORITES\s+REELLES|CE\s+QUI\s+VA\s+TE\s+FREINER|TON\s+TIMING|ACTION\s+IMMEDIATE)$/i.test(trimmed)) {
        return []
      }

      const body = trimmed
        .replace(/^\d+\.\s+/, '')
        .replace(/^Pourquoi:\s+/, '')
        .replace(/^Dans la vraie vie:\s+/, '')
        .replace(/^Cle simple:\s+/, '')
        .replace(/^Debut d annee:\s+/, '')
        .replace(/^Milieu d annee:\s+/, '')
        .replace(/^Fin d annee:\s+/, '')
        .replace(/^Action\s+\d+:\s+/, '')
        .replace(/^-+\s+/, '')

      return body
        .split(/[.!?]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    })
}

function countWords(value: string): number {
  return value
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length
}

function extractAnnualSection(text: string, heading: string, nextHeading?: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedNextHeading = nextHeading?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `${escapedHeading}\\s*\\n([\\s\\S]*?)(?:\\n\\s*${escapedNextHeading ?? '$'}|$)`,
    'i',
  )

  return text.match(pattern)?.[1]?.trim() ?? ''
}

function makeMinimalKnowledgePacket(): KnowledgePacket {
  return {
    domainRoute: 'fusion',
    focus: {
      selectedMenuLabel: null,
      selectedSubmenuLabel: null,
      scienceFocus: null,
      subscienceFocus: null,
    },
    constraints: {
      selectedPromptHint: null,
      selectedOutputStructure: null,
    },
    priorityOrder: [],
    hierarchyGuide: '',
    fusionGuide: '',
    ignoredSources: [],
    masterPrompt: null,
    readingStructure: null,
    menuPrompt: null,
    sciencePrompt: [],
    subsciencePrompt: [],
    referenceBook: [],
    supportingKnowledge: [],
    orderedSources: [],
    fusionHints: ['fusion_general'],
  }
}

describe('buildFinalAnswer', () => {
  it('renders a clear global current-state answer', () => {
    const answer = buildRenderedCase('decision_current_state')

    expect(answer.text).toContain('-> Ce qui se passe')
    expect(answer.text).toContain('-> Pourquoi')
    expect(answer.text).toContain('-> Ce que tu peux faire')
    expect(answer.text).toContain('-> Cle a retenir')
    expect(answer.sections?.opening).toMatch(/Actuellement|En ce moment|bouge|ressort/i)
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

  it('never renders timing_fusion as a raw internal key', () => {
    const answer = buildFinalAnswer({
      userMessage: 'est-ce le bon moment ?',
      responseMode: 'timing_strategic_response',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'timing_fusion',
            sourceType: 'fusion',
            value: 'timing_fusion',
          },
        ],
        dominantOpeningSource: 'fusion',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'timing_fusion',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).not.toContain('timing_fusion')
    expect(answer.sections?.opening?.toLowerCase()).toContain('bon moment')
  })

  it('varies timing fusion fallback copy depending on responseMode', () => {
    const timingAnswer = buildFinalAnswer({
      userMessage: 'est-ce le bon moment ?',
      responseMode: 'timing_strategic_response',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'timing_fusion',
            sourceType: 'fusion',
            value: 'timing_fusion',
          },
        ],
        dominantOpeningSource: 'fusion',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'timing_fusion',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const interpretiveAnswer = buildFinalAnswer({
      userMessage: 'qu est-ce que je traverse ?',
      responseMode: 'interpretive_reading',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'timing_fusion',
            sourceType: 'fusion',
            value: 'timing_fusion',
          },
        ],
        dominantOpeningSource: 'fusion',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'timing_fusion',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'timing_fusion',
          sourceType: 'fusion',
          value: 'timing_fusion',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(timingAnswer.sections?.explanation).not.toBe(interpretiveAnswer.sections?.explanation)
    expect(timingAnswer.sections?.explanation?.toLowerCase()).toContain('fenetre claire')
    expect(interpretiveAnswer.sections?.explanation?.toLowerCase()).toContain('murit en toi')
  })

  it('never renders fusion_general as a raw internal key', () => {
    const answer = buildFinalAnswer({
      userMessage: 'que se passe-t-il pour moi ?',
      responseMode: 'interpretive_reading',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'fusion_general',
          sourceType: 'fusion',
          value: 'fusion_general',
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'fusion_general',
            sourceType: 'fusion',
            value: 'fusion_general',
          },
        ],
        dominantOpeningSource: 'fusion',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'fusion_general',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'fusion_general',
          sourceType: 'fusion',
          value: 'fusion_general',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).not.toContain('fusion_general')
    expect(answer.sections?.opening?.toLowerCase()).toContain('ordre plus profondement')
  })

  it('uses a human fallback for unknown fusion subcategories', () => {
    const answer = buildFinalAnswer({
      userMessage: 'que se passe-t-il ?',
      responseMode: 'concise_fusion_answer',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'fusion_unknown_axis',
          sourceType: 'fusion',
          value: 'fusion_unknown_axis',
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'fusion_unknown_axis',
            sourceType: 'fusion',
            value: 'fusion_unknown_axis',
          },
        ],
        dominantOpeningSource: 'fusion',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'fusion_unknown_axis',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'fusion_unknown_axis',
          sourceType: 'fusion',
          value: 'fusion_unknown_axis',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).not.toContain('fusion_unknown_axis')
    expect(answer.sections?.opening?.toLowerCase()).toContain('reorganiser')
    expect(answer.sections?.explanation?.toLowerCase()).toContain('dynamique en cours')
  })

  it('never leaks internal non-fusion keys either', () => {
    const answer = buildFinalAnswer({
      userMessage: 'mon type',
      responseMode: 'direct_answer',
      openingSignal: {
        signal: {
          science: 'human_design',
          subCategory: 'hd_type',
          sourceType: 'exact_data',
          value: 'hd_type',
        },
        orderedSignals: [
          {
            science: 'human_design',
            subCategory: 'hd_type',
            sourceType: 'exact_data',
            value: 'hd_type',
          },
        ],
        dominantOpeningSource: 'exact_data',
        dominantOpeningScience: 'human_design',
        dominantOpeningSubCategory: 'hd_type',
        reasoningTags: [],
      },
      prioritizedSignals: [
        {
          science: 'human_design',
          subCategory: 'hd_type',
          sourceType: 'exact_data',
          value: 'hd_type',
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).not.toContain('hd_type')
  })

  it('renders yearly priorities with the dedicated annual structure only', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Quelles sont mes priorites pour 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: {
            summary: '2026 te demande de recentrer ton energie sur un cap plus net et plus soutenable.',
          },
        },
        orderedSignals: [
          {
            science: 'fusion',
            subCategory: 'annual_guidance',
            sourceType: 'exact_data',
            value: {
              summary: '2026 te demande de recentrer ton energie sur un cap plus net et plus soutenable.',
            },
          },
        ],
        dominantOpeningSource: 'exact_data',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'annual_guidance',
        reasoningTags: ['yearly_priority_override', 'exact_data_backed_interpretive_query'],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'recentre ton axe et coupe les dispersions' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_solar_return',
          sourceType: 'exact_data',
          value: { annual_theme: 'leadership plus assume et recentrage du cap' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_progressions',
          sourceType: 'exact_data',
          value: { secondary_progressions: { moon: 'maturite emotionnelle et tri interieur' } },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie seulement la ou la reponse est claire' },
        },
        {
          science: 'numerology',
          subCategory: 'num_personal_year',
          sourceType: 'exact_data',
          value: { yearly: { personalYearNumber: 8 } },
        },
        {
          science: 'kua',
          subCategory: 'kua_annual_influence',
          sourceType: 'exact_data',
          value: { annualInfluence: 'clarifier la direction et simplifier le cadre' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).toContain('ORIENTATION 2026')
    expect(answer.text).toContain('TA LIGNE DIRECTRICE 2026')
    expect(answer.text).toContain('TES 3 PRIORITES REELLES')
    expect(answer.text).toContain('CE QUI VA TE FREINER')
    expect(answer.text).toContain('TON TIMING')
    expect(answer.text).toContain('ACTION IMMEDIATE')
    expect(answer.text).not.toContain('CE QUI SE PASSE')
    expect(answer.text).not.toContain('POURQUOI CA BLOQUE')
    expect(answer.text).not.toContain('CE QUE TU DOIS FAIRE')
    expect(answer.text).not.toContain('CLE A RETENIR')
    expect(answer.text).not.toMatch(/Sphere/i)
    expect((answer.text.match(/^Pourquoi:/gm) ?? []).length).toBe(3)
    expect((answer.text.match(/^Dans la vraie vie:/gm) ?? []).length).toBe(3)
    expect((answer.text.match(/^Cle simple:/gm) ?? []).length).toBe(3)
    expect((answer.text.match(/^\-\s+/gm) ?? []).length).toBeGreaterThanOrEqual(3)
    expect((answer.text.match(/^Action\s+\d+:/gm) ?? []).length).toBeGreaterThanOrEqual(2)
    for (const forbiddenWord of ['true', 'false', 'signal', 'confidence']) {
      expect(answer.text.toLowerCase()).not.toContain(forbiddenWord)
    }
    expect(answer.text).not.toMatch(/\b(?:vrai|faux)\b/i)
    expect(answer.text).toContain('Debut d annee:')
    expect(answer.text).toContain('Milieu d annee:')
    expect(answer.text).toContain('Fin d annee:')
    expect(answer.sections).toBeUndefined()

    const validation = validateYearlyPriorityAnswerFormat(answer.text)
    expect(validation.valid).toBe(true)
    expect(validation.priorityCount).toBe(3)
  })

  it('detects yearly priority focus angles from natural questions', () => {
    expect(detectYearlyPriorityFocusAngle('Sur quoi je dois me concentrer cette annee ?')).toBe('concentration')
    expect(detectYearlyPriorityFocusAngle('Quel axe je dois vraiment choisir ?')).toBe('direction_choice')
    expect(detectYearlyPriorityFocusAngle('Qu est-ce que je dois arreter en 2026 ?')).toBe('stop_cut_remove')
    expect(detectYearlyPriorityFocusAngle('Ou je perds mon energie ?')).toBe('energy_leak')
    expect(detectYearlyPriorityFocusAngle('Comment avancer cette annee ?')).toBe('execution_push')
  })

  it('adapts yearly priorities to a concentration angle', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Sur quoi je dois me concentrer cette annee ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_transits_current',
          sourceType: 'exact_data',
          value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const lower = answer.text.toLowerCase()
    expect(lower).toContain('ou concentrer tes moyens')
    expect(answer.text).toContain('Protege tes plages fortes')
    expect(lower).toContain('choisis un seul front central')
    expect(lower).toContain('bloque deux creneaux fixes')
  })

  it('adapts yearly priorities to a direction-choice angle', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Quel axe je dois vraiment choisir ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_transits_current',
          sourceType: 'exact_data',
          value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).toContain('une direction claire')
    expect(answer.text).toContain('Choisis puis coupe')
    expect(answer.text).toContain('Ecris ton axe en une phrase claire')
  })

  it('adapts yearly priorities to an execution-push angle', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Comment avancer cette annee ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_transits_current',
          sourceType: 'exact_data',
          value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const lower = answer.text.toLowerCase()
    expect(lower).toContain('transforme ton cap en preuves concretes')
    expect(lower).toContain('gestes repetes et visibles')
    expect(lower).toContain('choisis un livrable simple')
  })

  it('keeps the annual structure stable while changing the wording by focus angle', () => {
    const sharedSignals = [
      {
        science: 'fusion' as const,
        subCategory: 'annual_guidance',
        sourceType: 'exact_data' as const,
        value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
      },
      {
        science: 'astrology' as const,
        subCategory: 'astro_transits_current',
        sourceType: 'exact_data' as const,
        value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
      },
      {
        science: 'human_design' as const,
        subCategory: 'hd_current_transits',
        sourceType: 'exact_data' as const,
        value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
      },
    ]

    const concentrationAnswer = buildFinalAnswer({
      userMessage: 'Sur quoi je dois me concentrer cette annee ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: sharedSignals,
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const directionAnswer = buildFinalAnswer({
      userMessage: 'Quel axe je dois vraiment choisir ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: sharedSignals,
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    for (const heading of ['ORIENTATION', 'TES 3 PRIORITES REELLES', 'CE QUI VA TE FREINER', 'TON TIMING', 'ACTION IMMEDIATE']) {
      expect(concentrationAnswer.text).toContain(heading)
      expect(directionAnswer.text).toContain(heading)
    }

    expect(concentrationAnswer.text).not.toBe(directionAnswer.text)
    expect(concentrationAnswer.text.toLowerCase()).toContain('choisis un seul front central')
    expect(directionAnswer.text.toLowerCase()).toContain('ecris ton axe en une phrase claire')
    expect(concentrationAnswer.text.toLowerCase()).not.toContain('ecris ton axe en une phrase claire')
    expect(directionAnswer.text.toLowerCase()).not.toContain('choisis un seul front central')
  })

  it('adapts yearly_priority_answer to the user plan while keeping the same structure', () => {
    const sharedSignals = [
      {
        science: 'fusion' as const,
        subCategory: 'annual_guidance',
        sourceType: 'exact_data' as const,
        value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
      },
      {
        science: 'astrology' as const,
        subCategory: 'astro_transits_current',
        sourceType: 'exact_data' as const,
        value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
      },
      {
        science: 'human_design' as const,
        subCategory: 'hd_current_transits',
        sourceType: 'exact_data' as const,
        value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
      },
    ]

    const buildAnnualAnswerForPlan = (userPlan: 'free' | 'essentiel' | 'premium' | 'praticien') =>
      buildFinalAnswer({
        userMessage: 'Sur quoi je dois me concentrer cette annee ?',
        responseMode: 'yearly_priority_answer',
        openingSignal: null,
        prioritizedSignals: sharedSignals,
        knowledgePacket: makeMinimalKnowledgePacket(),
        userPlan,
      }).text

    const freeAnswer = buildAnnualAnswerForPlan('free')
    const essentialAnswer = buildAnnualAnswerForPlan('essentiel')
    const premiumAnswer = buildAnnualAnswerForPlan('premium')
    const practitionerAnswer = buildAnnualAnswerForPlan('praticien')

    for (const answer of [freeAnswer, essentialAnswer, premiumAnswer, practitionerAnswer]) {
      for (const heading of ['ORIENTATION', 'TES 3 PRIORITES REELLES', 'CE QUI VA TE FREINER', 'TON TIMING', 'ACTION IMMEDIATE']) {
        expect(answer).toContain(heading)
      }
    }

    expect(freeAnswer).toContain('TA LIGNE DIRECTRICE 2026: Reduis. Concentre. Avance.')
    expect(essentialAnswer).toContain('TA LIGNE DIRECTRICE 2026: Garde peu de fronts. Fais avancer le bon.')
    expect(premiumAnswer).toContain('TA LIGNE DIRECTRICE 2026: Reduis tes fronts pour faire grandir ce qui repond deja.')
    expect(practitionerAnswer).toContain('TA LIGNE DIRECTRICE 2026: Coupe le bruit pour donner du poids a ce qui')
    expect(practitionerAnswer).toContain('Avance deja.')
    expect(freeAnswer).not.toContain('Cle simple:')
    expect(freeAnswer).not.toContain('Pourquoi:')
    expect(freeAnswer).not.toContain('Dans la vraie vie:')
    expect(essentialAnswer).not.toContain('Cle simple:')
    expect((essentialAnswer.match(/^Pourquoi:/gm) ?? []).length).toBe(3)
    expect((essentialAnswer.match(/^Dans la vraie vie:/gm) ?? []).length).toBe(3)
    expect(essentialAnswer).toContain('Mets plus de temps sur ce qui avance deja.')
    expect(essentialAnswer).toContain('Garde un seul front ouvert.')
    expect(essentialAnswer.toLowerCase()).not.toContain('maitrise et expansion')
    expect(essentialAnswer.toLowerCase()).not.toContain('l energie est propice')
    expect(essentialAnswer.toLowerCase()).not.toContain('equilibre personnel')
    expect(premiumAnswer).toContain('Cle simple:')
    expect(practitionerAnswer).toContain('Cle simple:')

    const freeAction = extractAnnualSection(freeAnswer, 'ACTION IMMEDIATE')
    const essentialAction = extractAnnualSection(essentialAnswer, 'ACTION IMMEDIATE')
    const premiumAction = extractAnnualSection(premiumAnswer, 'ACTION IMMEDIATE')
    const practitionerAction = extractAnnualSection(practitionerAnswer, 'ACTION IMMEDIATE')
    const freeWordCount = countWords(freeAnswer)
    const essentialWordCount = countWords(essentialAnswer)
    const premiumWordCount = countWords(premiumAnswer)
    const practitionerWordCount = countWords(practitionerAnswer)

    expect((freeAction.match(/^Action\s+\d+:/gm) ?? []).length).toBe(1)
    expect((essentialAction.match(/^Action\s+\d+:/gm) ?? []).length).toBe(2)
    expect((premiumAction.match(/^Action\s+\d+:/gm) ?? []).length).toBe(3)
    expect((practitionerAction.match(/^Action\s+\d+:/gm) ?? []).length).toBe(3)
    expect(freeWordCount).toBeLessThan(essentialWordCount * 0.8)
    expect(premiumWordCount).toBeGreaterThan(essentialWordCount)
    expect(practitionerWordCount).toBeGreaterThanOrEqual(premiumWordCount)
    expect(new Set([freeAction, essentialAction, premiumAction, practitionerAction]).size).toBeGreaterThanOrEqual(2)
  })

  it('keeps yearly priority wording short and easy to read', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Qu est-ce que je dois arreter en 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap, trier tes engagements et couper les dispersions' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_transits_current',
          sourceType: 'exact_data',
          value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const sentences = extractAnnualSentences(answer.text)
    expect(sentences.length).toBeGreaterThan(8)
    expect(sentences.every((sentence) => countWords(sentence) <= 20)).toBe(true)
    expect(answer.text.toLowerCase()).not.toContain('concretement')
    expect(answer.text.toLowerCase()).not.toContain('dans ce contexte')
    expect(answer.text.toLowerCase()).not.toContain('il faut')
  })

  it('keeps yearly angles structurally identical but visibly different in wording and action', () => {
    const sharedSignals = [
      {
        science: 'fusion' as const,
        subCategory: 'annual_guidance',
        sourceType: 'exact_data' as const,
        value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
      },
      {
        science: 'astrology' as const,
        subCategory: 'astro_transits_current',
        sourceType: 'exact_data' as const,
        value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
      },
      {
        science: 'human_design' as const,
        subCategory: 'hd_current_transits',
        sourceType: 'exact_data' as const,
        value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
      },
    ]

    const queries = [
      'Sur quoi je dois me concentrer cette annee ?',
      'Quel axe je dois vraiment choisir ?',
      'Qu est-ce que je dois arreter en 2026 ?',
      'Ou je perds mon energie en ce moment ?',
      'Comment avancer cette annee ?',
    ]

    const answers = queries.map((query) =>
      buildFinalAnswer({
        userMessage: query,
        responseMode: 'yearly_priority_answer',
        openingSignal: null,
        prioritizedSignals: sharedSignals,
        knowledgePacket: makeMinimalKnowledgePacket(),
      }).text,
    )

    for (const answer of answers) {
      for (const heading of ['ORIENTATION', 'TES 3 PRIORITES REELLES', 'CE QUI VA TE FREINER', 'TON TIMING', 'ACTION IMMEDIATE']) {
        expect(answer).toContain(heading)
      }
    }

    const uniqueTexts = new Set(answers)
    const uniqueActions = new Set(
      answers.map((answer) => extractAnnualSection(answer, 'ACTION IMMEDIATE')),
    )
    const uniqueDirectives = new Set(
      answers.map((answer) => {
        const lines = answer.split('\n').map((line) => line.trim()).filter(Boolean)
        return lines.find((line) => /TA LIGNE DIRECTRICE 20\d{2}/i.test(line)) ?? ''
      }),
    )

    expect(uniqueTexts.size).toBe(queries.length)
    expect(uniqueActions.size).toBe(queries.length)
    expect(uniqueDirectives.size).toBe(queries.length)
  })

  it('strips boolean leakage from yearly priority content', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Sur quoi je dois me concentrer cette annee ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: {
            summary: true,
            details: {
              note: 'clarifier tes engagements prioritaires',
            },
          },
        },
        orderedSignals: [],
        dominantOpeningSource: 'exact_data',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'annual_guidance',
        reasoningTags: ['yearly_priority_override'],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: {
            summary: true,
            details: {
              note: 'clarifier tes engagements prioritaires',
            },
          },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: false, summary: 'engager ton energie sur moins de fronts' },
        },
        {
          science: 'numerology',
          subCategory: 'num_personal_year',
          sourceType: 'exact_data',
          value: { yearly: { personalYearNumber: 8, activated: true } },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text.toLowerCase()).not.toContain(' true ')
    expect(answer.text.toLowerCase()).not.toContain(' false ')
    expect(answer.text.toLowerCase()).not.toContain(' vrai ')
    expect(answer.text.toLowerCase()).not.toContain(' faux ')
    expect(answer.text).not.toMatch(/\b(?:true|false|vrai|faux)\b/i)
  })

  it('strips technical exact-data tokens and iso dates from yearly priority content', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Quel cap choisir en 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: {
        signal: {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: {
            summary: 'solar_return',
          },
        },
        orderedSignals: [],
        dominantOpeningSource: 'exact_data',
        dominantOpeningScience: 'fusion',
        dominantOpeningSubCategory: 'annual_guidance',
        reasoningTags: ['yearly_priority_override'],
      },
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: {
            summary: 'solar_return',
          },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'human_design_transits' },
        },
        {
          science: 'kua',
          subCategory: 'kua_annual_influence',
          sourceType: 'exact_data',
          value: { annualInfluence: '2026-04-02' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).not.toMatch(/\b(?:solar_return|lunar_return|progressions|transits|human_design_transits|numerology_cycles|kua_directions)\b/i)
    expect(answer.text).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/)
    expect(answer.text).toContain('ORIENTATION 2026')
    expect(validateYearlyPriorityAnswerFormat(answer.text).valid).toBe(true)
  })

  it('keeps the three yearly priorities distinct and concretely grounded', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Quel axe privilegier en 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap, trier tes engagements et assumer un axe plus net' },
        },
        {
          science: 'astrology',
          subCategory: 'astro_transits_current',
          sourceType: 'exact_data',
          value: { summary: 'la traction existe mais elle doit etre lue avant d accelerer' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts mais avec plus de nettete' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    const priorityTitles = Array.from(answer.text.matchAll(/^\d+\.\s+(.+)$/gm)).map((match) => match[1])
    const priorityBlocks = answer.text
      .split(/\n\n/)
      .filter((block) => /^\d+\.\s+/m.test(block))

    expect(new Set(priorityTitles).size).toBe(3)
    expect(priorityBlocks).toHaveLength(3)
    expect(priorityBlocks.some((block) => /\b(stop|supprime|coupe|refuse)\b/i.test(block))).toBe(true)
    for (const block of priorityBlocks) {
      expect(block).toContain('Pourquoi:')
      expect(block).toContain('Dans la vraie vie:')
      expect(block).toContain('Cle simple:')
    }
  })

  it('rejects the legacy generic template for yearly priorities', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'CE QUI SE PASSE',
      'Ca bouge un peu partout.',
      '',
      'POURQUOI CA BLOQUE',
      'Tu es disperse.',
      '',
      'CE QUE TU DOIS FAIRE',
      'Recentre-toi.',
      '',
      'CLE A RETENIR',
      'Avance mieux.',
      '',
      'Sphere centrale',
    ].join('\n'))

    expect(validation.valid).toBe(false)
    expect(validation.issues.join(' ')).toMatch(/disallowed_block/)
  })

  it('counts only the three visible priorities inside the annual priority block', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, l axe dominant est tri strategique et structuration du cap.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Coupe le secondaire',
      'Pourquoi: En 2026, laisser ouverts des fronts tiedes te coute plus qu il ne t aide.',
      'Dans la vraie vie: Coupe un projet secondaire et refuse une opportunite non alignee.',
      'Cle simple: Moins de fronts donne plus d elan.',
      '',
      '2. Nettoyer tes oui',
      'Pourquoi: Cette annee, ton energie doit aller sur moins de fronts mais de meilleure qualite.',
      'Dans la vraie vie: Refuse une demande non alignee et garde un seul oui fort.',
      'Cle simple: Chaque oui secondaire brouille ton axe.',
      '',
      '3. Consolider ce qui tient',
      'Pourquoi: En 2026, les resultats viennent de ce qui tient deja dans le reel.',
      'Dans la vraie vie: Termine un chantier utile avant d en ouvrir un autre.',
      'Cle simple: Ce qui tient merite plus de place.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui a des opportunites non alignees.',
      '- Changer le decor sans changer la vraie decision de fond.',
      '- Commencer plein de choses sans en finir une seule.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie. Evite les nouveaux fronts.',
      'Milieu d annee: Engage-toi nettement. Corrige la dispersion.',
      'Fin d annee: Consolide les resultats. Laisse tomber le secondaire.',
      '',
      'ACTION IMMEDIATE',
      'Action 1: Ferme un engagement secondaire.',
      'Action 2: Bloque deux creneaux sur ton front principal.',
      '',
      '1. Ceci est une numerotation parasite hors du bloc des priorites.',
      '2. Elle ne doit pas etre comptee par le validateur.',
    ].join('\n'))

    expect(validation.priorityCount).toBe(3)
    expect(validation.issues).not.toContain('invalid_priority_count:5')
  })

  it('validates the displayed yearly structure with markdown accents and CRLF', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      '## ORIENTATION 2026',
      'En 2026, l axe dominant est tri strategique et structuration du cap.',
      '',
      '**TES 3 PRIORITÉS RÉELLES**',
      '1. Coupe le secondaire',
      'Pourquoi: En 2026, laisser ouverts des fronts tiedes te coute plus qu ils ne t apportent.',
      'Dans la vraie vie: Coupe un projet secondaire et refuse une opportunite non alignee.',
      'Cle simple: Moins de fronts donne plus d elan.',
      '',
      '2. Nettoyer tes oui',
      'Pourquoi: Cette annee, ton energie doit aller sur moins de fronts mais avec plus de nettete.',
      'Dans la vraie vie: Refuse une demande non alignee et garde un seul oui fort.',
      'Cle simple: Chaque oui secondaire brouille ton axe.',
      '',
      '3. Consolider ce qui tient',
      'Pourquoi: En 2026, les resultats viennent de ce qui tient deja dans le reel.',
      'Dans la vraie vie: Termine un chantier utile avant d en ouvrir un autre.',
      'Cle simple: Ce qui tient merite plus de place.',
      '',
      '### CE QUI VA TE FREINER',
      '- Dire oui a des opportunites non alignees.',
      '- Changer le decor sans changer la vraie decision de fond.',
      '- Commencer plein de choses sans en finir une seule.',
      '',
      '## TON TIMING',
      'Début d’année: Trie et clarifie. Evite les nouveaux fronts.',
      'Milieu d’année: Engage-toi nettement. Corrige la dispersion.',
      'Fin d’année: Consolide les resultats. Laisse tomber le secondaire.',
      '',
      '**ACTION IMMÉDIATE**',
      'Action 1: Ferme un engagement secondaire.',
      'Action 2: Bloque deux creneaux sur ton front principal.',
    ].join('\r\n'))

    expect(validation.valid).toBe(true)
    expect(validation.priorityCount).toBe(3)
    expect(validation.issues).not.toContain('missing_heading:/TES\\s+3\\s+PRIORITES\\s+REELLES\\b/i')
    expect(validation.issues).not.toContain('missing_heading:/ACTION\\s+IMMEDIATE\\b/i')
  })

  it('accepts a lighter yearly structure for essential without premium-only requirements', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, tu avances mieux quand tu gardes peu de fronts.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Cette annee, trop d options diluent ton elan.',
      'Dans la vraie vie: Termine un chantier avant d en ouvrir un autre.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Ton temps doit aller au plus utile.',
      'Dans la vraie vie: Refuse une demande secondaire cette semaine.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Les resultats viennent de ce qui tient deja.',
      'Dans la vraie vie: Renforce ce qui marche au lieu de repartir de zero.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Renforce ce qui repond.',
      'Fin d annee: Garde ce qui tient.',
      '',
      'ACTION IMMEDIATE',
      'Choisis un seul front principal pour les 72 prochaines heures.',
    ].join('\n'), { userPlan: 'essentiel' })

    expect(validation.valid).toBe(true)
    expect(validation.issues).not.toContain('missing_priority_simple_key')
    expect(validation.issues).not.toContain('missing_radical_priority')
    expect(validation.issues).not.toContain('invalid_action_count:0')
  })

  it('accepts essential yearly structure with a single immediate action', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, garde peu de fronts utiles.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Cette annee, trop de fronts brouillent ton elan.',
      'Dans la vraie vie: Termine un sujet avant d en ouvrir un autre.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Ton temps doit aller au plus utile.',
      'Dans la vraie vie: Refuse une demande secondaire cette semaine.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Les resultats viennent de ce qui tient deja.',
      'Dans la vraie vie: Renforce ce qui avance deja.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Renforce ce qui repond.',
      'Fin d annee: Garde ce qui tient.',
      '',
      'ACTION IMMEDIATE',
      'Action 1: Choisis un front principal pour les 72 prochaines heures.',
    ].join('\n'), { userPlan: 'essentiel' })

    expect(validation.valid).toBe(true)
    expect(validation.issues).not.toContain('invalid_action_count:1')
  })

  it('accepts essential yearly structure with two immediate actions', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, garde peu de fronts utiles.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Cette annee, trop de fronts brouillent ton elan.',
      'Dans la vraie vie: Termine un sujet avant d en ouvrir un autre.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Ton temps doit aller au plus utile.',
      'Dans la vraie vie: Refuse une demande secondaire cette semaine.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Les resultats viennent de ce qui tient deja.',
      'Dans la vraie vie: Renforce ce qui avance deja.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Renforce ce qui repond.',
      'Fin d annee: Garde ce qui tient.',
      '',
      'ACTION IMMEDIATE',
      'Action 1: Choisis un front principal pour les 72 prochaines heures.',
      'Action 2: Coupe une distraction avant vendredi.',
    ].join('\n'), { userPlan: 'essentiel' })

    expect(validation.valid).toBe(true)
    expect(validation.issues).not.toContain('invalid_action_count:2')
  })

  it('trims essential yearly output to two immediate actions when a third one appears', () => {
    const sanitized = sanitizeYearlyPriorityRenderedText([
      'ORIENTATION 2026',
      'En 2026, garde peu de fronts utiles.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Cette annee, trop de fronts brouillent ton elan.',
      'Dans la vraie vie: Termine un sujet avant d en ouvrir un autre.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Ton temps doit aller au plus utile.',
      'Dans la vraie vie: Refuse une demande secondaire cette semaine.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Les resultats viennent de ce qui tient deja.',
      'Dans la vraie vie: Renforce ce qui avance deja.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Renforce ce qui repond.',
      'Fin d annee: Garde ce qui tient.',
      '',
      'ACTION IMMEDIATE',
      'Action 1: Choisis un front principal pour les 72 prochaines heures.',
      'Action 2: Coupe une distraction avant vendredi.',
      'Action 3: Ouvre un nouveau chantier lundi prochain.',
    ].join('\n'), { userPlan: 'essentiel' })

    const validation = validateYearlyPriorityAnswerFormat(sanitized, { userPlan: 'essentiel' })

    expect((sanitized.match(/^Action\s+\d+:/gm) ?? []).length).toBe(2)
    expect(sanitized).not.toContain('Action 3:')
    expect(validation.valid).toBe(true)
  })

  it('accepts a free yearly structure without why or real-life details', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, garde peu de fronts.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      '',
      '2. Trie tes oui',
      '',
      '3. Avance sur ce qui repond',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie.',
      'Milieu d annee: Renforce.',
      'Fin d annee: Garde.',
      '',
      'ACTION IMMEDIATE',
      'Choisis un seul front pour les 72 prochaines heures.',
    ].join('\n'), { userPlan: 'free' })

    expect(validation.valid).toBe(true)
    expect(validation.issues).not.toContain('missing_priority_why')
    expect(validation.issues).not.toContain('missing_priority_real_life')
  })

  it('keeps essential stricter than free when yearly priorities omit why', () => {
    const validation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, garde peu de fronts.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      '',
      '2. Trie tes oui',
      '',
      '3. Avance sur ce qui repond',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie.',
      'Milieu d annee: Renforce.',
      'Fin d annee: Garde.',
      '',
      'ACTION IMMEDIATE',
      'Choisis un seul front pour les 72 prochaines heures.',
    ].join('\n'), { userPlan: 'essentiel' })

    expect(validation.valid).toBe(false)
    expect(validation.issues).toContain('missing_priority_why')
  })

  it('keeps premium validation stricter than essential on the same lighter yearly shape', () => {
    const premiumValidation = validateYearlyPriorityAnswerFormat([
      'ORIENTATION 2026',
      'En 2026, tu avances mieux quand tu gardes peu de fronts.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Cette annee, trop d options diluent ton elan.',
      'Dans la vraie vie: Termine un chantier avant d en ouvrir un autre.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Ton temps doit aller au plus utile.',
      'Dans la vraie vie: Refuse une demande secondaire cette semaine.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Les resultats viennent de ce qui tient deja.',
      'Dans la vraie vie: Renforce ce qui marche au lieu de repartir de zero.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui trop vite.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Renforce ce qui repond.',
      'Fin d annee: Garde ce qui tient.',
      '',
      'ACTION IMMEDIATE',
      'Choisis un seul front principal pour les 72 prochaines heures.',
    ].join('\n'), { userPlan: 'premium' })

    expect(premiumValidation.valid).toBe(false)
    expect(premiumValidation.issues).toContain('missing_priority_simple_key')
    expect(
      premiumValidation.issues.some((issue) =>
        ['missing_radical_priority', 'invalid_pitfall_count:1', 'invalid_action_count:0'].includes(issue),
      ),
    ).toBe(true)
  })

  it('strips annual technical tokens like transits, progressions and solar return before validation', () => {
    const sanitized = sanitizeYearlyPriorityRenderedText([
      'ORIENTATION 2026',
      'TA LIGNE DIRECTRICE 2026: Solar return, transits, avance.',
      '',
      'TES 3 PRIORITES REELLES',
      '1. Garde un seul axe',
      'Pourquoi: Tes transits et progressions montrent un tri net.',
      'Dans la vraie vie: Coupe un sujet secondaire.',
      '',
      '2. Trie tes oui',
      'Pourquoi: Le solar_return pousse a choisir.',
      'Dans la vraie vie: Refuse une demande secondaire.',
      '',
      '3. Consolide ce qui repond',
      'Pourquoi: Le human_design_transits aide a mieux viser.',
      'Dans la vraie vie: Renforce ce qui avance deja.',
      '',
      'CE QUI VA TE FREINER',
      '- Suivre des transits au lieu d agir.',
      '',
      'TON TIMING',
      'Debut d annee: Observe les lunar return et trie.',
      'Milieu d annee: Utilise les progressions pour corriger.',
      'Fin d annee: Garde la bonne direction sans parler de kua_directions.',
      '',
      'ACTION IMMEDIATE',
      'Action 1: Coupe une fuite et avance cette periode.',
    ].join('\n'))

    expect(sanitized).not.toMatch(/\b(?:transits?|progressions?|solar[_ ]return|lunar[_ ]return|human[_ ]design[_ ]transits|numerology[_ ]cycles|kua[_ ]directions)\b/i)
    expect(sanitized).toContain('les mouvements de l annee')
    expect(sanitized).toContain('les evolutions de fond')
    expect(sanitized).toContain('la dynamique annuelle')
  })

  it('prefers a naturally radical family over a first maturation item', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Ou mettre mon energie en 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'astrology',
          subCategory: 'astro_progressions',
          sourceType: 'exact_data',
          value: { secondary_progressions: { moon: 'maturite emotionnelle et tri interieur' } },
        },
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'clarifier ton cap et fermer les projets ouverts qui brouillent ton execution' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'engager ton energie sur moins de fronts avec des oui plus nets' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).toContain('Maturer avant d exposer')
    expect(answer.text).toMatch(/Ferme les fronts qui te vident|Coupe le secondaire/)
    expect(answer.text).not.toContain('Ne montre pas trop tot')
  })

  it('keeps yearly pitfalls and timing differentiated for adjacent strategic families', () => {
    const answer = buildFinalAnswer({
      userMessage: 'Quelles sont mes priorites pour 2026 ?',
      responseMode: 'yearly_priority_answer',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'fusion',
          subCategory: 'annual_guidance',
          sourceType: 'exact_data',
          value: { summary: 'fermer des projets ouverts et choisir un cap plus net' },
        },
        {
          science: 'human_design',
          subCategory: 'hd_current_transits',
          sourceType: 'exact_data',
          value: { current_cycle: 'dire oui sur moins de fronts mais avec plus de nettete' },
        },
        {
          science: 'kua',
          subCategory: 'kua_annual_influence',
          sourceType: 'exact_data',
          value: { annualInfluence: 'reconfigurer le cadre concret et simplifier les priorites visibles' },
        },
      ],
      knowledgePacket: makeMinimalKnowledgePacket(),
    })

    expect(answer.text).toMatch(/- Garder des projets tiedes ouverts pour ne decevoir personne\.\s*(Et\s+)?finir par diluer ton axe principal\./i)
    expect(answer.text).toMatch(/- Changer le decor\.\s*Les outils ou l organisation sans changer la vraie decision de fond\./)
    expect(answer.text).not.toContain('Dire oui pour calmer la pression, rester agreable ou ne pas decevoir, puis avancer a vide.')
    expect(answer.text).toContain('Debut d annee: Fais le tri')
    expect(answer.text).toContain('Milieu d annee: Renforce ce qui repond')
    expect(answer.text).toContain('Fin d annee: Garde ce qui tient')
  })
})

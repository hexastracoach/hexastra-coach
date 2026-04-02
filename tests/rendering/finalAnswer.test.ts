import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'
import { classifyUserIntent, isFusionIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { KnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import { validateYearlyPriorityAnswerFormat } from '@/lib/hexastra/rendering/buildYearlyPriorityAnswer'
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
      '',
      '2. Nettoyer tes oui',
      'Pourquoi: Cette annee, ton energie doit aller sur moins de fronts mais de meilleure qualite.',
      'Dans la vraie vie: Refuse une demande non alignee et garde un seul oui fort.',
      '',
      '3. Consolider ce qui tient',
      'Pourquoi: En 2026, les resultats viennent de ce qui tient deja dans le reel.',
      'Dans la vraie vie: Termine un chantier utile avant d en ouvrir un autre.',
      '',
      'CE QUI VA TE FREINER',
      '- Dire oui a des opportunites non alignees.',
      '- Changer le decor sans changer la vraie decision de fond.',
      '',
      'TON TIMING',
      'Debut d annee: Trie et clarifie.',
      'Milieu d annee: Engage-toi nettement.',
      'Fin d annee: Consolide les resultats.',
      '',
      'ACTION IMMEDIATE',
      'Dans les 24 a 72 heures, ferme un engagement secondaire.',
      '',
      '1. Ceci est une numerotation parasite hors du bloc des priorites.',
      '2. Elle ne doit pas etre comptee par le validateur.',
    ].join('\n'))

    expect(validation.priorityCount).toBe(3)
    expect(validation.issues).not.toContain('invalid_priority_count:5')
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

    expect(answer.text).toContain('1. Maturer avant d exposer')
    expect(answer.text).toContain('2. Coupe le secondaire')
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

    expect(answer.text).toContain('- Garder des projets tiedes ouverts pour ne decevoir personne et finir par diluer ton axe principal.')
    expect(answer.text).toContain('- Changer le decor, les outils ou l organisation sans changer la vraie decision de fond.')
    expect(answer.text).not.toContain('Dire oui pour calmer la pression, rester agreable ou ne pas decevoir, puis avancer a vide.')
    expect(answer.text).toContain('Debut d annee: Trie et clarifie.')
    expect(answer.text).toContain('Milieu d annee: Engage-toi nettement.')
    expect(answer.text).toContain('Fin d annee: Fixe le cadre.')
  })
})

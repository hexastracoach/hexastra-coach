import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import {
  buildResponseModeDirective,
  selectResponseMode,
} from '@/lib/hexastra/orchestration/responseModes'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildFusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { arbitrateFusionSignals } from '@/lib/hexastra/orchestrator/arbitrateFusionSignals'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import { postValidateCareerPathAnswer } from '@/lib/hexastra/rendering/postValidateCareerPathAnswer'
import { selectResponseModeSelection } from '@/lib/hexastra/orchestrator/selectResponseMode'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import type { KnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'

const CAREER_QUERY = 'quel metier est fait pour moi ?'

const CAREER_RAW: Record<string, unknown> = {
  tropical: {
    sun: 'Lion',
    mercury: 'Vierge',
    mars: 'Sagittaire',
    saturn: 'Capricorne',
    ascendant: 'Balance',
  },
  midheaven: 'Capricorne',
  house10: { sign: 'Capricorne' },
  house6: { sign: 'Vierge' },
  type_hd: 'Projecteur',
  profil_hd: '2/4',
  autorite_hd: 'Autorite emotionnelle',
  strategie_hd: "Attendre l'invitation",
  hdDefinedCenters: ['Gorge', 'Coeur'],
  enneagram: {
    type_enn: 3,
  },
  exactData: {
    numerology_cycles: {
      lifePath: { number: 7 },
      expression: { value: 3 },
      yearly: {
        personalYearNumber: 6,
      },
    },
    kua_directions: {
      kua_number: 6,
      favorable_directions: ['Ouest', 'Nord-Ouest'],
      element: 'Metal',
    },
  },
}

function makeKnowledgePacket(): KnowledgePacket {
  return {
    domainRoute: 'career',
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
    fusionHints: ['orientation professionnelle'],
  }
}

function makeCareerSignals() {
  return [
    {
      science: 'human_design',
      subCategory: 'type_hd',
      sourceType: 'exact_data',
      value: {
        type_hd: 'Projecteur',
        strategie_hd: "Attendre l'invitation",
      },
    },
    {
      science: 'astrology',
      subCategory: 'vocation_astro',
      sourceType: 'exact_data',
      value: {
        midheaven: 'Capricorne',
        house10: 'Capricorne',
        house6: 'Vierge',
        mars: 'Sagittaire',
      },
    },
    {
      science: 'numerology',
      subCategory: 'num_life_path',
      sourceType: 'exact_data',
      value: {
        lifePath: { number: 7 },
        expression: { value: 3 },
      },
    },
  ]
}

function makeCreativeMovementSignals() {
  return [
    {
      science: 'human_design',
      subCategory: 'type_hd',
      sourceType: 'exact_data',
      value: {
        type_hd: 'Manifestor',
        strategie_hd: 'Informer',
        hdDefinedCenters: ['Gorge'],
      },
    },
    {
      science: 'astrology',
      subCategory: 'vocation_astro',
      sourceType: 'exact_data',
      value: {
        venus: 'Lion',
        mars: 'Sagittaire',
        sun: 'Lion',
      },
    },
    {
      science: 'numerology',
      subCategory: 'num_life_path',
      sourceType: 'exact_data',
      value: {
        lifePath: { number: 3 },
        expression: { value: 3 },
      },
    },
  ]
}

function extractSection(text: string, heading: string, nextHeading?: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedNextHeading = nextHeading?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `${escapedHeading}\\n([\\s\\S]*?)(?:\\n${escapedNextHeading ?? '$'}|$)`,
    'i',
  )

  return text.match(pattern)?.[1]?.trim() ?? ''
}

describe('career guidance routing', () => {
  it('detects a dedicated career intent and routes to career', () => {
    expect(classifyUserIntent(CAREER_QUERY)).toBe('career_guidance')
    expect(classifyQuery(CAREER_QUERY)).toBe('career')
  })

  it.each([
    'quel sont les metier que je peut faire ?',
    'quels metiers me correspondent ?',
    'dans quoi je pourrais travailler ?',
    'dans quoi travailler ?',
    'quel travail me convient ?',
    'quelle voie pro est faite pour moi ?',
  ])('classifies natural career wording as career orientation: %s', (query) => {
    const classification = classifyMessage(query)

    expect(classifyUserIntent(query)).toBe('career_guidance')
    expect(classification.domainRoute).toBe('career')
    expect(classification.subcategory).toBe('career_guidance')
    expect(classification.requestKind).toBe('career_orientation')
  })

  it('keeps natural career wording on the dedicated career mode', () => {
    const query = 'quels metiers me correspondent ?'
    const classification = classifyMessage(query)

    expect(
      selectResponseMode({
        intent: classifyUserIntent(query),
        requestKind: classification.requestKind,
        subcategory: classification.subcategory,
        plan: 'premium',
      }),
    ).toBe('career_path_answer')
  })

  it('selects the dedicated response mode for career guidance', () => {
    expect(
      selectResponseMode({
        intent: 'career_guidance',
        requestKind: 'career_orientation',
        subcategory: 'career_guidance',
        plan: 'premium',
      }),
    ).toBe('career_path_answer')
  })

  it('keeps a work_money fallback on the dedicated career path mode', () => {
    const selection = selectResponseModeSelection({
      userMessage: 'dans quoi travailler ?',
      requestKind: 'unknown',
      subcategory: null,
      plan: 'essential',
      intent: 'work_money',
      retrievalPlan: buildRetrievalPlanFromQuery('dans quoi travailler ?', {
        hasBirthData: true,
        domainRoute: 'career',
      }),
      structuredSignals: [],
    })

    expect(selection.responseMode).toBe('career_path_answer')
    expect(selection.responseMode).not.toBe('concise_fusion_answer')
  })

  it('keeps annual strategic questions on the yearly mode', () => {
    const classification = classifyMessage('sur quoi je dois me concentrer cette annee ?')

    expect(classification.requestKind).toBe('yearly_priorities')
    expect(classification.subcategory).toBe('annual_guidance')
    expect(classification.domainRoute).toBe('fusion')
  })

  it('expands the retrieval plan with work-oriented sciences and subcategories', () => {
    const plan = buildRetrievalPlanFromQuery(CAREER_QUERY, {
      hasBirthData: true,
      domainRoute: 'career',
    })

    expect(plan.sciences).toContain('human_design')
    expect(plan.sciences).toContain('numerology')
    expect(plan.subCategories).toEqual(
      expect.arrayContaining(['fusion_career_money', 'num_career_axis']),
    )
  })
})

describe('career guidance fusion context', () => {
  it('unwraps object numerology values and exposes career fields', () => {
    const ctx = buildFusionContext('career_guidance', CAREER_RAW, 'fr')

    expect(ctx.readingAngle).toContain('Orientation professionnelle')
    expect(ctx.modules.numerology.fields.lifePath).toBe(7)
    expect(ctx.modules.numerology.fields.expression).toBe(3)
    expect(ctx.modules.astrology.fields.midheaven).toBe('Capricorne')
    expect(ctx.modules.astrology.fields.house10).toBe('Capricorne')
    expect(ctx.modules.astrology.fields.house6).toBe('Vierge')
    expect(ctx.modules.kua.fields.favorableDirections).toEqual(['Ouest', 'Nord-Ouest'])
  })

  it('builds a career-oriented arbitration without leaking object rendering', () => {
    const ctx = buildFusionContext('career_guidance', CAREER_RAW, 'fr')
    const arbitration = arbitrateFusionSignals(ctx, 'fr')
    const combined = `${arbitration.mainBlock} ${arbitration.supportPoints.join(' ')}`

    expect(arbitration.questionType).toBe('career_guidance')
    expect(combined).not.toContain('[object Object]')
    expect(combined.toLowerCase()).toContain('orientation')
    expect(combined).toMatch(/Autonomie vs cadre/i)
    expect(combined).toMatch(/Types de roles compatibles|Types de rôles compatibles/i)
  })
})

describe('career guidance rendering safety', () => {
  it('renders life path values cleanly when the source value is an object', () => {
    const answer = buildFinalAnswer({
      userMessage: CAREER_QUERY,
      responseMode: 'calculated_reading',
      openingSignal: null,
      prioritizedSignals: [
        {
          science: 'numerology',
          subCategory: 'num_life_path',
          sourceType: 'exact_data',
          value: {
            lifePath: { number: 7 },
          },
        },
      ],
      knowledgePacket: makeKnowledgePacket(),
    })

    expect(answer.text).toContain('ton chemin de vie est 7')
    expect(answer.text).not.toContain('[object Object]')
  })

  it('renders the dedicated career path structure for free', () => {
    const answer = buildFinalAnswer({
      userMessage: 'quel metier je peux faire ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'free',
    })

    const environments = extractSection(
      answer.text,
      '→ CE QUI TE CORRESPOND NATURELLEMENT',
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
    )
    const aligned = extractSection(
      answer.text,
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '→ CE QUI VA TE BLOQUER',
    )
    const actions = extractSection(
      answer.text,
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
    )

    expect(answer.text).toContain('→ CE QUI TE CORRESPOND NATURELLEMENT')
    expect(answer.text).toContain('→ LES ENVIRONNEMENTS OU METIERS ALIGNES')
    expect(answer.text).toContain('→ CE QUI VA TE BLOQUER')
    expect(answer.text).toContain('→ CE QUE TU PEUX FAIRE MAINTENANT')
    expect((aligned.match(/^\s*-\s+/gm) ?? []).length).toBeGreaterThanOrEqual(2)
    expect((aligned.match(/^\s*-\s+/gm) ?? []).length).toBeLessThanOrEqual(3)
    expect((actions.match(/^\s*-\s+/gm) ?? []).length).toBe(1)
    expect(environments).not.toContain('Human Design')
    expect(answer.text).not.toContain('Projecteur')
  })

  it('renders a more concrete essential career path answer without technical jargon', () => {
    const freeAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'free',
    })

    const essentialAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    })

    const aligned = extractSection(
      essentialAnswer.text,
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '→ CE QUI VA TE BLOQUER',
    )
    const actions = extractSection(
      essentialAnswer.text,
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
    )

    expect((aligned.match(/^\s*-\s+/gm) ?? []).length).toBeGreaterThanOrEqual(3)
    expect((aligned.match(/^\s*-\s+/gm) ?? []).length).toBeLessThanOrEqual(5)
    expect((actions.match(/^\s*-\s+/gm) ?? []).length).toBeGreaterThanOrEqual(1)
    expect((actions.match(/^\s*-\s+/gm) ?? []).length).toBeLessThanOrEqual(2)
    expect(actions).toMatch(/teste|compare|repere|demande|liste/i)
    expect(essentialAnswer.text.length).toBeGreaterThan(freeAnswer.text.length)
    expect(essentialAnswer.text).not.toMatch(/Human Design|numerologie|astrologie|Projecteur|Capricorne/i)
  })

  it('varies the aligned career families for different profiles', () => {
    const analyticalAnswer = buildFinalAnswer({
      userMessage: 'quel metier je peux faire ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    })

    const creativeAnswer = buildFinalAnswer({
      userMessage: 'quel metier je peux faire ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCreativeMovementSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    })

    const analyticalAligned = extractSection(
      analyticalAnswer.text,
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '→ CE QUI VA TE BLOQUER',
    )
    const creativeAligned = extractSection(
      creativeAnswer.text,
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '→ CE QUI VA TE BLOQUER',
    )

    expect(analyticalAligned).not.toBe(creativeAligned)
    expect(analyticalAligned).toMatch(/clarifies|cadre|methode|priorites|relation client/i)
    expect(creativeAligned).toMatch(/idee|visible|message|terrain|lancement/i)
  })

  it('increases density across plans while keeping the structure stable', () => {
    const freeAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'free',
    })

    const essentialAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    })

    const premiumAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'premium',
    })

    const practitionerAnswer = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'praticien',
    })

    expect(freeAnswer.text).toContain('→ CE QUI TE CORRESPOND NATURELLEMENT')
    expect(essentialAnswer.text).toContain('→ LES ENVIRONNEMENTS OU METIERS ALIGNES')
    expect(premiumAnswer.text).toContain('Metiers alignes:')
    expect(practitionerAnswer.text).toContain('Terrain naturel:')
    expect(practitionerAnswer.text).toContain('Vigilance pro:')
    expect(freeAnswer.text.length).toBeLessThan(essentialAnswer.text.length)
    expect(essentialAnswer.text.length).toBeLessThan(premiumAnswer.text.length)
    expect(premiumAnswer.text.length).toBeLessThanOrEqual(practitionerAnswer.text.length)
  })

  it('keeps career answers free of technical jargon and vague formulas', () => {
    const answer = buildFinalAnswer({
      userMessage: 'dans quoi je pourrais travailler ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'premium',
    })

    expect(answer.text).not.toMatch(
      /Human Design|astrologie|numerologie|enneagramme|Kua|Projecteur|Manifestor|Capricorne|Vierge|Sagittaire/i,
    )
    expect(answer.text).not.toMatch(
      /tout est possible|tu es fait pour aider les autres|tu es une personne unique/i,
    )
  })
})

describe('career guidance prompt isolation', () => {
  it('isolates career_path_answer from fusion coaching templates', () => {
    const prompt = buildSystemPrompt({
      plan: 'essential',
      mode: 'libre_avance',
      language: 'fr',
      contextType: 'general',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'career',
      flowStep: 'analysis',
      analysisMode: 'hexastra_fusion',
      fusionOnlyExperience: true,
      responseModeDirective: buildResponseModeDirective('career_path_answer'),
      questionShapeDirective: '# QUESTION_SHAPE: COMMENT -> ACTION_GUIDANCE',
      messages: [{ role: 'user', content: 'Quel metier je peux faire ?' }],
    })

    expect(prompt).toContain('# CAREER_PATH_ANSWER_MODE')
    expect(prompt).toContain('OUTPUT SENTINEL - STRUCTURE FINALE METIER OBLIGATOIRE')
    expect(prompt).toContain('CE QUI TE CORRESPOND NATURELLEMENT')
    expect(prompt).toContain('LES ENVIRONNEMENTS OU METIERS ALIGNES')
    expect(prompt).not.toContain('STRUCTURE DE SORTIE Ã¢â‚¬â€ PLAN PREMIUM')
    expect(prompt).not.toContain('# QUESTION_SHAPE:')
  })
})

describe('career guidance post validation', () => {
  it('corrects forbidden phrases without triggering a fallback', () => {
    const fallbackText = buildFinalAnswer({
      userMessage: 'quel metier je peux faire ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    }).text

    const llmText = [
      '→ CE QUI TE CORRESPOND NATURELLEMENT',
      'Tu peux faire beaucoup de choses.',
      '',
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '- communication',
      '- accompagnement',
      '- coordination',
      '',
      '→ CE QUI VA TE BLOQUER',
      '- rester trop longtemps dans le flou.',
      '',
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
      '- teste un terrain simple cette semaine.',
    ].join('\n')

    const result = postValidateCareerPathAnswer(llmText, {
      userPlan: 'essentiel',
      fallbackText,
    })

    expect(result.valid).toBe(true)
    expect(result.corrected).toBe(true)
    expect(result.fallbackRecommended).toBe(false)
    expect(result.text).not.toMatch(/tu peux faire beaucoup de choses/i)
    expect(result.text).toMatch(/idee claire et comprehensible|presence aide quelqu un a avancer ou decider/i)
  })

  it('adds a missing block automatically instead of falling back', () => {
    const fallbackText = buildFinalAnswer({
      userMessage: 'quels metiers me correspondent ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'essentiel',
    }).text

    const llmText = [
      '→ CE QUI TE CORRESPOND NATURELLEMENT',
      'Tu avances mieux quand tu clarifies une situation.',
      '',
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '- role ou tu clarifies et aides a choisir',
      '- cadre ou tu mets de l ordre dans un projet',
      '- poste ou tu rends une situation plus lisible',
      '',
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
      '- compare deux roles reels cette semaine.',
    ].join('\n')

    const result = postValidateCareerPathAnswer(llmText, {
      userPlan: 'essentiel',
      fallbackText,
    })

    expect(result.valid).toBe(true)
    expect(result.fallbackRecommended).toBe(false)
    expect(result.text).toContain('→ CE QUI VA TE BLOQUER')
    expect(result.correctedSections).toContain('blocked')
  })

  it('lightly enriches overly generic career families without a direct fallback', () => {
    const fallbackText = buildFinalAnswer({
      userMessage: 'dans quoi je pourrais travailler ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'premium',
    }).text

    const llmText = [
      '→ CE QUI TE CORRESPOND NATURELLEMENT',
      'Tu es fait pour aider les autres.',
      '',
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      '- communication',
      '- accompagnement',
      '- coordination',
      '- communication',
      '',
      '→ CE QUI VA TE BLOQUER',
      '- rester dans un travail trop flou.',
      '',
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
      '- teste un role court.',
      '- garde ce qui marche.',
    ].join('\n')

    const result = postValidateCareerPathAnswer(llmText, {
      userPlan: 'premium',
      fallbackText,
    })

    expect(result.valid).toBe(true)
    expect(result.fallbackRecommended).toBe(false)
    expect(result.text).not.toMatch(/tu es fait pour aider les autres|communication\b|accompagnement\b/i)
    expect(result.text).toMatch(/role ou tu rends une idee claire et comprehensible/i)
    expect(result.text).toMatch(/cadre ou ta presence aide quelqu un a avancer ou decider/i)
  })

  it('leaves an already correct career answer untouched', () => {
    const correctText = buildFinalAnswer({
      userMessage: 'quelle voie pro est faite pour moi ?',
      responseMode: 'career_path_answer',
      openingSignal: null,
      prioritizedSignals: makeCareerSignals(),
      knowledgePacket: makeKnowledgePacket(),
      userPlan: 'premium',
    }).text

    const result = postValidateCareerPathAnswer(correctText, {
      userPlan: 'premium',
      fallbackText: correctText,
    })

    expect(result.valid).toBe(true)
    expect(result.corrected).toBe(false)
    expect(result.fallbackRecommended).toBe(false)
    expect(result.text).toBe(correctText)
  })
})

import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import { selectResponseMode } from '@/lib/hexastra/orchestration/responseModes'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildFusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { arbitrateFusionSignals } from '@/lib/hexastra/orchestrator/arbitrateFusionSignals'
import { buildFinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
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

describe('career guidance routing', () => {
  it('detects a dedicated career intent and routes to career', () => {
    expect(classifyUserIntent(CAREER_QUERY)).toBe('career_guidance')
    expect(classifyQuery(CAREER_QUERY)).toBe('career')
  })

  it('selects the dedicated response mode for career guidance', () => {
    expect(
      selectResponseMode({
        intent: 'career_guidance',
        requestKind: 'guidance',
        subcategory: null,
        plan: 'premium',
      }),
    ).toBe('career_fit_answer')
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
})

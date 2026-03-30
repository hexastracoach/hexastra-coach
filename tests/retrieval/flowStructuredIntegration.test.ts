import { describe, expect, it } from 'vitest'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import { buildExactDataRequestFromRetrievalPlan } from '@/lib/hexastra/retrieval/exactDataHintMapper'
import {
  buildStructuredRetrievalSignalsBlock,
  buildStructuredSignals,
} from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import { runKsPipeline } from '@/lib/hexastra/orchestrator/ksPipeline'
import type { FusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'

function makeCompactCore() {
  return {
    dominantDynamic: 'Chercher le bon tempo avant d agir',
    hiddenMechanism: 'Le mouvement juste depend d un signal clair, pas d une impulsion mentale.',
    realTension: 'Une partie veut agir vite, l autre attend une validation plus profonde.',
    visibleEffect: 'Cela cree de l hesitation et des demarrages interrompus.',
    rightMovement: 'Observer le signal dominant avant de lancer quoi que ce soit.',
    decisionSignal: 'La bonne decision vient quand la pression redescend.',
    timingSignal: 'Le cycle demande de lire le moment avant d agir.',
    energyLeak: 'L energie se perd quand la decision part dans toutes les directions.',
    leveragePoint: 'Revenir a un seul axe et le laisser se confirmer.',
    toneHint: 'Ton calme et concret',
    solarToneHint: 'Ton solaire nuance',
    questionType: 'timing',
    signalConfidence: 0.82,
  } as const
}

function makeFusionContext() {
  return {
    intent: 'timing',
    readingAngle: 'Lecture du moment present',
    readingQuestion: 'Que se passe-t-il maintenant ?',
    modulesActivated: ['astrology', 'human_design', 'numerology'],
    dominantModule: 'astrology',
    modules: {
      astrology: { available: true, weight: 0.82, fields: { sunSign: 'Lion' } },
      human_design: { available: true, weight: 0.72, fields: { hdType: 'Projector' } },
      numerology: { available: true, weight: 0.7, fields: { personalYear: 6 } },
      enneagram: { available: false, weight: 0, fields: {}, isHeuristic: false },
      kua: { available: false, weight: 0, fields: {} },
    },
    completeness: 0.78,
    fusionConfidence: 0.8,
    confidenceBreakdown: {
      astrology: 0.82,
      human_design: 0.72,
      numerology: 0.7,
    },
    warnings: [],
    mapping: {} as never,
  } as FusionContext
}

function buildFlowArtifacts(args: {
  query: string
  domainRoute: 'timing' | 'science' | 'decision'
  retrievalResults: LayerResult[]
  exactData?: unknown
}) {
  const retrievalPlan = buildRetrievalPlanFromQuery(args.query)
  const exactDataRequest = buildExactDataRequestFromRetrievalPlan(retrievalPlan)
  const structuredSignals = buildStructuredSignals({
    retrievalPlan,
    retrievalResults: args.retrievalResults,
    exactData: args.exactData,
  })
  const retrievalSignalsBlock = buildStructuredRetrievalSignalsBlock({
    retrievalPlan,
    structuredSignals,
    intent: args.domainRoute,
    flowType: args.domainRoute,
  })
  const knowledgePacket = buildKnowledgePacket({
    results: args.retrievalResults,
    domainRoute: args.domainRoute,
    latestUserMessage: args.query,
    retrievalPlan,
    exactData: args.exactData,
    exactDataRequest,
    structuredSignals,
    ksNarrativeBrief: 'Synthese KS de test.',
    fusionHints: retrievalPlan.subCategories.slice(0, 4),
  })

  return {
    retrievalPlan,
    exactDataRequest,
    structuredSignals,
    retrievalSignalsBlock,
    knowledgePacket,
  }
}

describe('retrieval flow structured integration', () => {
  it('builds a transit-oriented flow envelope and injects retrieval context into ksPipeline', () => {
    const retrievalResults: LayerResult[] = [
      {
        source: 'knowledge',
        fileId: 'astro-1',
        filename: 'Les_transits_de_Saturne.pdf',
        text: 'Transit actuel de Saturne sur les axes de relation et de responsabilite.',
        score: 0.84,
        scienceTag: 'astrolex',
      },
    ]

    const { retrievalPlan, exactDataRequest, structuredSignals, retrievalSignalsBlock, knowledgePacket } =
      buildFlowArtifacts({
        query: 'mes transits actuels',
        domainRoute: 'timing',
        retrievalResults,
        exactData: {
          exactData: {
            transits: {
              saturn: 'Saturne active une phase de structure et de clarification.',
            },
          },
        },
      })

    const ksPipelineOutput = runKsPipeline({
      userIntent: 'timing',
      userMessage: 'mes transits actuels',
      compactCore: makeCompactCore(),
      fusionCtx: makeFusionContext(),
      flowType: 'timing_strategic',
      structuredSignals,
      retrievalPlan,
    })

    expect(retrievalPlan.subCategories).toContain('astro_transits_current')
    expect(exactDataRequest.includeTransits).toBe(true)
    expect(structuredSignals.length).toBeGreaterThan(0)
    expect(structuredSignals[0]?.sourceType).toBe('exact_data')
    expect(structuredSignals[0]?.exactDataSection).toBe('transits')
    expect(retrievalSignalsBlock).toContain('astro_transits_current')
    expect(knowledgePacket?.retrievalPlan?.subCategories).toContain('astro_transits_current')
    expect(knowledgePacket?.exactData).toMatchObject({
      transits: expect.stringContaining('saturn'),
      progressions: null,
      solarReturn: null,
      lunarReturn: null,
      humanDesignTransits: null,
      numerologyCycles: null,
      kuaDirections: null,
    })
    expect(knowledgePacket?.structuredSignals?.[0]?.exactDataSection).toBe('transits')
    expect(ksPipelineOutput.retrievalContext?.subCategories).toContain('astro_transits_current')
    expect(ksPipelineOutput.signals.length).toBeGreaterThan(structuredSignals.length)
  })

  it('builds a human design flow envelope for hd type', () => {
    const { retrievalPlan, exactDataRequest, structuredSignals } = buildFlowArtifacts({
      query: 'mon type hd',
      domainRoute: 'science',
      retrievalResults: [
        {
          source: 'science_focus:human_design',
          fileId: 'hd-1',
          filename: 'PROMPT_PORTEUM.txt',
          text: 'Lecture Human Design du type, de la strategie et de l autorite.',
          score: 0.78,
          scienceTag: 'human_design',
        },
      ],
      exactData: {
        hdProfile: {
          hdType: 'Projector',
          hdAuthority: 'Emotional',
        },
      },
    })

    expect(retrievalPlan.sciences).toContain('human_design')
    expect(retrievalPlan.subCategories).toContain('hd_type')
    expect(exactDataRequest.includeHumanDesignTransits).toBeUndefined()
    expect(structuredSignals[0]?.science).toBe('human_design')
  })

  it('derives numerology cycle flags from personal year', () => {
    const { retrievalPlan, exactDataRequest, structuredSignals } = buildFlowArtifacts({
      query: 'mon année perso',
      domainRoute: 'timing',
      retrievalResults: [
        {
          source: 'knowledge',
          fileId: 'num-1',
          filename: 'Numerologie_Cycle_annuel_2026.pdf',
          text: 'Annee personnelle, cycle annuel et timing numerologique.',
          score: 0.77,
          scienceTag: 'numerologie',
        },
      ],
      exactData: {
        exactData: {
          numerology_cycles: {
            yearly: {
              personalYearNumber: 6,
            },
          },
        },
      },
    })

    expect(retrievalPlan.sciences).toContain('numerology')
    expect(retrievalPlan.subCategories).toContain('num_personal_year')
    expect(exactDataRequest.includeNumerologyCycles).toBe(true)
    expect(structuredSignals[0]?.exactDataSection).toBe('numerologyCycles')
  })

  it('derives advanced astro exact-data flags for returns and progressions', () => {
    const solarReturnPlan = buildRetrievalPlanFromQuery('mon retour solaire')
    const progressionPlan = buildRetrievalPlanFromQuery('mes progressions')

    expect(buildExactDataRequestFromRetrievalPlan(solarReturnPlan).includeSolarReturn).toBe(true)
    expect(buildExactDataRequestFromRetrievalPlan(progressionPlan).includeProgressions).toBe(true)
  })

  it('derives kua spatial hints for bed orientation', () => {
    const { retrievalPlan, exactDataRequest, structuredSignals } = buildFlowArtifacts({
      query: 'orientation de mon lit',
      domainRoute: 'science',
      retrievalResults: [
        {
          source: 'knowledge',
          fileId: 'kua-1',
          filename: 'Feng_Shui_espace_de_vie_et_orientation.pdf',
          text: 'Orientation du lit, espace de vie et directions favorables.',
          score: 0.75,
          scienceTag: 'kua',
        },
      ],
      exactData: {
        exactData: {
          kua_directions: {
            favorable_directions: ['SE', 'E'],
            bed_orientation: 'SE',
          },
        },
      },
    })

    expect(retrievalPlan.subCategories).toContain('kua_bed_orientation')
    expect(exactDataRequest.includeKuaDirections).toBe(true)
    expect(structuredSignals[0]?.science).toBe('kua')
    expect(structuredSignals[0]?.exactDataSection).toBe('kuaDirections')
  })

  it('expands fusion decision phrasing through intent-aware retrieval planning', () => {
    const { retrievalPlan, structuredSignals, knowledgePacket } = buildFlowArtifacts({
      query: 'que dois-je faire maintenant',
      domainRoute: 'decision',
      retrievalResults: [
        {
          source: 'ks_fusion',
          fileId: 'fusion-1',
          filename: 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
          text: 'Synthese fusion pour arbitrage, direction et priorite du moment.',
          score: 0.8,
          scienceTag: 'global',
        },
      ],
    })

    expect(retrievalPlan.subCategories).toContain('fusion_decision')
    expect(retrievalPlan.subCategories).toContain('hd_strategy')
    expect(retrievalPlan.subCategories).toContain('astro_transits_timing')
    expect(structuredSignals.length).toBeGreaterThan(0)
    expect(knowledgePacket?.structuredSignals?.length).toBeGreaterThan(0)
  })
})

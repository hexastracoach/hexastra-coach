/**
 * Tests KS.FUSION.V13 — pipeline complet
 *
 * Couvre :
 *   1. Intent classification — timing_decision + behavior_change
 *   2. Flow type routing
 *   3. KS module resolution
 *   4. FusionEngine (mergeSignals, buildFusionSummary)
 *   5. PriorityField detection
 *   6. KsArbiter
 *   7. KsPipeline complet (avec données mock)
 *   8. Cas standard — pipeline non affecté
 */

import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { resolveFlowType, resolveKsModules, needsBehaviorEngine } from '@/lib/hexastra/orchestration/queryRouter'
import { mergeSignals, computeDominants, resolveContradictions, buildFusionSummary } from '@/lib/hexastra/orchestrator/fusionEngine'
import type { KsSignal } from '@/lib/hexastra/orchestrator/fusionEngine'
import { detectPriorityField } from '@/lib/hexastra/orchestrator/priorityField'
import { applyKsArbiter } from '@/lib/hexastra/orchestrator/ksArbiter'
import { runKsPipeline } from '@/lib/hexastra/orchestrator/ksPipeline'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import type { FusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { getIntentFieldMap } from '@/lib/hexastra/orchestrator/intentFieldMapping'

// ── Données mock ──────────────────────────────────────────────────────────────

const MOCK_COMPACT_CORE: CompactReadingCore = {
  dominantDynamic: 'Énergie de réponse — attend le signal interne avant d\'agir',
  hiddenMechanism: 'Décharge de tension par le comportement compulsif — régulation externe',
  realTension: 'Décision mentale vs signal sacral — tension entre la tête et le corps',
  visibleEffect: 'Rechute à chaque moment de vide ou d\'ennui',
  rightMovement: 'Attendre la saturation naturelle — ne pas décider par volonté pure',
  decisionSignal: 'Signal sacral — attendre la réponse corporelle claire avant de trancher',
  timingSignal: 'Année 3 numéro personel — phase de croissance, énergie en hausse',
  energyLeak: 'Énergie perdue à insister contre le fonctionnement naturel',
  leveragePoint: 'Un seul ajustement : aligner la décision avec le signal interne',
  toneHint: 'Ton ancré — s\'appuyer sur le concret',
  solarToneHint: 'Ton direct et factuel',
  questionType: 'timing_decision',
  signalConfidence: 0.78,
}

const MOCK_FUSION_CTX: FusionContext = {
  intent: 'timing_decision',
  readingAngle: 'timing stratégique',
  readingQuestion: 'quel est le meilleur moment pour arrêter ?',
  modulesActivated: ['astrology', 'human_design', 'numerology'],
  dominantModule: 'human_design',
  mapping: getIntentFieldMap('timing'),
  modules: {
    astrology: {
      available: true,
      weight: 0.25,
      fields: { sunSign: 'taureau', yearPersonal: '3' },
    },
    human_design: {
      available: true,
      weight: 0.30,
      fields: { hdType: 'générateur', hdAuthority: 'sacrale' },
      isHeuristic: false,
    },
    numerology: {
      available: true,
      weight: 0.20,
      fields: { lifePath: '7', personalYear: '3' },
    },
    enneagram: {
      available: false,
      weight: 0,
      fields: {},
      isHeuristic: true,
    },
    kua: {
      available: false,
      weight: 0,
      fields: {},
    },
  },
  fusionConfidence: 0.75,
  completeness: 0.70,
  confidenceBreakdown: { astrology: 0.75, human_design: 0.80, numerology: 0.68, enneagram: 0, kua: 0 },
  warnings: [],
}

// ── Bloc 1 : Intent classification ────────────────────────────────────────────

describe('Intent classification — timing_decision', () => {
  it('détecte timing_decision pour "je veux arrêter de fumer, quel est le meilleur moment ?"', () => {
    const intent = classifyUserIntent('je veux arrêter de fumer, quel est le meilleur moment ?')
    expect(intent).toBe('timing_decision')
  })

  it('détecte timing_decision pour "est-ce le bon moment pour quitter mon emploi ?"', () => {
    const intent = classifyUserIntent('est-ce le bon moment pour quitter mon emploi ?')
    expect(intent).toBe('timing_decision')
  })

  it('détecte timing_decision pour "meilleur moment pour me lancer dans mon projet"', () => {
    const intent = classifyUserIntent('quel est le meilleur moment pour me lancer dans mon projet ?')
    expect(intent).toBe('timing_decision')
  })

  it('détecte timing_decision pour "quand dois-je arrêter de procrastiner ?"', () => {
    const intent = classifyUserIntent('quand dois-je arrêter de procrastiner ?')
    expect(intent).toBe('timing_decision')
  })
})

describe('Intent classification — behavior_change', () => {
  it('détecte behavior_change pour "je veux arrêter de procrastiner"', () => {
    const intent = classifyUserIntent('je veux arrêter de procrastiner')
    expect(intent).toBe('behavior_change')
  })

  it('détecte behavior_change pour "comment me débarrasser de mon addiction aux réseaux ?"', () => {
    const intent = classifyUserIntent('comment me débarrasser de mon addiction aux réseaux ?')
    expect(intent).toBe('behavior_change')
  })

  it('détecte behavior_change pour "je veux changer cette habitude négative"', () => {
    const intent = classifyUserIntent('je veux changer cette habitude négative')
    expect(intent).toBe('behavior_change')
  })
})

describe('Intent classification — standard (non affecté)', () => {
  it('détecte fusion_general_question pour "que se passe-t-il dans ma vie en ce moment ?"', () => {
    const intent = classifyUserIntent('que se passe-t-il dans ma vie en ce moment ?')
    expect(intent).toBe('fusion_general_question')
  })

  it('détecte un intent fusion (blocage ou fusion_general) pour "pourquoi je me sens bloqué ?"', () => {
    const intent = classifyUserIntent('pourquoi je me sens bloqué ?')
    // "bloqué" → blocage (intent fusion valide) — les deux sont des intents fusion standard
    expect(['fusion_general_question', 'blocage']).toContain(intent)
    expect(resolveFlowType(intent as any)).toBe('standard')
  })
})

// ── Bloc 2 : Flow type routing ────────────────────────────────────────────────

describe('Flow type routing', () => {
  it('timing_decision → timing_strategic', () => {
    expect(resolveFlowType('timing_decision')).toBe('timing_strategic')
  })

  it('behavior_change → behavior', () => {
    expect(resolveFlowType('behavior_change')).toBe('behavior')
  })

  it('fusion_general_question → standard', () => {
    expect(resolveFlowType('fusion_general_question')).toBe('standard')
  })

  it('needsBehaviorEngine → true pour timing_strategic et behavior', () => {
    expect(needsBehaviorEngine('timing_strategic')).toBe(true)
    expect(needsBehaviorEngine('behavior')).toBe(true)
    expect(needsBehaviorEngine('standard')).toBe(false)
  })
})

// ── Bloc 3 : KS module resolution ─────────────────────────────────────────────

describe('KS module resolution', () => {
  it('timing_strategic + exactData → inclut KS.Threshold.Timing et KS.Porteum', () => {
    const modules = resolveKsModules({
      intent: 'timing_decision',
      flowType: 'timing_strategic',
      hasBirthData: true,
      hasExactData: true,
    })
    expect(modules).toContain('KS.Threshold.Timing')
    expect(modules).toContain('KS.Presence.Field')
    expect(modules).toContain('KS.Resonance.Balance')
    expect(modules).toContain('KS.Porteum')
  })

  it('timing_strategic sans data → pas de KS.Porteum', () => {
    const modules = resolveKsModules({
      intent: 'timing_decision',
      flowType: 'timing_strategic',
      hasBirthData: false,
      hasExactData: false,
    })
    expect(modules).not.toContain('KS.Porteum')
  })

  it('behavior + exactData → inclut KS.DeconditioMap', () => {
    const modules = resolveKsModules({
      intent: 'behavior_change',
      flowType: 'behavior',
      hasBirthData: true,
      hasExactData: true,
    })
    expect(modules).toContain('KS.DeconditioMap')
    expect(modules).toContain('KS.Porteum')
  })

  it('standard → tableau vide', () => {
    const modules = resolveKsModules({
      intent: 'fusion_general_question',
      flowType: 'standard',
    })
    expect(modules).toHaveLength(0)
  })
})

// ── Bloc 4 : Fusion Engine ────────────────────────────────────────────────────

const MOCK_SIGNALS: KsSignal[] = [
  {
    module: 'KS.Threshold.Timing',
    sourceLayer: 'cosmos',
    signals: [{ tag: 'timing_signal', description: 'Année 3 — phase de croissance', intensity: 0.8, confidence: 0.75 }],
    phaseHint: 'activation',
    zoneHint: 'direction',
    opportunityFlag: true,
  },
  {
    module: 'KS.Presence.Field',
    sourceLayer: 'human',
    signals: [
      { tag: 'presence_field', description: 'Signal sacral — attendre la réponse corporelle', intensity: 0.75, confidence: 0.72 },
      { tag: 'real_tension', description: 'Tension décision mentale vs sacrale', intensity: 0.65, confidence: 0.68 },
    ],
    zoneHint: 'identity',
    riskFlag: true,
  },
  {
    module: 'KS.Strategic.Arbiter',
    sourceLayer: 'strategic',
    signals: [
      { tag: 'right_movement', description: 'Attendre saturation naturelle', intensity: 0.80, confidence: 0.78 },
      { tag: 'energy_leak', description: 'Énergie perdue dans la résistance', intensity: 0.70, confidence: 0.70 },
    ],
    opportunityFlag: true,
  },
]

describe('Fusion Engine', () => {
  it('mergeSignals retourne tous les signaux sans perte', () => {
    const merged = mergeSignals(MOCK_SIGNALS)
    // Tous les signaux doivent être présents
    expect(merged.length).toBe(MOCK_SIGNALS.length)
    // Les modules doivent tous être représentés
    const modules = merged.map(s => s.module)
    expect(modules).toContain('KS.Threshold.Timing')
    expect(modules).toContain('KS.Presence.Field')
    expect(modules).toContain('KS.Strategic.Arbiter')
  })

  it('computeDominants retourne un signal dominant et une phase', () => {
    const { dominantSignal, dominantPhase, dominantZone } = computeDominants(MOCK_SIGNALS)
    expect(typeof dominantSignal).toBe('string')
    expect(dominantSignal.length).toBeGreaterThan(0)
    // la seule phase déclarée est 'activation'
    expect(dominantPhase).toBe('activation')
  })

  it('resolveContradictions détecte risk_vs_opportunity', () => {
    const contradictions = resolveContradictions(MOCK_SIGNALS)
    expect(contradictions).toContain('risk_vs_opportunity')
  })

  it('buildFusionSummary retourne une synthèse avec phase et stratégie', () => {
    const summary = buildFusionSummary(MOCK_SIGNALS)
    expect(summary.dominantSignal).toBeTruthy()
    expect(summary.dominantPhase).toBe('activation')
    expect(['action', 'prudence', 'observation', 'stabilisation']).toContain(summary.answerStrategy)
    expect(summary.sentinelStatus).toMatch(/validated|degraded/)
    expect(typeof summary.confidenceScore).toBe('number')
  })

  it('buildFusionSummary sans signaux retourne un état par défaut', () => {
    const summary = buildFusionSummary([])
    expect(summary.answerStrategy).toBe('observation')
    expect(summary.sentinelStatus).toBe('validated')
  })
})

// ── Bloc 5 : Priority Field ───────────────────────────────────────────────────

describe('Priority Field detection', () => {
  it('détecte direction pour une question de timing décision', () => {
    const result = detectPriorityField({
      userQuestion: 'je veux arrêter de fumer, quel est le meilleur moment ?',
      fusionSummary: buildFusionSummary(MOCK_SIGNALS),
      context: { intent: 'timing_decision' },
    })
    expect(['direction', 'identity', 'expansion']).toContain(result.dominantField)
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(10)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('retourne un champ dominant même sans signal explicite dans la question', () => {
    const result = detectPriorityField({
      userQuestion: 'que faire maintenant ?',
      fusionSummary: buildFusionSummary(MOCK_SIGNALS),
      context: { intent: 'timing_decision' },
    })
    expect(result.dominantField).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
  })
})

// ── Bloc 6 : KsArbiter ────────────────────────────────────────────────────────

describe('KsArbiter', () => {
  it('retourne un narrativeFocus non vide', () => {
    const fusionSummary = buildFusionSummary(MOCK_SIGNALS)
    const priorityField = detectPriorityField({
      userQuestion: 'je veux arrêter de fumer, quel est le meilleur moment ?',
      fusionSummary,
      context: { intent: 'timing_decision' },
    })
    const result = applyKsArbiter({
      fusionSummary,
      priorityField,
      flowType: 'timing_strategic',
      intent: 'timing_decision',
    })
    expect(result.narrativeFocus.length).toBeGreaterThan(20)
    expect(result.dominantDynamic.length).toBeGreaterThan(5)
    expect(['action', 'prudence', 'observation', 'stabilisation']).toContain(result.answerStrategy)
  })
})

// ── Bloc 7 : KsPipeline complet ───────────────────────────────────────────────

describe('KsPipeline complet', () => {
  it('produit une sortie valide pour "je veux arrêter de fumer, quel est le meilleur moment ?"', () => {
    const output = runKsPipeline({
      userIntent: 'timing_decision',
      userMessage: 'je veux arrêter de fumer, quel est le meilleur moment ?',
      compactCore: MOCK_COMPACT_CORE,
      fusionCtx: MOCK_FUSION_CTX,
      flowType: 'timing_strategic',
      lang: 'fr',
    })

    // Modules
    expect(output.ksModules).toContain('KS.Threshold.Timing')
    expect(output.ksModules.length).toBeGreaterThan(0)

    // Signals
    expect(output.signals.length).toBeGreaterThan(0)

    // FusionSummary
    expect(output.fusionSummary.dominantSignal).toBeTruthy()
    expect(typeof output.fusionSummary.answerStrategy).toBe('string')

    // Arbiter
    expect(output.arbiter.narrativeFocus.length).toBeGreaterThan(20)
    expect(output.arbiter.dominantDynamic.length).toBeGreaterThan(5)

    // Directive
    expect(output.arbiterDirective).toContain('KS.FUSION.V13')
    expect(output.arbiterDirective.length).toBeGreaterThan(50)
  })

  it('produit une sortie valide pour behavior_change', () => {
    const output = runKsPipeline({
      userIntent: 'behavior_change',
      userMessage: 'je veux arrêter de procrastiner',
      compactCore: MOCK_COMPACT_CORE,
      fusionCtx: MOCK_FUSION_CTX,
      flowType: 'behavior',
      lang: 'fr',
    })
    expect(output.ksModules).toContain('KS.Presence.Field')
    expect(output.arbiterDirective).toBeTruthy()
  })
})

// ── Bloc 8 : Standard flow non affecté ───────────────────────────────────────

describe('Standard flow — non modifié', () => {
  it('resolveFlowType retourne standard pour tous les intents non spécialisés', () => {
    const standardIntents = [
      'fusion_general_question',
      'relationship',
      'love',
      'inner_state',
      'identity',
      'life_period',
      'decision',
      'work_money',
      'blocage',
      'timing',
    ] as const
    for (const intent of standardIntents) {
      expect(resolveFlowType(intent)).toBe('standard')
    }
  })

  it('resolveKsModules retourne [] pour standard', () => {
    expect(resolveKsModules({ intent: 'fusion_general_question', flowType: 'standard' })).toHaveLength(0)
  })
})

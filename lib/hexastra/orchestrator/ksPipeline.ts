/**
 * KS Pipeline — KS.FUSION.V13
 *
 * Orchestre le pipeline complet en 9 étapes :
 *
 *   1. intent classification         (fait en amont dans runHexastraFlow)
 *   2. flow type                     (fait en amont)
 *   3. ks modules resolution         → resolveKsModules()
 *   4. module outputs / signals      → buildKsSignalsFromFusion()
 *   5. fusion engine                 → buildFusionSummary()
 *   6. priority field                → detectPriorityField()
 *   7. arbiter                       → applyKsArbiter()
 *   8. sentinel                      → contrôle qualité (degraded check)
 *   9. narrative composer            → buildArbiterDirective()
 *
 * Entrée  : CompactReadingCore + FusionContext + intent + flowType
 * Sortie  : directive string prête pour injection dans le system prompt
 */

import type { CompactReadingCore } from './compactReadingCore'
import type { FusionContext } from './buildFusionContext'
import type { UserIntent } from '../orchestration/intentClassifier'
import type { FlowType } from '../orchestration/queryRouter'
import { resolveKsModules } from '../orchestration/queryRouter'
import {
  type KsSignal,
  type FusionSummary,
  type KsZoneHint,
  type KsPhaseHint,
  buildFusionSummary,
} from './fusionEngine'
import { detectPriorityField, type PriorityFieldResult } from './priorityField'
import { applyKsArbiter, type KsArbiterResult } from './ksArbiter'

// ── Types ─────────────────────────────────────────────────────────────────────

export type KsPipelineInput = {
  userIntent: UserIntent
  userMessage: string
  compactCore: CompactReadingCore
  fusionCtx: FusionContext
  flowType: FlowType
  lang?: string
  /** Signaux additionnels issus du retrieval vectoriel (extractRetrievalSignals) */
  additionalSignals?: KsSignal[]
}

export type KsPipelineOutput = {
  ksModules: string[]
  signals: KsSignal[]
  fusionSummary: FusionSummary
  priorityField: PriorityFieldResult
  arbiter: KsArbiterResult
  arbiterDirective: string
}

// ── Module → KS label mapping ─────────────────────────────────────────────────

const MODULE_TO_KS: Record<string, string> = {
  astrology:    'KS.Threshold.Timing',
  human_design: 'KS.Presence.Field',
  numerology:   'KS.Resonance.Balance',
  enneagram:    'KS.Porteum',
  kua:          'KS.DeconditioMap',
}

// ── Helpers de conversion phase/zone ──────────────────────────────────────────

function inferPhase(text: string): KsPhaseHint | null {
  const t = text.toLowerCase()
  if (/activ|lancer|demarr|commencer|initier/.test(t)) return 'activation'
  if (/stabil|consolid|ancr|poser les bases|maintenir/.test(t)) return 'stabilisation'
  if (/transit|changement|passage|transformation|basculer/.test(t)) return 'transition'
  return null
}

function inferZone(text: string): KsZoneHint | null {
  const t = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/securit|stable|argent|logement|emploi/.test(t)) return 'security'
  if (/relation|couple|famille|entourage/.test(t)) return 'relation'
  if (/identit|nature|fonctionnement|qui je/.test(t)) return 'identity'
  if (/direction|voie|chemin|decision|orienter/.test(t)) return 'direction'
  if (/avancer|developper|creer|lancer|progresser/.test(t)) return 'expansion'
  if (/sens|mission|raison|signif|comprendre/.test(t)) return 'meaning'
  return null
}

// ── Étape 4 : conversion CompactCore + FusionContext → KsSignal[] ─────────────

function buildKsSignalsFromFusion(
  compactCore: CompactReadingCore,
  fusionCtx: FusionContext,
  activeKsModules: string[],
): KsSignal[] {
  const signals: KsSignal[] = []

  // Astrology → cosmos → KS.Threshold.Timing
  if (
    fusionCtx.modules.astrology.available &&
    (activeKsModules.length === 0 || activeKsModules.includes('KS.Threshold.Timing'))
  ) {
    signals.push({
      module: 'KS.Threshold.Timing',
      sourceLayer: 'cosmos',
      signals: [
        {
          tag: 'timing_signal',
          description: compactCore.timingSignal,
          intensity: fusionCtx.modules.astrology.weight,
          confidence: 0.75,
        },
      ],
      phaseHint: inferPhase(compactCore.timingSignal),
      zoneHint: inferZone(compactCore.timingSignal) ?? 'direction',
      riskFlag: false,
      opportunityFlag: /moment|propice|favorable|bon/.test(compactCore.timingSignal.toLowerCase()),
    })
  }

  // Human Design → human → KS.Presence.Field
  if (
    fusionCtx.modules.human_design.available &&
    (activeKsModules.length === 0 || activeKsModules.includes('KS.Presence.Field'))
  ) {
    signals.push({
      module: 'KS.Presence.Field',
      sourceLayer: 'human',
      signals: [
        {
          tag: 'presence_field',
          description: compactCore.decisionSignal,
          intensity: fusionCtx.modules.human_design.weight,
          confidence: 0.72,
        },
        {
          tag: 'real_tension',
          description: compactCore.realTension,
          intensity: fusionCtx.modules.human_design.weight * 0.85,
          confidence: 0.68,
        },
      ],
      zoneHint: 'identity',
      riskFlag: compactCore.realTension.length > 30,
      opportunityFlag: false,
    })
  }

  // Numerology → symbolic → KS.Resonance.Balance
  if (
    fusionCtx.modules.numerology.available &&
    (activeKsModules.length === 0 || activeKsModules.includes('KS.Resonance.Balance'))
  ) {
    signals.push({
      module: 'KS.Resonance.Balance',
      sourceLayer: 'symbolic',
      signals: [
        {
          tag: 'cycle_resonance',
          description: compactCore.timingSignal,
          intensity: fusionCtx.modules.numerology.weight * 0.9,
          confidence: 0.68,
        },
      ],
      phaseHint: inferPhase(compactCore.timingSignal),
    })
  }

  // Enneagram → human → KS.Porteum
  if (
    fusionCtx.modules.enneagram.available &&
    (activeKsModules.length === 0 || activeKsModules.includes('KS.Porteum'))
  ) {
    signals.push({
      module: 'KS.Porteum',
      sourceLayer: 'human',
      signals: [
        {
          tag: 'core_motivation',
          description: compactCore.hiddenMechanism,
          intensity: fusionCtx.modules.enneagram.weight,
          confidence: fusionCtx.modules.enneagram.isHeuristic ? 0.50 : 0.70,
        },
      ],
      zoneHint: inferZone(compactCore.hiddenMechanism),
    })
  }

  // Kua → nature → KS.DeconditioMap
  if (
    fusionCtx.modules.kua.available &&
    (activeKsModules.length === 0 || activeKsModules.includes('KS.DeconditioMap'))
  ) {
    signals.push({
      module: 'KS.DeconditioMap',
      sourceLayer: 'nature',
      signals: [
        {
          tag: 'directional_anchor',
          description: compactCore.leveragePoint,
          intensity: fusionCtx.modules.kua.weight,
          confidence: 0.65,
        },
      ],
    })
  }

  // Strategic layer → toujours présent — compactCore direct
  signals.push({
    module: 'KS.Strategic.Arbiter',
    sourceLayer: 'strategic',
    signals: [
      {
        tag: 'right_movement',
        description: compactCore.rightMovement,
        intensity: 0.80,
        confidence: compactCore.signalConfidence,
      },
      {
        tag: 'energy_leak',
        description: compactCore.energyLeak,
        intensity: 0.70,
        confidence: compactCore.signalConfidence * 0.90,
      },
    ],
    riskFlag: compactCore.realTension.length > 20,
    opportunityFlag: compactCore.rightMovement.length > 10,
    notes: compactCore.dominantDynamic,
  })

  return signals
}

// ── Labels locaux phase / zone (FR) ───────────────────────────────────────────

const ZONE_LABELS_FR: Record<string, string> = {
  security:     'la sécurité et la stabilité',
  relation:     'les dynamiques relationnelles',
  identity:     'l\'identité et le fonctionnement interne',
  direction:    'l\'orientation et la décision',
  expansion:    'la croissance et l\'avancement',
  meaning:      'le sens et la raison d\'être',
}

const PHASE_LABELS_FR: Record<string, string> = {
  activation:    'activation (phase de lancement)',
  stabilisation: 'stabilisation (phase de consolidation)',
  transition:    'transition (phase de changement)',
}

// ── Étape 9a : Directive timing stratégique ────────────────────────────────────
//
// Utilisée UNIQUEMENT quand flowType === 'timing_strategic'.
// Injecte directement les valeurs calculées (timingSignal, realTension, etc.)
// pour forcer la réponse LLM à refléter le pipeline, pas un coaching générique.

function buildTimingNarrativeDirective(
  arbiter: KsArbiterResult,
  fusionSummary: FusionSummary,
  compactCore: CompactReadingCore,
): string {
  const zoneLabel  = ZONE_LABELS_FR[fusionSummary.dominantZone  ?? ''] ?? (fusionSummary.dominantZone  ?? 'non identifiée')
  const phaseLabel = PHASE_LABELS_FR[fusionSummary.dominantPhase ?? ''] ?? (fusionSummary.dominantPhase ?? 'non identifiée')

  return [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'KS.FUSION.V13 — DIRECTIVE TIMING STRATÉGIQUE',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '── DONNÉES CALCULÉES — SOURCE DE VÉRITÉ ──',
    `KS.Threshold.Timing   : ${compactCore.timingSignal}`,
    `KS.Fusion.Engine.Phase: ${phaseLabel}`,
    `KS.Fusion.Engine.Zone : ${zoneLabel}`,
    `KS.Fusion.Engine.Signal: ${fusionSummary.dominantSignal}`,
    `KS.Presence.Field     : ${compactCore.decisionSignal}`,
    `KS.Porteum.Tension    : ${compactCore.realTension}`,
    `KS.Porteum.Leak       : ${compactCore.energyLeak}`,
    `KS.Arbiter.Movement   : ${compactCore.rightMovement}`,
    '',
    '── KS.ARBITER ─────────────────────────────',
    `DYNAMIQUE   : ${arbiter.dominantDynamic}`,
    arbiter.supportingDynamic ? `TENSION     : ${arbiter.supportingDynamic}` : null,
    `STRATÉGIE   : ${arbiter.answerStrategy.toUpperCase()}`,
    `FOCUS UNIQUE: ${arbiter.narrativeFocus}`,
    '',
    '── STRUCTURE OBLIGATOIRE — 4 BLOCS ────────',
    '',
    'BLOC 1 — LE MOMENT EXACT (obligatoire, non négociable)',
    `  Source : "${compactCore.timingSignal}"`,
    '  → Nommer UN moment précis et identifiable.',
    '  → Exemples valides : "après saturation naturelle", "début de cycle X",',
    '    "quand [signal observable] se déclenche", "en phase d\'activation du cycle".',
    '  → INTERDIT : "quand tu seras prêt", "quand tu sentiras", vague temporel.',
    '',
    'BLOC 2 — LES SIGNAUX OBSERVABLES (obligatoire)',
    `  Sources : "${compactCore.realTension}" + "${compactCore.energyLeak}"`,
    '  → Lister 2 à 3 signaux physiques ou comportementaux concrets.',
    '  → La personne doit pouvoir les reconnaître elle-même sans interprétation.',
    '  → Exemples valides : dégoût naturel, fatigue persistante, perte d\'envie',
    '    franche, tension corporelle forte, incapacité à continuer sans forçage.',
    '',
    'BLOC 3 — LES MOMENTS À ÉVITER (obligatoire)',
    '  → Nommer les conditions précises où la décision échoue systématiquement.',
    '  → Exemples valides : vide émotionnel, ennui, pression externe de délai,',
    '    décision prise mentalement sans signal corporel, période de stress aigu.',
    '',
    'BLOC 4 — L\'ACTION IMMÉDIATE (obligatoire)',
    `  Sources : "${compactCore.rightMovement}" + "${compactCore.decisionSignal}"`,
    '  → UNE seule action. Verbe à l\'impératif + objet précis + contexte.',
    '  → Faisable aujourd\'hui ou cette semaine.',
    '  → INTERDIT : "réfléchis à", "envisage de", formulation ouverte sans objet.',
    '',
    '── INTERDICTIONS ABSOLUES ─────────────────',
    '"écoute-toi"           → INTERDIT — remplacer par une condition observable',
    '"quand tu seras prêt"  → INTERDIT — remplacer par un signal physique/comportemental',
    '"suis ton intuition"   → INTERDIT — remplacer par le mécanisme de décision calculé',
    '"suis ton instinct"    → INTERDIT — même règle',
    'Sphères hors focus     → INTERDIT — pas de sphère émotionnelle, énergétique,',
    '                          spirituelle, ou extérieure non liée au timing',
    'Angles multiples       → INTERDIT — UN seul focus : TIMING STRATÉGIQUE',
    '',
    '── RÈGLE DE CLÔTURE ───────────────────────',
    arbiter.answerStrategy === 'action'
      ? 'Terminer OBLIGATOIREMENT sur le BLOC 4 (action immédiate). Pas de question ouverte.'
      : arbiter.answerStrategy === 'prudence'
      ? 'Terminer sur les conditions PRÉCISES à éviter + signal d\'alerte identifiable.'
      : 'Terminer sur les signaux à observer avant d\'agir.',
    '',
    fusionSummary.sentinelStatus === 'degraded'
      ? 'SENTINEL DÉGRADÉ — Signaux contradictoires détectés. Maintenir la posture d\'observation. Ne pas résoudre artificiellement.'
      : null,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ].filter((l): l is string => l !== null).join('\n')
}

// ── Étape 9b : Directive générique (non-timing) ────────────────────────────────

function buildArbiterDirective(
  arbiter: KsArbiterResult,
  fusionSummary: FusionSummary,
  isFr: boolean,
  flowType: FlowType,
  compactCore: CompactReadingCore,
): string {
  // Chemin timing_strategic : directive spécialisée avec données calculées injectées
  if (flowType === 'timing_strategic') {
    return buildTimingNarrativeDirective(arbiter, fusionSummary, compactCore)
  }

  if (!isFr) {
    return [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'KS.FUSION.V13 — ORCHESTRATION DIRECTIVE',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `DOMINANT DYNAMIC: ${arbiter.dominantDynamic}`,
      arbiter.supportingDynamic ? `SUPPORTING TENSION: ${arbiter.supportingDynamic}` : null,
      '',
      `NARRATIVE FOCUS (SINGLE — DO NOT EXPAND): ${arbiter.narrativeFocus}`,
      '',
      `ANSWER STRATEGY: ${arbiter.answerStrategy.toUpperCase()}`,
      `PHASE: ${fusionSummary.dominantPhase ?? 'not detected'}`,
      `ZONE: ${fusionSummary.dominantZone ?? 'not detected'}`,
      `CONFIDENCE: ${fusionSummary.confidenceScore}`,
      `SENTINEL: ${fusionSummary.sentinelStatus}`,
      '',
      '── ANTI-EXPANSION RULES ────────────────────',
      'RULE 1 — ONE FOCUS ONLY: Develop ONLY the narrative focus above. Do not add secondary angles, life advice, or general encouragement.',
      'RULE 2 — ACTION CLOSURE: If strategy = action → end with ONE concrete action. No observation, no open question.',
      'RULE 3 — RISK NAMING: If strategy = prudence → name the SPECIFIC risk. No generic warnings.',
      'RULE 4 — NO GENERIC SPIRITUALITY: Do not write "listen to yourself", "when you feel ready", "trust your intuition" — these are forbidden.',
      'RULE 5 — SINGLE DOMINANT LINE: Every paragraph must serve the unique focus. Remove anything that does not.',
      fusionSummary.sentinelStatus === 'degraded' ? 'SENTINEL DEGRADED — Contradictory signals detected. Maintain observational stance. Do not resolve artificially.' : null,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].filter((l): l is string => l !== null).join('\n')
  }

  return [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'KS.FUSION.V13 — DIRECTIVE D\'ORCHESTRATION',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `DYNAMIQUE DOMINANTE : ${arbiter.dominantDynamic}`,
    arbiter.supportingDynamic ? `TENSION SECONDAIRE : ${arbiter.supportingDynamic}` : null,
    '',
    `FOCUS NARRATIF UNIQUE (NE PAS ÉLARGIR) : ${arbiter.narrativeFocus}`,
    '',
    `STRATÉGIE : ${arbiter.answerStrategy.toUpperCase()}`,
    `PHASE : ${fusionSummary.dominantPhase ?? 'non détectée'}`,
    `ZONE : ${fusionSummary.dominantZone ?? 'non détectée'}`,
    `CONFIANCE : ${fusionSummary.confidenceScore}`,
    `SENTINEL : ${fusionSummary.sentinelStatus}`,
    '',
    '── RÈGLES ANTI-EXPANSION ──────────────────',
    'RÈGLE 1 — UN SEUL FOCUS : Développer UNIQUEMENT le focus narratif ci-dessus. Ne pas ajouter d\'angles secondaires, de conseils de vie ou d\'encouragements génériques.',
    'RÈGLE 2 — CLÔTURE PAR L\'ACTION : Si stratégie = action → terminer sur UNE action concrète. Pas d\'observation, pas de question ouverte.',
    'RÈGLE 3 — NOMMER LE RISQUE : Si stratégie = prudence → nommer le risque PRÉCIS. Pas de mise en garde générique.',
    'RÈGLE 4 — ZÉRO SPIRITUALITÉ GÉNÉRIQUE : Ne jamais écrire "écoute-toi", "quand tu seras prêt", "suis ton intuition" — phrases interdites.',
    'RÈGLE 5 — LIGNE DIRECTRICE UNIQUE : Chaque paragraphe doit servir le focus unique. Supprimer tout ce qui ne s\'y rattache pas directement.',
    fusionSummary.sentinelStatus === 'degraded' ? 'SENTINEL DÉGRADÉ — Signaux contradictoires détectés. Maintenir la posture d\'observation. Ne pas résoudre artificiellement.' : null,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ].filter((l): l is string => l !== null).join('\n')
}

// ── Pipeline principal ────────────────────────────────────────────────────────

/**
 * Lance le pipeline KS.FUSION.V13 complet.
 * Appelé depuis runHexastraFlow après que compactCore soit disponible.
 */
export function runKsPipeline(input: KsPipelineInput): KsPipelineOutput {
  const { userIntent, userMessage, compactCore, fusionCtx, flowType, lang = 'fr', additionalSignals } = input
  const isFr = !lang.startsWith('en')

  // Étape 3 — Module resolution
  const hasBirthData = Object.values(fusionCtx.modules).some(m => m.available)
  const hasExactData = fusionCtx.fusionConfidence > 0.5
  const ksModules = resolveKsModules({ intent: userIntent, flowType, hasBirthData, hasExactData })

  // Étape 4 — Conversion en KsSignal[]
  const coreSignals = buildKsSignalsFromFusion(compactCore, fusionCtx, ksModules)

  // Merge signaux retrieval vectoriel (si présents) — enrichissent sans écraser
  const signals = additionalSignals && additionalSignals.length > 0
    ? [...coreSignals, ...additionalSignals]
    : coreSignals

  // Étape 5 — Fusion Engine
  const fusionSummary = buildFusionSummary(signals)

  // Étape 6 — Priority Field
  const priorityFieldResult = detectPriorityField({
    userQuestion: userMessage,
    fusionSummary,
    context: { intent: userIntent, lang },
  })

  // Étape 7 — Arbiter
  const arbiterResult = applyKsArbiter({
    fusionSummary,
    priorityField: priorityFieldResult,
    flowType,
    intent: userIntent,
  })

  // Étape 8 — Sentinel (intégré dans fusionSummary.sentinelStatus)
  // degraded → signaux contradictoires trop nombreux, strategy = observation

  // Étape 9 — Narrative Composer
  // timing_strategic → buildTimingNarrativeDirective (valeurs calculées injectées)
  // standard / behavior → buildArbiterDirective générique
  const arbiterDirective = buildArbiterDirective(arbiterResult, fusionSummary, isFr, flowType, compactCore)

  return {
    ksModules,
    signals,
    fusionSummary,
    priorityField: priorityFieldResult,
    arbiter: arbiterResult,
    arbiterDirective,
  }
}

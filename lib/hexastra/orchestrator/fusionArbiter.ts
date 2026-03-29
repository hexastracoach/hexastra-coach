/**
 * fusionArbiter — Hexastra Coach
 *
 * Façade propre du pipeline d'arbitrage de lecture intelligent.
 *
 * Orchestre :
 *   INTENT → QUESTION TYPE → FIELD MAP → FUSION ARBITER → COMPACT READING CORE
 *
 * Entrée : payload brut /chart/fusion + intent + lang
 * Sortie : FusionArbitration — lecture focalisée prête pour le renderer
 *
 * Tous les logs Mission 4 sont émis ici dans l'ordre exact du pipeline.
 */

import { logger } from '@/lib/utils/logger'
import { getIntentFieldMap } from './intentFieldMapping'
import { buildFusionContext } from './buildFusionContext'
import { arbitrateFusionSignals } from './arbitrateFusionSignals'
import type { FusionArbitration } from './buildFusionContext'

export type { FusionArbitration }

// ── Types d'entrée ─────────────────────────────────────────────────────────────

export type RunFusionArbiterInput = {
  /** Payload brut retourné par /chart/fusion */
  raw: Record<string, unknown>
  /** Intent utilisateur classifié */
  intent: string
  /** Langue de sortie */
  lang?: string
  /** Identifiant de session (pour corrélation logs) */
  sessionId?: string
}

// ── Utilitaire interne ─────────────────────────────────────────────────────────

/**
 * Mappe un intent utilisateur vers le label de type de question affiché dans les logs.
 */
function resolveQuestionTypeLabel(intent: string): string {
  const LABELS: Record<string, string> = {
    relationship: 'relation_générale',
    love: 'amour_attraction',
    decision: 'décision',
    work_money: 'travail_argent',
    inner_state: 'état_intérieur',
    blocage: 'blocage_pattern',
    timing: 'timing_cycle',
    timing_decision: 'timing_décision_stratégique',
    behavior_change: 'changement_comportemental',
    identity: 'identité',
    life_period: 'période_de_vie',
    exact_profile: 'profil_exact',
    fusion_general_question: 'lecture_générale',
  }
  return LABELS[intent] ?? intent
}

// ── Pipeline principal ─────────────────────────────────────────────────────────

/**
 * Lance le pipeline complet d'arbitrage de fusion.
 *
 * Émet dans l'ordre :
 *  1. QUESTION_TYPE_RESOLVED
 *  2. FIELD_MAP_APPLIED
 *  3. FUSION_ARBITER_START
 *  4. SIGNAL_WEIGHTS_APPLIED
 *  5. DOMINANT_DYNAMIC_SELECTED
 *  6. MAIN_BLOCK_SELECTED
 *  7. PRIORITY_ACTION_SELECTED
 *  8. RELIABILITY_SUMMARY
 *  9. USED_FIELDS_TRACE
 * 10. IGNORED_FIELDS_TRACE
 */
export function runFusionArbiter(input: RunFusionArbiterInput): FusionArbitration {
  const { raw, intent, lang = 'fr', sessionId } = input
  const sid = sessionId ? { sid: sessionId } : {}
  const started = Date.now()

  // ── 1. QUESTION_TYPE_RESOLVED ──────────────────────────────────────────────
  const questionTypeLabel = resolveQuestionTypeLabel(intent)
  logger.info('QUESTION_TYPE_RESOLVED', {
    intent,
    questionType: questionTypeLabel,
    lang,
    ...sid,
  })

  // ── 2. FIELD_MAP_APPLIED ───────────────────────────────────────────────────
  const fieldMap = getIntentFieldMap(intent)
  logger.info('FIELD_MAP_APPLIED', {
    intent,
    dominantModule: fieldMap.dominantModule,
    readingDepth: fieldMap.depth,
    priorityFields: {
      astrology: fieldMap.priorityFields.astrology.length,
      human_design: fieldMap.priorityFields.human_design.length,
      numerology: fieldMap.priorityFields.numerology.length,
      enneagram: fieldMap.priorityFields.enneagram.length,
      kua: fieldMap.priorityFields.kua.length,
    },
    ...sid,
  })

  // ── 3. FUSION_ARBITER_START ────────────────────────────────────────────────
  logger.info('FUSION_ARBITER_START', {
    intent,
    questionType: questionTypeLabel,
    readingAngle: fieldMap.readingAngleFr,
    ...sid,
  })

  // ── 4. SIGNAL_WEIGHTS_APPLIED ──────────────────────────────────────────────
  const weights = fieldMap.moduleWeights
  logger.info('SIGNAL_WEIGHTS_APPLIED', {
    intent,
    weights: {
      astrology: weights.astrology,
      human_design: weights.human_design,
      numerology: weights.numerology,
      enneagram: weights.enneagram,
      kua: weights.kua,
    },
    dominant: fieldMap.dominantModule,
    ...sid,
  })

  // ── Construction du contexte de fusion ────────────────────────────────────
  const ctx = buildFusionContext(intent, raw, lang)

  // ── Arbitrage ─────────────────────────────────────────────────────────────
  const result = arbitrateFusionSignals(ctx, lang)

  const elapsed = Date.now() - started

  // ── 5. DOMINANT_DYNAMIC_SELECTED ──────────────────────────────────────────
  logger.info('DOMINANT_DYNAMIC_SELECTED', {
    intent,
    dominantDynamic: result.dominantDynamic,
    secondaryDynamic: result.secondaryDynamic,
    dominantModule: result.dominantModule,
    signalConfidence: result.signalConfidence,
    ...sid,
  })

  // ── 6. MAIN_BLOCK_SELECTED ─────────────────────────────────────────────────
  logger.info('MAIN_BLOCK_SELECTED', {
    intent,
    mainBlockLength: result.mainBlock.length,
    innerOuterGapPresent: result.innerOuterGap.length > 0,
    ...sid,
  })

  // ── 7. PRIORITY_ACTION_SELECTED ───────────────────────────────────────────
  logger.info('PRIORITY_ACTION_SELECTED', {
    intent,
    priorityAction: result.priorityAction,
    supportPointsCount: result.supportPoints.length,
    ...sid,
  })

  // ── 8. RELIABILITY_SUMMARY ────────────────────────────────────────────────
  const reliabilityEntries = Object.entries(result.reliabilitySummary)
  const reliableCount = reliabilityEntries.filter(([, v]) => v === true).length
  const unreliableCount = reliabilityEntries.filter(([, v]) => v === false).length
  logger.info('RELIABILITY_SUMMARY', {
    intent,
    reliable: reliableCount,
    unreliable: unreliableCount,
    modules: result.reliabilitySummary,
    overallConfidence: result.signalConfidence,
    ...sid,
  })

  // ── 9. USED_FIELDS_TRACE ──────────────────────────────────────────────────
  logger.info('USED_FIELDS_TRACE', {
    intent,
    usedCount: result.usedFields.length,
    usedFields: result.usedFields,
    ...sid,
  })

  // ── 10. IGNORED_FIELDS_TRACE ──────────────────────────────────────────────
  logger.info('IGNORED_FIELDS_TRACE', {
    intent,
    ignoredCount: result.ignoredFields.length,
    ignoredFields: result.ignoredFields,
    elapsedMs: elapsed,
    ...sid,
  })

  return result
}

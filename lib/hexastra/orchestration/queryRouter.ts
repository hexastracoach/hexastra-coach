/**
 * Query Router — Hexastra Coach
 *
 * Détermine le type de flux de réponse à partir de l'intent utilisateur.
 * Utilisé dans runHexastraFlow pour activer les modules spécialisés.
 *
 * FlowType:
 *   'timing_strategic' → module behaviorEngine + mode TIMING_STRATEGIC_RESPONSE
 *   'behavior'         → module behaviorEngine + mode TIMING_STRATEGIC_RESPONSE
 *   'standard'         → pipeline fusion normal
 */

import type { UserIntent } from './intentClassifier'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FlowType =
  | 'timing_strategic' // intent timing_decision → 7-bloc stratège
  | 'behavior'         // intent behavior_change → moteur comportement
  | 'standard'         // pipeline fusion standard

export type KsModuleInput = {
  intent: UserIntent
  flowType: FlowType
  /** True si des données de naissance sont disponibles */
  hasBirthData?: boolean
  /** True si les données exactes de profil sont résolues */
  hasExactData?: boolean
}

// ── Router ───────────────────────────────────────────────────────────────────

/**
 * Résout le type de flux à partir de l'intent.
 * Appelé dans runHexastraFlow après classifyUserIntent().
 */
export function resolveFlowType(intent: UserIntent): FlowType {
  switch (intent) {
    case 'timing_decision':
      return 'timing_strategic'
    case 'behavior_change':
      return 'behavior'
    default:
      return 'standard'
  }
}

/**
 * True si le flux nécessite le module behaviorEngine.
 * (timing_strategic ET behavior utilisent tous les deux behaviorEngine)
 */
export function needsBehaviorEngine(flowType: FlowType): boolean {
  return flowType === 'timing_strategic' || flowType === 'behavior'
}

/**
 * True si le flux nécessite le mode TIMING_STRATEGIC_RESPONSE.
 */
export function needsTimingStrategicMode(flowType: FlowType): boolean {
  return flowType === 'timing_strategic' || flowType === 'behavior'
}

// ── KS Module Router ──────────────────────────────────────────────────────────

/**
 * Résout les modules KS à activer selon l'intent et le flow type.
 *
 * Règles :
 *   timing_strategic → KS.Threshold.Timing + KS.Presence.Field + KS.Resonance.Balance + KS.Porteum (si data)
 *   behavior         → KS.Presence.Field + KS.Resonance.Balance + KS.Porteum + KS.DeconditioMap (si exact)
 *   standard         → tableau vide (pipeline existant non modifié)
 */
export function resolveKsModules(input: KsModuleInput): string[] {
  const { flowType, hasBirthData = false, hasExactData = false } = input

  switch (flowType) {
    case 'timing_strategic':
      return [
        'KS.Threshold.Timing',
        'KS.Presence.Field',
        'KS.Resonance.Balance',
        ...(hasBirthData || hasExactData ? ['KS.Porteum'] : []),
      ]

    case 'behavior':
      return [
        'KS.Presence.Field',
        'KS.Resonance.Balance',
        'KS.Porteum',
        ...(hasExactData ? ['KS.DeconditioMap'] : []),
      ]

    case 'standard':
    default:
      return []
  }
}

/**
 * adaptReadingByPlan — Hexastra Coach
 *
 * Adapte la profondeur de la lecture selon le plan de l'utilisateur.
 *
 * free        → lecture essentielle, 1 levier, pas de données techniques
 * essential   → lecture structurée, phase incluse, 3–4 leviers
 * premium     → lecture complète, zone + phase + fiabilité + arbitrage détaillé
 * practitioner → identique premium + marqueurs praticien
 */

import type { PlanKey } from '@/types/subscription'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReadingAdaptation = {
  plan: PlanKey
  /** Inclure la zone de vie dans le bloc prompt */
  showZone: boolean
  /** Inclure la phase actuelle dans le bloc prompt */
  showPhase: boolean
  /** Inclure le score de fiabilité dans le bloc prompt */
  showReliability: boolean
  /** Profondeur des signaux : light (top 2) | standard (top 4) | full (tous) */
  signalDepth: 'light' | 'standard' | 'full'
  /** Suffixe d'instruction injecté à la fin du bloc pour cadrer la réponse LLM */
  instructionSuffix: string
}

// ── Configurations par plan ────────────────────────────────────────────────────

const ADAPTATIONS: Record<PlanKey, ReadingAdaptation> = {
  free: {
    plan: 'free',
    showZone: false,
    showPhase: false,
    showReliability: false,
    signalDepth: 'light',
    instructionSuffix:
      'CONTRAINTE RÉPONSE: courte et directe. Maximum 3 paragraphes. Un seul levier actionnable. Pas de liste à puces. Pas de mention de sciences.',
  },
  essential: {
    plan: 'essential',
    showZone: false,
    showPhase: true,
    showReliability: false,
    signalDepth: 'standard',
    instructionSuffix:
      'CONTRAINTE RÉPONSE: structurée et personnalisée. Maximum 5 paragraphes. Inclure la phase actuelle dans le cadrage. 2–3 leviers actionnables.',
  },
  premium: {
    plan: 'premium',
    showZone: true,
    showPhase: true,
    showReliability: true,
    signalDepth: 'full',
    instructionSuffix:
      'CONTRAINTE RÉPONSE: complète et nuancée. Intégrer zone de vie, phase, dynamique dominante et points de support. Réponse multi-dimensionnelle.',
  },
  practitioner: {
    plan: 'practitioner',
    showZone: true,
    showPhase: true,
    showReliability: true,
    signalDepth: 'full',
    instructionSuffix:
      'CONTRAINTE RÉPONSE (PRATICIEN): réponse complète avec lecture systémique. Inclure la tension intérieure/extérieure, les points de support et les marqueurs de progression.',
  },
}

// ── API ────────────────────────────────────────────────────────────────────────

/**
 * Retourne la configuration d'adaptation de lecture pour un plan donné.
 * Défaut : free si plan inconnu.
 */
export function getReadingAdaptation(plan: PlanKey): ReadingAdaptation {
  return ADAPTATIONS[plan] ?? ADAPTATIONS.free
}

/**
 * Applique l'adaptation de plan au bloc orienté construit.
 * Ajoute le suffixe d'instruction à la fin du bloc.
 *
 * @param block     Bloc orienté construit par buildOrientedFusionBlock
 * @param adaptation Config d'adaptation retournée par getReadingAdaptation
 */
export function applyPlanSuffix(block: string, adaptation: ReadingAdaptation): string {
  if (!adaptation.instructionSuffix) return block
  return `${block}\n\n${adaptation.instructionSuffix}`
}

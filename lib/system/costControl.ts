/**
 * lib/system/costControl.ts — Contrôle dynamique du budget tokens et des coûts
 *
 * Centralise toutes les décisions de réduction de coût selon le mode de trafic et le plan.
 * Évite les if/else dispersés dans route.ts et runHexastraFlow.
 *
 * RÈGLES GÉNÉRALES :
 *   - Les plans payants conservent toujours un budget suffisant pour une réponse utile
 *   - Les utilisateurs free subissent les réductions les plus fortes
 *   - En mode viral, Railway n'est appelé que si nécessaire pour les payants
 *   - Le budget minimal absolu est 200 tokens (réponse exploitable mais courte)
 *
 * USAGE :
 *   import { getTokenBudget, shouldSkipExpensiveEnrichment, shouldBypassRailway } from '@/lib/system/costControl'
 *
 *   const budget = getTokenBudget(trafficMode, plan)
 *   const skipEnrich = shouldSkipExpensiveEnrichment(trafficMode, plan)
 */

import type { SystemTrafficMode } from './viralMode'
import type { PlanKey } from '@/types/subscription'

// ── Budget tokens par plan (base en mode normal) ──────────────────────────────

/** Tokens de base par plan, en mode normal (pas de réduction) */
const BASE_TOKEN_BUDGET: Record<PlanKey, number> = {
  free:          800,
  essential:    1_200,
  premium:      2_000,
  practitioner: 3_000,
}

/** Token minimal absolu — en dessous, la réponse n'est pas exploitable */
const MIN_TOKEN_BUDGET = 200

// ── Multiplicateurs par mode × tier ──────────────────────────────────────────

function _getMultiplier(mode: SystemTrafficMode, plan: PlanKey): number {
  const isPaid = plan !== 'free'

  switch (mode) {
    case 'viral':
      return isPaid ? 0.65 : 0.30

    case 'critical':
      return isPaid ? 0.80 : 0.45

    case 'high':
      return isPaid ? 0.90 : 0.65

    case 'normal':
    default:
      return 1.0
  }
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Retourne le budget tokens max pour un plan et un mode de trafic donnés.
 *
 * Le résultat peut être passé comme `max_output_tokens` à OpenAI.
 * Toujours ≥ MIN_TOKEN_BUDGET (200).
 */
export function getTokenBudget(mode: SystemTrafficMode, plan: PlanKey): number {
  const base       = BASE_TOKEN_BUDGET[plan] ?? BASE_TOKEN_BUDGET.free
  const multiplier = _getMultiplier(mode, plan)
  return Math.max(MIN_TOKEN_BUDGET, Math.round(base * multiplier))
}

/**
 * Retourne true si les enrichissements secondaires coûteux doivent être ignorés.
 *
 * Enrichissements "coûteux" : appels vectoriels secondaires, suggestions contextuelles,
 * profil évolutif, calculs de numéro supplémentaires.
 *
 * Règle : économiser du temps et des tokens quand la charge est élevée,
 *         en préservant l'expérience des plans payants.
 */
export function shouldSkipExpensiveEnrichment(mode: SystemTrafficMode, plan: PlanKey): boolean {
  if (mode === 'normal') return false

  switch (mode) {
    case 'high':
      return plan === 'free'

    case 'critical':
      return plan === 'free' || plan === 'essential'

    case 'viral':
      // En viral : skip pour free et essential ; premium/practitioner conservent tout
      return plan === 'free' || plan === 'essential'
  }
}

/**
 * Retourne true si l'appel Railway (API astro/HD/numérologie) doit être court-circuité.
 *
 * Railway est appelé pour les calculs natal, HD, kua — coûteux en latence (2-5s).
 * En mode viral, on skip Railway pour free uniquement — les payants ont besoin de ces données.
 *
 * ⚠️ Si Railway est skippé, la réponse sera généraliste (sans données exactes natal/HD).
 */
export function shouldBypassRailway(mode: SystemTrafficMode, plan: PlanKey): boolean {
  if (mode !== 'viral') return false
  return plan === 'free'
}

/**
 * Snapshot complet pour un plan/mode — utile pour le logging et les décisions groupées.
 */
export function getCostControlSnapshot(mode: SystemTrafficMode, plan: PlanKey): {
  tokenBudget: number
  skipEnrichment: boolean
  bypassRailway: boolean
  multiplier: number
} {
  return {
    tokenBudget:    getTokenBudget(mode, plan),
    skipEnrichment: shouldSkipExpensiveEnrichment(mode, plan),
    bypassRailway:  shouldBypassRailway(mode, plan),
    multiplier:     _getMultiplier(mode, plan),
  }
}

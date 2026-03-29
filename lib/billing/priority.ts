/**
 * lib/billing/priority.ts — Priorité par plan pour la queue et la stratégie d'exécution
 *
 * La priorité détermine l'ordre de traitement dans la queue ET qui passe en synchrone
 * vs. qui est mis en attente lors des pics de charge.
 *
 * ÉCHELLE :
 *   praticien  → 3  (traitement immédiat garanti même en mode viral)
 *   premium    → 2  (traitement prioritaire)
 *   essentiel  → 1  (traitement normal, dégradation légère possible)
 *   free       → 0  (premier mis en queue, dégradation forte en mode viral)
 */

export type PlanPriority = 0 | 1 | 2 | 3

const PRIORITY_MAP: Readonly<Record<string, PlanPriority>> = {
  practitioner: 3,
  premium:      2,
  essential:    1,
  free:         0,
}

/**
 * Retourne la priorité numérique d'un plan.
 * null / undefined / inconnu → 0 (traitement comme free).
 */
export function getPlanPriority(plan?: string | null): PlanPriority {
  if (!plan) return 0
  return PRIORITY_MAP[plan] ?? 0
}

/**
 * Retourne true si le plan est payant (non free).
 * Utile pour les décisions binaires de dégradation.
 */
export function isPaidPlan(plan?: string | null): boolean {
  return getPlanPriority(plan) > 0
}

/**
 * Retourne true si le plan est premium ou praticien.
 * Ces plans conservent l'accès synchrone même en mode critique/viral.
 */
export function isHighPriorityPlan(plan?: string | null): boolean {
  return getPlanPriority(plan) >= 2
}

/**
 * lib/queue/executionStrategy.ts — Décision sync / dégradé / queue par mode et plan
 *
 * Centralise la logique de priorisation premium vs free en mode de charge.
 * Route.ts appelle decideChatExecutionStrategy() et adapte son comportement en conséquence.
 *
 * STRATÉGIES :
 *   sync          — traitement synchrone standard, réponse immédiate
 *   degraded-sync — traitement synchrone mais tokens/enrichissements réduits
 *   queue         — job mis en attente, client reçoit jobId + doit poller /status
 *
 * RÈGLES PAR MODE :
 *
 *   normal    → sync pour tous
 *
 *   high      → sync pour tous, réduction de tokens appliquée par costControl
 *
 *   critical  → practitioner/premium : sync
 *               essential             : degraded-sync
 *               free                 : degraded-sync si actives < 100, sinon queue
 *
 *   viral     → practitioner/premium : sync (accès garanti même en pic)
 *               essential             : degraded-sync si actives < 150, sinon queue
 *               free                 : queue systématique
 */

import type { SystemTrafficMode } from '@/lib/system/viralMode'
import type { PlanKey } from '@/types/subscription'
import { getPlanPriority } from '@/lib/billing/priority'

export type ChatExecutionStrategy = 'sync' | 'degraded-sync' | 'queue'

export interface StrategyInput {
  mode:           SystemTrafficMode
  plan:           PlanKey
  activeRequests: number
  queuedJobs:     number
}

/**
 * Retourne la stratégie d'exécution pour une requête.
 *
 * Cette fonction est pure (pas d'effets de bord) — facilement testable.
 */
export function decideChatExecutionStrategy(input: StrategyInput): ChatExecutionStrategy {
  const { mode, plan, activeRequests } = input
  const priority = getPlanPriority(plan)

  switch (mode) {
    case 'normal':
      return 'sync'

    case 'high':
      // Tout le monde passe en sync — costControl réduit les tokens
      return 'sync'

    case 'critical':
      if (priority >= 2) return 'sync'              // premium, practitioner : priorité totale
      if (priority === 1) return 'degraded-sync'    // essential : sync dégradé
      // free : queue si surcharge, sinon dégradé
      return activeRequests > 100 ? 'queue' : 'degraded-sync'

    case 'viral':
      if (priority >= 2) return 'sync'              // premium, practitioner : toujours sync
      if (priority === 1) {
        // essential : sync dégradé si la charge le permet encore
        return activeRequests < 150 ? 'degraded-sync' : 'queue'
      }
      // free : queue systématique en viral
      return 'queue'
  }
}

/**
 * Message de queue localisé selon le plan et la langue.
 */
export function buildQueuedMessage(plan: PlanKey, lang = 'fr'): string {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const priority = getPlanPriority(plan)

  if (isFr) {
    if (priority >= 2) {
      return 'Forte demande en ce moment. Ta lecture est en file d\'attente prioritaire — tu seras servi(e) très prochainement.'
    }
    if (priority === 1) {
      return 'Forte demande en cours. Ta réponse est en préparation — reviens dans quelques instants.'
    }
    return 'Forte demande en ce moment. Ta question est bien reçue et sera traitée dans quelques instants. Passe en Essentiel pour un accès prioritaire.'
  }

  if (priority >= 2) {
    return 'High demand right now. Your reading is in the priority queue — you\'ll be served very shortly.'
  }
  if (priority === 1) {
    return 'High demand at the moment. Your response is being prepared — check back shortly.'
  }
  return 'High demand right now. Your question is queued and will be processed shortly. Upgrade to Essential for priority access.'
}

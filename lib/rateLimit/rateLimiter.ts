/**
 * lib/rateLimit/rateLimiter.ts — Interface abstraite du rate limiter utilisateur
 *
 * `check()` EST ASYNC — Redis est asynchrone.
 * L'implémentation mémoire retourne Promise.resolve() immédiatement.
 *
 * route.ts dépend UNIQUEMENT de cette interface via providerFactory.ts.
 */

import type { PlanKey } from '@/types/subscription'

export type RateLimiterResult = {
  /** true = la requête est autorisée */
  allowed: boolean
  /** Cause du refus ('cooldown' | 'ip_volume') ou null si autorisé */
  reason: 'cooldown' | 'ip_volume' | null
  /** Millisecondes restantes avant qu'une nouvelle requête soit autorisée (0 si allowed) */
  retryAfterMs: number
  /** Nombre de requêtes IP consommées dans la fenêtre courante */
  ipUsed: number
}

export interface RateLimiter {
  /**
   * Vérifie si la requête est autorisée ET enregistre l'accès (atomique).
   *
   * ⚠️ Appeler UNE SEULE FOIS par requête (check + enregistrement sont couplés).
   */
  check(params: {
    userId: string | null
    ip: string
    plan: PlanKey
  }): Promise<RateLimiterResult>
}

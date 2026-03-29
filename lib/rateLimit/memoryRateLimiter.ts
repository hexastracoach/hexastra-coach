/**
 * lib/rateLimit/memoryRateLimiter.ts — Implémentation mémoire de RateLimiter
 *
 * Délègue à checkUserRateLimit() de simpleRateLimit.ts (sliding window en mémoire locale).
 * Retourne une Promise résolue immédiatement pour respecter le contrat async de l'interface.
 *
 * NE PAS IMPORTER DIRECTEMENT DANS route.ts.
 * Utiliser getRateLimiter() depuis lib/system/providerFactory.ts.
 *
 * LIMITES :
 * - État local à l'instance Vercel — pas de cohérence cross-instances
 * - Acceptable pour anti-spam ; insuffisant pour limite stricte distribuée
 */

import type { RateLimiter, RateLimiterResult } from './rateLimiter'
import { checkUserRateLimit } from './simpleRateLimit'
import type { PlanKey } from '@/types/subscription'

export class MemoryRateLimiter implements RateLimiter {
  async check(params: { userId: string | null; ip: string; plan: PlanKey }): Promise<RateLimiterResult> {
    return checkUserRateLimit(params)
  }
}

/** Singleton — partagé par toutes les requêtes d'une même instance Vercel warm. */
export const memoryRateLimiter = new MemoryRateLimiter()

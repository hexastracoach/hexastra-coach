/**
 * lib/cache/lru.ts — Cache LRU partagé pour Hexastra Coach
 *
 * POURQUOI LRU vs Map :
 * - La Map<> brute n'a pas de limite de taille → fuite mémoire garantie en serverless.
 *   Sur Vercel, chaque instance Node.js garde la Map en vie entre les requêtes :
 *   1000 utilisateurs différents = 1000 entrées qui s'accumulent jusqu'au redémarrage.
 * - LRU (Least Recently Used) évince automatiquement les entrées les moins utilisées
 *   quand la limite `max` est atteinte.
 * - Le paramètre `ttl` remplace l'expiration manuelle (expires > Date.now()).
 *
 * CONFIGURATION :
 * - max: 500 entrées simultanées — au-delà, les plus anciennes sont éjectées
 * - ttl: 10 minutes — cohérent avec l'ancien CACHE_TTL_MS
 * - allowStale: false — une entrée expirée retourne undefined, jamais de stale data
 *
 * USAGE :
 *   import { hexastraCache } from '@/lib/cache/lru'
 *   hexastraCache.set(key, value)
 *   const hit = hexastraCache.get(key)  // undefined si absent ou expiré
 */

import { LRUCache } from 'lru-cache'

export const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes (identique à l'ancien CACHE_TTL_MS)

export const hexastraCache = new LRUCache<string, unknown>({
  /** Nombre maximum d'entrées. Au-delà, les plus anciennes sont évincées. */
  max: 500,
  /** TTL par entrée. L'entrée est invisible après expiration même si toujours en mémoire. */
  ttl: CACHE_TTL_MS,
  /** Ne jamais retourner une valeur expirée (défaut, mais explicite pour la lisibilité). */
  allowStale: false,
  /** Met à jour le TTL à chaque accès (lecture = renouvellement de vie de l'entrée). */
  updateAgeOnGet: false,
})

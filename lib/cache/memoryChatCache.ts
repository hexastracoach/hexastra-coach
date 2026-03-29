/**
 * lib/cache/memoryChatCache.ts — Implémentation mémoire de ChatCache (LRU)
 *
 * Implémente l'interface async `ChatCache` en s'appuyant sur `hexastraCache` (lru-cache v11).
 * Toutes les méthodes wrappent leurs résultats synchrones dans Promise.resolve()
 * pour respecter le contrat async de l'interface.
 *
 * NE PAS IMPORTER DIRECTEMENT DANS route.ts.
 * Utiliser getChatCache() depuis lib/system/providerFactory.ts.
 */

import type { ChatCache } from './chatCache'
import { hexastraCache, CACHE_TTL_MS } from './lru'

export class MemoryChatCache implements ChatCache {
  async get<T = unknown>(key: string): Promise<T | null> {
    const hit = hexastraCache.get(key)
    return hit !== undefined ? (hit as T) : null
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (ttlMs !== undefined) {
      hexastraCache.set(key, value, { ttl: ttlMs })
    } else {
      hexastraCache.set(key, value)
    }
  }

  async delete(key: string): Promise<void> {
    hexastraCache.delete(key)
  }

  async clear(): Promise<void> {
    hexastraCache.clear()
  }
}

/** Singleton — partagé par toutes les requêtes d'une même instance Vercel warm. */
export const memoryChatCache = new MemoryChatCache()

// Re-export pour les callsites qui en ont besoin
export { CACHE_TTL_MS }

/**
 * lib/system/providerFactory.ts — Sélection automatique du provider (Redis ou mémoire)
 *
 * CE FICHIER EST L'UNIQUE POINT D'ENTRÉE pour route.ts.
 * route.ts importe SEULEMENT getChatCache() et getRateLimiter() — jamais les implémentations.
 *
 * LOGIQUE DE SÉLECTION :
 *
 *   SI UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sont définis
 *     → Redis (RedisChatCache / RedisRateLimiter)
 *     → Enveloppé dans FallbackChatCache / FallbackRateLimiter
 *   SINON
 *     → Mémoire locale (MemoryChatCache / MemoryRateLimiter)
 *
 * FALLBACK AUTOMATIQUE :
 *   Les wrappers Fallback* capturent toute exception Redis et redirigent
 *   vers l'implémentation mémoire sans interrompre la requête.
 *   Redis down = warn log discret + mémoire = API continue de fonctionner.
 *
 * FAIL-OPEN sur le rate limiter :
 *   Sur erreur Redis, la vérification de rate limit délègue à la mémoire locale.
 *   Un utilisateur ne sera jamais bloqué à cause d'un crash Redis.
 *
 * SINGLETONS :
 *   getChatCache() et getRateLimiter() retournent toujours la même instance.
 *   Créée une fois au premier appel (lazy init), réutilisée ensuite.
 *   Compatible serverless : chaque warm instance Vercel a son propre singleton.
 *
 * IMPORTS STATIQUES :
 *   Les classes Redis sont importées en haut de fichier (pas de require() dynamique).
 *   @upstash/redis utilise l'API REST HTTP — aucune connexion ouverte à l'import.
 *   L'instanciation n'a lieu que si Redis est configuré.
 */

import type { ChatCache } from '@/lib/cache/chatCache'
import type { RateLimiter, RateLimiterResult } from '@/lib/rateLimit/rateLimiter'
import { MemoryChatCache, memoryChatCache } from '@/lib/cache/memoryChatCache'
import { MemoryRateLimiter, memoryRateLimiter } from '@/lib/rateLimit/memoryRateLimiter'
import { RedisChatCache } from '@/lib/cache/redisChatCache'
import { RedisRateLimiter } from '@/lib/rateLimit/redisRateLimiter'
import { getRedisClient, isRedisConfigured, getRedisNamespace } from '@/lib/redis/client'
import type { PlanKey } from '@/types/subscription'

// ── Wrappers Fallback ─────────────────────────────────────────────────────────
// Ces classes wrappent le provider principal (Redis) et absorbent ses erreurs.
// Sur exception Redis → log discret + délégation vers le provider mémoire.

class FallbackChatCache implements ChatCache {
  constructor(
    private readonly primary: ChatCache,
    private readonly fallback: ChatCache,
  ) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      return await this.primary.get<T>(key)
    } catch (err) {
      _warnFallback('cache.get', err)
      return this.fallback.get<T>(key)
    }
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      return await this.primary.set<T>(key, value, ttlMs)
    } catch (err) {
      _warnFallback('cache.set', err)
      return this.fallback.set<T>(key, value, ttlMs)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      return await this.primary.delete(key)
    } catch (err) {
      _warnFallback('cache.delete', err)
      return this.fallback.delete(key)
    }
  }

  async clear(): Promise<void> {
    try {
      return await this.primary.clear()
    } catch (err) {
      _warnFallback('cache.clear', err)
      return this.fallback.clear()
    }
  }
}

class FallbackRateLimiter implements RateLimiter {
  constructor(
    private readonly primary: RateLimiter,
    private readonly fallback: RateLimiter,
  ) {}

  async check(params: { userId: string | null; ip: string; plan: PlanKey }): Promise<RateLimiterResult> {
    try {
      return await this.primary.check(params)
    } catch (err) {
      _warnFallback('rateLimiter.check', err)
      // Fail-open : déléguer à la mémoire locale plutôt que de bloquer la requête
      return this.fallback.check(params)
    }
  }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function _warnFallback(operation: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  console.warn(`[providerFactory] Redis ${operation} failed, falling back to memory: ${msg}`)
}

// ── Singletons ────────────────────────────────────────────────────────────────

let _chatCache: ChatCache | null = null
let _rateLimiter: RateLimiter | null = null

/**
 * Retourne l'instance ChatCache active pour cette warm instance Vercel.
 *
 * - Si Redis configuré → FallbackChatCache(RedisChatCache, MemoryChatCache)
 * - Sinon             → MemoryChatCache
 *
 * Appelée une seule fois par cold start, le résultat est mis en cache.
 */
export function getChatCache(): ChatCache {
  if (_chatCache !== null) return _chatCache

  if (isRedisConfigured()) {
    const client = getRedisClient()
    if (client !== null) {
      const ns = getRedisNamespace()
      const redisCache = new RedisChatCache(client, ns)
      _chatCache = new FallbackChatCache(redisCache, new MemoryChatCache())
      console.info(`[providerFactory] cache → Redis (ns=${ns})`)
      return _chatCache
    }
  }

  _chatCache = memoryChatCache
  console.info('[providerFactory] cache → memory (Redis non configuré ou indisponible)')
  return _chatCache
}

/**
 * Retourne l'instance RateLimiter active pour cette warm instance Vercel.
 *
 * - Si Redis configuré → FallbackRateLimiter(RedisRateLimiter, MemoryRateLimiter)
 * - Sinon             → MemoryRateLimiter
 *
 * Appelée une seule fois par cold start, le résultat est mis en cache.
 */
export function getRateLimiter(): RateLimiter {
  if (_rateLimiter !== null) return _rateLimiter

  if (isRedisConfigured()) {
    const client = getRedisClient()
    if (client !== null) {
      const ns = getRedisNamespace()
      const redisRl = new RedisRateLimiter(client, ns)
      _rateLimiter = new FallbackRateLimiter(redisRl, new MemoryRateLimiter())
      console.info(`[providerFactory] rateLimiter → Redis (ns=${ns})`)
      return _rateLimiter
    }
  }

  _rateLimiter = memoryRateLimiter
  console.info('[providerFactory] rateLimiter → memory (Redis non configuré ou indisponible)')
  return _rateLimiter
}

/**
 * Snapshot du provider actif — utile pour le logging, les health checks et les tests.
 */
export function getProviderSnapshot(): {
  cache: 'redis' | 'memory'
  rateLimiter: 'redis' | 'memory'
} {
  const redisAvailable = isRedisConfigured() && getRedisClient() !== null
  return {
    cache:       redisAvailable ? 'redis' : 'memory',
    rateLimiter: redisAvailable ? 'redis' : 'memory',
  }
}

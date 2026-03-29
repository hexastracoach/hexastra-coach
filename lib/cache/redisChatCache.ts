/**
 * lib/cache/redisChatCache.ts — Implémentation Redis de ChatCache (Upstash)
 *
 * Utilise l'API REST Upstash via @upstash/redis.
 * Les opérations GET/SET/DEL sont des appels HTTP vers Upstash — aucune connexion TCP.
 *
 * FORMAT DES CLÉS :
 *   {namespace}:chat:{key}
 *   Exemple : "prod:chat:a3f9c2..." (clé SHA-256 de 64 chars → 73 chars au total)
 *
 * SÉRIALISATION :
 *   Les valeurs sont sérialisées en JSON. @upstash/redis sérialise automatiquement
 *   les objets, mais on JSON.stringify explicitement pour contrôle total.
 *
 * ERREURS :
 *   Cette classe LÈVE des erreurs sur échec Redis.
 *   Le fallback vers mémoire est géré par FallbackChatCache dans providerFactory.ts.
 *
 * NE PAS INSTANCIER DIRECTEMENT — utiliser getChatCache() depuis providerFactory.ts.
 */

import type { Redis } from '@upstash/redis'
import type { ChatCache } from './chatCache'
import { CACHE_TTL_MS } from './lru'

export class RedisChatCache implements ChatCache {
  private readonly client: Redis
  private readonly ns: string
  private readonly defaultTtlMs: number

  constructor(client: Redis, namespace: string, defaultTtlMs = CACHE_TTL_MS) {
    this.client       = client
    this.ns           = namespace
    this.defaultTtlMs = defaultTtlMs
  }

  private buildKey(key: string): string {
    return `${this.ns}:chat:${key}`
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    // @upstash/redis désérialise automatiquement le JSON stocké en string
    const raw = await this.client.get<string>(this.buildKey(key))
    if (raw === null || raw === undefined) return null

    try {
      return JSON.parse(raw) as T
    } catch {
      // Donnée corrompue dans Redis → traiter comme un miss
      return null
    }
  }

  async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs
    const serialized = JSON.stringify(value)
    // PX = TTL en millisecondes (précision ms vs EX qui est en secondes)
    await this.client.set(this.buildKey(key), serialized, { px: ttl })
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.buildKey(key))
  }

  async clear(): Promise<void> {
    // SCAN + DEL limité au namespace — évite de vider tout Redis en prod
    const pattern = `${this.ns}:chat:*`
    let cursor = 0
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, {
        match: pattern,
        count: 100,
      })
      cursor = Number(nextCursor)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } while (cursor !== 0)
  }
}

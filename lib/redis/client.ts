/**
 * lib/redis/client.ts — Client Upstash Redis singleton
 *
 * SINGLETON LAZY :
 * Le client est créé une seule fois au premier appel, puis réutilisé.
 * Sur Vercel serverless, la variable de module persiste entre les requêtes
 * d'une même warm instance — économise la reconnexion TCP à chaque appel.
 *
 * VARIABLES D'ENVIRONNEMENT REQUISES :
 *   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxx...
 *
 * SI ABSENTES → getRedisClient() retourne null → providerFactory bascule en mémoire.
 *
 * NAMESPACE PAR ENVIRONNEMENT :
 * Toutes les clés sont préfixées pour isoler dev / preview / prod sur le même cluster Redis.
 *   production  → "prod"
 *   preview     → "prev"
 *   development → "dev"
 *
 * COMPATIBILITÉ SERVERLESS :
 * `@upstash/redis` utilise l'API REST d'Upstash via fetch() — pas de connexion TCP persistante.
 * Compatible avec les runtimes Edge et Node.js sans configuration supplémentaire.
 */

import { Redis } from '@upstash/redis'

// ── Singleton ──────────────────────────────────────────────────────────────────

let _redisClient: Redis | null = null

/**
 * Retourne le client Redis singleton, ou null si les variables d'env sont absentes.
 *
 * JAMAIS de throw — un retour null déclenche le fallback mémoire dans providerFactory.
 */
export function getRedisClient(): Redis | null {
  if (_redisClient !== null) return _redisClient

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  try {
    _redisClient = new Redis({ url, token })
    return _redisClient
  } catch {
    // Env vars présentes mais invalides (mauvais format URL, etc.)
    return null
  }
}

/**
 * Retourne true si les deux variables d'env Redis sont définies.
 * N'établit pas de connexion — vérifie seulement la configuration.
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

// ── Namespace par environnement ────────────────────────────────────────────────

/**
 * Préfixe court basé sur l'environnement Vercel.
 *
 * Exemple :
 *   production  → "prod"
 *   preview     → "prev"
 *   development → "dev"
 *
 * Ce préfixe est inséré dans toutes les clés Redis pour isoler les environnements
 * sur un même cluster Upstash (évite les collisions dev ↔ prod).
 */
export function getRedisNamespace(): string {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
  if (env === 'production')  return 'prod'
  if (env === 'preview')     return 'prev'
  return 'dev'
}

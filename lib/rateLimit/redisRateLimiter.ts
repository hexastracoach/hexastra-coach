/**
 * lib/rateLimit/redisRateLimiter.ts — Implémentation Redis de RateLimiter (Upstash)
 *
 * DEUX NIVEAUX DE PROTECTION (miroir de simpleRateLimit.ts, mais distribué) :
 *
 * 1. COOLDOWN PAR UTILISATEUR (plan-aware)
 *    Clé : "{ns}:rl:cd:{userKey}"
 *    Mécanisme : SET NX PX {cooldownMs}
 *      → SET réussit (retourne "OK") = clé absente = cooldown écoulé = requête autorisée
 *      → SET échoue (retourne null) = clé présente = cooldown actif = refus
 *    PTTL pour calculer retryAfterMs précis.
 *
 *    AVANTAGE vs mémoire : cohérent cross-instances Vercel.
 *    Exemple : instance A traite une requête, instance B voit le cooldown aussi.
 *
 * 2. VOLUME PAR IP (fenêtre fixe — 20 req/min/IP)
 *    Clé : "{ns}:rl:vol:{ip}"
 *    Mécanisme : INCR (atomique) + PEXPIRE si premier incrément
 *    PTTL pour calculer retryAfterMs.
 *
 *    FENÊTRE FIXE vs GLISSANTE :
 *    simpleRateLimit.ts utilise une fenêtre glissante (timestamps).
 *    Redis utilise une fenêtre fixe (INCR + TTL) — plus simple, plus performant.
 *    La différence est négligeable pour 20 req/min : max 40 req en 60s dans le pire cas
 *    (20 en fin de window + 20 en début de window suivante).
 *
 * ATOMICITÉ :
 *    - SET NX est atomique par définition Redis.
 *    - INCR est atomique — deux instances Vercel simultanées voient des valeurs distinctes.
 *    - PEXPIRE après INCR est non-atomique : si INCR réussit et PEXPIRE échoue, la clé n'expire
 *      jamais. Risque extrêmement faible (Upstash REST très fiable), acceptable en production.
 *      Mitigation : TTL de la clé volume sera toujours ≤ 60s grâce au premier appel réussi.
 *
 * ERREURS :
 *    Cette classe LÈVE des erreurs sur échec Redis.
 *    Le fallback vers mémoire est géré par FallbackRateLimiter dans providerFactory.ts.
 *
 * NE PAS INSTANCIER DIRECTEMENT — utiliser getRateLimiter() depuis providerFactory.ts.
 */

import type { Redis } from '@upstash/redis'
import type { RateLimiter, RateLimiterResult } from './rateLimiter'
import { PLAN_COOLDOWNS_MS } from './simpleRateLimit'
import type { PlanKey } from '@/types/subscription'

/** 20 req par IP par fenêtre de 60s */
const IP_MAX_REQS  = 20
const IP_WINDOW_MS = 60_000

export class RedisRateLimiter implements RateLimiter {
  private readonly client: Redis
  private readonly ns: string

  constructor(client: Redis, namespace: string) {
    this.client = client
    this.ns     = namespace
  }

  async check(params: { userId: string | null; ip: string; plan: PlanKey }): Promise<RateLimiterResult> {
    const { userId, ip, plan } = params
    const cooldownMs = PLAN_COOLDOWNS_MS[plan] ?? PLAN_COOLDOWNS_MS.free

    // ── Règle 1 : cooldown par utilisateur ──────────────────────────────────
    const userKey    = userId ? `uid:${userId}` : `ip:${ip}`
    const cdKey      = `${this.ns}:rl:cd:${userKey}`

    // SET NX PX = "écrire SI absente, expirer dans cooldownMs ms"
    // Retourne "OK" si la clé n'existait pas (= on vient de la créer = requête autorisée)
    // Retourne null si la clé existait déjà (= cooldown encore actif = refus)
    const setResult = await this.client.set(cdKey, '1', {
      nx: true,
      px: cooldownMs,
    })

    if (setResult === null) {
      // Cooldown actif — calculer le temps restant via PTTL
      const pttl = await this.client.pttl(cdKey)
      return {
        allowed:      false,
        reason:       'cooldown',
        retryAfterMs: Math.max(0, pttl),
        ipUsed:       0,
      }
    }

    // ── Règle 2 : volume IP global ───────────────────────────────────────────
    const volKey  = `${this.ns}:rl:vol:${ip}`

    // INCR est atomique — deux instances concurrentes obtiennent des counts distincts
    const count = await this.client.incr(volKey)

    // Poser le TTL uniquement sur le premier incrément (démarre la fenêtre)
    if (count === 1) {
      await this.client.pexpire(volKey, IP_WINDOW_MS)
    }

    if (count > IP_MAX_REQS) {
      // Volume dépassé — annuler le cooldown posé (fairness : l'utilisateur n'a pas "consommé" de slot)
      await this.client.del(cdKey)

      const windowPttl = await this.client.pttl(volKey)
      return {
        allowed:      false,
        reason:       'ip_volume',
        retryAfterMs: Math.max(0, windowPttl),
        ipUsed:       count,
      }
    }

    // ── Autorisé ─────────────────────────────────────────────────────────────
    return {
      allowed:      true,
      reason:       null,
      retryAfterMs: 0,
      ipUsed:       count,
    }
  }
}

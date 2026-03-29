/**
 * lib/rateLimit/simpleRateLimit.ts — Rate limiter par plan + IP globale
 *
 * DEUX NIVEAUX DE PROTECTION :
 *
 * 1. COOLDOWN PAR UTILISATEUR (plan-aware)
 *    Un utilisateur authentifié ou anonyme ne peut pas envoyer une nouvelle requête
 *    avant que le cooldown du plan soit écoulé depuis la précédente.
 *    C'est un "anti-spam" conversationnel — l'IA prend 5-15s à répondre,
 *    il est inutile d'envoyer 5 questions en 2 secondes.
 *
 *    free:          10s minimum entre deux requêtes
 *    essential:      5s
 *    premium:        3s
 *    practitioner:   2s
 *
 * 2. IP GLOBALE (volume maximum par IP)
 *    Indépendant du plan, limite le volume absolu par adresse IP.
 *    Protège contre les scripts automatisés et le scraping.
 *    20 requêtes / minute / IP (fenêtre glissante)
 *
 * DIFFÉRENCE AVEC chatRateLimit.ts :
 *    chatRateLimit.ts = 10 req/min/IP — protection initiale avant auth
 *    simpleRateLimit.ts = cooldown/plan + 20 req/min/IP — protection post-auth
 *    Les deux fonctionnent en tandem (couches différentes)
 *
 * REMARQUE SERVERLESS :
 *    État en mémoire local à l'instance Vercel. Voir chatRateLimit.ts pour détails.
 */

import type { PlanKey } from '@/types/subscription'

// ── Configuration ────────────────────────────────────────────────────────────

/**
 * Cooldown minimum (ms) entre deux requêtes consécutives, par plan.
 * Exporté pour être réutilisé par les implémentations Redis du rate limiter.
 */
export const PLAN_COOLDOWNS_MS: Record<PlanKey, number> = {
  free:          10_000,  // 10 secondes
  essential:      5_000,  //  5 secondes
  premium:        3_000,  //  3 secondes
  practitioner:   2_000,  //  2 secondes
}

/** Limite de volume globale par IP : 20 requêtes sur une fenêtre glissante d'1 minute */
const IP_MAX_REQS   = 20
const IP_WINDOW_MS  = 60_000

const CLEANUP_INTERVAL_MS = 5 * 60_000  // nettoyage toutes les 5 min

// ── Stockage en mémoire ───────────────────────────────────────────────────────

/** Dernier timestamp de requête par userId (ou `ip:xxx` pour les anonymes) */
const lastRequestMap = new Map<string, number>()

/** Timestamps des requêtes récentes par IP (fenêtre glissante) */
const ipWindowMap    = new Map<string, number[]>()

/** Nettoyage périodique — évite que les Maps grossissent indéfiniment */
let _cleanupTimer: ReturnType<typeof setInterval> | null = null

function scheduleCleanup() {
  if (_cleanupTimer !== null) return
  _cleanupTimer = setInterval(() => {
    const now     = Date.now()
    const cutoff  = now - IP_WINDOW_MS
    const staleCooloff = now - Math.max(...Object.values(PLAN_COOLDOWNS_MS)) * 10

    // Purger les entrées IP hors fenêtre
    for (const [key, timestamps] of ipWindowMap.entries()) {
      const active = timestamps.filter((t) => t > cutoff)
      if (active.length === 0) ipWindowMap.delete(key)
      else ipWindowMap.set(key, active)
    }

    // Purger les cooldowns trop anciens (10× le cooldown max = clairement expiré)
    for (const [key, ts] of lastRequestMap.entries()) {
      if (ts < staleCooloff) lastRequestMap.delete(key)
    }
  }, CLEANUP_INTERVAL_MS)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRateLimitResult = {
  /** true = la requête est autorisée */
  allowed: boolean
  /** Cause du refus ('cooldown' | 'ip_volume' | null) */
  reason: 'cooldown' | 'ip_volume' | null
  /** Millisecondes restantes avant autorisation (0 si autorisé) */
  retryAfterMs: number
  /** Nombre de requêtes IP consommées dans la fenêtre courante */
  ipUsed: number
}

// ── Fonctions publiques ───────────────────────────────────────────────────────

/**
 * Vérifie et enregistre une requête utilisateur.
 *
 * @param params.userId   Identifiant utilisateur (null si anonyme)
 * @param params.ip       Adresse IP (toujours présente)
 * @param params.plan     Plan actif de l'utilisateur
 * @returns               `allowed: true` si la requête peut passer
 *
 * ⚠️  N'appeler qu'APRÈS avoir résolu userId et plan (post-auth).
 *     Pour la protection pré-auth, utiliser checkChatRateLimit() (chatRateLimit.ts).
 */
export function checkUserRateLimit(params: {
  userId: string | null
  ip: string
  plan: PlanKey
}): UserRateLimitResult {
  const { userId, ip, plan } = params
  scheduleCleanup()

  const now         = Date.now()
  const cooldownMs  = PLAN_COOLDOWNS_MS[plan] ?? PLAN_COOLDOWNS_MS.free
  const userKey     = userId ? `uid:${userId}` : `ip:${ip}`

  // ── Règle 1 : cooldown par utilisateur ────────────────────────────────────
  const lastTs = lastRequestMap.get(userKey) ?? 0
  const elapsed = now - lastTs
  if (elapsed < cooldownMs) {
    const retryAfterMs = cooldownMs - elapsed
    return {
      allowed:      false,
      reason:       'cooldown',
      retryAfterMs,
      ipUsed:       0,
    }
  }

  // ── Règle 2 : volume IP global ───────────────────────────────────────────
  const cutoff    = now - IP_WINDOW_MS
  const existing  = ipWindowMap.get(ip) ?? []
  const active    = existing.filter((t) => t > cutoff)
  const ipUsed    = active.length

  if (ipUsed >= IP_MAX_REQS) {
    const oldest      = active[0] ?? now
    const retryAfterMs = (oldest + IP_WINDOW_MS) - now
    return {
      allowed:      false,
      reason:       'ip_volume',
      retryAfterMs: Math.max(0, retryAfterMs),
      ipUsed,
    }
  }

  // ── Autorisé : enregistrer les deux compteurs ────────────────────────────
  lastRequestMap.set(userKey, now)
  active.push(now)
  ipWindowMap.set(ip, active)

  return {
    allowed:      true,
    reason:       null,
    retryAfterMs: 0,
    ipUsed:       ipUsed + 1,
  }
}

/**
 * Retourne le message 429 adapté à la raison du refus.
 * Toujours en français (l'internationalisation est gérée en amont si nécessaire).
 */
export function getRateLimitMessage(reason: UserRateLimitResult['reason'], plan: PlanKey): string {
  if (reason === 'cooldown') {
    const cooldown = Math.ceil((PLAN_COOLDOWNS_MS[plan] ?? 10_000) / 1000)
    return `Une réponse est déjà en cours. Attends ${cooldown}s avant d'envoyer une nouvelle question.`
  }
  if (reason === 'ip_volume') {
    return 'Trop de requêtes depuis cette adresse. Réessaie dans quelques instants.'
  }
  return 'Trop de requêtes. Réessaie dans un moment.'
}

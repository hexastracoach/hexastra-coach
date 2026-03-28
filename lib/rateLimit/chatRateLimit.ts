/**
 * lib/rateLimit/chatRateLimit.ts — Rate limiter in-memory pour /api/chat
 *
 * OBJECTIF :
 * Empêcher un utilisateur (authentifié ou anonyme) de spammer /api/chat
 * et de saturer le quota OpenAI ou Railway au détriment des autres utilisateurs.
 *
 * ALGORITHME : Sliding Window (fenêtre glissante)
 * - On conserve les timestamps des N dernières requêtes par sujet (userId ou IP)
 * - À chaque requête, on purge les timestamps hors fenêtre, puis on compte ce qui reste
 * - Plus précis qu'un compteur fixe (évite le "double burst" en fin de fenêtre)
 *
 * LIMITES :
 * - WINDOW_MS  : 60 secondes
 * - MAX_REQS   : 10 requêtes par fenêtre (= 10 questions/minute max)
 * - MAX_ENTRIES: 10 000 sujets en mémoire max (LRU sur le Map via cleanup TTL)
 *
 * REMARQUE SERVERLESS :
 * En production Vercel, chaque "warm instance" a son propre state en mémoire.
 * Deux requêtes simultanées sur deux instances différentes ne partagent pas
 * ce rate limiter. C'est acceptable pour protéger OpenAI de *rafales locales*.
 * Pour un rate limit global et partagé : utiliser Upstash Redis.
 *
 * USAGE :
 *   const result = checkChatRateLimit(userId ?? ipAddress)
 *   if (!result.allowed) return 429
 */

const WINDOW_MS  = 60_000  // 1 minute
const MAX_REQS   = 10      // max requêtes par fenêtre
const CLEANUP_INTERVAL_MS = 5 * 60_000  // nettoyage des sujets inactifs toutes les 5 min

/** Timestamps des requêtes récentes, indexés par sujet (userId ou IP) */
const windowMap = new Map<string, number[]>()

/** Nettoyage périodique pour éviter que la Map grossisse indéfiniment */
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function scheduleCleanup() {
  if (cleanupTimer !== null) return
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS
    for (const [key, timestamps] of windowMap.entries()) {
      // Supprimer les timestamps expirés
      const active = timestamps.filter((t) => t > cutoff)
      if (active.length === 0) {
        // Sujet inactif depuis > 1 minute : retirer de la Map
        windowMap.delete(key)
      } else {
        windowMap.set(key, active)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}

export type RateLimitResult = {
  /** true si la requête est autorisée */
  allowed: boolean
  /** Nombre de requêtes consommées dans la fenêtre courante */
  used: number
  /** Limite configurée */
  limit: number
  /** Nombre de requêtes restantes */
  remaining: number
  /** Timestamp (ms) où la fenêtre se réinitialise */
  resetAt: number
}

/**
 * Vérifie et enregistre une requête pour le sujet donné.
 *
 * @param subject  userId (préféré) ou adresse IP de fallback
 * @returns        RateLimitResult — utiliser `.allowed` pour décider
 */
export function checkChatRateLimit(subject: string): RateLimitResult {
  // Lancer le cleanup en arrière-plan (no-op si déjà démarré)
  scheduleCleanup()

  const now = Date.now()
  const cutoff = now - WINDOW_MS

  // Récupérer et purger les timestamps hors fenêtre
  const existing = windowMap.get(subject) ?? []
  const active = existing.filter((t) => t > cutoff)

  const used = active.length
  const allowed = used < MAX_REQS

  if (allowed) {
    // Enregistrer cette requête
    active.push(now)
    windowMap.set(subject, active)
  }

  const oldest = active[0] ?? now
  const resetAt = oldest + WINDOW_MS  // quand la plus ancienne requête sort de la fenêtre

  return {
    allowed,
    used: used + (allowed ? 1 : 0),
    limit: MAX_REQS,
    remaining: Math.max(0, MAX_REQS - used - (allowed ? 1 : 0)),
    resetAt,
  }
}

/**
 * Extrait l'IP de la requête entrante (Vercel expose X-Forwarded-For).
 * Fallback sur 'unknown' si non disponible.
 */
export function getRequestIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

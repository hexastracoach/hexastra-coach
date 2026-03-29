/**
 * lib/system/loadMonitor.ts — Compteur de requêtes actives + détection de charge
 *
 * RÔLE :
 * Savoir à tout instant combien de requêtes /api/chat sont en cours d'exécution
 * sur cette instance Node.js (warm serverless function), afin de prendre des
 * décisions adaptées : réduire les tokens OpenAI, rejeter en file d'attente, etc.
 *
 * PRINCIPE :
 * - `incrementLoad()` appelé au DÉBUT de chaque requête (avant tout await)
 * - `decrementLoad()` appelé dans le bloc `finally` (garanti même en cas d'erreur)
 * - `getCurrentLoad()` retourne le nombre de requêtes actives en ce moment
 * - `getLoadLevel()` traduit ce nombre en niveau de charge actionnable
 *
 * LIMITES SERVERLESS :
 * Ce compteur est LOCAL à chaque instance Vercel.
 * Avec 5 instances warm en parallèle, le vrai total est getLoad() × 5.
 * Pour un compteur global : utiliser Upstash Redis ou Vercel KV.
 * Pour une instance normale, ce compteur est suffisant pour les décisions locales.
 *
 * SEUILS (basés sur les limites pratiques d'une instance Node.js + OpenAI) :
 *   > 100 requêtes actives → HIGH    (réduire les tokens, ralentir)
 *   > 200 requêtes actives → CRITICAL (réduire fortement, activer queue)
 */

/** Nombre de requêtes /api/chat actuellement en traitement sur cette instance */
let _activeRequests = 0

/** Niveau de charge observable */
export type LoadLevel = 'normal' | 'high' | 'critical'

/**
 * Incrémenter le compteur.
 * Appeler au DÉBUT du handler POST, avant tout await.
 */
export function incrementLoad(): void {
  _activeRequests++
}

/**
 * Décrémenter le compteur.
 * Appeler dans le bloc `finally` du handler POST — garanti même en cas d'exception.
 */
export function decrementLoad(): void {
  _activeRequests = Math.max(0, _activeRequests - 1)
}

/**
 * Nombre brut de requêtes actives sur cette instance.
 * Utile pour le logging et les dashboards.
 */
export function getCurrentLoad(): number {
  return _activeRequests
}

/**
 * Traduit le compteur brut en niveau de charge actionnable.
 *
 * NORMAL   (0–100)  : comportement nominal, pas de restriction
 * HIGH     (101–200): réduire les tokens OpenAI (~40%)
 * CRITICAL (201+)   : réduire fortement les tokens (~65%), activer la queue
 */
export function getLoadLevel(): LoadLevel {
  if (_activeRequests > 200) return 'critical'
  if (_activeRequests > 100) return 'high'
  return 'normal'
}

/**
 * Multiplicateur à appliquer sur `max_output_tokens` selon la charge.
 *
 * NORMAL   → 1.00 (aucune réduction)
 * HIGH     → 0.55 (token budget réduit de ~45%)
 * CRITICAL → 0.35 (token budget réduit de ~65%)
 *
 * Exemple pratique :
 *   base = 950 tokens (plan free, lecture normale)
 *   HIGH     → 950 × 0.55 ≈ 522 tokens (réponse plus courte, mais toujours exploitable)
 *   CRITICAL → 950 × 0.35 ≈ 332 tokens (synthèse minimaliste)
 */
export function getLoadTokenMultiplier(): number {
  const level = getLoadLevel()
  if (level === 'critical') return 0.35
  if (level === 'high')     return 0.55
  return 1.0
}

/**
 * Retourne true si le système est en état de surcharge active.
 * Raccourci pour le point d'entrée queue dans route.ts.
 */
export function isOverloaded(threshold = 300): boolean {
  return _activeRequests > threshold
}

/**
 * Snapshot des métriques pour le logging.
 */
export function getLoadSnapshot(): { active: number; level: LoadLevel; tokenMultiplier: number } {
  return {
    active:          _activeRequests,
    level:           getLoadLevel(),
    tokenMultiplier: getLoadTokenMultiplier(),
  }
}

/**
 * lib/system/viralMode.ts — Détection automatique du mode de trafic
 *
 * DIFFÉRENCE AVEC runtimeMode.ts :
 *   runtimeMode.ts  = basé UNIQUEMENT sur le compteur de requêtes actives (loadMonitor)
 *   viralMode.ts    = vue plus large : actives + jobs en queue + taux d'erreur/timeout récents
 *
 * viralMode est la vue produit : "comment se comporte le système en ce moment ?"
 * runtimeMode est la vue infra  : "combien de requêtes sont actives sur cette instance ?"
 *
 * Les deux sont utilisés ensemble dans route.ts pour décider la stratégie d'exécution.
 *
 * MODES :
 *   normal   — charge nominale, comportement standard
 *   high     — légère surcharge, réduction de tokens, aucun blocage utilisateur
 *   critical — forte tension, dégradation pour free, payants préservés
 *   viral    — pic sévère, queue quasi-systématique pour free, accès prioritaire payants
 *
 * SEUILS (calibrés pour une instance Vercel serverless) :
 *   Ces valeurs sont conservatrices — mieux vaut activer viral tôt que de laisser OpenAI saturer.
 */

import { getCurrentLoad } from '@/lib/system/loadMonitor'

export type SystemTrafficMode = 'normal' | 'high' | 'critical' | 'viral'

// ── Seuils ────────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  high:     { activeRequests: 40,  queuedJobs: 8  },
  critical: { activeRequests: 120, queuedJobs: 40 },
  viral:    {
    activeRequests:   220,
    queuedJobs:       80,
    timeoutRate:      0.08,   // 8% de requêtes en timeout sur la fenêtre glissante
    errorRate:        0.12,   // 12% d'erreurs récentes
  },
} as const

// ── Tracking des erreurs/timeouts récents ─────────────────────────────────────

const STATS_WINDOW_MS = 60_000

interface StatEvent { ts: number }

const _requests: StatEvent[]  = []
const _timeouts: StatEvent[]   = []
const _errors: StatEvent[]     = []

/** À appeler au début de chaque requête /api/chat (depuis route.ts) */
export function recordRequest(): void {
  _requests.push({ ts: Date.now() })
  _trimOld(_requests)
}

/** À appeler quand runFlowWithFallback active un fallback suite à un timeout */
export function recordTimeout(): void {
  _timeouts.push({ ts: Date.now() })
  _trimOld(_timeouts)
}

/** À appeler quand le handler POST catch une erreur non-fallback */
export function recordError(): void {
  _errors.push({ ts: Date.now() })
  _trimOld(_errors)
}

function _trimOld(arr: StatEvent[]): void {
  const cutoff = Date.now() - STATS_WINDOW_MS
  while (arr.length > 0 && arr[0].ts < cutoff) arr.shift()
}

function _recentRate(events: StatEvent[]): number {
  const cutoff = Date.now() - STATS_WINDOW_MS
  const recentTotal   = _requests.filter(e => e.ts > cutoff).length
  const recentEvents  = events.filter(e => e.ts > cutoff).length
  if (recentTotal < 10) return 0   // pas assez de données pour être significatif
  return recentEvents / recentTotal
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Calcule le mode de trafic système à partir des métriques courantes.
 *
 * Peut être appelé avec uniquement `queuedJobs` (les autres viennent du loadMonitor/stats).
 */
export function getSystemTrafficMode(input: {
  activeRequests?: number
  queuedJobs: number
  recentTimeoutRate?: number
  recentErrorRate?: number
}): SystemTrafficMode {
  const activeRequests  = input.activeRequests  ?? getCurrentLoad()
  const queuedJobs      = input.queuedJobs
  const timeoutRate     = input.recentTimeoutRate ?? _recentRate(_timeouts)
  const errorRate       = input.recentErrorRate   ?? _recentRate(_errors)

  if (
    activeRequests >= THRESHOLDS.viral.activeRequests ||
    queuedJobs     >= THRESHOLDS.viral.queuedJobs     ||
    timeoutRate    >= THRESHOLDS.viral.timeoutRate     ||
    errorRate      >= THRESHOLDS.viral.errorRate
  ) return 'viral'

  if (
    activeRequests >= THRESHOLDS.critical.activeRequests ||
    queuedJobs     >= THRESHOLDS.critical.queuedJobs
  ) return 'critical'

  if (
    activeRequests >= THRESHOLDS.high.activeRequests ||
    queuedJobs     >= THRESHOLDS.high.queuedJobs
  ) return 'high'

  return 'normal'
}

/**
 * Snapshot complet pour logs et observabilité.
 */
export function getTrafficSnapshot(): {
  mode: SystemTrafficMode
  activeRequests: number
  timeoutRate: number
  errorRate: number
  requestsLast60s: number
} {
  const activeRequests  = getCurrentLoad()
  const timeoutRate     = _recentRate(_timeouts)
  const errorRate       = _recentRate(_errors)
  const requestsLast60s = _requests.filter(e => e.ts > Date.now() - STATS_WINDOW_MS).length

  return {
    mode: getSystemTrafficMode({ activeRequests, queuedJobs: 0 }),
    activeRequests,
    timeoutRate,
    errorRate,
    requestsLast60s,
  }
}

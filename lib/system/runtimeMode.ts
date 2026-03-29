/**
 * lib/system/runtimeMode.ts — Abstraction du mode d'exécution selon la charge
 *
 * POURQUOI PAS DIRECTEMENT loadMonitor.ts :
 * `loadMonitor.ts` expose des métriques brutes (nombre de requêtes actives, LoadLevel).
 * Ce module traduit ces métriques en **mode de comportement actionnable** (`RuntimeMode`)
 * et centralise les décisions qui en dépendent (multiplicateurs de tokens, seuils de queue).
 *
 * MODES :
 *   normal    (0–100 req)    : comportement nominal
 *   high      (101–200 req)  : réduire les tokens (–45%)
 *   critical  (201–300 req)  : réduire fortement les tokens (–65%)
 *   extreme   (301+ req)     : activer le point d'entrée queue → 503
 *
 * USAGE :
 *   import { getRuntimeMode, getTokenMultiplier, isExtremeLoad } from '@/lib/system/runtimeMode'
 *
 *   if (isExtremeLoad()) return queueResponse()
 *   const multiplier = getTokenMultiplier()
 *
 * NOTE : s'appuie sur `getLoadLevel()` de loadMonitor.ts pour les seuils NORMAL/HIGH/CRITICAL,
 * et ajoute le niveau EXTREME (> 300) pour le point d'entrée queue.
 */

import { getCurrentLoad } from '@/lib/system/loadMonitor'

/** Niveaux de mode d'exécution — plus précis que LoadLevel pour les décisions comportementales */
export type RuntimeMode = 'normal' | 'high' | 'critical' | 'extreme'

/** Seuils en nombre de requêtes actives sur cette instance */
const THRESHOLDS = {
  high:     101,  // > 100 req actives
  critical: 201,  // > 200 req actives
  extreme:  301,  // > 300 req actives → queue entry
} as const

/**
 * Retourne le mode d'exécution courant basé sur le compteur de charge local.
 *
 * NOTE serverless : le compteur est LOCAL à l'instance Vercel.
 * Pour un compteur global distribué, utiliser Upstash Redis.
 */
export function getRuntimeMode(): RuntimeMode {
  const active = getCurrentLoad()
  if (active >= THRESHOLDS.extreme)  return 'extreme'
  if (active >= THRESHOLDS.critical) return 'critical'
  if (active >= THRESHOLDS.high)     return 'high'
  return 'normal'
}

/**
 * Multiplicateur à appliquer sur `max_output_tokens` selon le mode.
 *
 * @param mode  Mode optionnel — si omis, appelle `getRuntimeMode()` automatiquement
 * @returns     1.0 (normal) | 0.55 (high) | 0.35 (critical/extreme)
 *
 * Exemple :
 *   base = 950 tokens
 *   high     → 950 × 0.55 ≈ 522 tokens (réponse plus courte)
 *   critical → 950 × 0.35 ≈ 332 tokens (synthèse minimaliste)
 */
export function getTokenMultiplier(mode?: RuntimeMode): number {
  const resolved = mode ?? getRuntimeMode()
  if (resolved === 'critical' || resolved === 'extreme') return 0.35
  if (resolved === 'high')                               return 0.55
  return 1.0
}

/**
 * Retourne true si le système est en mode `extreme` (seuil de queue activé).
 * Raccourci pour le point d'entrée queue dans route.ts.
 *
 * @param threshold  Seuil personnalisé (défaut : THRESHOLDS.extreme = 301)
 */
export function isExtremeLoad(threshold = THRESHOLDS.extreme): boolean {
  return getCurrentLoad() >= threshold
}

/**
 * Snapshot complet pour le logging et les dashboards.
 */
export function getModeSnapshot(): {
  mode: RuntimeMode
  active: number
  tokenMultiplier: number
} {
  const active = getCurrentLoad()
  const mode   = getRuntimeMode()
  return {
    active,
    mode,
    tokenMultiplier: getTokenMultiplier(mode),
  }
}

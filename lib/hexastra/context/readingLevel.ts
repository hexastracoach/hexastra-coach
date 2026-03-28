/**
 * readingLevel — Hexastra Coach
 *
 * Résout le niveau de lecture approprié :
 * 'short'    → 3 blocs essentiels (plan free ou override "court")
 * 'standard' → 5 blocs complets (par défaut)
 * 'deep'     → 5 blocs enrichis (plan praticien ou override "détaillé")
 *
 * Priorité :
 * 1. Override utilisateur (mots-clés dans le message)
 * 2. Plan de l'utilisateur
 * 3. Fallback → 'standard'
 */

export type ReadingLevel = 'short' | 'standard' | 'deep'

export type ResolveReadingLevelOptions = {
  /** Plan de l'utilisateur (free | essential | premium | practitioner) */
  plan?: string | null
  /** Message brut de l'utilisateur (pour détection d'override par mots-clés) */
  userMessage?: string | null
}

// ── Patterns de détection ──────────────────────────────────────────────────────

/** Mots-clés déclenchant une lecture courte (override 'short') */
const SHORT_PATTERNS = /\b(r[eé]sum[eé]|court|bref|vite|rapide|l.essentiel|le principal|quick|brief|short|juste l.essentiel|en une phrase|en gros)\b/i

/** Mots-clés déclenchant une lecture approfondie (override 'deep') */
const DEEP_PATTERNS = /\b(d[eé]tail|d[eé]taille|expliqu[eez]|approfond[ie]r?[sz]?|d[eé]velopp[e]|compl[eè]t[e]|en profondeur|tout comprendre|deep|full reading|analyse compl[eè]te|analyse d[eé]taill[eé]e)\b/i

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Résout le niveau de lecture à partir du plan et du message utilisateur.
 *
 * L'override utilisateur (mots-clés dans le message) est prioritaire sur le plan.
 *
 * @param options  Plan + message utilisateur
 * @returns        'short' | 'standard' | 'deep'
 *
 * @example
 * resolveReadingLevel({ plan: 'free' })                           // 'short'
 * resolveReadingLevel({ plan: 'premium' })                        // 'standard'
 * resolveReadingLevel({ plan: 'premium', userMessage: 'résume' }) // 'short'  ← override
 * resolveReadingLevel({ plan: 'free', userMessage: 'explique' })  // 'deep'   ← override
 * resolveReadingLevel({ plan: 'practitioner' })                   // 'deep'
 */
export function resolveReadingLevel(options: ResolveReadingLevelOptions): ReadingLevel {
  const { plan, userMessage } = options

  // 1. Override utilisateur — prioritaire sur le plan
  if (userMessage && userMessage.trim().length > 0) {
    if (SHORT_PATTERNS.test(userMessage)) return 'short'
    if (DEEP_PATTERNS.test(userMessage)) return 'deep'
  }

  // 2. Plan-based
  if (plan === 'free') return 'short'
  if (plan === 'practitioner') return 'deep'
  // essential et premium → 'standard'

  // 3. Fallback
  return 'standard'
}

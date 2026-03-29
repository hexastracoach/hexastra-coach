import type { UserIntent } from './intentClassifier'

export type GuardDecision = 'allowed' | 'redirect' | 'blocked'

/**
 * Maps each intent to a guard decision.
 *
 * allowed  — forward to IA engine
 * redirect — soft refusal with an invitation to refocus
 * blocked  — hard refusal, won't engage with the content
 */
const INTENT_GUARD_MAP: Record<UserIntent, GuardDecision> = {
  // ── In-scope ─────────────────────────────
  life_decision:    'allowed',
  relationship:     'allowed',
  career:           'allowed',
  personal_growth:  'allowed',
  life_situation:   'allowed',
  timing:           'allowed',

  // ── Soft refusal — user may have mixed intent ─
  general_assistant: 'redirect',

  // ── Hard refusal — clearly out of scope ──
  technical_question: 'blocked',
  academic_question:  'blocked',
  practical_task:     'blocked',
  medical_question:   'blocked',
  legal_question:     'blocked',
}

export function evaluateDomainGuard(intent: UserIntent): GuardDecision {
  return INTENT_GUARD_MAP[intent]
}

/** Convenience: true if the message should reach the IA engine */
export function isAllowed(intent: UserIntent): boolean {
  return evaluateDomainGuard(intent) === 'allowed'
}

// ── Science domain guard ───────────────────────────────────────────────────────
// Toutes les sciences et sous-catégories HexAstra sont explicitement autorisées.
// Ce guard est appelé en amont du routing par science (astro_transits, hd_type…).
// Il ne bloque aucun domaine scientifique : la décision de routing est laissée
// au pipeline KS.FUSION.V13.

const ALLOWED_SCIENCES = new Set([
  'astro',
  'numerology',
  'human_design',
  'enneagram',
  'kua',
  'fusion',
])

/** Toujours `true` pour les sciences HexAstra — export explicite pour documentation. */
export function isScienceAllowed(science: string): boolean {
  return ALLOWED_SCIENCES.has(science)
}

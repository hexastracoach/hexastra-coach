/**
 * userPhase — Hexastra Coach
 *
 * Détecte la phase de l'utilisateur à partir du CompactReadingCore.
 *
 * 'transition'    : tension active, mécanisme conflictuel → ton rassurant + explicatif
 * 'expansion'     : mouvement clair, action identifiée → ton direct, orienté action
 * 'stabilisation' : équilibre relatif → ton posé, structuré
 *
 * Logique intentionnellement simple et stable.
 * Objectif : cohérence, pas perfection.
 */

import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'

export type UserPhase = 'expansion' | 'transition' | 'stabilisation'

// ── Patterns de détection ──────────────────────────────────────────────────────

/** Patterns signalant une tension active ou un blocage — indique 'transition' */
const TRANSITION_PATTERNS =
  /\b(bloqu[ée]?(?:r|s|es|ée|ées)?|blocage[rs]?|frein[ée]?(?:r|s|es|ée)?|conflit|tension|contradict|coinc[ée]?(?:e[sr]?)?|peur|fuite|r[ée]sistanc|struggle|block(?:ed|s|ing)?|stuck|sabote?\w*|stagne?\w*|impasse)\b/i

/** Patterns signalant un mouvement actif, une dynamique positive — indique 'expansion' */
const EXPANSION_PATTERNS =
  /\b(lancer|ouvrir|avancer|cr[ée]er|initier|progresser|d[ée]ployer|construire|[ée]merger|launch|create|move forward|advance|grow|expand|progress|build|deploy)\b/i

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Détecte la phase de l'utilisateur à partir du CompactReadingCore.
 *
 * Analyse hiddenMechanism + realTension pour détecter la tension active,
 * et rightMovement pour détecter une dynamique d'expansion.
 *
 * @param core  CompactReadingCore construit par buildCompactReadingCore
 * @returns     'expansion' | 'transition' | 'stabilisation'
 *
 * @example
 * // hiddenMechanism : "Tu pousses là où ça bloque — tension réelle"
 * detectUserPhase(core) // 'transition'
 *
 * // rightMovement : "lancer la démarche, créer les premières fondations"
 * detectUserPhase(core) // 'expansion'
 */
export function detectUserPhase(core: CompactReadingCore): UserPhase {
  // Analyser la base conflictuelle (mécanisme + tension)
  const conflictBase = `${core.hiddenMechanism} ${core.realTension}`

  // Transition : tension ou blocage détecté dans le mécanisme / la tension
  if (TRANSITION_PATTERNS.test(conflictBase)) return 'transition'

  // Expansion : mouvement actif clair dans l'action prioritaire
  if (EXPANSION_PATTERNS.test(core.rightMovement)) return 'expansion'

  // Stabilisation par défaut
  return 'stabilisation'
}

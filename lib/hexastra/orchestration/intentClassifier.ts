/**
 * Intent Classifier — Hexastra Coach
 *
 * Classifies user messages into a UserIntent that drives routing priority.
 * RULE: INTENT > ROUTE > DATA > RENDER
 *
 * Fusion is the default for any personal/existential question.
 * Sciences are only activated when explicitly named.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserIntent =
  | 'fusion_general_question' // pourquoi, comment, je ressens, je bloque, etc.
  | 'relationship'             // relations, couple, famille, proches
  | 'decision'                 // décision, choix, dois-je, trancher
  | 'inner_state'              // énergie, état intérieur, comment je me sens
  | 'science_specific'         // science explicitement nommée
  | 'exact_profile'            // profil complet, mon thème natal, etc.
  | 'horoscope'                // horoscope journalier / hebdomadaire
  | 'birth_update'             // mise à jour données de naissance
  | 'out_of_scope'             // hors sujet Hexastra

// ── Fusion intents (groupes qui routent vers fusion) ───────────────────────────

export const FUSION_INTENTS: ReadonlySet<UserIntent> = new Set([
  'fusion_general_question',
  'relationship',
  'decision',
  'inner_state',
])

export function isFusionIntent(intent: UserIntent): boolean {
  return FUSION_INTENTS.has(intent)
}

// ── Pattern tables ─────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Patterns → science_specific */
const SCIENCE_SPECIFIC_PATTERNS: RegExp[] = [
  /\b(astrologie|astrology|theme natal|theme astral|carte du ciel|ascendant|maisons|transits|signe solaire|signe lunaire|lune en|soleil en)\b/i,
  /\b(numerolog|numerologie|chemin de vie|nombre expression|nombre d(e |')ame|annee personnelle)\b/i,
  /\b(human design|design humain|bodygraph|mon hd\b|portes? hd|centres? hd|canaux hd|type hd|autorite hd|strategie hd)\b/i,
  /\b(enneagramme|ennéagramme|mon type [1-9]\b|type ennea)\b/i,
  /\b(kua\b|feng.?shui|gps kua|neurokua|nombre kua|direction kua)\b/i,
  /\b(hexastra fusion|fusion des sciences|toutes les sciences|lecture multi.?science)\b/i,
]

/** Patterns → exact_profile */
const EXACT_PROFILE_PATTERNS: RegExp[] = [
  /\b(profil complet|lecture compl[eè]te|tout mon profil|mon profil [eé]nerg[eé]tique|bilan complet|profil fusionn[eé])\b/i,
  /\b(mon th[eè]me (natal|astral)|ma carte du ciel|th[eè]me natal complet)\b/i,
  /\b(qui suis.?je|quelle est ma nature|quel est mon profil)\b/i,
]

/** Patterns → decision */
const DECISION_PATTERNS: RegExp[] = [
  /\b(dois.?je|devrais.?je|faut.?il que je|est.?ce que je dois)\b/i,
  /\b(d[eé]cision|choix|trancher|choisir entre|partir ou rester|accepter ou refuser)\b/i,
  /\b(quelle (option|voie|direction)|quel chemin|quelle d[eé]cision)\b/i,
]

/** Patterns → relationship */
const RELATIONSHIP_PATTERNS: RegExp[] = [
  /\b(relation|couple|amour|famille|proches|ami(e)?s|entourage|partenaire|conjoint)\b/i,
  /\b(les gens (ne |n['''])?m[''']([eé]coutent|comprennent|respectent|voient))\b/i,
  /\b(compatibilit[eé]|affinit[eé]|communication avec|conflit avec|tension avec)\b/i,
  /\b(je n[''']arrive pas [àa] me connecter|personne ne me comprend|mal compris|incompris)\b/i,
]

/** Patterns → inner_state */
const INNER_STATE_PATTERNS: RegExp[] = [
  /\b([eé]nergie|[eé]tat int[eé]rieur|surcharge|fatigue|recharge|[eé]puisement|burn.?out)\b/i,
  /\b(comment je me sens|ce que je ressens|ce que je vis|mon [eé]tat|je me sens)\b/i,
  /\b(motiv|[eé]lan|blocage int[eé]rieur|frein|paralys|anxi|peur de)\b/i,
]

/** Patterns → fusion_general_question (core rule: pourquoi/comment/je ressens/je bloque) */
const FUSION_GENERAL_PATTERNS: RegExp[] = [
  /\bpourquoi\b/i,
  /\bcomment\b/i,
  /\bje (ressens|sens|vis|traverse|n[''']arrive pas|n[''']y arrive|bloque|souffre|manque|cherche)\b/i,
  /\bje ne (comprends|sais|peux|vois|trouve|r[eé]ussis) pas\b/i,
  /\bqu[''']est.?ce qui (se passe|m[''']emp[eê]che|bloque|ne va pas)\b/i,
  /\bma (vie|situation|[eé]nergie|relation|carri[eè]re|sant[eé])\b/i,
  /\bmon (fonctionnement|comportement|rapport [àa]|probl[eè]me|blocage)\b/i,
  /\b(qu[''']est.?ce que je|pourquoi est.?ce que je|comment [eé]viter|comment sortir)\b/i,
  /\b(analyser?|comprendre|expliquer?|d[eé]chiffrer?) (ma |mon |ma situation|ce qui)\b/i,
  /\b(quel est mon|quelle est ma|quels sont mes) (rapport|relation|lien|tendance|pattern|mode de fonctionnement)\b/i,
]

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classify a user message into a UserIntent.
 *
 * Priority:
 * 1. out_of_scope (handled upstream by detectScope — pass `isOutOfScope` when known)
 * 2. science_specific (explicit science name)
 * 3. exact_profile (profil complet, thème natal, etc.)
 * 4. decision
 * 5. relationship
 * 6. inner_state
 * 7. fusion_general_question (pourquoi, comment, je ressens…)
 * 8. Sidebar intent fallback (from userIntentKey)
 * 9. Default: fusion_general_question  ← intentionally permissive
 *
 * @param message        Current user message
 * @param sidebarIntentKey  Active sidebar intent (from frontend)
 * @param isOutOfScope   True if detectScope already flagged this as out_of_scope
 */
export function classifyUserIntent(
  message: string,
  sidebarIntentKey?: string | null,
  isOutOfScope?: boolean,
): UserIntent {
  if (isOutOfScope) return 'out_of_scope'

  const normalized = deaccent((message || '').toLowerCase())

  // 1. Science explicitly named → science_specific
  if (SCIENCE_SPECIFIC_PATTERNS.some((p) => p.test(normalized))) return 'science_specific'

  // 2. Exact profile request
  if (EXACT_PROFILE_PATTERNS.some((p) => p.test(normalized))) return 'exact_profile'

  // 3. Decision
  if (DECISION_PATTERNS.some((p) => p.test(normalized))) return 'decision'

  // 4. Relationship
  if (RELATIONSHIP_PATTERNS.some((p) => p.test(normalized))) return 'relationship'

  // 5. Inner state
  if (INNER_STATE_PATTERNS.some((p) => p.test(normalized))) return 'inner_state'

  // 6. General fusion (pourquoi, comment, je ressens, je bloque…)
  if (FUSION_GENERAL_PATTERNS.some((p) => p.test(normalized))) return 'fusion_general_question'

  // 7. Sidebar intent fallback — translate sidebarIntentKey to UserIntent
  if (sidebarIntentKey) {
    const SIDEBAR_TO_INTENT: Record<string, UserIntent> = {
      understand_situation: 'fusion_general_question',
      make_decision: 'decision',
      relationships: 'relationship',
      money_work: 'fusion_general_question',
      inner_state: 'inner_state',
    }
    const mapped = SIDEBAR_TO_INTENT[sidebarIntentKey]
    if (mapped) return mapped
  }

  // 8. CRITICAL: unknown → fusion_general_question (never leave intent unresolved)
  return 'fusion_general_question'
}

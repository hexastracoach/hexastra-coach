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
  | 'direct_knowledge_query'   // "mes canaux", "mon kua", "mon type" — réponse factuelle directe
  | 'fusion_general_question'  // pourquoi, comment, je ressens, je bloque, etc.
  | 'relationship'             // relations, couple, famille, proches
  | 'love'                     // amour, attirance, vie sentimentale — plus ciblé que relationship
  | 'decision'                 // décision, choix, dois-je, trancher
  | 'work_money'               // travail, carrière, argent, mission
  | 'inner_state'              // énergie, état intérieur, comment je me sens
  | 'blocage'                  // blocage, pattern répétitif, je n'arrive pas à avancer
  | 'timing'                   // quand agir, bon moment, timing, cycles
  | 'identity'                 // qui je suis vraiment, ma nature profonde, fonctionnement naturel
  | 'life_period'              // période de vie, transition, passage, grand changement
  | 'science_specific'         // science explicitement nommée
  | 'exact_profile'            // profil complet, mon thème natal, etc.
  | 'horoscope'                // horoscope journalier / hebdomadaire
  | 'birth_update'             // mise à jour données de naissance
  | 'out_of_scope'             // hors sujet Hexastra

// ── Fusion intents (groupes qui routent vers fusion) ───────────────────────────

export const FUSION_INTENTS: ReadonlySet<UserIntent> = new Set([
  'fusion_general_question',
  'relationship',
  'love',
  'decision',
  'work_money',
  'inner_state',
  'blocage',
  'timing',
  'identity',
  'life_period',
])

export function isFusionIntent(intent: UserIntent): boolean {
  return FUSION_INTENTS.has(intent)
}

// ── Pattern tables ─────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Patterns → direct_knowledge_query
 *
 * Questions courtes et possessives demandant une donnée factuelle précise,
 * sans interprétation. Priorité maximale : avant science_specific.
 *
 * Forme canonique : "mes/mon [donnée]" ou "quels sont mes [donnée]"
 */
const DIRECT_KNOWLEDGE_PATTERNS: RegExp[] = [
  // Human Design — canaux
  /\b(mes canaux|mes channels|quels (sont mes|sont les) canaux|canal[x]? d[eé]fini[s]?)\b/i,
  // Human Design — centres
  /\b(mes centres?|quels (sont mes|sont les) centres?|centres? d[eé]fini[s]?|centres? ouverts?)\b/i,
  // Human Design — gates/portes
  /\b(mes (gates?|portes?)|quelles? (sont mes|sont les) (gates?|portes?)|porte[s]? activ[eé]e?[s]?)\b/i,
  // Human Design — type (court, possessif)
  /\b(mon type hd|quel est mon type hd|mon type human design|mon type de design)\b/i,
  // Human Design — autorité
  /\b(mon autorit[eé]( hd)?|quelle est mon autorit[eé])\b/i,
  // Human Design — profil
  /\b(mon profil hd|mon profil [0-9]\/[0-9]|quel est mon profil hd)\b/i,
  // Human Design — complet court
  /\b(mon (human design|design humain|hd|bodygraph)( complet)?\b)(?! (est|me|te|nous|vous|lui|leur))\b/i,
  // Ennéagramme
  /\b(mon (type |)enn[eé](agramme)?|quel est mon (type |)enn[eé]|mon enn[eé]a\b|mon (type [1-9])\b)\b/i,
  // Kua
  /\b(mon (nombre |num[eé]ro |)kua|mon kua|mes directions (kua|favorables?)|quel est mon kua)\b/i,
  // Numérologie — chemin de vie
  /\b(mon chemin de vie|quel est mon chemin de vie|mon chemin de vie \b)\b/i,
  // Numérologie — année perso
  /\b(mon ann[eé]e personnelle|mon ann[eé]e perso|quelle est mon ann[eé]e (personnelle|perso))\b/i,
  // Astrologie — signes courts
  /\b(mon signe solaire|mon signe lunaire|ma lune en|mon ascendant|quel est mon (signe|ascendant|soleil|lune))\b/i,
]

/** Patterns → love (amour romantique — avant relationship) */
const LOVE_PATTERNS: RegExp[] = [
  /\b(vie (amoureuse|sentimentale)|s[eé]duction|attirance (romantique)?|tomber amoureux|coup de foudre|l.amour dans ma vie)\b/i,
  /\b(relation amoureuse|partenaire (amoureux|id[eé]al|de vie)|l.amour et moi|pourquoi (je|j[''']) (n[''']arrive pas [àa] trouver|repousse|attire mal|suis seul))\b/i,
  /\b(compat?ibilit[eé] amoureuse|attirer l.amour|trouver l.amour|ouvrir (mon|le) coeur|blocage amoureux)\b/i,
  // patterns contextuels amour : "schémas amoureux", "ne pas trouver l'amour", etc.
  /\bsch[eé]mas? (amoureux|sentimental[s]?|en amour)\b/i,
  /\b(en amour|relations? amoureuses?|vie amoureuse|pourquoi (je|j.)(attire|repousse|choisis?))\b/i,
]

/** Patterns → work_money (travail / argent) */
const WORK_MONEY_PATTERNS: RegExp[] = [
  /\b(travail|carri[eè]re|boulot|emploi|poste|job\b|business|entrepreneuriat)\b/i,
  /\b(argent|finance[s]?|salaire|revenus?|prosp[eé]rit[eé]|abondance|richesse|manque d.argent)\b/i,
  /\b(mission (de vie|professionnelle)|trouver ma voie|ma vocation|qu.est.?ce que je dois (faire|cr[eé]er)|avancer (professionnellement|dans ma carri[eè]re))\b/i,
  /\b(reconversion|changer de travail|quitter mon poste|cr[eé]er mon entreprise)\b/i,
  // activité professionnelle : "mon activité", "dans mon activité", etc.
  /\b(activit[eé] (professionnelle|[eé]conomique)?|dans mon activit[eé]|mon (projet (pro)?|entreprise|business))\b/i,
]

/** Patterns → blocage (pattern répétitif, obstacle interne) */
const BLOCAGE_PATTERNS: RegExp[] = [
  /\b(je (suis|me sens) bloqu[eé]|blocage|obstacle (int[eé]rieur|personnel)|frein int[eé]rieur)\b/i,
  /\b(pattern r[eé]p[eé]titif|je r[e]?tombe (toujours|encore)|ca recommence|memes? sch[eé]mas?|le meme cercle)\b/i,
  /\b(je n[''']arrive (plus|pas) [àa] avancer|je tourne en rond|je m[''']auto.?sabot|je (me )?(sabote|bloque))\b/i,
  /\b(cycle de souffrance|sortir de ce (cycle|pattern|sch[eé]ma)|pourquoi (ca|ça|je) recommence)\b/i,
  // variantes de "être freiné / retenu / bloqué"
  /\bje (suis|me sens) frein[eé]|je me sens (retenu[e]?|stopp[eé][e]?|coinc[eé][e]?)\b/i,
]

/** Patterns → timing (quand agir, moment juste, cycles) */
const TIMING_PATTERNS: RegExp[] = [
  /\b(quand (agir|partir|commencer|me lancer|est.?ce le bon moment|dois.?je))\b/i,
  /\b(bon moment|moment (juste|propice|favorable)|le timing|mon timing|bonne p[eé]riode)\b/i,
  /\b(maintenant ou (plus tard|attendre)|est.?ce (le bon|un bon) moment|est.?ce la bonne p[eé]riode)\b/i,
  /\b(mon cycle (actuel|en ce moment)|dans quel cycle je suis)\b/i,
]

/** Patterns → identity (qui je suis vraiment, nature profonde) */
const IDENTITY_PATTERNS: RegExp[] = [
  /\b(qui suis.?je (vraiment|r[eé]ellement|au fond)?|ma vraie nature|ma nature (profonde|r[eé]elle|essentielle))\b/i,
  /\b(mon fonctionnement naturel|comment je suis (vraiment|fait|câbl[eé])|ma nature (int[eé]rieure|profonde))\b/i,
  /\b(mon identit[eé] (profonde|essentielle|r[eé]elle)|comprendre qui je suis|conna[iî]tre ma nature)\b/i,
]

/** Patterns → life_period (transition, passage, période de vie) */
const LIFE_PERIOD_PATTERNS: RegExp[] = [
  /\b(p[eé]riode (de (vie|transition)|de changement|difficile|importante))\b/i,
  /\b(transition (de vie)?|grand changement|passage [àa] vide|[àa] un (carrefour|tournant)|passage)\b/i,
  /\b(transformation (profonde|de vie)|cycle (de vie|de fin|de commencement)|une nouvelle [eé]tape)\b/i,
  /\b(je traverse (une|un) (période|phase|moment|changement)|qu.est.?ce que je traverse)\b/i,
]

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
  /\b(relations?|couple|amours?|famille|proches|ami(e)?s|entourage|partenaires?|conjoint)\b/i,
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

  // 0. Données factuelles directes — priorité absolue avant science_specific
  // "mes canaux", "mon kua", "mon type hd", etc. → réponse factuelle sans narrative
  if (DIRECT_KNOWLEDGE_PATTERNS.some((p) => p.test(normalized))) return 'direct_knowledge_query'

  // 1a. Nouveaux intents précis (avant science_specific pour éviter les collisions)
  // love avant relationship (plus spécifique)
  if (LOVE_PATTERNS.some((p) => p.test(normalized))) return 'love'
  // identity avant exact_profile
  if (IDENTITY_PATTERNS.some((p) => p.test(normalized))) return 'identity'
  // timing avant decision
  if (TIMING_PATTERNS.some((p) => p.test(normalized))) return 'timing'
  // work_money avant decision
  if (WORK_MONEY_PATTERNS.some((p) => p.test(normalized))) return 'work_money'
  // blocage avant inner_state
  if (BLOCAGE_PATTERNS.some((p) => p.test(normalized))) return 'blocage'
  // life_period avant fusion_general
  if (LIFE_PERIOD_PATTERNS.some((p) => p.test(normalized))) return 'life_period'

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

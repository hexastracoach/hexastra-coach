/**
 * Request Kind Classification — Hexastra Coach
 *
 * Classifies the nature of a user request beyond domain route + subcategory.
 * Drives: whether exact data is required, whether response is factual or interpretive,
 * whether vector enrichment is appropriate.
 *
 * Priority order:
 *   exact_fact > exact_profile > yearly_priorities > career_orientation > synthesis > interpretation > guidance > clarification > mixed > unknown
 */

import { isCareerGuidanceQuery } from '@/lib/hexastra/orchestration/careerGuidance'
import { isYearlyPriorityQuestion } from '@/lib/hexastra/orchestration/yearlyPriorityRouting'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RequestKind =
  | 'exact_fact'        // "quelles sont mes planètes ?" / "quel est mon ascendant ?"
  | 'exact_profile'     // "quel est mon profil HD ?" / "quel est mon type ?"
  | 'yearly_priorities' // guidance annuelle interpretee a partir des exact data fusion
  | 'career_orientation' // orientation metier / environnement professionnel
  | 'interpretation'    // "ça dit quoi sur moi ?" / "explique-moi mon profil 3/5"
  | 'synthesis'         // "fais-moi une lecture complète" / "qui suis-je ?"
  | 'comparison'        // "est-ce mieux X ou Y ?" — unused for now, reserved
  | 'guidance'          // "que dois-je faire ?" / "comment avancer ?"
  | 'clarification'     // "qu'est-ce que ça veut dire ?" — concept explanation
  | 'mixed'             // fact + interpretation combined
  | 'unknown'

// ── Normalizer ─────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // strip diacritics
    .replace(/[^\w\s'/\-?!.]/g, ' ')   // keep apostrophes, digits, basic punct
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAny(raw: string, patterns: RegExp[]): boolean {
  const n = normalize(raw)
  return patterns.some((p) => p.test(n) || p.test(raw.toLowerCase()))
}

// ── Pattern sets ───────────────────────────────────────────────────────────────

/** User wants a specific data point (list of planets, a house placement, a number…) */
const EXACT_FACT_PATTERNS: RegExp[] = [
  /quell?es? (est|sont|sera?) (mes?|mon|ma|ses?|son|sa) (plan[eè]te?s?|signe?s?|placement?s?|maison?s?|ascendant|lune|soleil|aspect?s?|position?s?|degr[eé]?|chiffre?s?|nombre?s?|ann[eé]e|mois|jour|porte?s?|canal|canaux|centre?s?)/i,
  /mon (ascendant|soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|chiron)\s*[?!]?$/i,
  /quel est (mon|ma|mes) (ascendant|signe solaire|signe lunaire|soleil|lune|ann[eé]e personnelle|chemin de vie|nombre kua|mois personnel|nombre d.expression|nombre d.ame|jour personnel)/i,
  /dis[- ]moi (mes?|mon|ma) (plan[eè]te?s?|signe?s?|placement?s?|maison?s?|ascendant|porte?s?|canal|canaux|centre?s?)/i,
  /liste[- ]?(moi)? (mes?|mon|ma)? ?(plan[eè]te?s?|maison?s?|aspect?s?|centre?s?|porte?s?|canal|canaux)/i,
  /donne[- ]moi (mes?|mon|ma) (plan[eè]te?s?|signe?s?|placement?s?|maison?s?|porte?s?|canal|canaux|centre?s?|chiffre?s?|nombre?s?)/i,
  /quell?es? (planet|planets|houses|aspects|gates|channels|centers|placements) (are|is) (mine|my)/i,
  /(what (is|are)|tell me|give me|show me) (my) (sun|moon|rising|ascendant|planets?|houses?|aspects?|gates?|channels?|centers?)/i,
  /ma (maison|house) (\d{1,2})/i,
  /maison (\d{1,2}) (en|in) ([a-zA-Zà-ÿ]+)/i,
]

/** User wants to know WHAT they are (type/profile/identity value) */
const EXACT_PROFILE_PATTERNS: RegExp[] = [
  /quel (est|sont) (mon|ma|mes) (type hd|profil hd|autorit[eé] hd|strat[eé]gie hd|chemin de vie|nombre expression|nombre [aâ]me|kua|enneagramme?)/i,
  /quel est mon (type|profil|design|autorit[eé]|strat[eé]gie|incarnation|d[eé]finition)\b/i,
  /je suis (quel|quoi|comment) (type|profil|design|signe|autorit[eé])/i,
  /(suis[- ]je|est[- ]ce que je suis) (un|une)? ?(g[eé]n[eé]rateur|projecteur|manifesteur|r[eé]flecteur|manifestant|\d\/\d)/i,
  /mon (type|profil|design|autorit[eé]) (est|c.?est) (quoi|quel|comment)/i,
  /je suis (\d\/\d) ou (\d\/\d)\s*[?!]?$/i,
  /(give me|what is|what.?s) (my) (type|profile|design|authority|strategy|life path|kua number|incarnation cross)/i,
  /quel est mon (type|profil|design)\s*[?!$]?/i,
  /donne[- ]moi mon (type|profil|design|autorit[eé]|strat[eé]gie)\s*[?!$]?/i,
  /mon design humain\s*[?!$]?/i,
  /quel est mon design\s*[?!$]?/i,
]

/** User wants meaning, not just the value */
const INTERPRETATION_PATTERNS: RegExp[] = [
  /[cç]a (dit|veut dire|signifie|repr[eé]sente|indique) (quoi|quelque chose)?/i,
  /explique[- ]moi (mon|ma|mes|ce que|ce|ca|ça|cela|pourquoi)/i,
  /qu.?est[- ]ce que [cç]a (veut dire|signifie|repr[eé]sente|dit)/i,
  /comment (comprendre|interpr[eé]ter|lire) (mon|ma|mes|ce|ca|ça|cela)/i,
  /que dit (mon|ma|mes) (profil|type|signe|placement|maison|autorit[eé]|design)/i,
  /qu.?est[- ]ce que (mon|ma|mes) (profil|type|signe|placement|maison) (dit|signifie|veut dire)/i,
  /qu.?apporte (mon|ma|mes|ce|ca|ça|cela)/i,
  /quel sens (a|ont) (mon|ma|mes)/i,
  /analyse[- ]moi (mon|ma|mes)/i,
  /(what does|how (do|should) i read|explain) (my|this)/i,
  /lire (mon|ma|mes|ce que)/i,
  /interpr[eé]te[- ]?(moi)? (mon|ma|mes)/i,
  /comment ca se traduit/i,
]

/** User wants a full reading or complete portrait */
const SYNTHESIS_PATTERNS: RegExp[] = [
  /(lecture|analyse|bilan|portrait|synth[eè]se) (compl[eè]te?|globale?|g[eé]n[eé]rale?|d.?ensemble)/i,
  /(fais[- ]moi|donne[- ]moi) (une|ma|mon)? ?(lecture|analyse|bilan) (compl[eè]te?|globale?|d.?ensemble)?/i,
  /qui suis[- ]je\s*[?!]?$/i,
  /(profil|design|th[eè]me natal|th[eè]me) (complet|entier|global|g[eé]n[eé]ral)/i,
  /tout (sur|sur moi|ce que tu sais)/i,
  /(full|complete|overall|global|entire) (reading|analysis|profile|chart|design)/i,
  /hexastra (compl[eè]te?|global|g[eé]n[eé]ral|sur moi)/i,
  /mon (hexastra|bilan|portrait|synth[eè]se) (complet|global)?/i,
]

/** User wants advice or next steps */
const GUIDANCE_PATTERNS: RegExp[] = [
  /(que dois[- ]je|comment (dois[- ]je|je dois|je peux|puis[- ]je))/i,
  /(comment avancer|comment progresser|comment (me )?am[eé]liorer)/i,
  /(conseil|conseils|recommandation|recommandations) (sur|pour|concernant)/i,
  /(quoi faire|que faire|que faut[- ]il)/i,
  /(what should i|how (do|can|should) i|what (can|do) i do)/i,
  /comment utiliser (mon|ma|mes)/i,
  /levier (principal|de changement|utile)/i,
]

/** User wants an explanation of a concept */
const CLARIFICATION_PATTERNS: RegExp[] = [
  /qu.?est[- ]ce (que|qu.?) (est|sont|c.?est|signifie|veut dire) (le|la|les|un|une|des)/i,
  /explique[- ]moi (le|la|les|ce que|qu.?est[- ]ce)/i,
  /c.?est quoi (le|la|les|un|une)/i,
  /d[eé]finition (de|du|d.)/i,
  /(what is|what are|define|explain) (the|a|an)/i,
  /difference (entre|between)/i,
  /c.?est quoi (exactement|vraiment|pr[eé]cis[eé]ment)/i,
]

// ── Subcategories that imply exact requests ────────────────────────────────────

const EXACT_SUBCATS = new Set([
  'ascendant', 'signe_lunaire', 'signe_solaire', 'planetes',
  'theme_natal', 'maisons', 'aspects', 'transits', 'retrograde', 'cycle',
  'chemin_de_vie', 'expression', 'ame', 'annee_personnelle',
  'mois_personnel', 'jour_personnel', 'personnalite_num',
  'type_hd', 'profil_hd', 'autorite_hd', 'strategie_hd',
  'centres_hd', 'portes_hd', 'canaux_hd', 'croix_incarnation', 'definition_hd',
  'nombre_kua', 'direction_kua', 'type_enn', 'aile_enn',
])

const SYNTHESIS_SUBCATS = new Set([
  'human_design_exact', 'theme_natal', 'lecture_fusionnee', 'lecture_generale',
])

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classify the kind of request from user message + optional subcategory context.
 *
 * @param message    Raw user message
 * @param subcategory  Detected fine-grained subcategory (from detectSubcategory)
 */
export function classifyRequestKind(message: string, subcategory?: string | null): RequestKind {
  // exact_fact: user wants a specific data value
  if (matchesAny(message, EXACT_FACT_PATTERNS)) return 'exact_fact'

  // exact_profile: user wants to know their type / identity label
  if (matchesAny(message, EXACT_PROFILE_PATTERNS)) return 'exact_profile'

  if (isYearlyPriorityQuestion(message) || subcategory === 'annual_guidance') return 'yearly_priorities'

  if (isCareerGuidanceQuery(message) || subcategory === 'career_guidance') return 'career_orientation'

  // synthesis: full portrait / complete reading
  if (matchesAny(message, SYNTHESIS_PATTERNS)) return 'synthesis'

  // interpretation: meaning / explanation
  if (matchesAny(message, INTERPRETATION_PATTERNS)) return 'interpretation'

  // guidance: what to do, how to act
  if (matchesAny(message, GUIDANCE_PATTERNS)) return 'guidance'

  // clarification: concept explanation
  if (matchesAny(message, CLARIFICATION_PATTERNS)) return 'clarification'

  // Infer from subcategory when message has no strong signal
  if (subcategory) {
    if (EXACT_SUBCATS.has(subcategory)) {
      // Short message + exact subcategory → exact_profile (safer than exact_fact for singletons)
      return normalize(message).split(' ').length <= 10 ? 'exact_profile' : 'mixed'
    }
    if (SYNTHESIS_SUBCATS.has(subcategory)) return 'synthesis'
  }

  return 'unknown'
}

// ── Derived helpers ────────────────────────────────────────────────────────────

/**
 * Whether this requestKind requires exact data from the calculation engine.
 */
export function requestKindNeedsExactData(kind: RequestKind): boolean {
  return (
    kind === 'exact_fact' ||
    kind === 'exact_profile' ||
    kind === 'yearly_priorities' ||
    kind === 'career_orientation' ||
    kind === 'synthesis' ||
    kind === 'mixed'
  )
}

/**
 * Whether this requestKind benefits from interpretive enrichment.
 */
export function requestKindNeedsInterpretation(kind: RequestKind): boolean {
  return (
    kind === 'yearly_priorities' ||
    kind === 'career_orientation' ||
    kind === 'interpretation' ||
    kind === 'synthesis' ||
    kind === 'guidance' ||
    kind === 'mixed'
  )
}

/**
 * Whether vector store enrichment is appropriate for this request kind.
 *
 * RULE: vector enriches explanations; it never determines a calculated value.
 * exact_fact and exact_profile bypass the vector store (engine data is sufficient).
 */
export function requestKindAllowsVectorEnrichment(kind: RequestKind): boolean {
  return kind !== 'exact_fact' && kind !== 'exact_profile'
}

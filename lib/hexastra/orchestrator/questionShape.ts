/**
 * Question Shape Detection — Hexastra Coach
 *
 * Détecte la "forme" de la question posée par l'utilisateur en français.
 * Normalise les accents et tolère les fautes de frappe courantes.
 *
 * Shapes disponibles :
 *   how_question   → Comment ? → mode action_guidance
 *   why_question   → Pourquoi ? → mode causal_reading
 *   who_question   → Qui ? / Quel profil ? → mode relational_profile
 *   when_question  → Quand ? → mode timing_reading
 */

export type QuestionShape =
  | 'how_question'
  | 'why_question'
  | 'who_question'
  | 'when_question'

/** Normalise le texte : minuscules, sans accents, apostrophes standardisées */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/[«»]/g, '"')
    .trim()
}

// ── Patterns HOW ─────────────────────────────────────────────────────────────
const HOW_PATTERNS: RegExp[] = [
  /\bcomm?ent\b/,
  /\bcomm?ant\b/,         // typo: commant
  /\bconment\b/,           // typo: conment
  /\bcmment\b/,            // typo: cmment
  /\bde quelle (facon|maniere|façon)\b/,
  /\bpar quel (moyen|chemin|biais)\b/,
  /\bqu['e]est[- ]ce que (je|on) (peux|peut|dois|doit) faire\b/,
  /\bque faire (pour|face|avec|quand)\b/,
  /\bcomment (faire|agir|reagir|avancer|sortir|changer|gerer|resoudre)\b/,
]

// ── Patterns WHY ─────────────────────────────────────────────────────────────
const WHY_PATTERNS: RegExp[] = [
  /\bpourquoi\b/,
  /\bpourkoi\b/,           // typo
  /\bporquoi\b/,           // typo
  /\bpourquai\b/,          // typo
  /\bporuqoi\b/,           // typo
  /\bpour quelle raison\b/,
  /\bd['']ou (ca |ça )?vient\b/,
  /\bd['']ou (ça |ca )?vient\b/,
  /\bla (cause|raison|source|origine) (de|du|d'|d[''])\b/,
  /\bc['']est quoi la raison\b/,
  /\bc['']est d['']ou\b/,
  /\bpourquoi (je|ca|ça|c['']|il|elle|on|tu)\b/,
  /\bqu['']est[- ]ce qui (fait|cause|explique|provoque|cree|entraine)\b/,
]

// ── Patterns WHO ─────────────────────────────────────────────────────────────
const WHO_PATTERNS: RegExp[] = [
  /\bqui suis[- ]?je\b/,
  /\bqui je suis\b/,
  /\bquel type (de personne|d['']energie|de profil)\b/,
  /\bmon (type|profil|energie|caractere|fonctionnement|schema|pattern)\b/,
  /\bave[ck] qui\b/,
  /\bpour qui\b/,
  /\bquelle est ma (nature|energie|vibration|frequence)\b/,
  /\bje suis quel (type|profil|signe)\b/,
  /\bmon (ame|soul|essence)\b/,
  /\bquel(le)? est (mon|ma) (profil|type|energie|nature)\b/,
  /\bcompatibilite\b/,
  /\bqui (sont|est) (les personnes|les gens|ceux) (avec qui|que)\b/,
]

// ── Patterns WHEN ────────────────────────────────────────────────────────────
const WHEN_PATTERNS: RegExp[] = [
  /\bquand\b/,
  /\bkand\b/,              // typo
  /\bkwan\b/,              // typo
  /\ba quel moment\b/,
  /\bquel moment\b/,
  /\bdans combien (de temps|de jours|de mois)\b/,
  /\bc['']est le bon moment\b/,
  /\best[- ]ce le (bon )?moment\b/,
  /\bquelle periode\b/,
  /\ble bon timing\b/,
  /\btiming\b/,
  /\bquand (est[- ]ce que|faut[- ]il|dois[- ]je|vais[- ]je|ca va|ça va)\b/,
  /\bpas encore le moment\b/,
  /\ben ce moment\b/,
]

/**
 * Détecte la forme de la question dans le message.
 * Retourne null si aucune forme n'est identifiée.
 *
 * Priorité : how > why > who > when
 * (les questions "comment" sont prioritaires car elles appellent une action immédiate)
 */
export function detectQuestionShape(message: string): QuestionShape | null {
  if (!message?.trim()) return null

  const normalized = normalizeText(message)

  if (HOW_PATTERNS.some(p => p.test(normalized))) return 'how_question'
  if (WHY_PATTERNS.some(p => p.test(normalized))) return 'why_question'
  if (WHO_PATTERNS.some(p => p.test(normalized))) return 'who_question'
  if (WHEN_PATTERNS.some(p => p.test(normalized))) return 'when_question'

  return null
}

/**
 * Mappe une QuestionShape vers un mode de réponse enrichi.
 */
export function mapShapeToResponseMode(
  shape: QuestionShape,
): 'action_guidance' | 'causal_reading' | 'relational_profile' | 'timing_reading' {
  switch (shape) {
    case 'how_question':
      return 'action_guidance'
    case 'why_question':
      return 'causal_reading'
    case 'who_question':
      return 'relational_profile'
    case 'when_question':
      return 'timing_reading'
  }
}

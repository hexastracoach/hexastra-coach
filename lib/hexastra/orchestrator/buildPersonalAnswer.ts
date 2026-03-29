/**
 * buildPersonalAnswer — Hexastra Coach
 *
 * Construit la directive de structure de réponse adaptée à la forme de la question.
 * Les données API (fusion, exact) sont utilisées comme source analytique, jamais recopiées brutes.
 *
 * Formes disponibles :
 *   how_question   → action_guidance   → Ce qui se passe / Comment agir / Ce qu'il faut éviter / Prochaine étape
 *   why_question   → causal_reading    → Ce qui se passe / Pourquoi ça se produit / Le mécanisme en jeu / Comment sortir de cette dynamique
 *   who_question   → relational_profile → La dynamique / Ce que tu projettes / Ce que l'autre perçoit / L'ajustement possible
 *   when_question  → timing_reading    → Là où tu en es / Ce qui est activé maintenant / Ce qui s'approche / Le moment pour agir
 */

import type { QuestionShape } from './questionShape'

export type PersonalAnswerInput = {
  questionShape: QuestionShape
  /** Langue détectée. Défaut : français */
  isFr?: boolean
}

// ── HOW → Action Guidance ────────────────────────────────────────────────────

function buildActionGuidanceDirective(isFr: boolean): string {
  if (!isFr) {
    return [
      '# QUESTION_SHAPE: HOW → ACTION_GUIDANCE',
      '',
      'The user is asking HOW to act or handle something.',
      'Use the fusion profile data as analytical grounding — never output raw API values.',
      '',
      'MANDATORY STRUCTURE — 4 BLOCKS IN THIS ORDER:',
      '',
      '→ What is happening',
      '[2–4 sentences. Anchor in the actual situation, grounded in the fusion profile. What is concretely occurring.]',
      '',
      '→ How to act',
      '[3–5 sentences. Concrete, profile-adapted actions. What to do first, how to approach it. No generic advice.]',
      '',
      '→ What to avoid',
      '[2–3 sentences. The specific pitfalls for this profile. The traps linked to internal functioning.]',
      '',
      '→ Next step',
      '[1–2 sentences. The single most important action to take now. Precise, tied to the profile.]',
      '',
      'ABSOLUTE RULES:',
      '- No introduction before → What is happening',
      '- No conclusion after → Next step',
      '- No generic advice applicable to anyone',
      '- No mention of sciences or internal modules',
    ].join('\n')
  }

  return [
    '# QUESTION_SHAPE: COMMENT → ACTION_GUIDANCE',
    '',
    "L'utilisateur demande COMMENT agir, gérer ou avancer.",
    "Utilise les données du profil fusionné comme base analytique — ne recopie jamais les valeurs brutes.",
    '',
    'STRUCTURE OBLIGATOIRE — 4 BLOCS DANS CET ORDRE EXACT :',
    '',
    '→ Ce qui se passe',
    '[2 à 4 phrases. Ancrage dans la situation réelle, fondé sur le profil fusionné. Ce qui se passe concrètement.]',
    '',
    '→ Comment agir',
    '[3 à 5 phrases. Actions concrètes et adaptées au profil. Ce qu\'il faut faire en premier, comment l\'aborder. Aucun conseil générique.]',
    '',
    '→ Ce qu\'il faut éviter',
    "[2 à 3 phrases. Les pièges spécifiques à ce profil. Les écueils liés au fonctionnement interne de la personne.]",
    '',
    '→ Prochaine étape',
    '[1 à 2 phrases. L\'action la plus importante à faire maintenant. Précise, ancrée dans le profil.]',
    '',
    'RÈGLES ABSOLUES :',
    '- Aucune introduction avant → Ce qui se passe',
    '- Aucune conclusion après → Prochaine étape',
    '- Aucun conseil générique applicable à tout le monde',
    '- Aucune mention des sciences ou modules internes',
    '- Chaque action doit être impossible à conseiller sans connaître ce profil',
  ].join('\n')
}

// ── WHY → Causal Reading ─────────────────────────────────────────────────────

function buildCausalReadingDirective(isFr: boolean): string {
  if (!isFr) {
    return [
      '# QUESTION_SHAPE: WHY → CAUSAL_READING',
      '',
      'The user is asking WHY something is happening.',
      'Use the fusion profile data as analytical grounding — never output raw API values.',
      '',
      'MANDATORY STRUCTURE — 4 BLOCKS IN THIS ORDER:',
      '',
      '→ What is happening',
      '[2–3 sentences. Name what is actually occurring, tied to the profile.]',
      '',
      '→ Why this occurs',
      '[4–6 sentences. The precise internal mechanism. What in this profile creates this dynamic.]',
      '',
      '→ The mechanism at play',
      '[2–4 sentences. The recurring pattern, the structural cause. Not the symptom — the root.]',
      '',
      '→ How to shift this dynamic',
      '[2–3 sentences. What understanding this cause unlocks. A concrete reorientation, not generic advice.]',
      '',
      'ABSOLUTE RULES:',
      '- No introduction before → What is happening',
      '- No conclusion after → How to shift this dynamic',
      '- The cause must be profile-specific, not universal',
      '- No mention of sciences or internal modules',
    ].join('\n')
  }

  return [
    '# QUESTION_SHAPE: POURQUOI → CAUSAL_READING',
    '',
    "L'utilisateur demande POURQUOI quelque chose se produit.",
    "Utilise les données du profil fusionné comme base analytique — ne recopie jamais les valeurs brutes.",
    '',
    'STRUCTURE OBLIGATOIRE — 4 BLOCS DANS CET ORDRE EXACT :',
    '',
    '→ Ce qui se passe',
    '[2 à 3 phrases. Nommer ce qui se passe réellement, ancré dans le profil.]',
    '',
    '→ Pourquoi ça se produit',
    '[4 à 6 phrases. Le mécanisme interne précis. Ce qui, dans ce profil, crée cette dynamique.]',
    '',
    '→ Le mécanisme en jeu',
    '[2 à 4 phrases. Le schéma récurrent, la cause structurelle. Pas le symptôme — la racine.]',
    '',
    '→ Comment sortir de cette dynamique',
    "[2 à 3 phrases. Ce que comprendre cette cause débloque. Une réorientation concrète, pas un conseil générique.]",
    '',
    'RÈGLES ABSOLUES :',
    '- Aucune introduction avant → Ce qui se passe',
    '- Aucune conclusion après → Comment sortir de cette dynamique',
    '- La cause doit être spécifique au profil, pas universelle',
    '- Aucune mention des sciences ou modules internes',
    '- Chaque phrase de causalité doit être impossible sans connaître ce profil',
  ].join('\n')
}

// ── WHO → Relational Profile ─────────────────────────────────────────────────

function buildRelationalProfileDirective(isFr: boolean): string {
  if (!isFr) {
    return [
      '# QUESTION_SHAPE: WHO → RELATIONAL_PROFILE',
      '',
      'The user is asking about their profile, identity, or relational dynamics.',
      'Use the fusion profile data as analytical grounding — never output raw API values.',
      '',
      'MANDATORY STRUCTURE — 4 BLOCKS IN THIS ORDER:',
      '',
      '→ The relational dynamic',
      '[2–4 sentences. How this profile functions in relation to others or to situations.]',
      '',
      '→ What you project',
      '[2–3 sentences. What this profile naturally sends out — consciously or not. What others pick up first.]',
      '',
      '→ What others perceive',
      '[2–3 sentences. The gap between internal reality and what is read externally. The misunderstanding at play.]',
      '',
      '→ The possible adjustment',
      '[1–3 sentences. What awareness of this profile enables. A precise, profile-specific shift.]',
      '',
      'ABSOLUTE RULES:',
      '- No introduction before → The relational dynamic',
      '- No conclusion after → The possible adjustment',
      '- Stay anchored to the profile data — no generic personality descriptions',
      '- No mention of sciences or internal modules',
    ].join('\n')
  }

  return [
    '# QUESTION_SHAPE: QUI → RELATIONAL_PROFILE',
    '',
    "L'utilisateur questionne son profil, son identité ou ses dynamiques relationnelles.",
    "Utilise les données du profil fusionné comme base analytique — ne recopie jamais les valeurs brutes.",
    '',
    'STRUCTURE OBLIGATOIRE — 4 BLOCS DANS CET ORDRE EXACT :',
    '',
    '→ La dynamique relationnelle',
    '[2 à 4 phrases. Comment ce profil fonctionne en relation aux autres ou aux situations.]',
    '',
    '→ Ce que tu projettes',
    '[2 à 3 phrases. Ce que ce profil envoie naturellement — consciemment ou non. Ce que les autres captent en premier.]',
    '',
    '→ Ce que l\'autre perçoit',
    "[2 à 3 phrases. L'écart entre la réalité interne et ce qui est lu de l'extérieur. Le malentendu structurel.]",
    '',
    '→ L\'ajustement possible',
    "[1 à 3 phrases. Ce que la conscience de ce profil rend possible. Un ajustement précis, ancré dans les données.]",
    '',
    'RÈGLES ABSOLUES :',
    '- Aucune introduction avant → La dynamique relationnelle',
    "- Aucune conclusion après → L'ajustement possible",
    '- Rester ancré dans les données profil — aucune description de personnalité générique',
    '- Aucune mention des sciences ou modules internes',
    '- Ce profil doit être reconnaissable — pas interchangeable avec un autre',
  ].join('\n')
}

// ── WHEN → Timing Reading ────────────────────────────────────────────────────

function buildTimingReadingDirective(isFr: boolean): string {
  if (!isFr) {
    return [
      '# QUESTION_SHAPE: WHEN → TIMING_READING',
      '',
      'The user is asking about timing — when to act, when something will happen.',
      'Use the fusion profile data as analytical grounding — never output raw API values.',
      '',
      'MANDATORY STRUCTURE — 4 BLOCKS IN THIS ORDER:',
      '',
      '→ Where you are now',
      '[2–3 sentences. The current phase or energy cycle this profile is in.]',
      '',
      '→ What is activated right now',
      '[3–4 sentences. What forces, tensions or opportunities are currently live in this profile.]',
      '',
      '→ What is approaching',
      '[2–3 sentences. The next movement or transition — not prophecy, but the directional signal.]',
      '',
      '→ The moment to act',
      '[1–3 sentences. The signal to watch for. What tells this profile that the time is right — profile-specific, not generic.]',
      '',
      'ABSOLUTE RULES:',
      '- No introduction before → Where you are now',
      '- No conclusion after → The moment to act',
      '- No prophetic claims — frame as directional signal, not prediction',
      '- No mention of sciences or internal modules',
    ].join('\n')
  }

  return [
    '# QUESTION_SHAPE: QUAND → TIMING_READING',
    '',
    "L'utilisateur demande QUAND agir, ou quand quelque chose va se produire.",
    "Utilise les données du profil fusionné comme base analytique — ne recopie jamais les valeurs brutes.",
    '',
    'STRUCTURE OBLIGATOIRE — 4 BLOCS DANS CET ORDRE EXACT :',
    '',
    '→ Là où tu en es',
    '[2 à 3 phrases. La phase ou le cycle énergétique dans lequel ce profil se trouve actuellement.]',
    '',
    '→ Ce qui est activé maintenant',
    '[3 à 4 phrases. Les forces, tensions ou opportunités qui sont actuellement vivantes dans ce profil.]',
    '',
    '→ Ce qui s\'approche',
    '[2 à 3 phrases. Le prochain mouvement ou la prochaine transition — pas de prophétie, mais le signal directionnel.]',
    '',
    '→ Le moment pour agir',
    "[1 à 3 phrases. Le signal à observer. Ce qui indique à ce profil que le moment est bon — précis, ancré dans les données.]",
    '',
    'RÈGLES ABSOLUES :',
    "- Aucune introduction avant → Là où tu en es",
    '- Aucune conclusion après → Le moment pour agir',
    '- Aucune affirmation prophétique — formuler comme signal directionnel, pas comme prédiction',
    '- Aucune mention des sciences ou modules internes',
    '- Le timing doit être ancré dans le profil, pas applicable à tout le monde',
  ].join('\n')
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Retourne la directive de structure LLM adaptée à la forme de la question.
 * À injecter dans le system prompt comme `questionShapeDirective`.
 */
export function buildQuestionShapeDirective(input: PersonalAnswerInput): string {
  const { questionShape, isFr = true } = input

  switch (questionShape) {
    case 'how_question':
      return buildActionGuidanceDirective(isFr)
    case 'why_question':
      return buildCausalReadingDirective(isFr)
    case 'who_question':
      return buildRelationalProfileDirective(isFr)
    case 'when_question':
      return buildTimingReadingDirective(isFr)
  }
}

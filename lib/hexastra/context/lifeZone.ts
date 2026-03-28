/**
 * lifeZone — Hexastra Coach
 *
 * Détecte la zone de vie dominante à partir de l'intent utilisateur.
 *
 * 'relation'  : vie amoureuse, relationnelle → accent sur la dynamique humaine
 * 'work'      : travail, argent, blocage pro → accent sur l'action concrète
 * 'identity'  : qui je suis, fonctionnement → accent sur la compréhension de soi
 * 'energy'    : état intérieur, ressenti → accent sur ce qui est vécu
 * 'decision'  : timing, choix, orientation → accent sur le choix juste
 *
 * Mapping simple : userIntent → LifeZone.
 * Fallback → 'identity' (neutre et universel).
 */

export type LifeZone = 'relation' | 'work' | 'identity' | 'energy' | 'decision'

// ── Table de mapping intent → zone ────────────────────────────────────────────

const INTENT_TO_LIFE_ZONE: Record<string, LifeZone> = {
  // Relation / Amour
  love:                    'relation',
  relationship:            'relation',
  relation:                'relation',

  // Travail / Blocage professionnel
  work_money:              'work',
  blocage:                 'work',
  money_work:              'work',

  // Identité / Profil / Période
  identity:                'identity',
  life_period:             'identity',
  exact_profile:           'identity',
  fusion_general_question: 'identity',

  // Énergie / État intérieur
  inner_state:             'energy',
  emotional_state:         'energy',

  // Décision / Timing
  timing:                  'decision',
  decision:                'decision',
  make_decision:           'decision',
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Retourne la zone de vie correspondant à un intent utilisateur.
 *
 * @param intent  Intent utilisateur (ex: 'love', 'work_money', 'blocage'...)
 * @returns       'relation' | 'work' | 'identity' | 'energy' | 'decision'
 *
 * @example
 * detectLifeZone('love')       // 'relation'
 * detectLifeZone('work_money') // 'work'
 * detectLifeZone('blocage')    // 'work'
 * detectLifeZone('identity')   // 'identity'
 * detectLifeZone('inner_state')// 'energy'
 * detectLifeZone('timing')     // 'decision'
 * detectLifeZone('unknown')    // 'identity' (fallback)
 */
export function detectLifeZone(intent: string): LifeZone {
  return INTENT_TO_LIFE_ZONE[intent] ?? 'identity'
}

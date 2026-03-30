import type { Science, UserIntent } from './scienceTaxonomy'
import { prepareQuery } from './scienceSynonyms'

export type IntentScienceEntry = {
  sciences: Science[]
  subCategories: string[]
  keywords: string[]
}

const RAW_INTENT_SCIENCE_MAP: Record<UserIntent, IntentScienceEntry> = {
  understand_self: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'kua', 'fusion'],
    subCategories: [
      'astro_natal_chart',
      'astro_big3',
      'hd_full_chart',
      'hd_type',
      'hd_authority',
      'num_core_profile',
      'num_life_path',
      'ennea_type_core',
      'kua_profile',
      'fusion_general',
    ],
    keywords: [
      'qui suis je',
      'me comprendre',
      'mieux me connaitre',
      'comment je fonctionne',
      'mon fonctionnement',
      'ma personnalite',
      'mes forces',
      'mes faiblesses',
      'mon potentiel',
      'mon profil',
      'ma nature',
    ],
  },
  understand_period: {
    sciences: ['astro', 'numerology', 'human_design', 'fusion'],
    subCategories: [
      'astro_transits_current',
      'astro_solar_return',
      'num_personal_year',
      'num_personal_month',
      'hd_current_transits',
      'hd_current_cycle',
      'fusion_timing',
      'fusion_transition_phase',
    ],
    keywords: [
      'cette periode',
      'ce que je traverse',
      'ce moment de ma vie',
      'periode actuelle',
      'en ce moment',
      'cycle actuel',
      'energie actuelle',
      'analyse de ma periode',
      'ce qui se passe en ce moment',
    ],
  },
  understand_relationship: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'kua', 'fusion'],
    subCategories: [
      'astro_synastry',
      'astro_composite',
      'hd_connection_dynamics',
      'hd_composite',
      'num_relationship_compatibility',
      'ennea_relationship_dynamics',
      'kua_relationship_match',
      'fusion_relationships',
    ],
    keywords: [
      'ma relation',
      'mon couple',
      'relation avec',
      'compatibilite avec',
      'dynamique avec',
      'mon partenaire',
      'vie amoureuse',
      'pourquoi on se dispute',
      'compatibilite',
    ],
  },
  understand_block: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'fusion'],
    subCategories: [
      'astro_chiron',
      'astro_saturn_return',
      'num_karmic_debt',
      'num_challenges',
      'hd_signature_notself',
      'hd_open_centers',
      'ennea_disintegration',
      'ennea_shadow_work',
      'fusion_blockage',
    ],
    keywords: [
      'je bloque',
      'je stagne',
      'je tourne en rond',
      'je n avance pas',
      'qu est ce qui bloque',
      'pourquoi ca ne marche pas',
      'obstacle',
      'blocage',
      'frein',
      'meme schema',
      'toujour pareil',
    ],
  },
  make_decision: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'kua', 'fusion'],
    subCategories: [
      'astro_transits_timing',
      'num_decision_timing',
      'hd_strategy',
      'hd_authority',
      'ennea_decision_style',
      'kua_decision_direction',
      'fusion_decision',
    ],
    keywords: [
      'que choisir',
      'je doi choisir',
      'quelle decision',
      'dois je',
      'choisir entre',
      'j hesite',
      'partir ou rester',
      'accepter ou refuser',
      'dire oui ou non',
      'prendre une decision',
    ],
  },
  timing: {
    sciences: ['astro', 'numerology', 'human_design', 'kua', 'fusion'],
    subCategories: [
      'astro_transits_current',
      'astro_transits_timing',
      'num_personal_year',
      'num_personal_month',
      'hd_current_transits',
      'kua_timing_support',
      'fusion_timing',
    ],
    keywords: [
      'quand',
      'quel moment',
      'bon moment',
      'bonne periode',
      'est ce le bon moment',
      'attendre ou agir',
      'timing',
      'maintenant ou plus tard',
      'quand agir',
      'quand commencer',
    ],
  },
  career_money: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'kua', 'fusion'],
    subCategories: [
      'astro_transits_work',
      'astro_transits_money',
      'hd_type',
      'hd_strategy',
      'hd_authority',
      'hd_profile',
      'hd_environment',
      'num_career_axis',
      'num_money_axis',
      'ennea_work_style',
      'ennea_money_patterns',
      'kua_work_axis',
      'fusion_career_money',
    ],
    keywords: [
      'ma carriere',
      'mon travail',
      'mon metier',
      'mon emploi',
      'ma voie pro',
      'ma voie professionnelle',
      'quel metier est fait pour moi',
      'quel travail est fait pour moi',
      'quel metier me correspond',
      'pour quel metier suis je fait',
      'quelle carriere me correspond',
      'quelle voie pro me correspond',
      'orientation professionnelle',
      'voie professionnelle',
      'dans quoi suis je bon au travail',
      'argent',
      'finance',
      'revenu',
      'business',
      'entreprise',
      'vocation',
      'reconversion',
    ],
  },
  health_energy: {
    sciences: ['astro', 'human_design', 'kua', 'fusion'],
    subCategories: [
      'astro_transits_energy',
      'hd_defined_centers',
      'hd_sacral_center',
      'hd_digestion',
      'kua_bed_orientation',
      'kua_sleep_axis',
      'fusion_energy_state',
    ],
    keywords: [
      'mon energie',
      'fatigue',
      'epuisement',
      'a plat',
      'sante',
      'vitalite',
      'comment recharger',
      'stress physique',
      'sommeil',
      'burnout',
    ],
  },
  spiritual_axis: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'fusion'],
    subCategories: [
      'astro_lunar_nodes',
      'astro_soul_path',
      'num_soul_mission',
      'num_master_numbers',
      'hd_incarnation_cross',
      'ennea_growth_path',
      'fusion_spiritual_axis',
    ],
    keywords: [
      'sens de ma vie',
      'mission de vie',
      'but profond',
      'chemin spirituel',
      'evolution spirituelle',
      'ame',
      'karma',
      'synchronicite',
      'message spirituel',
    ],
  },
  home_space: {
    sciences: ['kua', 'astro', 'numerology', 'human_design'],
    subCategories: [
      'kua_favorable_directions',
      'kua_home_space_alignment',
      'kua_bed_orientation',
      'astro_relocation',
      'astro_astrocartography',
      'num_house_number',
      'hd_environment',
    ],
    keywords: [
      'ou vivre',
      'demenager',
      'ma maison',
      'mon espace',
      'mon appartement',
      'amenager',
      'feng shui',
      'orientation',
      'ou dormir',
      'quelle ville',
      'quel pays',
    ],
  },
  direct_knowledge: {
    sciences: ['astro', 'numerology', 'human_design', 'enneagram', 'kua'],
    subCategories: [
      'astro_natal_chart',
      'astro_dignities',
      'num_core_profile',
      'hd_full_chart',
      'hd_gates',
      'ennea_type_core',
      'kua_number',
    ],
    keywords: [
      'que signifie',
      'comment fonctionne',
      'expliquer',
      'c est quoi',
      'definition de',
      'qu est ce que',
      'comment interpreter',
      'que veut dire',
      'info sur',
      'information sur',
    ],
  },
  general: {
    sciences: ['fusion'],
    subCategories: ['fusion_general'],
    keywords: [],
  },
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasWholeTerm(text: string, term: string): boolean {
  if (!term) {
    return false
  }

  return new RegExp(`(^|\\s)${escapeRegExp(term)}(?=\\s|$)`).test(text)
}

export const INTENT_SCIENCE_MAP: Record<UserIntent, IntentScienceEntry> = Object.fromEntries(
  Object.entries(RAW_INTENT_SCIENCE_MAP).map(([intent, entry]) => [
    intent,
    {
      sciences: uniq(entry.sciences),
      subCategories: uniq(entry.subCategories),
      keywords: uniq(entry.keywords.map((keyword) => prepareQuery(keyword)).filter(Boolean)),
    },
  ]),
) as Record<UserIntent, IntentScienceEntry>

export const INTENT_KEYWORDS: Record<UserIntent, string[]> = Object.fromEntries(
  Object.entries(INTENT_SCIENCE_MAP).map(([intent, entry]) => [intent, entry.keywords]),
) as Record<UserIntent, string[]>

function scoreIntent(normalizedText: string, keywords: string[]): number {
  let score = 0

  for (const keyword of keywords) {
    if (!keyword) {
      continue
    }

    if (hasWholeTerm(normalizedText, keyword)) {
      score += keyword.includes(' ') ? 3 : 2
    }
  }

  return score
}

export function getSubCategoriesForIntent(intent: UserIntent): string[] {
  return INTENT_SCIENCE_MAP[intent]?.subCategories ?? ['fusion_general']
}

export function getSciencesForIntent(intent: UserIntent): Science[] {
  return INTENT_SCIENCE_MAP[intent]?.sciences ?? ['fusion']
}

export function detectIntentsFromText(normalizedText: string): UserIntent[] {
  const scored = (Object.entries(INTENT_KEYWORDS) as [UserIntent, string[]][])
    .map(([intent, keywords]) => ({
      intent,
      score: scoreIntent(normalizedText, keywords),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return ['general']
  }

  return scored.map((entry) => entry.intent)
}

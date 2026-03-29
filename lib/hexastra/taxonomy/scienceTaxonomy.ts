export type Science =
  | 'astro'
  | 'numerology'
  | 'human_design'
  | 'enneagram'
  | 'kua'
  | 'fusion'

export type SubCategory = {
  key: string
  science: Science
  keywords: string[]
}

export const SCIENCE_TAXONOMY: SubCategory[] = [

  // ================= ASTROLOGIE =================
  {
    key: 'astro_transits',
    science: 'astro',
    keywords: ['transit', 'transits', 'actuel', 'periode', 'energie actuelle', 'cycle'],
  },
  {
    key: 'astro_natal',
    science: 'astro',
    keywords: ['theme natal', 'carte du ciel', 'naissance'],
  },
  {
    key: 'astro_signs',
    science: 'astro',
    keywords: ['signe', 'ascendant', 'lune'],
  },
  {
    key: 'astro_planets',
    science: 'astro',
    keywords: ['planete', 'mars', 'venus', 'saturne', 'jupiter'],
  },
  {
    key: 'astro_houses',
    science: 'astro',
    keywords: ['maison', 'maison 1', 'maison 2'],
  },
  {
    key: 'astro_aspects',
    science: 'astro',
    keywords: ['aspect', 'carre', 'trigone', 'opposition'],
  },
  {
    key: 'astro_synastry',
    science: 'astro',
    keywords: ['compatibilite', 'synastrie', 'relation astrologique'],
  },

  // ================= NUMEROLOGIE =================
  {
    key: 'num_life_path',
    science: 'numerology',
    keywords: ['chemin de vie'],
  },
  {
    key: 'num_year',
    science: 'numerology',
    keywords: ['annee personnelle'],
  },
  {
    key: 'num_month',
    science: 'numerology',
    keywords: ['mois personnel'],
  },

  // ================= HUMAN DESIGN =================
  {
    key: 'hd_type',
    science: 'human_design',
    keywords: ['type', 'generateur', 'projecteur', 'manifesteur'],
  },
  {
    key: 'hd_authority',
    science: 'human_design',
    keywords: ['autorite'],
  },
  {
    key: 'hd_profile',
    science: 'human_design',
    keywords: ['profil'],
  },
  {
    key: 'hd_centers',
    science: 'human_design',
    keywords: ['centres'],
  },
  {
    key: 'hd_gates',
    science: 'human_design',
    keywords: ['portes', 'gates'],
  },
  {
    key: 'hd_channels',
    science: 'human_design',
    keywords: ['canaux'],
  },

  // ================= ENNEAGRAMME =================
  {
    key: 'ennea_type',
    science: 'enneagram',
    keywords: ['enneagramme', 'type 1', 'type 2', 'type 3'],
  },
  {
    key: 'ennea_wing',
    science: 'enneagram',
    keywords: ['aile'],
  },

  // ================= KUA =================
  {
    key: 'kua_number',
    science: 'kua',
    keywords: ['kua', 'nombre kua'],
  },
  {
    key: 'kua_directions',
    science: 'kua',
    keywords: ['direction favorable', 'orientation', 'feng shui'],
  },

  // ================= FUSION =================
  {
    key: 'fusion_general',
    science: 'fusion',
    keywords: [],
  },
]

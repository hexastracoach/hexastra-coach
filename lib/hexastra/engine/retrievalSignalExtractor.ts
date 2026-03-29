import type { SubCategory } from '@/lib/hexastra/taxonomy/scienceTaxonomy'

/**
 * Signal structuré extrait depuis les données brutes de l'API Railway,
 * indexé par science + sous-catégorie.
 *
 * Nommé SubCategorySignal pour éviter la collision avec KsSignal
 * de fusionEngine (qui a une structure différente : sourceLayer, phaseHint…).
 */
export type SubCategorySignal = {
  science: string
  category: string
  value: unknown
}

/**
 * Construit un tableau de signaux structurés à partir des sous-catégories détectées
 * et des données brutes retournées par l'API Railway (/chart/fusion).
 *
 * rawData contient les clés telles que retournées par Railway :
 *   transits, astroProfile, hdProfile, numerologyProfile, enneagram, kua, …
 */
export function buildSignals(
  subCategories: SubCategory[],
  rawData: Record<string, unknown> | null,
): SubCategorySignal[] {
  if (!rawData) {
    return subCategories.map((cat) => ({
      science: cat.science,
      category: cat.key,
      value: null,
    }))
  }

  // Mapping sous-catégorie → clé dans la réponse Railway
  const CATEGORY_TO_RAW_KEY: Record<string, string> = {
    astro_transits:   'transits',
    astro_natal:      'astroProfile',
    astro_signs:      'astroProfile',
    astro_planets:    'astroProfile',
    astro_houses:     'astroProfile',
    astro_aspects:    'astroProfile',
    astro_synastry:   'astroProfile',
    num_life_path:    'numerologyProfile',
    num_year:         'numerologyProfile',
    num_month:        'numerologyProfile',
    hd_type:          'hdProfile',
    hd_authority:     'hdProfile',
    hd_profile:       'hdProfile',
    hd_centers:       'hdProfile',
    hd_gates:         'hdProfile',
    hd_channels:      'hdProfile',
    ennea_type:       'enneagram',
    ennea_wing:       'enneagram',
    kua_number:       'kua',
    kua_directions:   'kua',
    fusion_general:   'publicSummary',
  }

  return subCategories.map((cat) => {
    const rawKey = CATEGORY_TO_RAW_KEY[cat.key] ?? cat.key
    return {
      science:  cat.science,
      category: cat.key,
      value:    rawData[rawKey] ?? null,
    }
  })
}

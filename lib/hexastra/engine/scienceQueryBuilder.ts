import { SCIENCE_TAXONOMY, type SubCategory } from '@/lib/hexastra/taxonomy/scienceTaxonomy'

/**
 * Détecte les sous-catégories de sciences pertinentes à partir du message utilisateur.
 * Retour garanti non-vide : fallback sur fusion_general si aucun match.
 */
export function detectSubCategories(message: string): SubCategory[] {
  const lower = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents pour normaliser

  const matches = SCIENCE_TAXONOMY.filter(
    (cat) => cat.keywords.length > 0 && cat.keywords.some((k) => lower.includes(k)),
  )

  if (matches.length === 0) {
    return [{ key: 'fusion_general', science: 'fusion', keywords: [] }]
  }

  return matches
}

/**
 * Retourne true si la liste de sous-catégories contient au moins une clé astro
 * nécessitant des données de transits temps-réel.
 */
export function requiresTransits(subCategories: SubCategory[]): boolean {
  return subCategories.some((c) => c.key === 'astro_transits')
}

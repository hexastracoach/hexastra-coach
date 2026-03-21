/**
 * HexAstra — Astrologie 12 sphères — Schéma TypeScript v2
 *
 * v2 adds:
 * - SphereRole weighting per reading type
 * - buildSpherePromptBlock()  — prompt-ready string for 1 sphere
 * - buildReadingSystemPrompt() — full injectable system prompt
 * - SPHERE_UI_LABELS           — compact labels for UI/menu
 * - getSphereWeight()           — primary / secondary / contextual per reading
 *
 * Re-exports all types and data from v1 schema.
 * Source: docs/hexastra/astrologie-12-spheres-framework-v2.md
 */

// ── Re-export v1 (types + data unchanged) ──────────────────────────────────────
export {
  ASTRO_SPHERES,
  ASTRO_READING_TYPES,
  PLANET_SPHERE_MAPPING,
  HEXASTRA_ASTRO_FRAMEWORK,
  getSphereByHouse,
  getSphereById,
  getPrioritySpheres,
  getPrimarySpherForPlanet,
} from './astrologie-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  Planet,
  AstroSubcat,
  AstroReadingType,
  ReadingDepth,
  ReadingRender,
  SphereRole,
  SphereDefinition,
  AstroReadingTypeDefinition,
  PlanetSphereMapping,
  ScienceFramework,
} from './astrologie-12-spheres-schema'

import {
  ASTRO_SPHERES,
  ASTRO_READING_TYPES,
  getSphereByHouse,
  type SphereDefinition,
  type AstroReadingType,
  type HouseNumber,
  type SphereRole,
} from './astrologie-12-spheres-schema'

// ── Pondération des sphères par type de lecture ─────────────────────────────────

/**
 * Sphères primaires par type de lecture.
 * Les sphères non listées sont 'secondary' (mention condensée) ou 'contextual' (omise).
 */
const PRIMARY_SPHERES_BY_READING: Record<AstroReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 2, 5, 9],
  relationnelle: [7, 5, 4, 8],
  vocationnelle: [10, 6, 2, 9],
  karmique:      [8, 12, 4, 1],
  creative:      [5, 3, 9, 11],
  cyclique:      [1, 4, 7, 10], // variable — remplacé dynamiquement par sphères transitées
}

/** Retourne le rôle d'une sphère dans un type de lecture donné */
export function getSphereWeight(house: HouseNumber, readingType: AstroReadingType): SphereRole {
  const primaries = PRIMARY_SPHERES_BY_READING[readingType]
  if (primaries.includes(house)) return 'primary'
  // Sphères 1 et 4 toujours au moins 'secondary' (Tier 1 obligatoire)
  if (house === 1 || house === 4) return 'secondary'
  return 'contextual'
}

// ── Labels compacts pour UI / menus ────────────────────────────────────────────

/** Labels courts (1 mot) pour affichage UI, sélecteurs, chips */
export const SPHERE_UI_LABELS: Record<HouseNumber, string> = {
  1:  'Identité',
  2:  'Ressources',
  3:  'Intelligence',
  4:  'Racines',
  5:  'Expression',
  6:  'Équilibre',
  7:  'Relations',
  8:  'Transformation',
  9:  'Vision',
  10: 'Vocation',
  11: 'Collectif',
  12: 'Intégration',
}

/** Labels de type de lecture pour UI */
export const READING_TYPE_LABELS: Record<AstroReadingType, string> = {
  general:       'Lecture générale',
  identitaire:   'Lecture identitaire',
  relationnelle: 'Lecture relationnelle',
  vocationnelle: 'Lecture vocationnelle',
  karmique:      'Lecture karmique',
  creative:      'Lecture créative',
  cyclique:      'Lecture cyclique',
}

// ── Builders de prompt ──────────────────────────────────────────────────────────

/**
 * Sérialise une sphère en bloc prompt-ready.
 * @param sphere  Définition de la sphère
 * @param role    'primary' = contenu complet | 'secondary' = condensé | 'contextual' = omis
 * @param lang    'fr' (défaut) ou 'en'
 */
export function buildSpherePromptBlock(
  sphere: SphereDefinition,
  role: SphereRole = 'primary',
  lang: 'fr' | 'en' = 'fr',
): string | null {
  if (role === 'contextual') return null

  const isFr = lang === 'fr'

  if (role === 'secondary') {
    return isFr
      ? `## ${sphere.house}. ${sphere.name}\n${sphere.reveals}`
      : `## ${sphere.house}. ${sphere.name}\n${sphere.reveals}`
  }

  // primary — full block
  const lines = [
    `## ${sphere.house}. ${sphere.name}`,
    sphere.reveals,
    isFr
      ? `Déséquilibre : ${sphere.imbalance}`
      : `Imbalance: ${sphere.imbalance}`,
    isFr
      ? `Potentiel : ${sphere.potential}`
      : `Potential: ${sphere.potential}`,
    isFr
      ? `Clé : ${sphere.keyUnderstanding}`
      : `Key: ${sphere.keyUnderstanding}`,
    isFr
      ? `Action : ${sphere.keyAction}`
      : `Action: ${sphere.keyAction}`,
  ]

  if (sphere.mirrorQuestion) {
    lines.push(isFr
      ? `Question : ${sphere.mirrorQuestion}`
      : `Question: ${sphere.mirrorQuestion}`)
  }

  return lines.join('\n')
}

/**
 * Génère le bloc de structure des 12 sphères pour injection dans buildSystemPrompt.
 * Adapte la profondeur selon le type de lecture.
 */
export function buildAstroStructureBlock(
  readingType: AstroReadingType,
  lang: 'fr' | 'en' = 'fr',
): string {
  const blocks = ASTRO_SPHERES
    .map((sphere) => {
      const role = getSphereWeight(sphere.house, readingType)
      return buildSpherePromptBlock(sphere, role, lang)
    })
    .filter((b): b is string => b !== null)

  const header = lang === 'fr'
    ? `STRUCTURE HEXASTRA — LECTURE ${readingType.toUpperCase()} — 12 SPHÈRES`
    : `HEXASTRA STRUCTURE — ${readingType.toUpperCase()} READING — 12 SPHERES`

  return [header, '', ...blocks].join('\n')
}

/**
 * Retourne le bloc de règles d'interprétation prêt à injecter.
 */
export function buildAstroRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `RULES:
- Tier 1 data (Sun, Moon, ASC) always present.
- Each planet analyzed in its primary sphere only.
- Cross-sphere aspects: treated in the most active sphere only.
- No generic sign descriptions. Every key action grounded in the read data.
- No empty sphere. If data missing: name the absence and provide available reading.
- Tone: clear, grounded, precise. No jargon without immediate explanation.`
  }

  return `RÈGLES :
- Tier 1 (Soleil, Lune, ASC) toujours présent.
- Chaque planète analysée dans sa sphère principale uniquement.
- Aspects cross-sphères : traités dans la sphère la plus active.
- Pas de description générique de signe. Chaque clé d'action ancrée dans les données lues.
- Pas de sphère vide. Si données manquantes : nommer l'absence et proposer la lecture disponible.
- Ton : clair, incarné, précis. Pas de jargon sans explication immédiate.`
}

/**
 * Construit un prompt système complet pour une lecture astrologique.
 * Utilisable directement dans buildSystemPrompt (analogie buildHoroscopeSystemPrompt).
 *
 * @example
 * const systemPrompt = buildReadingSystemPrompt('vocationnelle', 'fr')
 * // → injecter dans buildChatPayload as `instructions`
 */
export function buildReadingSystemPrompt(
  readingType: AstroReadingType,
  lang: 'fr' | 'en' = 'fr',
  options?: { firstName?: string; plan?: string },
): string {
  const isFr = lang === 'fr'
  const readingDef = ASTRO_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Astro, expert en lecture astrologique structurée à 12 sphères.\nMission : produire une ${readingDef?.name ?? 'lecture astrologique'} complète, structurée, à partir des données personnelles ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Astro, expert in structured 12-sphere astrological reading.\nMission: produce a complete ${readingDef?.name ?? 'astrological reading'}, structured, from the personal data below.\nInvariant structure. No data analyzed twice.`

  const identity = options?.firstName
    ? (isFr ? `Prénom : ${options.firstName}.` : `First name: ${options.firstName}.`)
    : ''

  const structureBlock = buildAstroStructureBlock(readingType, lang)
  const rulesBlock = buildAstroRulesBlock(lang)

  return [role, identity, structureBlock, rulesBlock]
    .filter(Boolean)
    .join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────────

/**
 * Blocs obligatoires pour validation post-render par type de lecture.
 * Analogie DAILY_REQUIRED_BLOCKS pour l'horoscope.
 */
export const ASTRO_REQUIRED_BLOCKS_BY_TYPE: Record<AstroReadingType, string[]> = {
  general:       ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:   ['IDENTITÉ', 'RESSOURCES', 'EXPRESSION', 'VISION'],
  relationnelle: ['RELATIONS', 'EXPRESSION', 'RACINES', 'TRANSFORMATION'],
  vocationnelle: ['VOCATION', 'ÉQUILIBRE', 'RESSOURCES', 'VISION'],
  karmique:      ['TRANSFORMATION', 'INTÉGRATION', 'RACINES', 'IDENTITÉ'],
  creative:      ['EXPRESSION', 'INTELLIGENCE', 'VISION', 'COLLECTIF'],
  cyclique:      ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
}

/**
 * Valide qu'un rendu astrologique contient les sphères requises.
 * Usage : post-render observability (analogue validateHoroscopeOutput).
 */
export function validateAstroOutput(
  text: string,
  readingType: AstroReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = ASTRO_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}

// ── Helpers UI ──────────────────────────────────────────────────────────────────

/**
 * Retourne les sphères avec leur rôle pour un type de lecture — utile pour le front.
 * Permet d'afficher un "sphère selector" avec indication visuelle primary/secondary.
 */
export function getSpheresWithRoles(
  readingType: AstroReadingType,
): Array<{ sphere: SphereDefinition; role: SphereRole }> {
  return ASTRO_SPHERES.map((sphere) => ({
    sphere,
    role: getSphereWeight(sphere.house, readingType),
  }))
}

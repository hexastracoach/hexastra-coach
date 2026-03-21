/**
 * HexAstra — Numérologie 12 sphères — Schéma TypeScript v2
 *
 * v2 adds (vs monolithic schema):
 * - buildNumRulesBlock()   — bloc règles seul, injectable indépendamment
 * - buildNumDataBlock()    — formate les données calculées en BLOC DONNÉES prompt-ready
 * - buildNumFullPrompt()   — prompt complet avec données injectées
 * - PRIMARY_SPHERES_BY_READING — exposé publiquement
 *
 * Re-exports all types, data, and helpers from the main schema.
 * Source: docs/hexastra/numerologie-12-spheres-framework-v2.md
 */

// ── Re-export principal ──────────────────────────────────────────────────────

export {
  NUM_SPHERES,
  NUM_READING_TYPES,
  NUM_DATA_MAPPING,
  HEXASTRA_NUM_FRAMEWORK,
  NUM_SPHERE_UI_LABELS,
  NUM_READING_TYPE_LABELS,
  NUM_REQUIRED_BLOCKS_BY_TYPE,
  getSphereWeight,
  getSphereByHouse,
  getSphereById,
  getPrioritySpheres,
  getSpheresWithRoles,
  getPrimarySphereForData,
  buildSpherePromptBlock,
  buildNumStructureBlock,
  buildNumReadingSystemPrompt,
  validateNumOutput,
} from './numerologie-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  NumDataKey,
  NumDataNature,
  NumReadingType,
  ReadingDepth,
  ReadingRender,
  SphereRole,
  NumSphereDefinition,
  NumReadingTypeDefinition,
  NumDataMapping,
  NumScienceFramework,
} from './numerologie-12-spheres-schema'

import {
  buildNumStructureBlock as _buildNumStructureBlock,
  type NumReadingType,
  type HouseNumber,
} from './numerologie-12-spheres-schema'

// ── Pondération exposée publiquement ────────────────────────────────────────

/** Sphères primaires par type de lecture — exposé pour usage UI / tests */
export const PRIMARY_SPHERES_BY_READING: Record<NumReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 3],
  relationnelle: [7, 4, 5, 8],
  vocationnelle: [10, 2, 9, 6],
  karmique:      [8, 12, 4, 1],
  cyclique:      [11, 6, 9, 2],
  potentiel:     [10, 2, 12, 9],
}

// ── Builders v2 ──────────────────────────────────────────────────────────────

/**
 * Retourne le bloc de règles d'interprétation numérologique, injectable seul.
 * Analogue de buildAstroRulesBlock() dans le schéma astrologie v2.
 */
export function buildNumRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `RULES:
- Spheres 1 and 10 (Life Path + Expression) always present.
- Each data source analyzed in its primary sphere only.
- Karmic Debts and Lessons: only in karmic or deep readings.
- Maturity: only if both Life Path and Expression are calculated.
- No generic number descriptions. Every key action grounded in the read data.
- No empty sphere. If data missing: name the absence and provide available reading.
- Tone: clear, grounded, strategic. No mysticism without concrete grounding.`
  }

  return `RÈGLES :
- Sphères 1 et 10 (CV + Expression) toujours présentes.
- Chaque donnée analysée dans sa sphère principale uniquement.
- Dettes et Leçons karmiques : uniquement en lecture karmique ou deep.
- Maturité : uniquement si CV et Expression sont tous deux calculés.
- Pas de description générique d'un nombre. Chaque clé d'action ancrée dans les données lues.
- Pas de sphère vide. Si données manquantes : nommer l'absence et proposer la lecture disponible.
- Ton : clair, incarné, stratégique. Pas de mystique sans ancrage concret.`
}

// ── Interface données calculées ──────────────────────────────────────────────

/** Données numériques calculées à injecter dans le prompt */
export interface NumCalculatedData {
  /** Prénom complet de naissance */
  firstName: string
  /** Nom de famille de naissance */
  lastName?: string
  /** Date de naissance JJ/MM/AAAA */
  birthDate?: string
  /** Tier 1 — toujours présents */
  cheminDeVie: number
  expression: number
  /** Tier 2 — identité */
  ame?: number
  personnalite?: number
  naissance?: number
  heritage?: number
  maturite?: number
  /** Tier 3 — karmique */
  dettesKarmiques?: number[] | 'aucune'
  leconsKarmiques?: number[] | 'aucune'
  /** Tier 4 — cyclique */
  defis?: [number, number, number, number]
  cycleVieActif?: { numero: 1 | 2 | 3; vibration: number }
  pinnacleActif?: { numero: 1 | 2 | 3 | 4; vibration: number }
  /** Tier 5 — temps court */
  anneePersonnelle?: number
  moisPersonnel?: number
  jourPersonnel?: number
}

/**
 * Formate les données calculées en BLOC DONNÉES prompt-ready.
 * Injectable directement dans buildNumReadingSystemPrompt ou buildNumFullPrompt.
 *
 * @example
 * const dataBlock = buildNumDataBlock({
 *   firstName: 'Sophie',
 *   cheminDeVie: 7,
 *   expression: 3,
 *   ame: 9,
 * })
 */
export function buildNumDataBlock(
  data: NumCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const lines: string[] = [
    isFr ? 'DONNÉES PERSONNELLES — SOURCE DE VÉRITÉ' : 'PERSONAL DATA — SOURCE OF TRUTH',
    isFr ? `Prénom : ${data.firstName}` : `First name: ${data.firstName}`,
  ]

  if (data.lastName) {
    lines.push(isFr ? `Nom : ${data.lastName}` : `Last name: ${data.lastName}`)
  }
  if (data.birthDate) {
    lines.push(isFr ? `Date de naissance : ${data.birthDate}` : `Birth date: ${data.birthDate}`)
  }

  lines.push('', isFr ? 'NOMBRES CALCULÉS :' : 'CALCULATED NUMBERS:')

  // Tier 1 — toujours
  lines.push(isFr ? `Chemin de Vie : ${data.cheminDeVie}` : `Life Path: ${data.cheminDeVie}`)
  lines.push(isFr ? `Expression : ${data.expression}` : `Expression: ${data.expression}`)

  // Tier 2 — si disponible
  if (data.ame != null) {
    lines.push(isFr ? `Âme / Intime : ${data.ame}` : `Soul: ${data.ame}`)
  }
  if (data.personnalite != null) {
    lines.push(isFr ? `Personnalité : ${data.personnalite}` : `Personality: ${data.personnalite}`)
  }
  if (data.naissance != null) {
    lines.push(isFr ? `Nombre de Naissance : ${data.naissance}` : `Birth number: ${data.naissance}`)
  }
  if (data.heritage != null) {
    lines.push(isFr ? `Héritage : ${data.heritage}` : `Heritage: ${data.heritage}`)
  }
  if (data.maturite != null) {
    lines.push(isFr ? `Maturité : ${data.maturite}` : `Maturity: ${data.maturite}`)
  }

  // Tier 3 — karmique
  if (data.dettesKarmiques != null) {
    const val = Array.isArray(data.dettesKarmiques)
      ? data.dettesKarmiques.join(', ')
      : (isFr ? 'aucune' : 'none')
    lines.push(isFr ? `Dettes karmiques : ${val}` : `Karmic debts: ${val}`)
  }
  if (data.leconsKarmiques != null) {
    const val = Array.isArray(data.leconsKarmiques)
      ? data.leconsKarmiques.join(', ')
      : (isFr ? 'aucune' : 'none')
    lines.push(isFr ? `Leçons karmiques : ${val}` : `Karmic lessons: ${val}`)
  }

  // Tier 4 — cyclique
  if (data.defis) {
    lines.push(isFr
      ? `Défis : D1=${data.defis[0]}, D2=${data.defis[1]}, D3=${data.defis[2]}, D4=${data.defis[3]}`
      : `Challenges: C1=${data.defis[0]}, C2=${data.defis[1]}, C3=${data.defis[2]}, C4=${data.defis[3]}`)
  }
  if (data.cycleVieActif) {
    lines.push(isFr
      ? `Cycle de vie actif : ${data.cycleVieActif.numero} (vibration ${data.cycleVieActif.vibration})`
      : `Active life cycle: ${data.cycleVieActif.numero} (vibration ${data.cycleVieActif.vibration})`)
  }
  if (data.pinnacleActif) {
    lines.push(isFr
      ? `Pinnacle actif : ${data.pinnacleActif.numero} (vibration ${data.pinnacleActif.vibration})`
      : `Active pinnacle: ${data.pinnacleActif.numero} (vibration ${data.pinnacleActif.vibration})`)
  }

  // Tier 5 — temps court
  if (data.anneePersonnelle != null) {
    lines.push(isFr ? `Année personnelle : ${data.anneePersonnelle}` : `Personal year: ${data.anneePersonnelle}`)
  }
  if (data.moisPersonnel != null) {
    lines.push(isFr ? `Mois personnel : ${data.moisPersonnel}` : `Personal month: ${data.moisPersonnel}`)
  }
  if (data.jourPersonnel != null) {
    lines.push(isFr ? `Jour personnel : ${data.jourPersonnel}` : `Personal day: ${data.jourPersonnel}`)
  }

  return lines.join('\n')
}

/**
 * Construit un prompt système complet avec données injectées.
 * Version étendue : rôle + structure des sphères + données calculées + règles.
 * Analogue direct de buildHoroscopeSystemPrompt avec données personnelles.
 *
 * @example
 * const systemPrompt = buildNumFullPrompt('vocationnelle', {
 *   firstName: 'Sophie',
 *   cheminDeVie: 7,
 *   expression: 3,
 *   maturite: 10,
 *   pinnacleActif: { numero: 3, vibration: 9 },
 * })
 * // → injecter dans buildChatPayload as `instructions`
 */
export function buildNumFullPrompt(
  readingType: NumReadingType,
  data: NumCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const role = isFr
    ? `Tu es HexAstra Numérologie, expert en lecture numérologique structurée à 12 sphères.\nMission : produire une lecture ${readingType} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Numerology, expert in structured 12-sphere numerological reading.\nMission: produce a complete ${readingType} reading from the data below.\nInvariant structure. No data analyzed twice.`

  const structureBlock = _buildNumStructureBlock(readingType, lang)
  const dataBlock = buildNumDataBlock(data, lang)
  const rulesBlock = buildNumRulesBlock(lang)

  return [role, structureBlock, dataBlock, rulesBlock].join('\n\n')
}

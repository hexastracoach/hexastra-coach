/**
 * HexAstra — Human Design 12 sphères — Schéma TypeScript v2
 *
 * v2 adds (vs monolithic schema):
 * - buildHDRulesBlock()    — bloc règles seul, injectable indépendamment
 * - HDCalculatedData       — interface typée des données HD à injecter
 * - buildHDDataBlock()     — formate les données HD en BLOC DONNÉES prompt-ready
 * - buildHDFullPrompt()    — prompt complet : rôle + structure + données + règles
 * - PRIMARY_SPHERES_BY_READING — exposé publiquement
 *
 * Re-exports all types, data, and helpers from the main schema.
 * Source: docs/hexastra/humandesign-12-spheres-framework-v2.md
 */

// ── Re-export principal ──────────────────────────────────────────────────────

export {
  HD_SPHERES,
  HD_READING_TYPES,
  HD_DATA_MAPPING,
  HEXASTRA_HD_FRAMEWORK,
  HD_SPHERE_UI_LABELS,
  HD_READING_TYPE_LABELS,
  HD_REQUIRED_BLOCKS_BY_TYPE,
  getSphereWeight,
  getSphereByHouse,
  getSphereById,
  getPrioritySpheres,
  getSpheresWithRoles,
  getPrimarySphereForData,
  buildSpherePromptBlock,
  buildHDStructureBlock,
  buildHDReadingSystemPrompt,
  validateHDOutput,
} from './humandesign-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  HDDataKey,
  HDDataNature,
  HDReadingType,
  ReadingDepth,
  ReadingRender,
  SphereRole,
  HDSphereDefinition,
  HDReadingTypeDefinition,
  HDDataMapping,
  HDScienceFramework,
} from './humandesign-12-spheres-schema'

import {
  buildHDStructureBlock as _buildHDStructureBlock,
  type HDReadingType,
  type HouseNumber,
} from './humandesign-12-spheres-schema'

// ── Pondération exposée publiquement ────────────────────────────────────────

/** Sphères primaires par type de lecture — exposé pour usage UI / tests */
export const PRIMARY_SPHERES_BY_READING: Record<HDReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 9],
  relationnelle: [7, 1, 4, 8],
  decisionnelle: [4, 1, 10, 3],
  vocationnelle: [10, 9, 2, 5],
  karmique:      [8, 12, 4, 1],
  energetique:   [2, 6, 3, 11],
  cyclique:      [1, 4, 7, 10],
}

// ── Builders v2 ──────────────────────────────────────────────────────────────

/**
 * Retourne le bloc de règles HD, injectable seul.
 * Analogue de buildAstroRulesBlock() / buildNumRulesBlock() dans les autres schémas v2.
 */
export function buildHDRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `RULES:
- Spheres 1 and 4 (Type + Authority) always present.
- Each data source analyzed in its primary sphere only.
- Open centers (sphere 7) ≠ defined centers (sphere 2) — never mixed.
- Not-Self and unconscious gates: only in karmic or deep readings.
- Variables: only in cyclical or energetic readings.
- Incarnation Cross: sphere 9 only — not duplicated in sphere 10.
- No generic Type descriptions. Every key action grounded in the actual Design data.
- No empty sphere. If data missing: name the absence and provide available reading.
- Tone: grounded, mechanical, non-mystical. Every statement anchored in the Design.`
  }

  return `RÈGLES :
- Sphères 1 et 4 (Type + Autorité) toujours présentes.
- Chaque donnée analysée dans sa sphère principale uniquement.
- Centres ouverts (sphère 7) ≠ centres définis (sphère 2) — jamais mélangés.
- Non-Soi et portes inconscientes : uniquement en lecture karmique ou deep.
- Variables : uniquement en lecture cyclique ou énergétique.
- Croix d'Incarnation : sphère 9 uniquement — pas dupliquée en sphère 10.
- Pas de description générique de Type. Chaque clé d'action ancrée dans les données Design lues.
- Pas de sphère vide. Si données manquantes : nommer l'absence et proposer la lecture disponible.
- Ton : incarné, mécanique, non mystique. Chaque affirmation ancrée dans le Design.`
}

// ── Interface données HD ─────────────────────────────────────────────────────

/** Type HD */
export type HDType =
  | 'Générateur'
  | 'Générateur Manifestant'
  | 'Manifesteur'
  | 'Projecteur'
  | 'Réflecteur'

/** Autorité intérieure */
export type HDAuthority =
  | 'Émotionnelle'
  | 'Sacrale'
  | 'Splénique'
  | 'Ego / Cœur'
  | 'Soi / G'
  | 'Environnementale'
  | 'Lunaire'

/** Définition du BodyGraph */
export type HDDefinition =
  | 'Simple'
  | 'Double'
  | 'Triple'
  | 'Quadruple'
  | 'Aucune'

/** Données Human Design calculées à injecter dans le prompt */
export interface HDCalculatedData {
  /** Prénom */
  firstName: string
  /** Date + heure de naissance (pour référence) */
  birthDateTime?: string

  /** Tier 1 — structure centrale (toujours présents) */
  typeHD: HDType
  strategie: string          // ex : "Attendre de répondre", "Inviter", "Informer"
  autorite: HDAuthority
  profil: string             // ex : "2/4", "5/1", "6/3"

  /** Tier 2 — architecture énergétique */
  centresDefinis?: string[]  // noms des centres définis, ex : ["Sacral", "Gorge"]
  centresOuverts?: string[]  // noms des centres non définis
  definitionHD?: HDDefinition
  canaux?: string[]          // noms ou numéros des canaux actifs, ex : ["34-57", "20-34"]

  /** Tier 3 — incarnation */
  croixIncarnation?: string  // ex : "Croix Droite du Serviteur (33/19 - 56/60)"
  portesConscientes?: number[] // numéros des portes Personnalité
  portesInconscientes?: number[] // numéros des portes Design

  /** Tier 4 — expérientiel */
  signature?: string         // ex : "Satisfaction" pour Générateur
  nonSoi?: string            // ex : "Frustration" pour Générateur
  circuitDominant?: 'Individuel' | 'Tribal' | 'Collectif' | 'Intégration'

  /** Tier 5 — cyclique */
  variables?: string         // ex : "PRL / PRR" ou description des 4 flèches
  transitsActifs?: string[]  // description des transits actifs
}

/**
 * Formate les données HD en BLOC DONNÉES prompt-ready.
 * Injectable directement dans buildHDReadingSystemPrompt ou buildHDFullPrompt.
 *
 * @example
 * const dataBlock = buildHDDataBlock({
 *   firstName: 'Sophie',
 *   typeHD: 'Projecteur',
 *   strategie: 'Attendre l\'invitation',
 *   autorite: 'Splénique',
 *   profil: '2/4',
 * })
 */
export function buildHDDataBlock(
  data: HDCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const lines: string[] = [
    isFr ? 'DONNÉES HUMAN DESIGN — SOURCE DE VÉRITÉ' : 'HUMAN DESIGN DATA — SOURCE OF TRUTH',
    isFr ? `Prénom : ${data.firstName}` : `First name: ${data.firstName}`,
  ]

  if (data.birthDateTime) {
    lines.push(isFr
      ? `Date / heure de naissance : ${data.birthDateTime}`
      : `Birth date / time: ${data.birthDateTime}`)
  }

  lines.push('', isFr ? 'STRUCTURE CENTRALE :' : 'CORE STRUCTURE:')
  lines.push(isFr ? `Type HD : ${data.typeHD}` : `HD Type: ${data.typeHD}`)
  lines.push(isFr ? `Stratégie : ${data.strategie}` : `Strategy: ${data.strategie}`)
  lines.push(isFr ? `Autorité : ${data.autorite}` : `Authority: ${data.autorite}`)
  lines.push(isFr ? `Profil : ${data.profil}` : `Profile: ${data.profil}`)

  // Tier 2 — architecture énergétique
  if (data.centresDefinis?.length) {
    lines.push(isFr
      ? `Centres définis : ${data.centresDefinis.join(', ')}`
      : `Defined centers: ${data.centresDefinis.join(', ')}`)
  }
  if (data.centresOuverts?.length) {
    lines.push(isFr
      ? `Centres ouverts : ${data.centresOuverts.join(', ')}`
      : `Open centers: ${data.centresOuverts.join(', ')}`)
  }
  if (data.definitionHD) {
    lines.push(isFr ? `Définition : ${data.definitionHD}` : `Definition: ${data.definitionHD}`)
  }
  if (data.canaux?.length) {
    lines.push(isFr
      ? `Canaux actifs : ${data.canaux.join(', ')}`
      : `Active channels: ${data.canaux.join(', ')}`)
  }

  // Tier 3 — incarnation
  if (data.croixIncarnation) {
    lines.push(isFr
      ? `Croix d'Incarnation : ${data.croixIncarnation}`
      : `Incarnation Cross: ${data.croixIncarnation}`)
  }
  if (data.portesConscientes?.length) {
    lines.push(isFr
      ? `Portes conscientes (Personnalité) : ${data.portesConscientes.join(', ')}`
      : `Conscious gates (Personality): ${data.portesConscientes.join(', ')}`)
  }
  if (data.portesInconscientes?.length) {
    lines.push(isFr
      ? `Portes inconscientes (Design) : ${data.portesInconscientes.join(', ')}`
      : `Unconscious gates (Design): ${data.portesInconscientes.join(', ')}`)
  }

  // Tier 4 — expérientiel
  if (data.signature) {
    lines.push(isFr ? `Signature : ${data.signature}` : `Signature: ${data.signature}`)
  }
  if (data.nonSoi) {
    lines.push(isFr ? `Thème du Non-Soi : ${data.nonSoi}` : `Not-Self theme: ${data.nonSoi}`)
  }
  if (data.circuitDominant) {
    lines.push(isFr
      ? `Circuit dominant : ${data.circuitDominant}`
      : `Dominant circuit: ${data.circuitDominant}`)
  }

  // Tier 5 — cyclique
  if (data.variables) {
    lines.push(isFr ? `Variables : ${data.variables}` : `Variables: ${data.variables}`)
  }
  if (data.transitsActifs?.length) {
    lines.push(isFr
      ? `Transits actifs : ${data.transitsActifs.join(' | ')}`
      : `Active transits: ${data.transitsActifs.join(' | ')}`)
  }

  return lines.join('\n')
}

/**
 * Construit un prompt système complet avec données HD injectées.
 * Version étendue : rôle + structure des sphères + données + règles.
 * Analogue direct de buildHoroscopeSystemPrompt avec données personnelles.
 *
 * @example
 * const systemPrompt = buildHDFullPrompt('decisionnelle', {
 *   firstName: 'Sophie',
 *   typeHD: 'Projecteur',
 *   strategie: 'Attendre l\'invitation',
 *   autorite: 'Splénique',
 *   profil: '2/4',
 *   centresDefinis: ['Ajna', 'Gorge'],
 * })
 * // → injecter dans buildChatPayload as `instructions`
 */
export function buildHDFullPrompt(
  readingType: HDReadingType,
  data: HDCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const role = isFr
    ? `Tu es HexAstra Human Design, expert en lecture HD structurée à 12 sphères.\nMission : produire une lecture ${readingType} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Human Design, expert in structured 12-sphere HD reading.\nMission: produce a complete ${readingType} reading from the data below.\nInvariant structure. No data analyzed twice.`

  const structureBlock = _buildHDStructureBlock(readingType, lang)
  const dataBlock = buildHDDataBlock(data, lang)
  const rulesBlock = buildHDRulesBlock(lang)

  return [role, structureBlock, dataBlock, rulesBlock].join('\n\n')
}

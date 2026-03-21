/**
 * HexAstra — Ennéagramme 12 sphères — Schéma TypeScript v2
 *
 * v2 adds (vs monolithic schema):
 * - buildEnneaRulesBlock()  — bloc règles seul, injectable indépendamment
 * - EnneaCalculatedData     — interface typée des données Ennéagramme à injecter
 * - buildEnneaDataBlock()   — formate les données en BLOC DONNÉES prompt-ready
 * - buildEnneaFullPrompt()  — prompt complet : rôle + structure + données + règles
 * - PRIMARY_SPHERES_BY_READING — exposé publiquement
 *
 * Re-exports all types, data, and helpers from the main schema.
 * Source: docs/hexastra/enneagramme-12-spheres-framework-v2.md
 */

// ── Re-export principal ──────────────────────────────────────────────────────

export {
  ENNEA_SPHERES,
  ENNEA_READING_TYPES,
  ENNEA_DATA_MAPPING,
  HEXASTRA_ENNEA_FRAMEWORK,
  ENNEA_SPHERE_UI_LABELS,
  ENNEA_READING_TYPE_LABELS,
  ENNEA_REQUIRED_BLOCKS_BY_TYPE,
  getSphereWeight,
  getSphereByHouse,
  getSphereById,
  getPrioritySpheres,
  getSpheresWithRoles,
  getPrimarySphereForData,
  buildSpherePromptBlock,
  buildEnneaStructureBlock,
  buildEnneaReadingSystemPrompt,
  validateEnneaOutput,
} from './enneagramme-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  EnneaDataKey,
  EnneaDataNature,
  EnneaReadingType,
  EnneaType,
  EnneaWing,
  EnneaCenter,
  EnneaSubtype,
  ReadingDepth,
  ReadingRender,
  SphereRole,
  EnneaSphereDefinition,
  EnneaReadingTypeDefinition,
  EnneaDataMapping,
  EnneaScienceFramework,
} from './enneagramme-12-spheres-schema'

import {
  buildEnneaStructureBlock as _buildEnneaStructureBlock,
  type EnneaReadingType,
  type EnneaType,
  type EnneaCenter,
  type EnneaSubtype,
  type HouseNumber,
} from './enneagramme-12-spheres-schema'

// ── Pondération exposée publiquement ────────────────────────────────────────

/** Sphères primaires par type de lecture — exposé pour usage UI / tests */
export const PRIMARY_SPHERES_BY_READING: Record<EnneaReadingType, HouseNumber[]> = {
  general:         [1, 4, 7, 10],
  identitaire:     [1, 4, 5, 3],
  relationnelle:   [7, 1, 4, 11],
  emotionnelle:    [6, 4, 8, 3],
  vocationnelle:   [10, 9, 2, 5],
  transformatrice: [8, 12, 4, 9],
  defensif:        [8, 3, 4, 6],
  evolutive:       [9, 12, 5, 1],
}

// ── Builders v2 ──────────────────────────────────────────────────────────────

/**
 * Retourne le bloc de règles Ennéagramme, injectable seul.
 * Analogue de buildHDRulesBlock() / buildNumRulesBlock() dans les autres schémas v2.
 */
export function buildEnneaRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `RULES:
- Spheres 1 and 4 (Type + Core Fear) always present.
- Each data source analyzed in its primary sphere only.
- Passion (sphere 6, emotional) ≠ Mental fixation (sphere 3, cognitive). Never interchanged.
- Disintegration arrow (sphere 8, stress) ≠ Integration arrow (sphere 9, growth). Never in the same sphere.
- Defense mechanism and core wound: only in defensive, transformative, or deep readings.
- Subtypes distributed: SP → sphere 2, SO → sphere 11, SX → sphere 7. Not all three in the same sphere.
- No generic type descriptions ("Fours are creative and melancholic").
- No vague key actions ("work on yourself", "be more present").
- No empty sphere. If data missing: name the absence and provide available reading.
- Tone: clear, grounded, strategic. No spiritual inflation without concrete grounding.`
  }

  return `RÈGLES :
- Sphères 1 et 4 (Type + Peur fondamentale) toujours présentes.
- Chaque donnée analysée dans sa sphère principale uniquement.
- Passion (sphère 6, émotionnel) ≠ Fixation mentale (sphère 3, cognitif). Jamais interverties.
- Flèche de désintégration (sphère 8, stress) ≠ Flèche d'intégration (sphère 9, croissance). Jamais dans la même sphère.
- Mécanisme de défense et blessure centrale : uniquement en lecture défensif, transformatrice ou deep.
- Sous-types distribués : SP → sphère 2, SO → sphère 11, SX → sphère 7. Pas les 3 dans la même sphère.
- Pas de description générique de type ("les 4 sont créatifs et mélancoliques").
- Pas de clé d'action floue ("travaille sur toi-même", "sois plus présent").
- Pas de sphère vide. Si données manquantes : nommer l'absence et proposer la lecture disponible.
- Ton : clair, incarné, stratégique. Pas d'inflation spirituelle sans ancrage concret.`
}

// ── Interface données Ennéagramme ────────────────────────────────────────────

/** Données Ennéagramme déclarées / observées à injecter dans le prompt */
export interface EnneaCalculatedData {
  /** Prénom */
  firstName: string
  /** Source des données : test validé, auto-déclaration, observation */
  dataSource?: 'test' | 'declared' | 'observed'

  /** Tier 1 — structure centrale (toujours présents) */
  typeEnneagramme: EnneaType
  aile?: string              // ex : "4w3", "4w5"
  centreIntelligence: EnneaCenter

  /** Tier 2 — dynamique centrale */
  passionDominante?: string  // ex : "Envie", "Colère", "Orgueil"
  fixationMentale?: string   // ex : "Mélancolie", "Ressentiment", "Vanité"
  peurFondamentale?: string  // formulée en phrase (ex : "Être insignifiant")
  desirFondamental?: string  // formulé en phrase (ex : "Être unique et authentique")

  /** Tier 3 — protection */
  mecanismeDefense?: string  // ex : "Introversion", "Refoulement", "Formation réactionnelle"
  blessureCentrale?: string  // ex : "Sentiment d'être fondamentalement déficient"

  /** Tier 4 — évolutif */
  fleche_integration?: string  // Type d'intégration, ex : "Type 4 → Type 1"
  fleche_desintegration?: string // Type de désintégration, ex : "Type 4 → Type 2"
  vertu?: string              // ex : "Équanimité", "Humilité", "Authenticité"
  ideeSacree?: string         // ex : "L'origine divine", "La volonté divine", "L'amour universel"

  /** Tier 5 — relationnel / cyclique */
  sousType?: EnneaSubtype
  styleRelationnel?: string   // description libre
  niveauxSante?: 'elevé' | 'moyen' | 'bas' // niveau estimé actuel
  triType?: string            // ex : "458", "279", "136"
}

/**
 * Formate les données Ennéagramme en BLOC DONNÉES prompt-ready.
 * Injectable directement dans buildEnneaReadingSystemPrompt ou buildEnneaFullPrompt.
 *
 * @example
 * const dataBlock = buildEnneaDataBlock({
 *   firstName: 'Sophie',
 *   typeEnneagramme: 4,
 *   centreIntelligence: 'Cœur',
 *   aile: '4w5',
 *   passionDominante: 'Envie',
 *   peurFondamentale: 'Être fondamentalement déficiente ou ordinaire',
 * })
 */
export function buildEnneaDataBlock(
  data: EnneaCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const lines: string[] = [
    isFr ? 'DONNÉES ENNÉAGRAMME — SOURCE DE VÉRITÉ' : 'ENNEAGRAM DATA — SOURCE OF TRUTH',
    isFr ? `Prénom : ${data.firstName}` : `First name: ${data.firstName}`,
  ]

  if (data.dataSource) {
    const srcLabel = { test: 'test validé', declared: 'auto-déclaration', observed: 'observation' }
    lines.push(isFr
      ? `Source : ${srcLabel[data.dataSource]}`
      : `Source: ${data.dataSource}`)
  }

  lines.push('', isFr ? 'STRUCTURE CENTRALE :' : 'CORE STRUCTURE:')
  lines.push(isFr ? `Type : ${data.typeEnneagramme}` : `Type: ${data.typeEnneagramme}`)
  lines.push(isFr
    ? `Centre d'intelligence : ${data.centreIntelligence}`
    : `Intelligence center: ${data.centreIntelligence}`)
  if (data.aile) {
    lines.push(isFr ? `Aile : ${data.aile}` : `Wing: ${data.aile}`)
  }

  // Tier 2 — dynamique centrale
  if (data.passionDominante || data.fixationMentale || data.peurFondamentale || data.desirFondamental) {
    lines.push('', isFr ? 'DYNAMIQUE CENTRALE :' : 'CORE DYNAMIC:')
    if (data.passionDominante) {
      lines.push(isFr ? `Passion dominante : ${data.passionDominante}` : `Dominant passion: ${data.passionDominante}`)
    }
    if (data.fixationMentale) {
      lines.push(isFr ? `Fixation mentale : ${data.fixationMentale}` : `Mental fixation: ${data.fixationMentale}`)
    }
    if (data.peurFondamentale) {
      lines.push(isFr ? `Peur fondamentale : ${data.peurFondamentale}` : `Core fear: ${data.peurFondamentale}`)
    }
    if (data.desirFondamental) {
      lines.push(isFr ? `Désir fondamental : ${data.desirFondamental}` : `Core desire: ${data.desirFondamental}`)
    }
  }

  // Tier 3 — protection
  if (data.mecanismeDefense || data.blessureCentrale) {
    lines.push('', isFr ? 'MÉCANISMES DE PROTECTION :' : 'PROTECTION MECHANISMS:')
    if (data.mecanismeDefense) {
      lines.push(isFr ? `Mécanisme de défense : ${data.mecanismeDefense}` : `Defense mechanism: ${data.mecanismeDefense}`)
    }
    if (data.blessureCentrale) {
      lines.push(isFr ? `Blessure centrale : ${data.blessureCentrale}` : `Core wound: ${data.blessureCentrale}`)
    }
  }

  // Tier 4 — évolutif
  if (data.fleche_integration || data.fleche_desintegration || data.vertu || data.ideeSacree) {
    lines.push('', isFr ? 'DYNAMIQUE ÉVOLUTIVE :' : 'EVOLUTIONARY DYNAMIC:')
    if (data.fleche_desintegration) {
      lines.push(isFr
        ? `Flèche de désintégration (stress) : ${data.fleche_desintegration}`
        : `Disintegration arrow (stress): ${data.fleche_desintegration}`)
    }
    if (data.fleche_integration) {
      lines.push(isFr
        ? `Flèche d'intégration (croissance) : ${data.fleche_integration}`
        : `Integration arrow (growth): ${data.fleche_integration}`)
    }
    if (data.vertu) {
      lines.push(isFr ? `Vertu : ${data.vertu}` : `Virtue: ${data.vertu}`)
    }
    if (data.ideeSacree) {
      lines.push(isFr ? `Idée sacrée : ${data.ideeSacree}` : `Holy idea: ${data.ideeSacree}`)
    }
  }

  // Tier 5 — relationnel / cyclique
  if (data.sousType || data.styleRelationnel || data.niveauxSante || data.triType) {
    lines.push('', isFr ? 'PROFIL RELATIONNEL / CYCLIQUE :' : 'RELATIONAL / CYCLICAL PROFILE:')
    if (data.sousType) {
      lines.push(isFr ? `Sous-type dominant : ${data.sousType}` : `Dominant subtype: ${data.sousType}`)
    }
    if (data.styleRelationnel) {
      lines.push(isFr ? `Style relationnel : ${data.styleRelationnel}` : `Relational style: ${data.styleRelationnel}`)
    }
    if (data.niveauxSante) {
      const lvl = { elevé: 'élevé (intégré)', moyen: 'moyen (automatique)', bas: 'bas (régression)' }
      lines.push(isFr
        ? `Niveau de santé estimé : ${lvl[data.niveauxSante]}`
        : `Estimated health level: ${data.niveauxSante}`)
    }
    if (data.triType) {
      lines.push(isFr ? `Tri-type : ${data.triType}` : `Tri-type: ${data.triType}`)
    }
  }

  return lines.join('\n')
}

/**
 * Construit un prompt système complet avec données Ennéagramme injectées.
 * Version étendue : rôle + structure des sphères + données + règles.
 * Analogue direct de buildHoroscopeSystemPrompt avec données personnelles.
 *
 * @example
 * const systemPrompt = buildEnneaFullPrompt('transformatrice', {
 *   firstName: 'Sophie',
 *   typeEnneagramme: 4,
 *   centreIntelligence: 'Cœur',
 *   peurFondamentale: 'Être fondamentalement déficiente',
 *   mecanismeDefense: 'Introversion',
 *   fleche_integration: 'Type 4 → qualités du Type 1',
 * })
 * // → injecter dans buildChatPayload as `instructions`
 */
export function buildEnneaFullPrompt(
  readingType: EnneaReadingType,
  data: EnneaCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const role = isFr
    ? `Tu es HexAstra Ennéagramme, expert en lecture caractérielle structurée à 12 sphères.\nMission : produire une lecture ${readingType} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Enneagram, expert in structured 12-sphere character reading.\nMission: produce a complete ${readingType} reading from the data below.\nInvariant structure. No data analyzed twice.`

  const structureBlock = _buildEnneaStructureBlock(readingType, lang)
  const dataBlock = buildEnneaDataBlock(data, lang)
  const rulesBlock = buildEnneaRulesBlock(lang)

  return [role, structureBlock, dataBlock, rulesBlock].join('\n\n')
}

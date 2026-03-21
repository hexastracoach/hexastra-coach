/**
 * HexAstra — Fusion 12 sphères — Schéma TypeScript v2
 *
 * v2 adds (vs monolithic schema):
 * - PRIMARY_SPHERES_BY_READING          — exposé publiquement
 * - buildFusionRulesBlock()             — bloc règles seul, injectable indépendamment
 * - buildFusionContextualPrompt()       — prompt court pour questions libres
 *                                         (utilise detectDominantSpheres en interne)
 * - SciencesAvailable                   — type helper pour déclarer les sciences présentes
 *
 * Re-exports all types, data, and helpers from the main schema.
 * Source: docs/hexastra/fusion-12-spheres-framework-v2.md
 */

// ── Re-export principal ──────────────────────────────────────────────────────

export {
  FUSION_SPHERES,
  FUSION_READING_TYPES,
  HEXASTRA_FUSION_FRAMEWORK,
  FUSION_SPHERE_UI_LABELS,
  FUSION_READING_TYPE_LABELS,
  FUSION_REQUIRED_BLOCKS_BY_TYPE,
  PRIMARY_SPHERES_BY_READING,
  getSphereByHouse,
  getLeadingSciencesForSphere,
  getScienceRoleInSphere,
  getPrioritySpheres,
  buildFusionDataBlock,
  buildFusionRulesBlock,
  buildFusionFullPrompt,
  detectDominantSpheres,
  validateFusionOutput,
} from './fusion-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  ScienceKey,
  ScienceRole,
  FusionReadingType,
  ReadingDepth,
  ReadingRender,
  ScienceAssignment,
  FusionSphereDefinition,
  FusionReadingTypeDefinition,
  FusionScienceFramework,
  FusionAvailableData,
} from './fusion-12-spheres-schema'

import {
  detectDominantSpheres as _detectDominantSpheres,
  buildFusionDataBlock as _buildFusionDataBlock,
  buildFusionRulesBlock as _buildFusionRulesBlock,
  getSphereByHouse as _getSphereByHouse,
  type FusionReadingType,
  type FusionAvailableData,
  type HouseNumber,
  type ScienceKey,
  type FusionSphereDefinition,
} from './fusion-12-spheres-schema'

// ── Type helper v2 ───────────────────────────────────────────────────────────

/** Sciences effectivement disponibles dans un contexte donné */
export type SciencesAvailable = Partial<Record<ScienceKey, boolean>>

// ── Builder contextuel v2 ────────────────────────────────────────────────────

/**
 * Construit un prompt court pour une question libre / contextuelle.
 * Détecte automatiquement les sphères dominantes et les sciences utiles.
 * Max 3 sphères, 3 sciences — jamais la matrice complète.
 *
 * @example
 * const prompt = buildFusionContextualPrompt(
 *   "Je me sens bloqué et je ne sais pas comment avancer",
 *   {
 *     firstName: 'Sophie',
 *     enneagramme: { type: 4, peurFondamentale: 'Être fondamentalement déficiente' },
 *     humandesign: { type: 'Projecteur', autorite: 'Splénique' },
 *   }
 * )
 * // → prompt court ciblé sur sphères 4/8/10, sciences Ennéagramme + HD
 */
export function buildFusionContextualPrompt(
  question: string,
  data: FusionAvailableData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'
  const { spheres, sciences } = _detectDominantSpheres(question)

  const role = isFr
    ? `Tu es HexAstra Fusion, expert en lecture multi-sciences.\nMode : réponse contextuelle courte.\nQuestion reçue : « ${question} »\nSphères activées : ${spheres.join(', ')}. Sciences utiles : ${sciences.join(', ')}.\nRépondre en 5 blocs : Ce qui se joue / Pourquoi / Observer / Posture / Synthèse.\nPas de jargon technique. Ton direct, humain, utile.`
    : `You are HexAstra Fusion, multi-science reading expert.\nMode: short contextual response.\nQuestion received: « ${question} »\nActive spheres: ${spheres.join(', ')}. Useful sciences: ${sciences.join(', ')}.\nRespond in 5 blocks: What is at play / Why / Observe / Posture / Synthesis.\nNo technical jargon. Direct, human, useful tone.`

  // Blocs sphères ciblés (max 3)
  const sphereBlocks = spheres
    .map((h) => _getSphereByHouse(h))
    .filter((s): s is FusionSphereDefinition => s !== undefined)
    .map((s) => {
      const leads = s.scienceAssignments
        .filter((a) => sciences.includes(a.science) && a.role === 'leading')
        .map((a) => `${a.science} (${a.priorityData.slice(0, 2).join(', ')})`)
        .join(' + ')
      return `## ${s.house}. ${s.name}\n${s.reveals}\n${isFr ? 'Leads' : 'Leading'}: ${leads || sciences[0]}`
    })
    .join('\n\n')

  const dataBlock = _buildFusionDataBlock(data, lang)
  const rules = isFr
    ? `RÈGLES : Réponse courte (5 blocs). Pas de liste exhaustive. Données manquantes = nommer l'absence. Pas de jargon.`
    : `RULES: Short response (5 blocks). No exhaustive list. Missing data = name the absence. No jargon.`

  return [role, sphereBlocks, dataBlock, rules].join('\n\n')
}

/**
 * Version allégée de buildFusionFullPrompt — injecte uniquement les sphères
 * prioritaires du type sans le bloc structure complet.
 * Idéal pour les réponses rapides ou les lectures courtes (freemium).
 *
 * @example
 * const prompt = buildFusionLitePrompt('general', {
 *   firstName: 'Sophie',
 *   enneagramme: { type: 4, centreIntelligence: 'Cœur' },
 *   numerologie: { cheminDeVie: 7 },
 * })
 */
export function buildFusionLitePrompt(
  readingType: FusionReadingType,
  data: FusionAvailableData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  // Import local des sphères prioritaires
  const PRIORITY: Record<FusionReadingType, HouseNumber[]> = {
    general:        [1, 4, 7, 10],
    identitaire:    [1, 4, 3, 5],
    relationnelle:  [7, 1, 4, 11],
    vocationnelle:  [10, 9, 2, 5],
    decisionnelle:  [3, 2, 10, 6],
    energetique:    [2, 6, 4, 8],
    transformatrice:[8, 12, 4, 9],
    cyclique:       [6, 11, 12, 10],
    contextuelle:   [1, 4, 6, 8],
  }

  const role = isFr
    ? `Tu es HexAstra Fusion, lecture multi-sciences 12 sphères.\nMission : lecture ${readingType} concise. Structure invariante. Pas de doublon entre sphères.`
    : `You are HexAstra Fusion, 12-sphere multi-science reading.\nMission: concise ${readingType} reading. Invariant structure. No duplication between spheres.`

  const sphereBlocks = PRIORITY[readingType]
    .map((h) => _getSphereByHouse(h))
    .filter((s): s is FusionSphereDefinition => s !== undefined)
    .map((s) => `## ${s.house}. ${s.name}\n${s.reveals}\n${isFr ? `Clé : ${s.keyUnderstanding}` : `Key: ${s.keyUnderstanding}`}`)
    .join('\n\n')

  const dataBlock = _buildFusionDataBlock(data, lang)
  const rulesBlock = _buildFusionRulesBlock(lang)

  return [role, sphereBlocks, dataBlock, rulesBlock].join('\n\n')
}

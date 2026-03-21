/**
 * HexAstra — Kua 12 sphères — Schéma TypeScript v2
 *
 * v2 adds (vs monolithic schema):
 * - buildKuaRulesBlock()    — bloc règles seul, injectable indépendamment
 * - KuaCalculatedData       — interface typée des données Kua à injecter
 * - buildKuaDataBlock()     — formate les données en BLOC DONNÉES prompt-ready
 * - buildKuaFullPrompt()    — prompt complet : rôle + structure + données + règles
 * - PRIMARY_SPHERES_BY_READING — exposé publiquement
 *
 * Re-exports all types, data, and helpers from the main schema.
 * Source: docs/hexastra/kua-12-spheres-framework-v2.md
 */

// ── Re-export principal ──────────────────────────────────────────────────────

export {
  KUA_SPHERES,
  KUA_READING_TYPES,
  KUA_DATA_MAPPING,
  HEXASTRA_KUA_FRAMEWORK,
  KUA_SPHERE_UI_LABELS,
  KUA_READING_TYPE_LABELS,
  KUA_REQUIRED_BLOCKS_BY_TYPE,
  getSphereWeight,
  getSphereByHouse,
  getSphereById,
  getPrioritySpheres,
  getSpheresWithRoles,
  getPrimarySphereForData,
  buildSpherePromptBlock,
  buildKuaStructureBlock,
  buildKuaReadingSystemPrompt,
  validateKuaOutput,
} from './kua-12-spheres-schema'

export type {
  SphereId,
  HouseNumber,
  KuaDataKey,
  KuaDataNature,
  KuaReadingType,
  KuaNumber,
  KuaGroup,
  KuaElement,
  KuaTrigramme,
  CompassDirection,
  ReadingDepth,
  ReadingRender,
  SphereRole,
  KuaSphereDefinition,
  KuaReadingTypeDefinition,
  KuaDataMapping,
  KuaScienceFramework,
} from './kua-12-spheres-schema'

import {
  buildKuaStructureBlock as _buildKuaStructureBlock,
  type KuaReadingType,
  type KuaNumber,
  type KuaGroup,
  type KuaElement,
  type KuaTrigramme,
  type CompassDirection,
  type HouseNumber,
} from './kua-12-spheres-schema'

// ── Pondération exposée publiquement ────────────────────────────────────────

/** Sphères primaires par type de lecture — exposé pour usage UI / tests */
export const PRIMARY_SPHERES_BY_READING: Record<KuaReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 3],
  relationnelle: [7, 1, 4, 11],
  decisionnelle: [3, 2, 10, 6],
  orientation:   [2, 9, 3, 10],
  environnement: [6, 8, 2, 9],
  cyclique:      [6, 11, 10, 12],
  strategique:   [10, 2, 9, 7],
}

// ── Builders v2 ──────────────────────────────────────────────────────────────

/**
 * Retourne le bloc de règles Kua, injectable seul.
 * Analogue de buildHDRulesBlock() / buildNumRulesBlock() dans les autres schémas v2.
 */
export function buildKuaRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `RULES:
- Spheres 1 and 4 (Kua Number + Trigram/Element) always present.
- Each data key analyzed in its primary sphere only.
- Favorable directions (Sheng Chi, Tien Yi, Nien Yen, Fu Wei) only in spheres 2/3/7/9/10 — never in sphere 8.
- Unfavorable directions (Ho Hai, Wu Gui, Liu Sha, Jue Ming) only in spheres 6/8 — never in spheres 2/3/7/9.
- Bureau and bed orientation only in orientation, environment, and strategic readings.
- Annual star and Ki cycle only in cyclical, decisional, and strategic readings.
- Sheng Chi redescribed in sphere 10: FORBIDDEN — sphere 10 = global vocational trajectory (group + element).
- Liu Sha, Wu Gui, Jue Ming in detail: only in environment or deep readings.
- No empty sphere. If data missing: name the absence and provide available reading.
- Tone: grounded in physical space, directive, non-mystical. Every direction linked to a concrete use.`
  }

  return `RÈGLES :
- Sphères 1 et 4 (Nombre Kua + Trigramme/Élément) toujours présentes.
- Chaque donnée analysée dans sa sphère principale uniquement.
- Directions favorables (Sheng Chi, Tien Yi, Nien Yen, Fu Wei) uniquement en sphères 2/3/7/9/10 — jamais en sphère 8.
- Directions défavorables (Ho Hai, Wu Gui, Liu Sha, Jue Ming) uniquement en sphères 6/8 — jamais en sphères 2/3/7/9.
- Orientation bureau et lit uniquement en lectures orientation, environnement, stratégique.
- Étoile annuelle et Cycle Ki uniquement en lectures cyclique, décisionnelle, stratégique.
- Sheng Chi redécrit en sphère 10 : INTERDIT — sphère 10 = trajectoire vocationnelle globale (groupe + élément).
- Liu Sha, Wu Gui, Jue Ming en détail : uniquement en lecture environnement ou deep.
- Pas de sphère vide. Si données manquantes : nommer l'absence et proposer la lecture disponible.
- Ton : ancré dans l'espace physique, directif, non mystique. Chaque direction reliée à un usage concret.`
}

// ── Interface données Kua ────────────────────────────────────────────────────

/** Données Kua calculées à injecter dans le prompt */
export interface KuaCalculatedData {
  /** Prénom */
  firstName: string

  /** Tier 1 — structure (toujours présents) */
  nombreKua: KuaNumber
  groupeKua: KuaGroup
  elementKua: KuaElement
  trigramme: KuaTrigramme

  /** Tier 2 — directions favorables (lectures standard et au-dessus) */
  directionShengChi?: CompassDirection
  directionTienYi?: CompassDirection
  directionNienYen?: CompassDirection
  directionFuWei?: CompassDirection

  /** Tier 3 — directions défavorables (lectures environnement et deep) */
  directionHoHai?: CompassDirection
  directionWuGui?: CompassDirection
  directionLiuSha?: CompassDirection
  directionJueMing?: CompassDirection

  /** Tier 4 — spatial (lectures orientation, environnement, stratégique) */
  orientationBureau?: CompassDirection
  orientationLit?: CompassDirection
  secteurMaison?: string   // ex. "Nord-Ouest", "secteur 6 de la maison"

  /** Tier 5 — cyclique (lectures cyclique, décisionnelle, stratégique) */
  etoileAnnuelle?: number  // ex. 3, 7, 9 (étoile Lo Shu active)
  cycleKi?: string         // ex. "Année 3 du cycle — Étoile Jade"
}

/**
 * Formate les données Kua en BLOC DONNÉES prompt-ready.
 * Injectable directement dans buildKuaReadingSystemPrompt ou buildKuaFullPrompt.
 *
 * @example
 * const dataBlock = buildKuaDataBlock({
 *   firstName: 'Sophie',
 *   nombreKua: 3,
 *   groupeKua: 'Est',
 *   elementKua: 'Bois',
 *   trigramme: 'Zhen',
 *   directionShengChi: 'Sud',
 *   directionNienYen: 'Nord',
 * })
 */
export function buildKuaDataBlock(
  data: KuaCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const lines: string[] = [
    isFr ? 'DONNÉES KUA — SOURCE DE VÉRITÉ' : 'KUA DATA — SOURCE OF TRUTH',
    isFr ? `Prénom : ${data.firstName}` : `First name: ${data.firstName}`,
  ]

  // Tier 1 — structure
  lines.push('', isFr ? 'STRUCTURE KUA :' : 'KUA STRUCTURE:')
  lines.push(isFr ? `Nombre Kua : ${data.nombreKua}` : `Kua Number: ${data.nombreKua}`)
  lines.push(isFr ? `Groupe : ${data.groupeKua}` : `Group: ${data.groupeKua}`)
  lines.push(isFr ? `Élément : ${data.elementKua}` : `Element: ${data.elementKua}`)
  lines.push(isFr ? `Trigramme : ${data.trigramme}` : `Trigram: ${data.trigramme}`)

  // Tier 2 — directions favorables
  if (data.directionShengChi || data.directionTienYi || data.directionNienYen || data.directionFuWei) {
    lines.push('', isFr ? 'DIRECTIONS FAVORABLES :' : 'FAVORABLE DIRECTIONS:')
    if (data.directionShengChi) {
      lines.push(isFr
        ? `Sheng Chi (abondance / réussite) : ${data.directionShengChi}`
        : `Sheng Chi (abundance / success): ${data.directionShengChi}`)
    }
    if (data.directionTienYi) {
      lines.push(isFr
        ? `Tien Yi (santé / médecin du ciel) : ${data.directionTienYi}`
        : `Tien Yi (health / heavenly doctor): ${data.directionTienYi}`)
    }
    if (data.directionNienYen) {
      lines.push(isFr
        ? `Nien Yen (longévité relationnelle) : ${data.directionNienYen}`
        : `Nien Yen (relational longevity): ${data.directionNienYen}`)
    }
    if (data.directionFuWei) {
      lines.push(isFr
        ? `Fu Wei (développement personnel) : ${data.directionFuWei}`
        : `Fu Wei (personal development): ${data.directionFuWei}`)
    }
  }

  // Tier 3 — directions défavorables
  if (data.directionHoHai || data.directionWuGui || data.directionLiuSha || data.directionJueMing) {
    lines.push('', isFr ? 'DIRECTIONS DÉFAVORABLES :' : 'UNFAVORABLE DIRECTIONS:')
    if (data.directionHoHai) {
      lines.push(isFr
        ? `Ho Hai (obstacles mineurs) : ${data.directionHoHai}`
        : `Ho Hai (minor obstacles): ${data.directionHoHai}`)
    }
    if (data.directionWuGui) {
      lines.push(isFr
        ? `Wu Gui (5 fantômes / conflits) : ${data.directionWuGui}`
        : `Wu Gui (5 ghosts / conflicts): ${data.directionWuGui}`)
    }
    if (data.directionLiuSha) {
      lines.push(isFr
        ? `Liu Sha (6 blessures / drainage) : ${data.directionLiuSha}`
        : `Liu Sha (6 killings / drainage): ${data.directionLiuSha}`)
    }
    if (data.directionJueMing) {
      lines.push(isFr
        ? `Jue Ming (destin brisé / direction la plus défavorable) : ${data.directionJueMing}`
        : `Jue Ming (total loss / most unfavorable direction): ${data.directionJueMing}`)
    }
  }

  // Tier 4 — spatial
  if (data.orientationBureau || data.orientationLit || data.secteurMaison) {
    lines.push('', isFr ? 'DONNÉES SPATIALES :' : 'SPATIAL DATA:')
    if (data.orientationBureau) {
      lines.push(isFr
        ? `Orientation bureau actuelle : ${data.orientationBureau}`
        : `Current desk orientation: ${data.orientationBureau}`)
    }
    if (data.orientationLit) {
      lines.push(isFr
        ? `Orientation lit actuelle (tête) : ${data.orientationLit}`
        : `Current bed orientation (head): ${data.orientationLit}`)
    }
    if (data.secteurMaison) {
      lines.push(isFr
        ? `Secteur maison principal : ${data.secteurMaison}`
        : `Main home sector: ${data.secteurMaison}`)
    }
  }

  // Tier 5 — cyclique
  if (data.etoileAnnuelle !== undefined || data.cycleKi) {
    lines.push('', isFr ? 'DONNÉES CYCLIQUES :' : 'CYCLICAL DATA:')
    if (data.etoileAnnuelle !== undefined) {
      lines.push(isFr
        ? `Étoile annuelle active : ${data.etoileAnnuelle}`
        : `Active annual star: ${data.etoileAnnuelle}`)
    }
    if (data.cycleKi) {
      lines.push(isFr
        ? `Cycle Ki 9 étoiles : ${data.cycleKi}`
        : `Ki 9 Stars cycle: ${data.cycleKi}`)
    }
  }

  return lines.join('\n')
}

/**
 * Construit un prompt système complet avec données Kua injectées.
 * Version étendue : rôle + structure des sphères + données + règles.
 * Analogue direct de buildHoroscopeSystemPrompt avec données personnelles.
 *
 * @example
 * const systemPrompt = buildKuaFullPrompt('orientation', {
 *   firstName: 'Sophie',
 *   nombreKua: 3,
 *   groupeKua: 'Est',
 *   elementKua: 'Bois',
 *   trigramme: 'Zhen',
 *   directionShengChi: 'Sud',
 *   directionTienYi: 'Nord',
 *   directionFuWei: 'Est',
 *   orientationBureau: 'Ouest',
 *   orientationLit: 'Ouest',
 * })
 * // → injecter dans buildChatPayload as `instructions`
 */
export function buildKuaFullPrompt(
  readingType: KuaReadingType,
  data: KuaCalculatedData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'

  const role = isFr
    ? `Tu es HexAstra Kua, expert en lecture Kua structurée à 12 sphères.\nMission : produire une lecture ${readingType} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Kua, expert in structured 12-sphere Kua reading.\nMission: produce a complete ${readingType} reading from the data below.\nInvariant structure. No data analyzed twice.`

  const structureBlock = _buildKuaStructureBlock(readingType, lang)
  const dataBlock = buildKuaDataBlock(data, lang)
  const rulesBlock = buildKuaRulesBlock(lang)

  return [role, structureBlock, dataBlock, rulesBlock].join('\n\n')
}

/**
 * mapCompactCoreToSpheres — Moteur de lecture 12 sphères Hexastra
 *
 * SOURCE DE VÉRITÉ : le CompactReadingCore
 * SORTIE : HexastraSpheres (12 sphères ordonnées + summary)
 *
 * PRINCIPES DE MAPPING :
 * - Chaque sphère éclaire la situation sous un ANGLE DISTINCT
 * - Les sphères 1–3 sont directes (mapping 1:1 depuis les champs core)
 * - Les sphères 4–7 sont des REFORMULATIONS à angle unique
 *   (pas de copier-coller : transformation active du contenu source)
 * - Les sphères 8–12 sont directes (timingSignal, energyLeak, synthèse)
 *
 * RÈGLES ABSOLUES :
 * - 1 à 2 phrases max par sphère
 * - Zéro jargon technique
 * - Zéro science citée
 * - Chaque sphère apporte une valeur nouvelle (anti-répétition par design)
 * - Ton humain, direct, précis
 */

import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import { areTooSimilar } from '@/lib/hexastra/reading/sphereVariation'

// ── Types ──────────────────────────────────────────────────────────────────────

export type HexastraSphere = {
  /** Identifiant 1–12 */
  id: number
  /** Titre de la sphère (FR ou EN selon langue) */
  title: string
  /** Contenu : 1 à 2 phrases, direct, sans jargon */
  content: string
}

export type HexastraSpheres = {
  /** Les 12 sphères ordonnées */
  spheres: HexastraSphere[]
  /**
   * Phrase de synthèse finale (1 phrase).
   * Combine l'ancre de la sphère centrale et le levier stratégique.
   */
  summary: string
}

export type SphereContext = {
  /** Intent utilisateur (ex: 'blocage', 'love', 'timing'...) */
  intent?: string | null
  /** Langue : 'fr' (défaut) | 'en' */
  lang?: string
}

// ── Titres des 12 sphères ─────────────────────────────────────────────────────

const SPHERE_TITLES_FR: Record<number, string> = {
  1:  'Sphère centrale',
  2:  'Sphère du mécanisme',
  3:  'Sphère de tension',
  4:  'Sphère mentale',
  5:  'Sphère émotionnelle',
  6:  'Sphère des schémas',
  7:  'Sphère extérieure',
  8:  'Sphère du timing',
  9:  'Sphère énergétique',
  10: 'Sphère du blocage',
  11: 'Sphère du mouvement juste',
  12: 'Sphère de synthèse',
}

const SPHERE_TITLES_EN: Record<number, string> = {
  1:  'Core sphere',
  2:  'Mechanism sphere',
  3:  'Tension sphere',
  4:  'Mental sphere',
  5:  'Emotional sphere',
  6:  'Pattern sphere',
  7:  'Outer sphere',
  8:  'Timing sphere',
  9:  'Energy sphere',
  10: 'Block sphere',
  11: 'Movement sphere',
  12: 'Synthesis sphere',
}

// ── Helpers de transformation de texte ───────────────────────────────────────

/**
 * Extrait la première clause significative d'un texte.
 * Séparateurs : point, em-dash, ' — ', ' - ', ' mais ', ' but '
 * Ne retourne jamais une chaîne vide.
 */
function extractFirstClause(text: string): string {
  const cleaned = text.trim()
  if (!cleaned) return cleaned

  const parts = cleaned.split(/[.]\s+|\s+[—–]\s+|\s+but\s+|\s+mais\s+/)
  const first = parts[0]?.trim() ?? cleaned
  return first.length > 10 ? first : cleaned
}

/**
 * Extrait la seconde partie d'un texte séparé par un connecteur.
 * Retourne null si pas de seconde partie ou si trop courte.
 */
function extractSecondPart(text: string): string | null {
  const parts = text.split(/\s+[—–]\s+|\s+et\s+|\s+mais\s+|\s+but\s+|\s+and\s+/)
  if (parts.length < 2) return null
  const second = parts[1]?.trim() ?? null
  return second && second.length > 10 ? second : null
}

/**
 * Minusculise le premier caractère d'une chaîne.
 * Utile pour enchaîner "..." + lowercased continuation.
 */
function lcFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// ── Fonctions de construction des 12 sphères ─────────────────────────────────

// S1 — SPHÈRE CENTRALE
// Angle : "Qui tu es / ce qui se passe vraiment"
// Source directe : dominantDynamic
function buildS1(core: CompactReadingCore): string {
  return core.dominantDynamic
}

// S2 — SPHÈRE DU MÉCANISME
// Angle : "Ce qui génère cette situation en arrière-plan"
// Source directe : hiddenMechanism
function buildS2(core: CompactReadingCore): string {
  return core.hiddenMechanism
}

// S3 — SPHÈRE DE TENSION
// Angle : "Le conflit principal — la friction entre deux forces"
// Source directe : realTension
function buildS3(core: CompactReadingCore): string {
  return core.realTension
}

// S4 — SPHÈRE MENTALE
// Angle : "Ce que le mental retient / la croyance active qui rend ça difficile"
// Source : hiddenMechanism (première clause) → reformulée comme croyance cognitive
// Transformation : "La lecture mentale en jeu : [mécanisme] — [implication cognitive]"
function buildS4(core: CompactReadingCore, isFr: boolean): string {
  const mechClause = extractFirstClause(core.hiddenMechanism)
  const tensionPart = extractSecondPart(core.realTension)

  if (tensionPart) {
    return isFr
      ? `Ce que ton mental retient : ${lcFirst(mechClause)} — et cette interprétation amplifie la sensation que ${lcFirst(tensionPart)}`
      : `What your mind holds onto: ${lcFirst(mechClause)} — and this reading amplifies the feeling that ${lcFirst(tensionPart)}`
  }

  return isFr
    ? `La lecture mentale active : ${lcFirst(mechClause)} — c'est ce prisme qui rend le blocage difficile à voir autrement`
    : `The active mental reading: ${lcFirst(mechClause)} — this lens makes the block hard to see differently`
}

// S5 — SPHÈRE ÉMOTIONNELLE
// Angle : "Ce que tu vis émotionnellement — l'expérience intérieure concrète"
// Source : visibleEffect + intent (pour adapter le ton)
// Transformation : reframe visibleEffect en expérience émotionnelle vécue
function buildS5(core: CompactReadingCore, intent: string | null | undefined, isFr: boolean): string {
  const effect = extractFirstClause(core.visibleEffect)
  const normalizedIntent = (intent ?? '').toLowerCase()

  if (/blocage|block/i.test(normalizedIntent)) {
    return isFr
      ? `Ce que tu portes intérieurement : ${lcFirst(effect)} — un inconfort qui signale que quelque chose demande à changer`
      : `What you carry internally: ${lcFirst(effect)} — a discomfort signaling something needs to change`
  }
  if (/love|relation|amour/i.test(normalizedIntent)) {
    return isFr
      ? `Dans l'espace émotionnel, tu vis : ${lcFirst(effect)} — ce ressenti est réel et mérite d'être regardé en face`
      : `In the emotional space, you're experiencing: ${lcFirst(effect)} — this feeling is real and deserves to be faced`
  }
  if (/timing|decision|make_decision/i.test(normalizedIntent)) {
    return isFr
      ? `Émotionnellement, la situation crée : ${lcFirst(effect)} — ce signal intérieur est une information utile pour décider`
      : `Emotionally, the situation creates: ${lcFirst(effect)} — this inner signal is useful information for deciding`
  }

  return isFr
    ? `Ce que tu vis concrètement à l'intérieur : ${lcFirst(effect)}`
    : `What you concretely experience inside: ${lcFirst(effect)}`
}

// S6 — SPHÈRE DES SCHÉMAS
// Angle : "Ce qui se répète — le loop mécanisme → effet"
// Source : hiddenMechanism (première clause) + visibleEffect (première clause)
// Transformation : expliciter la boucle récurrente
function buildS6(core: CompactReadingCore, isFr: boolean): string {
  const mechShort = extractFirstClause(core.hiddenMechanism)
  const effectShort = extractFirstClause(core.visibleEffect)

  // Vérifier qu'ils ne sont pas identiques
  if (mechShort === effectShort || areTooSimilar(mechShort, effectShort)) {
    // Fallback : utiliser la tension comme angle de schéma
    const tensionShort = extractFirstClause(core.realTension)
    return isFr
      ? `Le pattern qui revient : ${lcFirst(tensionShort)} — ce cycle se remet en route chaque fois que les conditions sont réunies`
      : `The recurring pattern: ${lcFirst(tensionShort)} — this cycle restarts each time the conditions are in place`
  }

  return isFr
    ? `Le schéma en boucle : ${lcFirst(mechShort)} → produit régulièrement ${lcFirst(effectShort)}`
    : `The loop pattern: ${lcFirst(mechShort)} → regularly produces ${lcFirst(effectShort)}`
}

// S7 — SPHÈRE EXTÉRIEURE
// Angle : "Ce qui vient des autres, de l'environnement, du contexte"
// Source : realTension — mais recentré sur la DIMENSION EXTERNE
// Transformation : isoler le versant extérieur de la tension
function buildS7(core: CompactReadingCore, isFr: boolean): string {
  const tension = core.realTension
  const externalPart = extractSecondPart(tension)

  if (externalPart && externalPart.length > 15) {
    return isFr
      ? `Ce qui vient du dehors : ${lcFirst(externalPart)} — la pression externe est réelle et s'ajoute à la friction interne`
      : `What comes from outside: ${lcFirst(externalPart)} — the external pressure is real and adds to the internal friction`
  }

  // Fallback : reformuler la tension avec focus externe
  const tensionShort = extractFirstClause(tension)
  return isFr
    ? `Dans la relation au contexte : ${lcFirst(tensionShort)} — l'environnement ne donne pas encore le signal attendu`
    : `In relation to context: ${lcFirst(tensionShort)} — the environment is not yet giving the expected signal`
}

// S8 — SPHÈRE DU TIMING
// Angle : "Le moment actuel — quelle phase est en cours"
// Source directe : timingSignal
function buildS8(core: CompactReadingCore): string {
  return core.timingSignal
}

// S9 — SPHÈRE ÉNERGÉTIQUE
// Angle : "Où l'énergie part, comment le fonctionnement naturel opère"
// Source directe : energyLeak (déjà en langage humain, zéro jargon)
function buildS9(core: CompactReadingCore): string {
  return core.energyLeak
}

// S10 — SPHÈRE DU BLOCAGE
// Angle : "Ce qui bloque concrètement — la synthèse tension + énergie"
// Source : realTension (première clause) + energyLeak (première clause)
// Transformation : combiner pour nommer le blocage précis
function buildS10(core: CompactReadingCore, isFr: boolean): string {
  const tensionShort = extractFirstClause(core.realTension)
  const leakShort = extractFirstClause(core.energyLeak)

  // Si trop similaires, utiliser une formulation plus synthétique
  if (areTooSimilar(tensionShort, leakShort)) {
    return isFr
      ? `Ce qui bloque : ${lcFirst(tensionShort)} — la sortie demande un changement d'angle, pas plus d'effort`
      : `What blocks: ${lcFirst(tensionShort)} — the way out requires a change of angle, not more effort`
  }

  return isFr
    ? `Ce qui bloque exactement : ${lcFirst(tensionShort)} — renforcé par le fait que ${lcFirst(leakShort)}`
    : `What exactly blocks: ${lcFirst(tensionShort)} — reinforced by the fact that ${lcFirst(leakShort)}`
}

// S11 — SPHÈRE DU MOUVEMENT JUSTE
// Angle : "L'action prioritaire + comment décider de l'enclencher"
// Source : rightMovement + decisionSignal (première clause)
// Transformation : combiner action + processus de décision
function buildS11(core: CompactReadingCore, isFr: boolean): string {
  const action = core.rightMovement
  const decisionClause = extractFirstClause(core.decisionSignal)

  // Éviter la répétition si rightMovement et decisionSignal se ressemblent
  if (areTooSimilar(action, decisionClause)) {
    return isFr
      ? `Le mouvement juste maintenant : ${action}`
      : `The right movement now: ${action}`
  }

  const decisionLc = lcFirst(decisionClause)
  return isFr
    ? `${action} — et pour décider de passer à l'acte : ${decisionLc}`
    : `${action} — and to decide to act: ${decisionLc}`
}

// S12 — SPHÈRE DE SYNTHÈSE
// Angle : "Le levier stratégique — ce qui change tout"
// Source directe : leveragePoint
function buildS12(core: CompactReadingCore): string {
  return core.leveragePoint
}

// ── Constructeur de summary ───────────────────────────────────────────────────

/**
 * Construit le summary final (1 phrase) :
 * Ancre la dynamique centrale + indique le levier de sortie.
 */
function buildSummary(core: CompactReadingCore, isFr: boolean): string {
  const anchor = extractFirstClause(core.dominantDynamic)
  const lever = extractFirstClause(core.leveragePoint)

  if (areTooSimilar(anchor, lever)) {
    return isFr
      ? `La clé : ${lcFirst(lever)}`
      : `The key: ${lcFirst(lever)}`
  }

  return isFr
    ? `${anchor} — et le levier central est : ${lcFirst(lever)}`
    : `${anchor} — and the core lever is: ${lcFirst(lever)}`
}

// ── Vérification post-construction ────────────────────────────────────────────

/**
 * Vérifie que chaque sphère est unique par rapport à ses voisines directes.
 * Si deux sphères consécutives sont trop similaires, enrichit la seconde
 * avec `leveragePoint` ou `decisionSignal` comme contenu alternatif.
 */
function ensureUniqueness(
  spheres: HexastraSphere[],
  core: CompactReadingCore,
  isFr: boolean,
): HexastraSphere[] {
  const fallbacks = [
    core.leveragePoint,
    core.decisionSignal,
    core.timingSignal,
    core.energyLeak,
  ]

  return spheres.map((sphere, idx) => {
    // Vérifier la similarité avec les 2 sphères précédentes
    for (let prev = Math.max(0, idx - 2); prev < idx; prev++) {
      if (areTooSimilar(sphere.content, spheres[prev]!.content)) {
        // Trouver un fallback distinct de tout ce qui précède
        const distinct = fallbacks.find(
          (fb) =>
            fb !== sphere.content &&
            !spheres.slice(0, idx).some((s) => areTooSimilar(s.content, fb)),
        )

        if (distinct) {
          return {
            ...sphere,
            content: isFr
              ? `${sphere.content} — perspective complémentaire : ${distinct}`
              : `${sphere.content} — complementary perspective: ${distinct}`,
          }
        }
      }
    }
    return sphere
  })
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Construit les 12 sphères Hexastra à partir du CompactReadingCore.
 *
 * MAPPING EXACT :
 * S1  Centrale         → dominantDynamic (direct)
 * S2  Mécanisme        → hiddenMechanism (direct)
 * S3  Tension          → realTension (direct)
 * S4  Mentale          → hiddenMechanism + realTension (angle croyance/perception)
 * S5  Émotionnelle     → visibleEffect + intent (angle expérience vécue)
 * S6  Schémas          → hiddenMechanism + visibleEffect (angle boucle répétitive)
 * S7  Extérieure       → realTension (angle dimension externe)
 * S8  Timing           → timingSignal (direct)
 * S9  Énergétique      → energyLeak (direct)
 * S10 Blocage          → realTension + energyLeak (synthèse)
 * S11 Mouvement juste  → rightMovement + decisionSignal (action + processus)
 * S12 Synthèse         → leveragePoint (direct)
 *
 * ANTI-RÉPÉTITION :
 * - Les sphères 4-7 utilisent des transformations actives, pas des copies
 * - Un post-check (ensureUniqueness) vérifie et corrige les doublons résiduels
 *
 * @param core  CompactReadingCore source
 * @param ctx   Contexte : intent (pour adapter les angles), langue
 * @returns     HexastraSpheres : 12 sphères + summary
 *
 * @example
 * const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage', lang: 'fr' })
 * spheres.spheres.length // 12
 * spheres.spheres[0].title // "Sphère centrale"
 * spheres.summary // "Type focalisé — et le levier central est : identifier où l'invitation manque"
 */
export function mapCompactCoreToSpheres(
  core: CompactReadingCore,
  ctx: SphereContext = {},
): HexastraSpheres {
  const { intent, lang = 'fr' } = ctx
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const titles = isFr ? SPHERE_TITLES_FR : SPHERE_TITLES_EN

  // Construire les 12 contenus
  const contents: string[] = [
    buildS1(core),           // 1. Centrale
    buildS2(core),           // 2. Mécanisme
    buildS3(core),           // 3. Tension
    buildS4(core, isFr),     // 4. Mentale
    buildS5(core, intent, isFr), // 5. Émotionnelle
    buildS6(core, isFr),     // 6. Schémas
    buildS7(core, isFr),     // 7. Extérieure
    buildS8(core),           // 8. Timing
    buildS9(core),           // 9. Énergétique
    buildS10(core, isFr),    // 10. Blocage
    buildS11(core, isFr),    // 11. Mouvement juste
    buildS12(core),          // 12. Synthèse
  ]

  // Construire les objets sphères
  let spheres: HexastraSphere[] = contents.map((content, idx) => ({
    id: idx + 1,
    title: titles[idx + 1] ?? `Sphere ${idx + 1}`,
    content: content.trim() || (isFr ? '[Contenu non disponible]' : '[Content unavailable]'),
  }))

  // Post-check anti-répétition (correction si doublons détectés)
  spheres = ensureUniqueness(spheres, core, isFr)

  // Summary final
  const summary = buildSummary(core, isFr)

  return { spheres, summary }
}

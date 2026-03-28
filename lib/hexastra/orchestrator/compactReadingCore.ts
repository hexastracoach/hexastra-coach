/**
 * compactReadingCore — Hexastra Coach
 *
 * Construit le "Compact Reading Core" à partir de l'arbitration de fusion.
 *
 * Le CompactReadingCore est une reformulation structurée de l'arbitration,
 * enrichie par la tonalité solaire et le ton émotionnel, prête pour le renderer.
 *
 * STRUCTURE :
 * - dominantDynamic   : la dynamique principale (qui tu es / comment tu fonctionnes)
 * - hiddenMechanism   : le mécanisme caché (le "pourquoi" profond)
 * - realTension       : la tension réelle (décalage intérieur/extérieur)
 * - visibleEffect     : l'effet visible (ce qui se manifeste concrètement)
 * - rightMovement     : le mouvement juste (l'action prioritaire contextuelle)
 * - toneHint          : conseil de ton basé sur la Lune + Ennéagramme
 * - solarToneHint     : micro-modulation du ton par le Soleil
 * - questionType      : intent/type de question
 * - signalConfidence  : 0–1 fiabilité du signal
 */

import type { FusionArbitration, FusionContext } from './buildFusionContext'
import { getSolarToneHint } from './solarToneProfile'

// ── Types ──────────────────────────────────────────────────────────────────────

export type CompactReadingCore = {
  /** La dynamique principale — le signal le plus fort */
  dominantDynamic: string
  /** Le mécanisme caché — pourquoi ça fonctionne ainsi (le "fond") */
  hiddenMechanism: string
  /** La tension réelle — le décalage intérieur/extérieur */
  realTension: string
  /** L'effet visible — ce qui se manifeste concrètement en surface */
  visibleEffect: string
  /** Le mouvement juste — l'action prioritaire contextuelle */
  rightMovement: string
  /** Conseil de ton basé sur la Lune + Ennéagramme */
  toneHint: string
  /** Micro-modulation du ton par le signe solaire */
  solarToneHint: string
  /** Intent / type de question */
  questionType: string
  /** Confiance du signal (0–1) */
  signalConfidence: number
}

// ── Helpers internes ───────────────────────────────────────────────────────────

// Clés en minuscules sans accents pour lookup robuste
const MOON_TONE_HINTS_FR: Record<string, string> = {
  belier:     "Ton direct — valider l'émotion vive avant de guider",
  aries:      "Ton direct — valider l'émotion vive avant de guider",
  taureau:    "Ton ancré — s'appuyer sur le sensoriel et le concret",
  taurus:     "Ton ancré — s'appuyer sur le sensoriel et le concret",
  gemeaux:    'Ton vif — offrir plusieurs angles, ne pas fermer les possibles',
  gemini:     'Ton vif — offrir plusieurs angles sans fermer les possibles',
  cancer:     'Ton doux — valider la profondeur émotionnelle avant tout',
  lion:       'Ton chaleureux — reconnaître la valeur et la singularité',
  leo:        'Ton chaleureux — reconnaître la valeur et la singularité',
  vierge:     'Ton précis — être factuel, nuancé, ne pas généraliser',
  virgo:      'Ton précis — être factuel et nuancé, ne pas généraliser',
  balance:    'Ton équilibré — présenter les deux côtés, éviter les absolus',
  libra:      'Ton équilibré — présenter les deux côtés, éviter les absolus',
  scorpion:   'Ton profond — aller sous la surface, nommer la vérité vraie',
  scorpio:    'Ton profond — aller sous la surface, nommer ce qui est vrai',
  sagittaire: "Ton ouvert — relier au sens plus large, laisser l'horizon",
  sagittarius:"Ton ouvert — relier au sens plus large, laisser l'horizon",
  capricorne: 'Ton sobre — concret et structuré, aller aux faits',
  capricorn:  'Ton sobre — concret et structuré, aller aux faits',
  verseau:    'Ton analytique — distancié, valoriser la singularité du fonctionnement',
  aquarius:   'Ton analytique — distancié, valoriser la singularité du fonctionnement',
  poissons:   "Ton fluide — doux, résonant, laisser de l'espace entre les phrases",
  pisces:     "Ton fluide — doux et résonant, laisser de l'espace",
}

const MOON_TONE_HINTS_EN: Record<string, string> = {
  belier:     'Direct tone — validate the vivid emotion before guiding',
  aries:      'Direct tone — validate vivid emotion before guiding',
  taureau:    'Grounded tone — stay in the sensory and concrete',
  taurus:     'Grounded tone — stay in the sensory and concrete',
  gemeaux:    'Lively tone — offer multiple angles, keep possibilities open',
  gemini:     'Lively tone — offer multiple angles, keep possibilities open',
  cancer:     'Gentle tone — validate the emotional depth first',
  lion:       'Warm tone — acknowledge value and uniqueness',
  leo:        'Warm tone — acknowledge value and uniqueness',
  vierge:     'Precise tone — be factual and nuanced, avoid generalizing',
  virgo:      'Precise tone — be factual and nuanced, avoid generalizing',
  balance:    'Balanced tone — show both sides, avoid absolutes',
  libra:      'Balanced tone — show both sides, avoid absolutes',
  scorpion:   'Deep tone — go beneath the surface, name what is true',
  scorpio:    'Deep tone — go beneath the surface, name what is true',
  sagittaire: 'Open tone — connect to larger meaning, leave the horizon',
  sagittarius:'Open tone — connect to larger meaning, leave the horizon',
  capricorne: 'Sober tone — concrete and structured, go to the facts',
  capricorn:  'Sober tone — concrete and structured, go to the facts',
  verseau:    'Analytical tone — slight detachment, value the unique functioning',
  aquarius:   'Analytical tone — slight detachment, value unique functioning',
  poissons:   'Fluid tone — soft, resonant, leave space between ideas',
  pisces:     'Fluid tone — soft, resonant, leave space between ideas',
}

const ENN_TONE_OVERLAYS_FR: Record<number, string> = {
  1: 'Ennéagramme 1 : présenter la vérité avec douceur, sans jugement',
  2: 'Ennéagramme 2 : reconnaître le don avant de pointer le manque',
  3: 'Ennéagramme 3 : valider la valeur réelle, pas seulement la performance',
  4: 'Ennéagramme 4 : honorer la profondeur sans amplifier le dramatique',
  5: 'Ennéagramme 5 : être précis et factuel, respecter le besoin d\'espace',
  6: 'Ennéagramme 6 : ancrer dans la confiance plutôt que dans la surveillance',
  7: 'Ennéagramme 7 : rester focalisé, éviter la dispersion dans les options',
  8: 'Ennéagramme 8 : parler avec force et respect, éviter la condescendance',
  9: 'Ennéagramme 9 : nommer clairement sans édulcorer pour éviter le conflit',
}

const ENN_TONE_OVERLAYS_EN: Record<number, string> = {
  1: 'Enneagram 1: present truth gently, without judgment',
  2: 'Enneagram 2: acknowledge the gift before pointing to the gap',
  3: 'Enneagram 3: validate real value, not just performance',
  4: 'Enneagram 4: honor depth without amplifying the dramatic',
  5: 'Enneagram 5: be precise and factual, respect the need for space',
  6: 'Enneagram 6: anchor in trust rather than surveillance',
  7: 'Enneagram 7: stay focused, avoid dispersing into options',
  8: 'Enneagram 8: speak with force and respect, avoid condescension',
  9: 'Enneagram 9: name clearly without softening to avoid conflict',
}

function normalizeMoonSign(sign: string): string {
  return sign
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Construit le toneHint à partir de la Lune et de l'Ennéagramme.
 * Lune = tonalité principale, Ennéagramme = overlay si poids > 0.3
 */
function buildToneHint(
  moonSign: string | null | undefined,
  ennType: string | number | null | undefined,
  ennWeight: number,
  isFr: boolean,
): string {
  const hintMap = isFr ? MOON_TONE_HINTS_FR : MOON_TONE_HINTS_EN
  const ennMap = isFr ? ENN_TONE_OVERLAYS_FR : ENN_TONE_OVERLAYS_EN

  const moonKey = moonSign ? normalizeMoonSign(moonSign) : null
  const moonHint = moonKey ? (hintMap[moonKey] ?? null) : null

  const ennNum = ennType != null
    ? (typeof ennType === 'string' ? parseInt(ennType, 10) : ennType)
    : null
  const ennHint = ennNum != null && !isNaN(ennNum) && ennWeight > 0.3
    ? (ennMap[ennNum] ?? null)
    : null

  if (moonHint && ennHint) return `${moonHint} · ${ennHint}`
  if (moonHint) return moonHint
  if (ennHint) return ennHint
  return isFr
    ? 'Ton équilibré — ancrer dans la vérité du profil sans projection'
    : 'Balanced tone — anchor in profile truth without projection'
}

/**
 * Dérive le hiddenMechanism (mécanisme caché) à partir du mainBlock et du gap HD.
 * C'est le "pourquoi ça fonctionne ainsi" — plus court et plus impactant que mainBlock.
 */
function deriveHiddenMechanism(arb: FusionArbitration, isFr: boolean): string {
  // Si innerOuterGap est riche, on l'utilise comme mécanisme caché
  // (il exprime déjà la tension profonde de fonctionnement)
  if (arb.innerOuterGap && arb.innerOuterGap.length > 20) {
    return arb.innerOuterGap
  }
  // Sinon, extraire l'essentiel du mainBlock (premier segment avant '.')
  if (arb.mainBlock) {
    const firstSentence = arb.mainBlock.split('.')[0]
    if (firstSentence && firstSentence.length > 20) return firstSentence + '.'
  }
  return isFr
    ? 'Mécanisme profond à décoder avec le profil complet'
    : 'Deep mechanism to decode with the full profile'
}

/**
 * Dérive l'effet visible (visibleEffect) à partir de secondaryDynamic ou supportPoints.
 */
function deriveVisibleEffect(arb: FusionArbitration, isFr: boolean): string {
  if (arb.secondaryDynamic && arb.secondaryDynamic.length > 10) {
    return arb.secondaryDynamic
  }
  if (arb.supportPoints.length > 0) {
    return arb.supportPoints[0]
  }
  return isFr
    ? 'Dynamique visible à affiner selon le contexte'
    : 'Visible dynamic to refine based on context'
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Construit le Compact Reading Core à partir de l'arbitration et du contexte de fusion.
 *
 * @param arbitration  Résultat de l'arbitrage (runFusionArbiter / arbitrateFusionSignals)
 * @param ctx          Contexte de fusion (contient les champs par module)
 * @param lang         'fr' | 'en'
 * @returns            CompactReadingCore prêt pour le renderer
 */
export function buildCompactReadingCore(
  arbitration: FusionArbitration,
  ctx: FusionContext,
  lang = 'fr',
): CompactReadingCore {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'

  // Extraire les champs nécessaires depuis le contexte
  const astro = ctx.modules.astrology.fields
  const enn = ctx.modules.enneagram.fields

  const sunSign = astro['sunSign'] as string | null | undefined
  const moonSign = astro['moonSign'] as string | null | undefined
  const ennType = enn['enneagramType'] as string | number | null | undefined
  const ennWeight = ctx.modules.enneagram.weight

  // Construire les composants
  const solarToneHint = getSolarToneHint(sunSign, isFr)
    ?? (isFr
      ? 'Ton adapté au profil solaire non résolu'
      : 'Tone adapted to unresolved solar profile')

  const toneHint = buildToneHint(moonSign, ennType, ennWeight, isFr)

  const hiddenMechanism = deriveHiddenMechanism(arbitration, isFr)
  const visibleEffect = deriveVisibleEffect(arbitration, isFr)

  return {
    dominantDynamic:  arbitration.dominantDynamic,
    hiddenMechanism,
    realTension:      arbitration.innerOuterGap || hiddenMechanism,
    visibleEffect,
    rightMovement:    arbitration.priorityAction,
    toneHint,
    solarToneHint,
    questionType:     arbitration.questionType,
    signalConfidence: arbitration.signalConfidence,
  }
}

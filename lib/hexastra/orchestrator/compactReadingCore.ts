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

  // ── 4 champs enrichis (concrets, sans jargon) ──────────────────────────────

  /**
   * Comment prendre une décision juste dans cette situation.
   * Dérivé de l'autorité de décision — traduit en langage humain, sans terminologie technique.
   * Ex : "Attendre la clarté émotionnelle — ne jamais trancher dans l'urgence"
   */
  decisionSignal: string

  /**
   * Lecture du moment actuel — où en est le cycle de la personne.
   * Dérivé de l'année personnelle numérologique — exprimé comme phase concrète.
   * Ex : "Phase de fondation — poser les bases maintenant, pas le moment de s'élancer"
   */
  timingSignal: string

  /**
   * Où l'énergie est perdue concrètement dans la situation actuelle.
   * Dérivé du type de fonctionnement — exprimé sans jargon.
   * Ex : "Énergie dépensée à insister là où aucun retour réel ne vient"
   */
  energyLeak: string

  /**
   * Ce qui peut tout changer rapidement — le levier stratégique prioritaire.
   * Dérivé du signal dominant + points de support — exprimé comme action de levier.
   * Ex : "Aligner le timing avec la réponse naturelle — un seul ajustement suffit"
   */
  leveragePoint: string

  // ── Ton et confiance ────────────────────────────────────────────────────────

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

// ── Tables d'autorité → signal de décision ────────────────────────────────────
// Traduit l'autorité HD en langage humain, sans citer "Human Design" ni le nom de l'autorité.
// Chaque signal = phrase directe, unique, applicable immédiatement.

const DECISION_SIGNALS_FR: Record<string, string> = {
  emotionnel:   "Attendre la clarté émotionnelle — ne jamais trancher dans l'urgence ou l'intensité du moment",
  emotional:    "Attendre la clarté émotionnelle — ne jamais trancher dans l'urgence ou l'intensité du moment",
  sacral:       "La réponse du corps arrive avant la pensée — écouter ce oui ou ce non instinctif",
  sacrale:      "La réponse du corps arrive avant la pensée — écouter ce oui ou ce non instinctif",
  splenique:    "L'intuition du moment présent est fiable — elle ne se répète pas deux fois",
  splenic:      "The intuition of the present moment is reliable — it does not come back twice",
  lunaire:      "Laisser un cycle entier passer avant de décider — la clarté vient avec le temps, pas avec la pression",
  lunar:        "Laisser un cycle entier passer avant de décider — la clarté vient avec le temps, pas avec la pression",
  ego:          "Décider uniquement sur ce que tu veux vraiment faire — pas sur ce que tu penses devoir faire",
  will:         "Décider uniquement sur ce que tu veux vraiment faire — pas sur ce que tu penses devoir faire",
  volonte:      "Décider uniquement sur ce que tu veux vraiment faire — pas sur ce que tu penses devoir faire",
  mental:       "La clarté vient dans l'échange — verbaliser ta situation à quelqu'un de confiance avant de décider",
  soi:          "Suivre la direction naturelle où tu te sens bien dans l'espace — ton sens de l'orientation guide mieux que le mental",
  self:         "Suivre la direction naturelle où tu te sens bien dans l'espace — ton sens de l'orientation guide mieux que le mental",
}

const DECISION_SIGNALS_EN: Record<string, string> = {
  emotional:    "Wait for emotional clarity — never decide in urgency or the intensity of the moment",
  emotionnel:   "Wait for emotional clarity — never decide in urgency or the intensity of the moment",
  sacral:       "The body's response comes before thought — listen to that instinctive yes or no",
  sacrale:      "The body's response comes before thought — listen to that instinctive yes or no",
  splenic:      "The intuition of the present moment is reliable — it does not come back twice",
  splenique:    "The intuition of the present moment is reliable — it does not come back twice",
  lunar:        "Let a full cycle pass before deciding — clarity comes with time, not pressure",
  lunaire:      "Let a full cycle pass before deciding — clarity comes with time, not pressure",
  ego:          "Decide only on what you genuinely want to do — not what you think you should",
  will:         "Decide only on what you genuinely want to do — not what you think you should",
  mental:       "Clarity comes in dialogue — talk your situation through with someone trusted before deciding",
  self:         "Follow the natural direction where you feel good in space — your sense of direction guides better than the mind",
  soi:          "Follow the natural direction where you feel good in space — your sense of direction guides better than the mind",
}

/**
 * Dérive le decisionSignal (comment décider justement) à partir du decisionStyle arbitré.
 * Traduit en langage humain concret — aucun jargon technique dans la sortie.
 */
function deriveDecisionSignal(arbitration: FusionArbitration, isFr: boolean): string {
  const raw = (arbitration.decisionStyle ?? '').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const signalMap = isFr ? DECISION_SIGNALS_FR : DECISION_SIGNALS_EN

  // Chercher le premier mot-clé d'autorité dans le raw decisionStyle
  for (const key of Object.keys(signalMap)) {
    if (raw.includes(key)) return signalMap[key]!
  }

  // Fallback : si le decisionStyle est une phrase courte déjà lisible et sans jargon
  const cleaned = (arbitration.decisionStyle ?? '').trim()
  if (cleaned.length > 15 && cleaned.length < 120
    && !/human.?design|autorité|authority|hdType/i.test(cleaned)) {
    return cleaned
  }

  return isFr
    ? "Consulter l'intelligence intérieure avant de décider — la réponse vient avant la pensée"
    : "Consult your inner intelligence before deciding — the answer comes before the thought"
}

// ── Tables de timing (année personnelle) ──────────────────────────────────────
// Traduit le numéro d'année personnelle en signal de timing concret.
// Pas de "année personnelle X" dans la sortie — uniquement la description de la phase.

const PERSONAL_YEAR_SIGNALS_FR: Record<number, string> = {
  1: "Tu entres dans un nouveau départ — le bon moment pour lancer ce qui a été trop longtemps attendu",
  2: "Phase de construction douce — avancer par alliance et patience plutôt qu'en solo",
  3: "Énergie créatrice et communicative disponible — le bon moment pour exprimer et partager",
  4: "Phase de fondation — poser les bases concrètes maintenant, pas le moment de s'élancer",
  5: "Cycle de transformation — les changements qui arrivent sont nécessaires et justifiés",
  6: "Moment d'équilibre et d'engagement — trouver l'harmonie dans les responsabilités actuelles",
  7: "Période d'introspection — comprendre vers l'intérieur plutôt qu'agir vers l'extérieur",
  8: "Phase de récolte — les actions passées portent leurs fruits, rester actif et visible",
  9: "Fin de cycle — lâcher ce qui ne sert plus pour libérer l'espace pour ce qui vient",
}

const PERSONAL_YEAR_SIGNALS_EN: Record<number, string> = {
  1: "You are entering a new beginning — the right moment to launch what has waited too long",
  2: "Gentle building phase — move forward through alliance and patience rather than solo",
  3: "Creative and communicative energy available — the right moment to express and share",
  4: "Foundation phase — lay concrete foundations now, not yet the moment to leap",
  5: "Transformation cycle — changes arriving are necessary and justified",
  6: "Moment of balance and commitment — find harmony in current responsibilities",
  7: "Introspection period — understand inward rather than acting outward",
  8: "Harvest phase — past actions bearing fruit, stay active and visible",
  9: "Cycle closure — release what no longer serves to clear space for what comes next",
}

/**
 * Dérive le timingSignal (lecture du moment actuel) depuis l'année personnelle numérologique.
 * Si l'année personnelle est absente, fallback basé sur le questionType.
 */
function deriveTimingSignal(
  ctx: FusionContext,
  arbitration: FusionArbitration,
  isFr: boolean,
): string {
  const numeFields = ctx.modules.numerology.fields
  const personalYearRaw = numeFields['personalYear'] as string | number | null | undefined

  if (personalYearRaw != null) {
    const year = typeof personalYearRaw === 'string'
      ? parseInt(personalYearRaw, 10)
      : personalYearRaw
    const table = isFr ? PERSONAL_YEAR_SIGNALS_FR : PERSONAL_YEAR_SIGNALS_EN
    const signal = table[year]
    if (signal) return signal
  }

  // Fallback : lire le timing dans le contexte de la question
  const qType = arbitration.questionType ?? ''
  if (/timing|decision|make_decision/i.test(qType)) {
    return isFr
      ? "Le moment invite à observer les signaux avant d'agir — la clarté précède l'action juste"
      : "The moment invites observing signals before acting — clarity precedes the right action"
  }
  if (/blocage|block/i.test(qType)) {
    return isFr
      ? "Ce moment de blocage est souvent un signal de cycle — il indique ce qui doit changer avant d'avancer"
      : "This blocking moment is often a cycle signal — it shows what must change before moving forward"
  }

  return isFr
    ? "Le moment actuel invite à aligner l'action avec le cycle naturel — ni trop tôt, ni trop tard"
    : "The current moment invites aligning action with the natural cycle — neither too early nor too late"
}

// ── Tables de fuite énergétique (par type de fonctionnement) ──────────────────
// Dérivé du type HD — traduit en comportement concret, sans citer le terme technique.

const HD_TYPE_ENERGY_LEAKS_FR: Record<string, string> = {
  projecteur: "Énergie dépensée à initier ou insister là où aucun retour réel ne vient",
  projector:  "Énergie dépensée à initier ou insister là où aucun retour réel ne vient",
  generateur_manifeste: "Énergie perdue dans l'impatience — à t'élancer avant que la réponse soit vraiment claire",
  manifesting_generator: "Énergie perdue dans l'impatience — à t'élancer avant que la réponse soit vraiment claire",
  generateur: "Énergie dépensée sur des voies que ton corps n'a pas vraiment confirmées",
  generator:  "Énergie dépensée sur des voies que ton corps n'a pas vraiment confirmées",
  manifesteur: "Énergie perdue à justifier tes décisions ou à attendre une permission qui ne viendra pas",
  manifestor:  "Énergie perdue à justifier tes décisions ou à attendre une permission qui ne viendra pas",
  reflecteur: "Énergie dépensée à décider trop vite — tu as besoin d'un cycle entier pour voir clair",
  reflector:  "Énergie dépensée à décider trop vite — tu as besoin d'un cycle entier pour voir clair",
}

const HD_TYPE_ENERGY_LEAKS_EN: Record<string, string> = {
  projector:             "Energy spent initiating or pushing where no real return comes back",
  projecteur:            "Energy spent initiating or pushing where no real return comes back",
  manifesting_generator: "Energy lost in impatience — launching before the response is truly clear",
  generateur_manifeste:  "Energy lost in impatience — launching before the response is truly clear",
  generator:             "Energy spent on paths your body has not truly confirmed",
  generateur:            "Energy spent on paths your body has not truly confirmed",
  manifestor:            "Energy lost justifying decisions or waiting for permission that will never come",
  manifesteur:           "Energy lost justifying decisions or waiting for permission that will never come",
  reflector:             "Energy spent deciding too fast — you need a full cycle to see clearly",
  reflecteur:            "Energy spent deciding too fast — you need a full cycle to see clearly",
}

function normalizeHdTypeKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, '_')
    .trim()
}

/**
 * Dérive l'energyLeak (où l'énergie est perdue concrètement) depuis le type HD.
 * Traduit en comportement observable — aucun terme technique dans la sortie.
 */
function deriveEnergyLeak(
  ctx: FusionContext,
  arbitration: FusionArbitration,
  isFr: boolean,
): string {
  const hd = ctx.modules.human_design.fields
  const hdType = hd['hdType'] as string | null | undefined

  if (hdType) {
    const key = normalizeHdTypeKey(hdType)
    const table = isFr ? HD_TYPE_ENERGY_LEAKS_FR : HD_TYPE_ENERGY_LEAKS_EN

    // Correspondance exacte
    if (table[key]) return table[key]!

    // Correspondance partielle (ex: "Générateur Manifeste" → "generateur_manifeste")
    for (const [k, v] of Object.entries(table)) {
      if (key.includes(k) || k.includes(key)) return v
    }
  }

  // Fallback : depuis energyPattern ou message générique
  const ep = (arbitration.energyPattern ?? '').trim()
  if (ep.length > 20 && !/human.?design|hd[A-Z]/i.test(ep)) return ep

  return isFr
    ? "Énergie dépensée à forcer là où le mouvement naturel ne vient pas"
    : "Energy spent forcing where natural movement does not come"
}

/**
 * Dérive le leveragePoint (ce qui peut tout changer rapidement) depuis les points de support.
 * Priorité : supportPoints[1] → supportPoints[0] → synthèse dominanteDynamic + action.
 * Validation : doit être spécifique (> 20 chars), pas générique.
 */
function deriveLeveragePoint(
  arbitration: FusionArbitration,
  isFr: boolean,
): string {
  const supports = arbitration.supportPoints ?? []

  // Priorité 1 : deuxième point de support (souvent le plus stratégique)
  if (supports.length > 1) {
    const sp = supports[1]!.trim()
    if (sp.length > 20) return sp
  }

  // Priorité 2 : premier point de support
  if (supports.length > 0) {
    const sp = supports[0]!.trim()
    if (sp.length > 20) return sp
  }

  // Priorité 3 : synthèse depuis la dynamique dominante + l'action prioritaire
  const action = (arbitration.priorityAction ?? '').trim()
  if (action.length > 20) {
    return isFr
      ? `Levier central : ${action}`
      : `Core lever: ${action}`
  }

  return isFr
    ? "Aligner le timing avec le signal naturel — un seul ajustement au bon moment change tout"
    : "Align timing with the natural signal — one adjustment at the right moment changes everything"
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

  // ── 4 champs enrichis ──────────────────────────────────────────────────────
  const decisionSignal = deriveDecisionSignal(arbitration, isFr)
  const timingSignal   = deriveTimingSignal(ctx, arbitration, isFr)
  const energyLeak     = deriveEnergyLeak(ctx, arbitration, isFr)
  const leveragePoint  = deriveLeveragePoint(arbitration, isFr)

  return {
    dominantDynamic:  arbitration.dominantDynamic,
    hiddenMechanism,
    realTension:      arbitration.innerOuterGap || hiddenMechanism,
    visibleEffect,
    rightMovement:    arbitration.priorityAction,
    decisionSignal,
    timingSignal,
    energyLeak,
    leveragePoint,
    toneHint,
    solarToneHint,
    questionType:     arbitration.questionType,
    signalConfidence: arbitration.signalConfidence,
  }
}

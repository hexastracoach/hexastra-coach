/**
 * arbitrateFusionSignals — Hexastra Coach
 *
 * Arbitrage des signaux du contexte de fusion.
 *
 * Prend un FusionContext (déjà orienté et pondéré) et produit :
 * - la dynamique dominante (une seule, la plus pertinente)
 * - le mécanisme central (pourquoi ça se passe ainsi)
 * - le décalage intérieur/extérieur (la tension visible)
 * - l'action prioritaire (adaptée au profil, pas générique)
 * - les points de support (signaux secondaires utiles)
 *
 * RÈGLE : NE PAS parler de tout. UNE lecture principale, cohérente avec la question.
 */

import type { FusionContext, FusionArbitration } from './buildFusionContext'

export type { FusionArbitration }

// ── Bibliothèques de signaux ───────────────────────────────────────────────────

type HDTypeDynamic = { pattern: string; gap: string; action: string }

const HD_TYPE_DYNAMICS: Record<string, HDTypeDynamic> = {
  'projecteur': {
    pattern: "fonctionne par reconnaissance — son énergie et ses insights n'ont d'impact que quand ils sont invités",
    gap: "besoin intérieur d'être vu et reconnu vs. environnement qui ne le sollicite pas spontanément",
    action: "attendre l'invitation avant de partager ou de s'impliquer profondément",
  },
  'projector': {
    pattern: "operates through recognition — energy and insights only land when invited",
    gap: "inner need to be seen vs. environment that doesn't naturally invite them",
    action: "wait for the invitation before deeply engaging or sharing",
  },
  'générateur': {
    pattern: "fonctionne avec une énergie de réponse — sa force s'active quand il répond à ce qui se présente",
    gap: "énergie puissante mais initiée trop vite, avant que la vraie réponse sacrale soit là",
    action: "attendre que la réponse corporelle (oui ou non) soit claire avant d'agir",
  },
  'generator': {
    pattern: "operates through response — power activates when responding to what shows up",
    gap: "strong energy but often initiated too fast, before the true gut response is clear",
    action: "wait for the body response (yes or no) before committing",
  },
  'générateur manifestant': {
    pattern: "fonctionne avec une énergie rapide et multi-directionnelle, tend à changer de cap",
    gap: "vitesse intérieure vs. besoin de l'entourage d'être informé et embarqué",
    action: "informer brièvement avant d'agir pour réduire les frictions",
  },
  'manifesting generator': {
    pattern: "operates with fast multi-directional energy, tends to change course quickly",
    gap: "inner speed vs. environment's need to be informed and brought along",
    action: "briefly inform before acting to reduce friction",
  },
  'manifesteur': {
    pattern: "initie et crée — son rôle est de lancer les cycles, mais informer réduit la résistance",
    gap: "besoin d'autonomie et d'initiation vs. résistances créées par le manque d'information",
    action: "informer les personnes clés avant d'agir pour désamorcer la résistance",
  },
  'manifestor': {
    pattern: "initiates and creates — role is to launch cycles, but informing reduces resistance",
    gap: "need for autonomy vs. resistance created by lack of communication",
    action: "inform key people before acting to defuse resistance",
  },
  'réflecteur': {
    pattern: "absorbe et reflète l'environnement — a besoin d'un cycle lunaire pour discerner",
    gap: "profonde sensibilité à l'environnement vs. pression d'agir vite",
    action: "prendre 28 jours avant les décisions importantes pour laisser la clarté s'installer",
  },
  'reflector': {
    pattern: "absorbs and reflects environment — needs a lunar cycle to discern",
    gap: "deep environmental sensitivity vs. pressure to decide quickly",
    action: "take 28 days before major decisions for clarity to settle",
  },
}

const MOON_SIGN_PATTERNS: Record<string, string> = {
  'aries': "réactions émotionnelles rapides et directes — besoin de mouvement et d'action",
  'bélier': "réactions émotionnelles rapides et directes — besoin de mouvement et d'action",
  'taurus': "besoin de stabilité émotionnelle et de sécurité concrète",
  'taureau': "besoin de stabilité émotionnelle et de sécurité concrète",
  'gemini': "état émotionnel changeant — besoin de verbaliser et de comprendre intellectuellement",
  'gémeaux': "état émotionnel changeant — besoin de verbaliser et de comprendre intellectuellement",
  'cancer': "profonde sensibilité émotionnelle — besoin de connexion et de sécurité relationnelle",
  'leo': "besoin d'être vu et valorisé — s'épanouit dans la reconnaissance sincère",
  'lion': "besoin d'être vu et valorisé — s'épanouit dans la reconnaissance sincère",
  'virgo': "analyse les émotions — peut ruminer et s'autocritiquer intérieurement",
  'vierge': "analyse les émotions — peut ruminer et s'autocritiquer intérieurement",
  'libra': "cherche l'harmonie émotionnelle — évite les conflits au prix de soi-même",
  'balance': "cherche l'harmonie émotionnelle — évite les conflits au prix de soi-même",
  'scorpio': "profondeur et intensité émotionnelles — besoin de vérité et de transformation",
  'scorpion': "profondeur et intensité émotionnelles — besoin de vérité et de transformation",
  'sagittarius': "besoin de liberté émotionnelle et de sens — s'étouffe dans la restriction",
  'sagittaire': "besoin de liberté émotionnelle et de sens — s'étouffe dans la restriction",
  'capricorn': "gère les émotions avec contrôle — peut paraître froid, besoin de maîtrise",
  'capricorne': "gère les émotions avec contrôle — peut paraître froid, besoin de maîtrise",
  'aquarius': "détachement émotionnel naturel — observe plus qu'il ne ressent en surface",
  'verseau': "détachement émotionnel naturel — observe plus qu'il ne ressent en surface",
  'pisces': "absorption émotionnelle profonde — frontières poreuses, empathie intense",
  'poissons': "absorption émotionnelle profonde — frontières poreuses, empathie intense",
}

const LIFE_PATH_PATTERNS: Record<number, string> = {
  1: "moteur de leadership — cherche l'autonomie et à tracer sa propre voie",
  2: "moteur de coopération — besoin d'harmonie, peut avoir du mal à s'affirmer clairement",
  3: "moteur de créativité — expressif, besoin de communication et d'épanouissement joyeux",
  4: "moteur de structure — cherche l'ordre et la stabilité solide",
  5: "moteur de liberté — besoin d'exploration, résiste naturellement à la restriction",
  6: "moteur de responsabilité — porte les autres, tend à s'imposer des standards élevés",
  7: "moteur d'analyse — besoin de comprendre en profondeur, tend à l'isolement contemplatif",
  8: "moteur d'autorité — ambition naturelle, peut être perçu comme imposant sans le vouloir",
  9: "moteur d'universalité — vision large, risque de dispersion au détriment de la clarté",
  11: "moteur de vision — sensibilité aiguë, souvent en décalage de rythme avec son entourage",
  22: "moteur de construction — grande ambition qui peut créer une distance avec les proches",
  33: "moteur de dévotion — peut s'épuiser à vouloir tout transformer et tout porter",
}

const ENE_TYPE_PATTERNS: Record<number, { fear: string; pattern: string }> = {
  1: { fear: "être imparfait ou dans l'erreur", pattern: "standard intérieur élevé qui crée des tensions avec l'imperfection perçue des autres" },
  2: { fear: "ne pas être aimé ou nécessaire", pattern: "se donne sans compter pour se rendre indispensable, jusqu'à s'oublier" },
  3: { fear: "être sans valeur ou perdre la face", pattern: "performance et image d'efficacité pour être reconnu, masque le doute intérieur" },
  4: { fear: "n'avoir aucune identité ou signification propre", pattern: "cherche à se distinguer, ressent profondément le décalage avec les autres" },
  5: { fear: "être envahi ou incompétent", pattern: "se retire pour observer et comprendre, résiste à l'exposition émotionnelle" },
  6: { fear: "être sans soutien ou guidance", pattern: "anticipe les dangers et teste les alliances, cherche réassurance ou met les limites à l'épreuve" },
  7: { fear: "être privé ou souffrir", pattern: "fuit vers l'abondance et les possibilités pour éviter la douleur et l'ennui" },
  8: { fear: "être contrôlé ou blessé", pattern: "contrôle son environnement par la force ou la présence, cache la vulnérabilité" },
  9: { fear: "être en conflit ou déconnecté", pattern: "efface ses priorités pour maintenir la paix, peut devenir absent à lui-même" },
}

// ── Fonctions utilitaires ──────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function getHDTypeDynamic(hdType: string | null | undefined): HDTypeDynamic | null {
  if (!hdType) return null
  const n = deaccent(hdType)
  // Ordre important : 'générateur manifestant' avant 'générateur'
  for (const key of [
    'générateur manifestant', 'manifesting generator',
    'projecteur', 'projector',
    'générateur', 'generator',
    'manifesteur', 'manifestor',
    'réflecteur', 'reflector',
  ]) {
    if (n.includes(deaccent(key))) return HD_TYPE_DYNAMICS[key] ?? null
  }
  return null
}

function getMoonPattern(moonSign: string | null | undefined): string | null {
  if (!moonSign) return null
  const n = deaccent(moonSign)
  for (const [key, val] of Object.entries(MOON_SIGN_PATTERNS)) {
    if (n.includes(deaccent(key))) return val
  }
  return null
}

function getLifePathPattern(lifePath: string | number | string[] | null | undefined): string | null {
  if (lifePath === null || lifePath === undefined || Array.isArray(lifePath)) return null
  const num = typeof lifePath === 'string' ? parseInt(lifePath, 10) : lifePath
  return isNaN(num) ? null : (LIFE_PATH_PATTERNS[num] ?? null)
}

function getEnneagramPattern(type: string | number | string[] | null | undefined): { fear: string; pattern: string } | null {
  if (type === null || type === undefined || Array.isArray(type)) return null
  const num = typeof type === 'string' ? parseInt(type, 10) : type
  return isNaN(num) ? null : (ENE_TYPE_PATTERNS[num] ?? null)
}

// ── Arbitrage par intent ───────────────────────────────────────────────────────

function arbitrateRelationship(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const enn = ctx.modules.enneagram.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const moonSign = astro['moonSign'] as string | null
  const venusSign = astro['venusSign'] as string | null
  const lifePath = nume['lifePath'] as string | number | null
  const ennType = enn['enneagramType'] as string | number | null
  const ennWeight = ctx.modules.enneagram.weight

  const hdDynamic = getHDTypeDynamic(hdType)
  const moonPattern = getMoonPattern(moonSign)
  const lpPattern = getLifePathPattern(lifePath)
  const ennPattern = getEnneagramPattern(ennType)

  // Dynamique dominante : HD type + Lune
  let dominantDynamic: string
  if (hdDynamic && moonPattern) {
    dominantDynamic = isFr
      ? `${hdType} (${hdDynamic.pattern}) avec Lune ${moonSign} (${moonPattern})`
      : `${hdType} (${hdDynamic.pattern}) with Moon ${moonSign} (${moonPattern})`
  } else if (hdDynamic) {
    dominantDynamic = isFr ? `${hdType} — ${hdDynamic.pattern}` : `${hdType} — ${hdDynamic.pattern}`
  } else if (moonPattern) {
    dominantDynamic = isFr ? `Lune ${moonSign} — ${moonPattern}` : `Moon ${moonSign} — ${moonPattern}`
  } else {
    dominantDynamic = isFr ? 'Profil relationnel multi-dimensionnel' : 'Multi-dimensional relational profile'
  }

  // Décalage intérieur/extérieur
  const innerOuterGap = hdDynamic
    ? (isFr ? hdDynamic.gap : hdDynamic.gap)
    : (isFr ? 'Décalage entre fonctionnement intérieur et réception extérieure' : 'Gap between inner functioning and external reception')

  // Action prioritaire
  const priorityAction = hdStrategy
    ? (isFr ? `Stratégie: ${hdStrategy}` : `Strategy: ${hdStrategy}`)
    : hdDynamic
      ? (isFr ? hdDynamic.action : hdDynamic.action)
      : (isFr ? 'Identifier le mécanisme de communication adapté à ton profil' : 'Identify the communication mechanism adapted to your profile')

  // Mécanisme central
  const mainBlock = isFr
    ? `HD ${hdType}${hdProfile ? ` profil ${hdProfile}` : ''}: ${hdDynamic ? hdDynamic.pattern : 'mécanisme relationnel spécifique'}${moonSign ? ` — amplifié par la Lune ${moonSign} (${moonPattern ?? 'ancrage émotionnel'})` : ''}.`
    : `HD ${hdType}${hdProfile ? ` profile ${hdProfile}` : ''}: ${hdDynamic ? hdDynamic.pattern : 'specific relational mechanism'}${moonSign ? ` — amplified by Moon ${moonSign} (${moonPattern ?? 'emotional anchor'})` : ''}.`

  // Points de support
  const supportPoints: string[] = []
  if (lpPattern) {
    supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life Path ${lifePath}: ${lpPattern}`)
  }
  if (ennPattern && ennWeight > 0.3) {
    supportPoints.push(isFr
      ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}`
      : `Enneagram type ${ennType}: ${ennPattern.pattern}`)
  }
  if (venusSign) {
    supportPoints.push(isFr
      ? `Vénus ${venusSign}: mode d'attraction et de connexion`
      : `Venus ${venusSign}: attraction and connection mode`)
  }

  const signalConfidence = (ctx.modules.human_design.weight + ctx.modules.astrology.weight) / 2

  return { dominantDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints, dominantModule: 'human_design', signalConfidence }
}

function arbitrateDecision(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const saturnSign = astro['saturnSign'] as string | null
  const marsSign = astro['marsSign'] as string | null
  const personalYear = nume['personalYear']
  const personalMonth = nume['personalMonth']
  const lifePath = nume['lifePath']

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)

  // Dynamique dominante : l'autorité HD est le mécanisme de décision
  const dominantDynamic = hdAuthority
    ? isFr
      ? `Autorité ${hdAuthority} (${hdType ?? 'HD'}) — ton mécanisme de décision fiable passe par ${hdAuthority}`
      : `Authority ${hdAuthority} (${hdType ?? 'HD'}) — your reliable decision mechanism runs through ${hdAuthority}`
    : isFr
      ? `Profil HD ${hdType ?? '?'} — stratégie: ${hdStrategy ?? 'attendre le bon moment'}`
      : `HD profile ${hdType ?? '?'} — strategy: ${hdStrategy ?? 'wait for the right moment'}`

  // Décalage intérieur/extérieur
  const innerOuterGap = isFr
    ? `Tendance à décider avec la tête (logique externe, pression sociale) plutôt qu'avec l'autorité HD interne (${hdAuthority ?? 'corps et instinct'})`
    : `Tendency to decide with the mind (external logic, social pressure) rather than the HD internal authority (${hdAuthority ?? 'body and instinct'})`

  // Action prioritaire
  const priorityAction = hdStrategy
    ? isFr
      ? `Stratégie HD: ${hdStrategy} — respecter ce mécanisme avant de trancher`
      : `HD Strategy: ${hdStrategy} — follow this mechanism before deciding`
    : hdDynamic
      ? isFr ? hdDynamic.action : hdDynamic.action
      : isFr
        ? "Revenir à l'intelligence corporelle avant de prendre la décision"
        : "Return to body intelligence before making the decision"

  // Mécanisme central
  const cyclePart = personalYear
    ? isFr ? ` — contexte cyclique: année personnelle ${personalYear}${personalMonth ? `, mois ${personalMonth}` : ''}` : ` — cyclical context: personal year ${personalYear}${personalMonth ? `, month ${personalMonth}` : ''}`
    : ''
  const mainBlock = isFr
    ? `L'autorité HD ${hdAuthority ?? hdType} indique que les meilleures décisions émergent via ${hdAuthority?.toLowerCase() ?? "l'intelligence interne"}, pas la rationalisation mentale${cyclePart}.`
    : `HD authority ${hdAuthority ?? hdType} indicates best decisions emerge through ${hdAuthority?.toLowerCase() ?? 'internal intelligence'}, not mental rationalization${cyclePart}.`

  const supportPoints: string[] = []
  if (saturnSign) {
    supportPoints.push(isFr
      ? `Saturne ${saturnSign}: structure, discipline et patience dans la décision`
      : `Saturn ${saturnSign}: structure, discipline and patience in decision-making`)
  }
  if (lpPattern) {
    supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life Path ${lifePath}: ${lpPattern}`)
  }
  if (marsSign) {
    supportPoints.push(isFr ? `Mars ${marsSign}: élan et timing d'action` : `Mars ${marsSign}: drive and action timing`)
  }

  const signalConfidence = ctx.modules.human_design.weight

  return { dominantDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints, dominantModule: 'human_design', signalConfidence }
}

function arbitrateInnerState(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const astro = ctx.modules.astrology.fields
  const hd = ctx.modules.human_design.fields
  const enn = ctx.modules.enneagram.fields
  const nume = ctx.modules.numerology.fields

  const moonSign = astro['moonSign'] as string | null
  const sunSign = astro['sunSign'] as string | null
  const dominantElements = astro['dominantElements'] as string[] | null
  const hdType = hd['hdType'] as string | null
  const hdDefinedCenters = hd['hdDefinedCenters'] as string | null
  const ennType = enn['enneagramType']
  const ennWeight = ctx.modules.enneagram.weight
  const personalMonth = nume['personalMonth']
  const personalYear = nume['personalYear']
  const lifePath = nume['lifePath']

  const moonPattern = getMoonPattern(moonSign)
  const hdDynamic = getHDTypeDynamic(hdType)
  const ennPattern = getEnneagramPattern(ennType)
  const lpPattern = getLifePathPattern(lifePath)

  // Dynamique dominante : Lune + HD type
  let dominantDynamic: string
  if (moonSign && moonPattern && hdType && hdDynamic) {
    dominantDynamic = isFr
      ? `Lune ${moonSign} (${moonPattern}) + ${hdType} (${hdDynamic.pattern})`
      : `Moon ${moonSign} (${moonPattern}) + ${hdType} (${hdDynamic.pattern})`
  } else if (moonSign && moonPattern) {
    dominantDynamic = isFr ? `Lune ${moonSign} — ${moonPattern}` : `Moon ${moonSign} — ${moonPattern}`
  } else if (hdType && hdDynamic) {
    dominantDynamic = isFr ? `${hdType} — ${hdDynamic.pattern}` : `${hdType} — ${hdDynamic.pattern}`
  } else {
    dominantDynamic = isFr ? 'État intérieur selon le profil multi-dimensionnel' : 'Inner state per multi-dimensional profile'
  }

  // Décalage intérieur/extérieur
  const innerOuterGap = isFr
    ? `Ce que tu ressens intérieurement (${moonSign ? `Lune ${moonSign}` : 'ancrage émotionnel'}) vs. ce que ton énergie projette (${hdType ?? 'type HD'})`
    : `What you feel internally (${moonSign ? `Moon ${moonSign}` : 'emotional anchor'}) vs. what your energy projects (${hdType ?? 'HD type'})`

  // Action prioritaire
  const priorityAction = hdDynamic
    ? isFr ? hdDynamic.action : hdDynamic.action
    : isFr
      ? "Identifier la source du décalage énergétique et respecter ton rythme naturel"
      : "Identify the source of the energetic gap and respect your natural rhythm"

  // Mécanisme central
  const ennNote = ennPattern && ennWeight > 0.3
    ? isFr ? ` — amplifié par la peur de type ${ennType} (${ennPattern.fear})` : ` — amplified by type ${ennType} fear (${ennPattern.fear})`
    : ''
  const mainBlock = isFr
    ? `L'état actuel reflète directement ${moonSign ? `la Lune ${moonSign} (${moonPattern ?? "ancrage émotionnel"})` : "l'énergie lunaire"} combinée au fonctionnement ${hdType ?? 'HD'}${ennNote}.`
    : `Current state directly reflects ${moonSign ? `Moon ${moonSign} (${moonPattern ?? 'emotional anchor'})` : 'lunar energy'} combined with ${hdType ?? 'HD'} functioning${ennNote}.`

  const supportPoints: string[] = []
  if (ennPattern && ennWeight > 0.3) {
    supportPoints.push(isFr
      ? `Type ${ennType} Ennéagramme: peur centrale = ${ennPattern.fear} → ${ennPattern.pattern}`
      : `Enneagram type ${ennType}: core fear = ${ennPattern.fear} → ${ennPattern.pattern}`)
  }
  if (personalMonth || personalYear) {
    const parts = [personalYear && `Année ${personalYear}`, personalMonth && `Mois ${personalMonth}`].filter(Boolean).join(' / ')
    supportPoints.push(isFr ? `Cycle actuel: ${parts}` : `Current cycle: ${parts}`)
  }
  if (dominantElements?.length) {
    supportPoints.push(isFr ? `Éléments dominants: ${dominantElements.join(', ')}` : `Dominant elements: ${dominantElements.join(', ')}`)
  }
  if (lpPattern) {
    supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life Path ${lifePath}: ${lpPattern}`)
  }

  const signalConfidence = (ctx.modules.astrology.weight + ctx.modules.human_design.weight) / 2

  return { dominantDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints, dominantModule: 'astrology', signalConfidence }
}

function arbitrateFusionGeneral(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields
  const enn = ctx.modules.enneagram.fields

  const hdType = hd['hdType'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const sunSign = astro['sunSign'] as string | null
  const moonSign = astro['moonSign'] as string | null
  const lifePath = nume['lifePath']
  const personalYear = nume['personalYear']
  const ennType = enn['enneagramType']
  const ennWeight = ctx.modules.enneagram.weight

  const hdDynamic = getHDTypeDynamic(hdType)
  const moonPattern = getMoonPattern(moonSign)
  const lpPattern = getLifePathPattern(lifePath)
  const ennPattern = getEnneagramPattern(ennType)

  // Dynamique dominante : HD type + Soleil
  let dominantDynamic: string
  if (hdType && sunSign) {
    dominantDynamic = isFr
      ? `${hdType} Soleil ${sunSign}${hdDynamic ? ` — ${hdDynamic.pattern}` : ''}`
      : `${hdType} Sun ${sunSign}${hdDynamic ? ` — ${hdDynamic.pattern}` : ''}`
  } else if (hdType && hdDynamic) {
    dominantDynamic = isFr ? `${hdType} — ${hdDynamic.pattern}` : `${hdType} — ${hdDynamic.pattern}`
  } else {
    dominantDynamic = isFr ? 'Profil fusionné multi-dimensionnel' : 'Multi-dimensional fusion profile'
  }

  // Décalage intérieur/extérieur
  const innerOuterGap = hdDynamic
    ? isFr ? hdDynamic.gap : hdDynamic.gap
    : isFr
      ? 'Décalage entre nature intérieure profonde et réception extérieure'
      : 'Gap between deep inner nature and external reception'

  // Action prioritaire
  const priorityAction = hdDynamic
    ? isFr ? hdDynamic.action : hdDynamic.action
    : isFr
      ? 'Identifier le mécanisme central qui génère la situation'
      : 'Identify the central mechanism generating the situation'

  // Mécanisme central
  const mainBlock = isFr
    ? `Le fonctionnement de base: ${hdType ?? 'HD'}${hdProfile ? ` (${hdProfile})` : ''} + ${sunSign ? `Soleil ${sunSign}` : 'identité solaire'} + Chemin de vie ${lifePath ?? '?'} forment le schéma central qui explique la situation.`
    : `Core functioning: ${hdType ?? 'HD'}${hdProfile ? ` (${hdProfile})` : ''} + ${sunSign ? `Sun ${sunSign}` : 'solar identity'} + Life Path ${lifePath ?? '?'} form the central pattern explaining the situation.`

  const supportPoints: string[] = []
  if (moonPattern) {
    supportPoints.push(isFr ? `Lune ${moonSign}: ${moonPattern}` : `Moon ${moonSign}: ${moonPattern}`)
  }
  if (lpPattern) {
    supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life Path ${lifePath}: ${lpPattern}`)
  }
  if (ennPattern && ennWeight > 0.3) {
    supportPoints.push(isFr
      ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}`
      : `Enneagram type ${ennType}: ${ennPattern.pattern}`)
  }
  if (hdAuthority) {
    supportPoints.push(isFr
      ? `Autorité HD ${hdAuthority}: mécanisme de décision fiable`
      : `HD Authority ${hdAuthority}: reliable decision mechanism`)
  }
  if (personalYear) {
    supportPoints.push(isFr ? `Année personnelle ${personalYear}: contexte cyclique` : `Personal year ${personalYear}: cyclical context`)
  }

  const signalConfidence = (ctx.modules.human_design.weight + ctx.modules.astrology.weight) / 2

  return { dominantDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints, dominantModule: 'human_design', signalConfidence }
}

// ── Arbitrage principal ────────────────────────────────────────────────────────

/**
 * Arbitre les signaux du contexte de fusion pour produire une lecture focalisée.
 *
 * @param ctx   Contexte de fusion construit par buildFusionContext
 * @param lang  'fr' | 'en'
 */
export function arbitrateFusionSignals(ctx: FusionContext, lang = 'fr'): FusionArbitration {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  switch (ctx.intent) {
    case 'relationship':
      return arbitrateRelationship(ctx, isFr)
    case 'decision':
      return arbitrateDecision(ctx, isFr)
    case 'inner_state':
      return arbitrateInnerState(ctx, isFr)
    case 'exact_profile':
    case 'fusion_general_question':
    default:
      return arbitrateFusionGeneral(ctx, isFr)
  }
}

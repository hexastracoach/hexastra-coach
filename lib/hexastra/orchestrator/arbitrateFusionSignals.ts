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
import { getContextualAction } from './contextualActionWording'

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

// ── Helpers traçabilité et patterns contextuels ───────────────────────────────

import type { FusionModuleData } from './buildFusionContext'

/**
 * Calcule la traçabilité complète des champs utilisés/ignorés et des poids.
 */
function buildTraceability(ctx: FusionContext): {
  usedFields: string[]
  ignoredFields: string[]
  weightsApplied: Partial<Record<string, number>>
  reliabilitySummary: Partial<Record<string, boolean>>
} {
  const usedFields: string[] = []
  const ignoredFields: string[] = []
  const weightsApplied: Partial<Record<string, number>> = {}
  const reliabilitySummary: Partial<Record<string, boolean>> = {}

  for (const [module, data] of Object.entries(ctx.modules) as [string, FusionModuleData][]) {
    weightsApplied[module] = data.weight
    reliabilitySummary[module] = data.available && data.weight > 0
    for (const [field, value] of Object.entries(data.fields)) {
      if (value !== null && value !== undefined) {
        usedFields.push(`${module}.${field}`)
      } else {
        ignoredFields.push(`${module}.${field}`)
      }
    }
  }

  return { usedFields, ignoredFields, weightsApplied, reliabilitySummary }
}

/**
 * Détermine le style de décision basé sur l'autorité HD.
 */
function buildDecisionStyle(
  hdAuthority: string | null,
  hdStrategy: string | null,
  isFr: boolean,
): string {
  if (hdAuthority) {
    // Éviter le doublon "Autorité Autorité Émotionnelle" si hdAuthority commence déjà par "Autorité"
    const stripped = hdAuthority.replace(/^(Autorit[eé]\s+|Authority\s+)/i, '').trim()
    return isFr
      ? `Autorité ${stripped}: décision via ${stripped.toLowerCase()}, pas via la rationalisation mentale`
      : `Authority ${stripped}: decide through ${stripped.toLowerCase()}, not mental rationalization`
  }
  if (hdStrategy) {
    return isFr
      ? `Stratégie ${hdStrategy}: respecter ce mécanisme avant de trancher`
      : `Strategy ${hdStrategy}: follow this mechanism before deciding`
  }
  return isFr
    ? "Consulter l'intelligence corporelle et émotionnelle avant de décider"
    : 'Consult body and emotional intelligence before deciding'
}

/**
 * Détermine le pattern relationnel (HD type + Vénus/Lune).
 */
function buildRelationalPattern(
  hdType: string | null,
  hdProfile: string | null,
  venusSign: string | null,
  moonSign: string | null,
  isFr: boolean,
): string {
  const parts: string[] = []
  if (hdType) parts.push(isFr ? `${hdType} (stratégie relationnelle propre)` : `${hdType} (specific relational strategy)`)
  if (venusSign) parts.push(isFr ? `Vénus ${venusSign} (mode d'attraction)` : `Venus ${venusSign} (attraction mode)`)
  if (moonSign) parts.push(isFr ? `Lune ${moonSign} (besoins émotionnels)` : `Moon ${moonSign} (emotional needs)`)
  return parts.length
    ? parts.join(' + ')
    : isFr ? 'Pattern relationnel basé sur le profil multi-dimensionnel' : 'Relational pattern from multi-dimensional profile'
}

/**
 * Détermine la dynamique énergétique (HD type + lune + éléments).
 */
function buildEnergyPattern(
  hdType: string | null,
  moonSign: string | null,
  dominantElements: string[] | null,
  isFr: boolean,
): string {
  const parts: string[] = []
  if (hdType) parts.push(hdType)
  if (moonSign) parts.push(isFr ? `Lune ${moonSign}` : `Moon ${moonSign}`)
  if (dominantElements?.length) parts.push(isFr ? `Éléments: ${dominantElements.join('/')}` : `Elements: ${dominantElements.join('/')}`)
  return parts.length
    ? parts.join(' · ')
    : isFr ? 'Dynamique énergétique multi-dimensionnelle' : 'Multi-dimensional energy dynamic'
}

function stringifyField(value: string | number | string[] | null | undefined): string | null {
  if (typeof value === 'string') {
    return value.trim() || null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null
  }

  if (Array.isArray(value)) {
    const cleaned = value.map((entry) => String(entry).trim()).filter(Boolean)
    return cleaned.length > 0 ? cleaned.join(', ') : null
  }

  return null
}

function hasAnyToken(value: string | null | undefined, tokens: string[]): boolean {
  if (!value) return false
  const normalized = deaccent(value)
  return tokens.some((token) => normalized.includes(deaccent(token)))
}

function resolveCareerAxisPoints(args: {
  hdType: string | null
  hdDefinedCenters: string | null
  mercurySign: string | null
  marsSign: string | null
  saturnSign: string | null
  sunSign: string | null
  midheaven: string | null
  house10: string | null
  house6: string | null
  lifePath: string | number | string[] | null
  expression: string | number | string[] | null
  enneagramType: string | number | string[] | null
  kuaElement: string | null
  favorableDirections: string | null
  isFr: boolean
}): string[] {
  const points: string[] = []
  const lifePathValue = stringifyField(args.lifePath)
  const expressionValue = stringifyField(args.expression)
  const enneagramValue = stringifyField(args.enneagramType)

  if (args.hdType) {
    if (hasAnyToken(args.hdType, ['projecteur', 'projector'])) {
      points.push(
        args.isFr
          ? "Autonomie vs cadre: besoin d'autonomie d'expertise, avec peu de micro-management et un rôle de conseil, de diagnostic ou de guidage."
          : 'Autonomy vs structure: needs expert autonomy with light structure and a role in guidance, diagnosis, or counsel.',
      )
    } else if (hasAnyToken(args.hdType, ['manifesteur', 'manifestor'])) {
      points.push(
        args.isFr
          ? "Exécution vs leadership: profil fait pour initier, ouvrir une voie et décider vite, plus que pour exécuter dans un cadre trop verrouillé."
          : 'Execution vs leadership: built to initiate and open paths more than to execute inside rigid structures.',
      )
    } else if (hasAnyToken(args.hdType, ['generateur manifestant', 'manifesting generator'])) {
      points.push(
        args.isFr
          ? "Stabilité vs variété: besoin de variété, de rythme et de polyvalence; les rôles trop répétitifs finissent par éteindre l'élan."
          : 'Stability vs variety: needs movement, variety, and polyvalence; overly repetitive roles drain momentum.',
      )
    } else if (hasAnyToken(args.hdType, ['generateur', 'generator'])) {
      points.push(
        args.isFr
          ? "Exécution vs leadership: très bon dans la construction concrète, l'endurance et l'amélioration continue quand le travail déclenche un vrai oui."
          : 'Execution vs leadership: strong in concrete building, endurance, and steady improvement when the work triggers a true yes.',
      )
    } else if (hasAnyToken(args.hdType, ['reflecteur', 'reflector'])) {
      points.push(
        args.isFr
          ? "Environnement favorable: le lieu, l'équipe et l'ambiance comptent autant que le poste; le bon métier se reconnaît aussi à la qualité du cadre."
          : 'Favorable environment: place, team, and atmosphere matter as much as the role; the right profession is also revealed by the quality of the environment.',
      )
    }
  }

  if (args.hdDefinedCenters && hasAnyToken(args.hdDefinedCenters, ['gorge', 'throat'])) {
    points.push(
      args.isFr
        ? 'Relationnel vs analytique: vraie force de communication, de transmission, de coordination ou de prise de parole.'
        : 'Relational vs analytical: strong communication, transmission, coordination, or speaking axis.',
    )
  } else if (
    hasAnyToken(args.mercurySign, ['gemeaux', 'gemini', 'balance', 'libra', 'verseau', 'aquarius'])
  ) {
    points.push(
      args.isFr
        ? 'Relationnel vs analytique: biais net vers la communication, la médiation, la pédagogie ou les rôles d’interface.'
        : 'Relational vs analytical: clear bias toward communication, mediation, teaching, or interface roles.',
    )
  } else {
    points.push(
      args.isFr
        ? 'Relationnel vs analytique: avantage pour l’analyse, le tri, la stratégie ou la résolution de problèmes complexes.'
        : 'Relational vs analytical: strong analytical, strategic, and complex problem-solving bias.',
    )
  }

  if (
    hasAnyToken(args.sunSign, ['lion', 'leo']) ||
    hasAnyToken(args.midheaven, ['lion', 'leo']) ||
    lifePathValue === '3'
  ) {
    points.push(
      args.isFr
        ? 'Créatif vs opérationnel vs stratégique: dominante créative et visible, utile dans des rôles d’expression, de marque, de contenu ou de représentation.'
        : 'Creative vs operational vs strategic: creative and visible axis, useful for expression, brand, content, or representation roles.',
    )
  } else if (
    hasAnyToken(args.saturnSign, ['capricorne', 'capricorn', 'vierge', 'virgo']) ||
    lifePathValue === '4'
  ) {
    points.push(
      args.isFr
        ? 'Créatif vs opérationnel vs stratégique: dominante opérationnelle et structurante, utile pour piloter, organiser, fiabiliser ou exécuter proprement.'
        : 'Creative vs operational vs strategic: operational and structuring axis, useful for running, organizing, stabilizing, or executing cleanly.',
    )
  } else {
    points.push(
      args.isFr
        ? 'Créatif vs opérationnel vs stratégique: profil plutôt stratégique, bon pour lire les enjeux, relier les pièces et orienter les décisions.'
        : 'Creative vs operational vs strategic: more strategic profile, strong for reading stakes, connecting pieces, and orienting decisions.',
    )
  }

  if (
    lifePathValue === '1' ||
    lifePathValue === '8' ||
    lifePathValue === '22' ||
    enneagramValue === '3' ||
    enneagramValue === '8'
  ) {
    points.push(
      args.isFr
        ? 'Types de rôles compatibles: pilotage, direction, entrepreneuriat, développement, stratégie ou responsabilités visibles.'
        : 'Compatible role families: leadership, entrepreneurship, development, strategy, or visible responsibility.',
    )
  } else if (
    lifePathValue === '2' ||
    lifePathValue === '6' ||
    enneagramValue === '2' ||
    enneagramValue === '9'
  ) {
    points.push(
      args.isFr
        ? 'Types de rôles compatibles: accompagnement, relation client, coordination humaine, soin, pédagogie ou support à forte dimension humaine.'
        : 'Compatible role families: support, client-facing work, human coordination, care, teaching, or people-centered support roles.',
    )
  } else if (
    lifePathValue === '5' ||
    enneagramValue === '7' ||
    hasAnyToken(args.marsSign, ['sagittaire', 'sagittarius', 'gemeaux', 'gemini'])
  ) {
    points.push(
      args.isFr
        ? 'Types de rôles compatibles: métiers mobiles, commerciaux, projets transverses, communication, innovation ou contextes à forte variété.'
        : 'Compatible role families: mobile roles, business development, transversal projects, communication, innovation, or high-variety environments.',
    )
  } else {
    points.push(
      args.isFr
        ? 'Types de rôles compatibles: conseil, analyse, expertise, stratégie, conception ou métiers de discernement.'
        : 'Compatible role families: consulting, analysis, expertise, strategy, design, or discernment-heavy work.',
    )
  }

  const workEnvironment = args.house10 ?? args.midheaven
  const dailyEnvironment = args.house6
  const environmentParts = [workEnvironment, dailyEnvironment].filter(Boolean)

  if (environmentParts.length > 0 || args.kuaElement || args.favorableDirections) {
    const spatial = args.favorableDirections
      ? args.isFr
        ? ` repère spatial utile: ${args.favorableDirections}.`
        : ` useful spatial support: ${args.favorableDirections}.`
      : ''
    const kuaTone = args.kuaElement
      ? args.isFr
        ? ` Élément Kua ${args.kuaElement}.`
        : ` Kua element ${args.kuaElement}.`
      : ''
    points.push(
      args.isFr
        ? `Environnement favorable: ${environmentParts.join(' / ') || 'cadre aligné au rythme réel'} plutôt que des contextes flous ou trop dispersés.${spatial}${kuaTone}`
        : `Favorable environment: ${environmentParts.join(' / ') || 'an environment aligned with the real rhythm'} rather than fuzzy or overly scattered contexts.${spatial}${kuaTone}`,
    )
  }

  if (expressionValue && !points.some((point) => point.includes(expressionValue))) {
    points.push(
      args.isFr
        ? `Mode de contribution: l'expression ${expressionValue} confirme que la forme, la voix ou la manière de transmettre comptent vraiment dans la réussite pro.`
        : `Contribution mode: expression ${expressionValue} confirms that voice, form, or the way of transmitting matters in professional success.`,
    )
  }

  return [...new Set(points)].slice(0, 5)
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

  // Action prioritaire — contextualisée par intent
  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : (isFr ? 'Identifier le mécanisme de communication adapté à ton profil' : 'Identify the communication mechanism adapted to your profile'))

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
  const secondaryDynamic = ennPattern && ennWeight > 0.3
    ? isFr ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}` : `Enneagram ${ennType}: ${ennPattern.pattern}`
    : venusSign
      ? isFr ? `Vénus ${venusSign}: mode d'attraction et connexion` : `Venus ${venusSign}: attraction and connection`
      : lpPattern ?? ''
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, venusSign as string | null, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
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

  // Action prioritaire — contextualisée par intent
  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr
        ? "Revenir à l'intelligence corporelle avant de prendre la décision"
        : "Return to body intelligence before making the decision")

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
  const secondaryDynamic = lpPattern
    ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
    : saturnSign
      ? isFr ? `Saturne ${saturnSign}: structure et discipline` : `Saturn ${saturnSign}: structure and discipline`
      : ''
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, null, isFr)
  const energyPattern = buildEnergyPattern(hdType, null, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
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
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
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

  // Action prioritaire — contextualisée par intent
  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr
        ? "Identifier la source du décalage énergétique et respecter ton rythme naturel"
        : "Identify the source of the energetic gap and respect your natural rhythm")

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
  const secondaryDynamic = ennPattern && ennWeight > 0.3
    ? isFr ? `Type ${ennType} Ennéagramme: peur de ${ennPattern.fear}` : `Enneagram ${ennType}: fear of ${ennPattern.fear}`
    : lpPattern
      ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
      : ''
  const venusSign = (ctx.modules.astrology.fields['venusSign'] as string | null)
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, venusSign, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, dominantElements, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'astrology', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateFusionGeneral(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields
  const enn = ctx.modules.enneagram.fields

  const hdType = hd['hdType'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
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

  // Action prioritaire — contextualisée par intent
  const priorityAction = getContextualAction(hdType, hdStrategy ?? null, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr
        ? 'Identifier le mécanisme central qui génère la situation'
        : 'Identify the central mechanism generating the situation')

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
  const secondaryDynamic = moonPattern
    ? isFr ? `Lune ${moonSign}: ${moonPattern}` : `Moon ${moonSign}: ${moonPattern}`
    : lpPattern
      ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
      : ''
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy ?? null, isFr)
  const venusSign = (ctx.modules.astrology.fields['venusSign'] as string | null)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, venusSign, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

// ── Arbitrage par intent — nouveaux intents ────────────────────────────────────

function arbitrateLove(ctx: FusionContext, isFr: boolean): FusionArbitration {
  // love = relationship avec priorité Vénus/Lune sur HD type
  const astro = ctx.modules.astrology.fields
  const hd = ctx.modules.human_design.fields
  const enn = ctx.modules.enneagram.fields

  const venusSign = astro['venusSign'] as string | null
  const moonSign = astro['moonSign'] as string | null
  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const ennType = enn['enneagramType']
  const ennWeight = ctx.modules.enneagram.weight
  const ennPattern = getEnneagramPattern(ennType)
  const moonPattern = getMoonPattern(moonSign)
  const hdDynamic = getHDTypeDynamic(hdType)

  const dominantDynamic = venusSign && moonSign
    ? isFr
      ? `Vénus ${venusSign} (mode d'attraction) + Lune ${moonSign} (${moonPattern ?? 'besoins émotionnels'})`
      : `Venus ${venusSign} (attraction mode) + Moon ${moonSign} (${moonPattern ?? 'emotional needs'})`
    : venusSign
      ? isFr ? `Vénus ${venusSign}: mode d'attraction et d'amour` : `Venus ${venusSign}: attraction and love mode`
      : moonPattern
        ? isFr ? `Lune ${moonSign}: ${moonPattern}` : `Moon ${moonSign}: ${moonPattern}`
        : isFr ? 'Profil amoureux multi-dimensionnel' : 'Multi-dimensional love profile'

  const secondaryDynamic = hdType && hdDynamic
    ? isFr ? `${hdType} (${hdDynamic.pattern})` : `${hdType} (${hdDynamic.pattern})`
    : ennPattern && ennWeight > 0.3
      ? isFr ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}` : `Enneagram ${ennType}: ${ennPattern.pattern}`
      : ''

  const innerOuterGap = isFr
    ? `Ce que tu cherches en amour (${venusSign ? `Vénus ${venusSign}` : 'mode Vénus'}) vs. ce que tu vis en réalité (${moonSign ? `Lune ${moonSign}` : 'ancrage Lune'})`
    : `What you seek in love (${venusSign ? `Venus ${venusSign}` : 'Venus mode'}) vs. what you experience (${moonSign ? `Moon ${moonSign}` : 'Moon anchor'})`

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? "Comprendre ton mode d'attraction naturel avant d'agir en relation" : 'Understand your natural attraction mode before acting in relationship')

  const mainBlock = isFr
    ? `En amour, tu attires selon ${venusSign ? `Vénus ${venusSign}` : 'ton mode Vénus'} et tu as besoin de ${moonSign ? `Lune ${moonSign} (${moonPattern ?? 'ancrage émotionnel'})` : 'ancrage lunaire'}. Ton mécanisme relationnel HD ${hdType ?? '?'} conditionne la manière dont l'autre peut réellement t'atteindre.`
    : `In love, you attract through ${venusSign ? `Venus ${venusSign}` : 'your Venus mode'} and need ${moonSign ? `Moon ${moonSign} (${moonPattern ?? 'emotional anchor'})` : 'lunar anchor'}. Your HD ${hdType ?? '?'} relational mechanism shapes how others can truly reach you.`

  const supportPoints: string[] = []
  if (ennPattern && ennWeight > 0.3) {
    supportPoints.push(isFr ? `Type ${ennType}: peur de ${ennPattern.fear} — schéma dans les liens` : `Type ${ennType}: fear of ${ennPattern.fear} — relational pattern`)
  }
  if (hdProfile) supportPoints.push(isFr ? `Profil HD ${hdProfile}: mode de présence relationnelle` : `HD Profile ${hdProfile}: relational presence mode`)

  const signalConfidence = (ctx.modules.astrology.weight + ctx.modules.human_design.weight) / 2
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, venusSign, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'astrology', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateWorkMoney(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const saturnSign = astro['saturnSign'] as string | null
  const marsSign = astro['marsSign'] as string | null
  const lifePath = nume['lifePath']
  const personalYear = nume['personalYear']
  const expression = nume['expression']

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)

  const dominantDynamic = hdType && hdDynamic
    ? isFr
      ? `${hdType} (${hdDynamic.pattern}) — stratégie naturelle pour avancer`
      : `${hdType} (${hdDynamic.pattern}) — natural strategy to move forward`
    : lpPattern
      ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
      : isFr ? 'Profil de mission multi-dimensionnel' : 'Multi-dimensional mission profile'

  const secondaryDynamic = lpPattern
    ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
    : saturnSign
      ? isFr ? `Saturne ${saturnSign}: structure et discipline au service du succès` : `Saturn ${saturnSign}: structure and discipline for success`
      : ''

  const innerOuterGap = hdDynamic
    ? isFr
      ? `Stratégie HD (${hdDynamic.action}) vs. pression de l'environnement à agir différemment`
      : `HD strategy (${hdDynamic.action}) vs. environmental pressure to act differently`
    : isFr
      ? 'Fonctionnement naturel vs. attentes extérieures professionnelles'
      : 'Natural functioning vs. external professional expectations'

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? "Aligner la stratégie de travail sur l'autorité HD" : 'Align work strategy with HD authority')

  const cyclePart = personalYear
    ? isFr ? ` — année personnelle ${personalYear} (contexte cyclique actuel)` : ` — personal year ${personalYear} (current cycle)`
    : ''
  const mainBlock = isFr
    ? `La stratégie naturelle de travail est définie par ${hdType ?? 'HD'} (${hdDynamic ? hdDynamic.pattern : 'mécanisme propre'}) + Chemin de vie ${lifePath ?? '?'} (${lpPattern ?? 'moteur de fond'})${cyclePart}.`
    : `Natural work strategy is defined by ${hdType ?? 'HD'} (${hdDynamic ? hdDynamic.pattern : 'own mechanism'}) + Life path ${lifePath ?? '?'} (${lpPattern ?? 'background driver'})${cyclePart}.`

  const supportPoints: string[] = []
  if (saturnSign) supportPoints.push(isFr ? `Saturne ${saturnSign}: discipline, structure et timing pro` : `Saturn ${saturnSign}: discipline, structure and professional timing`)
  if (marsSign) supportPoints.push(isFr ? `Mars ${marsSign}: élan et mode d'action` : `Mars ${marsSign}: drive and action mode`)
  if (expression) supportPoints.push(isFr ? `Nombre expression ${expression}: mode d'expression dans le travail` : `Expression number ${expression}: expression in work`)

  const signalConfidence = (ctx.modules.human_design.weight + ctx.modules.numerology.weight) / 2
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, null, isFr)
  const energyPattern = buildEnergyPattern(hdType, null, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateCareerGuidance(ctx: FusionContext, isFr: boolean): FusionArbitration {
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields
  const enn = ctx.modules.enneagram.fields
  const kua = ctx.modules.kua.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdDefinedCenters = hd['hdDefinedCenters'] as string | null
  const sunSign = astro['sunSign'] as string | null
  const mercurySign = astro['mercurySign'] as string | null
  const marsSign = astro['marsSign'] as string | null
  const saturnSign = astro['saturnSign'] as string | null
  const midheaven = stringifyField(astro['midheaven'] as string | number | string[] | null)
  const house10 = stringifyField(astro['house10'] as string | number | string[] | null)
  const house6 = stringifyField(astro['house6'] as string | number | string[] | null)
  const lifePath = nume['lifePath']
  const personalYear = nume['personalYear']
  const expression = nume['expression']
  const enneagramType = enn['enneagramType'] as string | number | string[] | null
  const kuaElement = stringifyField(kua['element'] as string | number | string[] | null)
  const favorableDirections = stringifyField(
    (kua['favorableDirections'] ?? kua['directions']) as string | number | string[] | null,
  )

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)
  const careerAxes = resolveCareerAxisPoints({
    hdType,
    hdDefinedCenters,
    mercurySign,
    marsSign,
    saturnSign,
    sunSign,
    midheaven,
    house10,
    house6,
    lifePath,
    expression,
    enneagramType,
    kuaElement,
    favorableDirections,
    isFr,
  })

  const dominantDynamic = hdDynamic
    ? isFr
      ? `${hdType} — tu contribues mieux dans un rôle aligné à ta mécanique réelle qu'en essayant de rentrer dans n'importe quel métier.`
      : `${hdType} — you contribute best in roles aligned with your real mechanism, not by forcing yourself into any job.`
    : lpPattern
      ? isFr
        ? `Chemin de vie ${lifePath}: ${lpPattern}`
        : `Life path ${lifePath}: ${lpPattern}`
      : isFr
        ? 'Orientation professionnelle à lire par rôle, environnement et mode de contribution.'
        : 'Career fit should be read through role, environment, and mode of contribution.'

  const secondaryDynamic = careerAxes[0] ?? (
    isFr
      ? 'Le bon métier se reconnaît moins par son titre que par le cadre, le rythme et la façon de contribuer.'
      : 'The right profession is recognized less by title than by environment, rhythm, and contribution style.'
  )

  const innerOuterGap = hdDynamic
    ? isFr
      ? `Ton fonctionnement naturel (${hdDynamic.action}) n'est pas toujours compatible avec les cadres pros trop standardisés ou trop rigides.`
      : `Your natural functioning (${hdDynamic.action}) is not always compatible with overly standardized or rigid work settings.`
    : isFr
      ? "Le décalage vient surtout d'un métier choisi pour sa logique externe plutôt que pour ton mode réel de contribution."
      : 'The gap mostly comes from choosing work for external logic rather than your real contribution style.'

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (
      isFr
        ? 'Tester un environnement de travail concret avant de chercher le métier parfait sur le papier.'
        : 'Test a concrete work environment before chasing the perfect profession on paper.'
    )

  const cyclePart = personalYear
    ? isFr
      ? ` L'année personnelle ${personalYear} colore aussi la manière d'aborder ce repositionnement.`
      : ` Personal year ${personalYear} also colors how this repositioning should be approached.`
    : ''
  const astroAnchor = [midheaven, house10, house6].filter(Boolean).join(' / ')
  const mainBlock = isFr
    ? `Cette orientation professionnelle ne se joue pas seulement sur "quel métier ?", mais surtout sur "dans quel rôle, quel environnement et quel rythme tu fonctionnes bien". ${hdType ?? 'Le profil HD'} donne le mode de contribution, ${astroAnchor || 'les repères astro vocationnels'} montrent le terrain pro, et le Chemin de vie ${stringifyField(lifePath) ?? '?'} précise le moteur de fond.${cyclePart}`
    : `This career orientation is not only about "which profession?" but above all about "which role, environment, and rhythm fit you". ${hdType ?? 'The HD profile'} shows the contribution style, ${astroAnchor || 'the vocational astro markers'} show the professional terrain, and Life Path ${stringifyField(lifePath) ?? '?'} clarifies the deeper driver.${cyclePart}`

  const supportPoints = careerAxes

  const signalConfidence = Number(
    (
      (ctx.modules.human_design.weight + ctx.modules.astrology.weight + ctx.modules.numerology.weight) /
      3
    ).toFixed(2),
  )
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, null, isFr)
  const energyPattern = buildEnergyPattern(hdType, null, null, isFr)

  return {
    dominantDynamic,
    secondaryDynamic,
    mainBlock,
    innerOuterGap,
    priorityAction,
    supportPoints,
    decisionStyle,
    relationalPattern,
    energyPattern,
    dominantModule: 'human_design',
    signalConfidence,
    questionType: ctx.intent,
    usedFields,
    ignoredFields,
    weightsApplied,
    reliabilitySummary,
  }
}

function arbitrateBlocage(ctx: FusionContext, isFr: boolean): FusionArbitration {
  // blocage = centres HD définis/ouverts + peur ennéagramme
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const enn = ctx.modules.enneagram.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdDefinedCenters = hd['hdDefinedCenters'] as string | null
  const moonSign = astro['moonSign'] as string | null
  const saturnSign = astro['saturnSign'] as string | null
  const ennType = enn['enneagramType']
  const ennWeight = ctx.modules.enneagram.weight
  const personalYear = nume['personalYear']
  const lifePath = nume['lifePath']

  const hdDynamic = getHDTypeDynamic(hdType)
  const moonPattern = getMoonPattern(moonSign)
  const ennPattern = getEnneagramPattern(ennType)
  const lpPattern = getLifePathPattern(lifePath)

  const dominantDynamic = hdType && hdDynamic
    ? isFr
      ? `${hdType} (${hdDynamic.gap}) — source du pattern bloquant`
      : `${hdType} (${hdDynamic.gap}) — source of blocking pattern`
    : moonPattern
      ? isFr ? `Lune ${moonSign}: ${moonPattern}` : `Moon ${moonSign}: ${moonPattern}`
      : isFr ? 'Pattern de blocage multi-dimensionnel' : 'Multi-dimensional blocking pattern'

  const secondaryDynamic = ennPattern && ennWeight > 0.3
    ? isFr ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}` : `Enneagram ${ennType}: ${ennPattern.pattern}`
    : saturnSign
      ? isFr ? `Saturne ${saturnSign}: contraintes structurelles` : `Saturn ${saturnSign}: structural constraints`
      : ''

  const innerOuterGap = hdDynamic
    ? isFr ? hdDynamic.gap : hdDynamic.gap
    : isFr ? 'Décalage entre énergie intérieure et réalité extérieure' : 'Gap between inner energy and outer reality'

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? 'Identifier la source du pattern et respecter le mécanisme HD' : 'Identify pattern source and follow HD mechanism')

  const centersNote = hdDefinedCenters
    ? isFr ? ` Centres définis (${hdDefinedCenters}): zones de conditionnement potentiel.` : ` Defined centers (${hdDefinedCenters}): potential conditioning zones.`
    : ''
  const ennNote = ennPattern && ennWeight > 0.3
    ? isFr ? ` La peur centrale type ${ennType} (${ennPattern.fear}) amplifie le blocage.` : ` Core type ${ennType} fear (${ennPattern.fear}) amplifies the block.`
    : ''
  const mainBlock = isFr
    ? `Le blocage vient du décalage ${hdType ?? 'HD'}: ${hdDynamic ? hdDynamic.gap : 'fonctionnement non respecté'}.${centersNote}${ennNote}`
    : `The block comes from ${hdType ?? 'HD'} gap: ${hdDynamic ? hdDynamic.gap : 'mechanism not followed'}.${centersNote}${ennNote}`

  const supportPoints: string[] = []
  if (moonPattern) supportPoints.push(isFr ? `Lune ${moonSign}: ${moonPattern}` : `Moon ${moonSign}: ${moonPattern}`)
  if (lpPattern) supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`)
  if (personalYear) supportPoints.push(isFr ? `Année perso ${personalYear}: contexte cyclique du blocage` : `Personal year ${personalYear}: cycle context of the block`)

  const signalConfidence = (ctx.modules.human_design.weight + ctx.modules.enneagram.weight) / 2
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const hdProfile = hd['hdProfile'] as string | null
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateTiming(ctx: FusionContext, isFr: boolean): FusionArbitration {
  // timing = numérologie dominant + HD autorité
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const personalYear = nume['personalYear'] as string | number | null
  const personalMonth = nume['personalMonth'] as string | number | null
  const lifePath = nume['lifePath']
  const saturnSign = astro['saturnSign'] as string | null
  const marsSign = astro['marsSign'] as string | null

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)

  const dominantDynamic = personalYear
    ? isFr
      ? `Année personnelle ${personalYear}${personalMonth ? ` / Mois ${personalMonth}` : ''}: contexte cyclique actuel`
      : `Personal year ${personalYear}${personalMonth ? ` / Month ${personalMonth}` : ''}: current cyclical context`
    : hdAuthority
      ? isFr
        ? `Autorité HD ${hdAuthority}: mécanisme de timing interne`
        : `HD authority ${hdAuthority}: internal timing mechanism`
      : isFr ? 'Timing basé sur le profil multi-dimensionnel' : 'Timing based on multi-dimensional profile'

  const secondaryDynamic = hdAuthority
    ? isFr ? `Autorité HD ${hdAuthority}: quand décider, comment savoir` : `HD Authority ${hdAuthority}: when to decide, how to know`
    : saturnSign
      ? isFr ? `Saturne ${saturnSign}: structure temporelle` : `Saturn ${saturnSign}: temporal structure`
      : ''

  const innerOuterGap = isFr
    ? `Pression externe d'agir maintenant vs. intelligence cyclique interne (${personalYear ? `année ${personalYear}` : 'autorité HD'})`
    : `External pressure to act now vs. internal cyclical intelligence (${personalYear ? `year ${personalYear}` : 'HD authority'})`

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? "Laisser l'intelligence cyclique guider le moment d'agir" : 'Let cyclical intelligence guide the moment to act')

  const mainBlock = isFr
    ? `Le timing juste émerge de l'intersection entre ${personalYear ? `l'année personnelle ${personalYear}` : 'le cycle actuel'} et l'autorité HD ${hdAuthority ?? hdType ?? '?'}. La question n'est pas "puis-je ?" mais "est-ce que mon système intérieur dit oui ?"`
    : `Right timing emerges from the intersection of ${personalYear ? `personal year ${personalYear}` : 'current cycle'} and HD authority ${hdAuthority ?? hdType ?? '?'}. The question is not "can I?" but "does my inner system say yes?"`

  const supportPoints: string[] = []
  if (lpPattern) supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`)
  if (saturnSign) supportPoints.push(isFr ? `Saturne ${saturnSign}: patience et structure temporelle` : `Saturn ${saturnSign}: patience and temporal structure`)
  if (marsSign) supportPoints.push(isFr ? `Mars ${marsSign}: élan et momentum` : `Mars ${marsSign}: drive and momentum`)

  const signalConfidence = (ctx.modules.numerology.weight + ctx.modules.human_design.weight) / 2
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, null, isFr)
  const energyPattern = buildEnergyPattern(hdType, null, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'numerology', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateIdentity(ctx: FusionContext, isFr: boolean): FusionArbitration {
  // identity = HD + chemin de vie + soleil — qui je suis vraiment
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields
  const enn = ctx.modules.enneagram.fields

  const hdType = hd['hdType'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdIncarnationCross = hd['hdIncarnationCross'] as string | null
  const sunSign = astro['sunSign'] as string | null
  const risingSign = astro['risingSign'] as string | null
  const lifePath = nume['lifePath']
  const ennType = enn['enneagramType']
  const ennWeight = ctx.modules.enneagram.weight

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)
  const ennPattern = getEnneagramPattern(ennType)

  const dominantDynamic = hdType && hdDynamic
    ? isFr
      ? `${hdType}${hdProfile ? ` profil ${hdProfile}` : ''} — ${hdDynamic.pattern}`
      : `${hdType}${hdProfile ? ` profile ${hdProfile}` : ''} — ${hdDynamic.pattern}`
    : lpPattern
      ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
      : isFr ? 'Identité multi-dimensionnelle' : 'Multi-dimensional identity'

  const secondaryDynamic = lpPattern
    ? isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`
    : sunSign
      ? isFr ? `Soleil ${sunSign}: expression solaire centrale` : `Sun ${sunSign}: central solar expression`
      : ''

  const innerOuterGap = hdDynamic
    ? isFr ? hdDynamic.gap : hdDynamic.gap
    : isFr ? 'Décalage entre nature profonde et expression extérieure' : 'Gap between deep nature and outer expression'

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? 'Honorer le mécanisme naturel plutôt que de se conformer aux attentes' : 'Honor the natural mechanism rather than conforming to expectations')

  const crossNote = hdIncarnationCross ? ` Croix d'incarnation ${hdIncarnationCross}: direction de vie.` : ''
  const mainBlock = isFr
    ? `L'identité profonde: ${hdType ?? 'HD'}${hdProfile ? ` (${hdProfile})` : ''} + Chemin de vie ${lifePath ?? '?'} + ${sunSign ? `Soleil ${sunSign}` : 'expression solaire'}.${crossNote} Ce n'est pas qui tu "essaies d'être", c'est qui tu es naturellement.`
    : `Deep identity: ${hdType ?? 'HD'}${hdProfile ? ` (${hdProfile})` : ''} + Life path ${lifePath ?? '?'} + ${sunSign ? `Sun ${sunSign}` : 'solar expression'}.${crossNote} This is not who you "try to be", it is who you naturally are.`

  const supportPoints: string[] = []
  if (ennPattern && ennWeight > 0.3) {
    supportPoints.push(isFr ? `Type ${ennType} Ennéagramme: ${ennPattern.pattern}` : `Enneagram ${ennType}: ${ennPattern.pattern}`)
  }
  if (risingSign) supportPoints.push(isFr ? `Ascendant ${risingSign}: masque social et première impression` : `Rising ${risingSign}: social mask and first impression`)
  if (hdAuthority) supportPoints.push(isFr ? `Autorité ${hdAuthority}: mécanisme de décision authentique` : `Authority ${hdAuthority}: authentic decision mechanism`)

  const signalConfidence = ctx.modules.human_design.weight
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const moonSign = (ctx.modules.astrology.fields['moonSign'] as string | null)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, moonSign, isFr)
  const energyPattern = buildEnergyPattern(hdType, moonSign, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'human_design', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
}

function arbitrateLifePeriod(ctx: FusionContext, isFr: boolean): FusionArbitration {
  // life_period = numérologie cycles + HD définition
  const hd = ctx.modules.human_design.fields
  const astro = ctx.modules.astrology.fields
  const nume = ctx.modules.numerology.fields

  const hdType = hd['hdType'] as string | null
  const hdAuthority = hd['hdAuthority'] as string | null
  const hdStrategy = hd['hdStrategy'] as string | null
  const hdProfile = hd['hdProfile'] as string | null
  const hdDefinition = hd['hdDefinition'] as string | null
  const sunSign = astro['sunSign'] as string | null
  const saturnSign = astro['saturnSign'] as string | null
  const personalYear = nume['personalYear'] as string | number | null
  const personalMonth = nume['personalMonth'] as string | number | null
  const lifePath = nume['lifePath']

  const hdDynamic = getHDTypeDynamic(hdType)
  const lpPattern = getLifePathPattern(lifePath)

  const dominantDynamic = personalYear
    ? isFr
      ? `Année personnelle ${personalYear}${personalMonth ? ` (mois ${personalMonth})` : ''}: la dynamique de cette période`
      : `Personal year ${personalYear}${personalMonth ? ` (month ${personalMonth})` : ''}: the dynamic of this period`
    : hdDynamic
      ? isFr ? `${hdType}: ${hdDynamic.pattern}` : `${hdType}: ${hdDynamic.pattern}`
      : isFr ? 'Dynamique de période multi-dimensionnelle' : 'Multi-dimensional period dynamic'

  const secondaryDynamic = hdDynamic && hdType
    ? isFr ? `${hdType} (${hdDynamic.pattern}): mécanisme de transition` : `${hdType} (${hdDynamic.pattern}): transition mechanism`
    : saturnSign
      ? isFr ? `Saturne ${saturnSign}: structure de la période` : `Saturn ${saturnSign}: period structure`
      : ''

  const innerOuterGap = hdDynamic
    ? isFr ? hdDynamic.gap : hdDynamic.gap
    : isFr ? 'Transition intérieure vs. rythme imposé par l\'extérieur' : 'Inner transition vs. externally imposed pace'

  const priorityAction = getContextualAction(hdType, hdStrategy, ctx.intent, isFr)
    ?? (hdDynamic ? (isFr ? hdDynamic.action : hdDynamic.action)
      : isFr ? 'Honorer le rythme naturel de cette période plutôt que de le forcer' : 'Honor the natural rhythm of this period rather than forcing it')

  const cyclePart = personalYear
    ? isFr ? ` L'année personnelle ${personalYear} indique: ${personalYear == 1 ? 'nouveau départ' : personalYear == 9 ? 'clôture' : personalYear == 5 ? 'changement' : personalYear == 4 ? 'construction' : 'progression'}.` : ` Personal year ${personalYear} indicates: ${personalYear == 1 ? 'new start' : personalYear == 9 ? 'closure' : personalYear == 5 ? 'change' : personalYear == 4 ? 'building' : 'progression'}.`
    : ''
  const mainBlock = isFr
    ? `Cette période est définie par ${personalYear ? `l'année personnelle ${personalYear}` : 'le cycle actuel'} + le mécanisme ${hdType ?? 'HD'}${hdDefinition ? ` (définition ${hdDefinition})` : ''}.${cyclePart} Comprendre ce cycle évite d'aller à contre-courant.`
    : `This period is defined by ${personalYear ? `personal year ${personalYear}` : 'current cycle'} + ${hdType ?? 'HD'} mechanism${hdDefinition ? ` (definition ${hdDefinition})` : ''}.${cyclePart} Understanding this cycle prevents going against the current.`

  const supportPoints: string[] = []
  if (lpPattern) supportPoints.push(isFr ? `Chemin de vie ${lifePath}: ${lpPattern}` : `Life path ${lifePath}: ${lpPattern}`)
  if (saturnSign) supportPoints.push(isFr ? `Saturne ${saturnSign}: leçons structurantes de la période` : `Saturn ${saturnSign}: structural lessons of the period`)
  if (sunSign) supportPoints.push(isFr ? `Soleil ${sunSign}: expression centrale pendant cette période` : `Sun ${sunSign}: central expression during this period`)

  const signalConfidence = (ctx.modules.numerology.weight + ctx.modules.human_design.weight) / 2
  const { usedFields, ignoredFields, weightsApplied, reliabilitySummary } = buildTraceability(ctx)
  const decisionStyle = buildDecisionStyle(hdAuthority, hdStrategy, isFr)
  const relationalPattern = buildRelationalPattern(hdType, hdProfile, null, null, isFr)
  const energyPattern = buildEnergyPattern(hdType, null, null, isFr)

  return {
    dominantDynamic, secondaryDynamic, mainBlock, innerOuterGap, priorityAction, supportPoints,
    decisionStyle, relationalPattern, energyPattern,
    dominantModule: 'numerology', signalConfidence, questionType: ctx.intent,
    usedFields, ignoredFields, weightsApplied, reliabilitySummary,
  }
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
    case 'love':
      return arbitrateLove(ctx, isFr)
    case 'decision':
      return arbitrateDecision(ctx, isFr)
    case 'career_guidance':
      return arbitrateCareerGuidance(ctx, isFr)
    case 'work_money':
      return arbitrateWorkMoney(ctx, isFr)
    case 'inner_state':
      return arbitrateInnerState(ctx, isFr)
    case 'blocage':
      return arbitrateBlocage(ctx, isFr)
    case 'timing':
      return arbitrateTiming(ctx, isFr)
    case 'identity':
      return arbitrateIdentity(ctx, isFr)
    case 'life_period':
      return arbitrateLifePeriod(ctx, isFr)
    case 'exact_profile':
    case 'fusion_general_question':
    default:
      return arbitrateFusionGeneral(ctx, isFr)
  }
}

/**
 * renderPremiumReading — Hexastra Coach
 *
 * Couche de rendu premium : transforme le CompactReadingCore en lecture
 * structurée, percutante et orientée action.
 *
 * STRUCTURE FIXE (5 blocs) :
 * 1. CE QUI SE PASSE         → dominantDynamic
 * 2. POURQUOI ÇA SE JOUE     → hiddenMechanism (+ realTension si distinct)
 * 3. CE QUE ÇA PRODUIT       → visibleEffect
 * 4. CE QUE TU DOIS FAIRE    → rightMovement
 * 5. CLÉ À RETENIR           → mantra dérivé du rightMovement
 *
 * TON :
 * - Adapté par solarToneHint + toneHint (directivité + intensité)
 * - Scorpion → profond/tranchant · Lion → affirmé · Cancer → doux · Vierge → précis
 *
 * JARGON :
 * - Supprimé : Human Design → architecture énergétique
 * - Supprimé : Ennéagramme 4w3 → profil de personnalité
 * - Supprimé : Autorité Émotionnelle → clarté qui vient avec le temps
 * - Les planètes sont humanisées
 *
 * RÈGLES :
 * - Phrases max 2 lignes par bloc
 * - Pas d'intro inutile
 * - Formulation actionnable
 * - Mémorable
 */

import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import { getSolarToneProfile } from '@/lib/hexastra/orchestrator/solarToneProfile'
import type { ReadingLevel } from '@/lib/hexastra/context/readingLevel'
import type { UserPhase } from '@/lib/hexastra/context/userPhase'
import type { LifeZone } from '@/lib/hexastra/context/lifeZone'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RenderPremiumInput = {
  /** Core de lecture construit par buildCompactReadingCore */
  core: CompactReadingCore
  /** Prénom optionnel pour personnalisation */
  firstName?: string | null
  /** Langue : 'fr' (défaut) | 'en' */
  lang?: string
  /** Intent utilisateur (pour personnalisation contextuelle) */
  intent?: string
  /** Signe solaire brut (ex: "Scorpion") — module la directivité du ton */
  sunSign?: string | null
  /**
   * Niveau de lecture :
   * 'short'    → 3 blocs essentiels (plan free ou override "court")
   * 'standard' → 5 blocs complets (par défaut)
   * 'deep'     → 5 blocs enrichis (praticien ou override "détaille")
   */
  readingLevel?: ReadingLevel
  /**
   * Phase de l'utilisateur — colore le ton :
   * 'expansion'     → direct, orienté action
   * 'transition'    → explicatif, rassurant
   * 'stabilisation' → posé, structuré
   */
  userPhase?: UserPhase
  /**
   * Zone de vie dominante — oriente le focus :
   * 'relation' | 'work' | 'identity' | 'energy' | 'decision'
   */
  lifeZone?: LifeZone
  /**
   * Profondeur de session (nombre de messages utilisateur échangés).
   * Utilisé pour :
   * - M3 : enrichir légèrement le POURQUOI (depth 2) et l'ACTION (depth 3+)
   * - M1 : sélectionner la micro-ouverture (rotation par depth)
   * Défaut → 1 (première réponse)
   */
  sessionDepth?: number
}

// ── Niveaux de ton ─────────────────────────────────────────────────────────────

type ToneLevel = 'direct' | 'balanced' | 'soft'

function resolveToneLevel(solarToneHint: string, toneHint: string): ToneLevel {
  const combined = `${solarToneHint} ${toneHint}`.toLowerCase()
  if (
    combined.includes('direct') ||
    combined.includes('tranchant') ||
    combined.includes('profond') ||
    combined.includes('intense') ||
    combined.includes('affirmé') ||
    combined.includes('sobre') ||
    combined.includes('fort') ||
    combined.includes('sharp') ||
    combined.includes('deep') ||
    combined.includes('sober')
  ) return 'direct'
  if (
    combined.includes('doux') ||
    combined.includes('fluide') ||
    combined.includes('enveloppant') ||
    combined.includes('équilibré') ||
    combined.includes('gentle') ||
    combined.includes('soft') ||
    combined.includes('fluid') ||
    combined.includes('balanced')
  ) return 'soft'
  return 'balanced'
}

// ── Nettoyage du jargon technique ─────────────────────────────────────────────

const JARGON_RULES_FR: [RegExp, string][] = [
  // Noms de systèmes
  [/\bHuman Design\b/gi, 'architecture énergétique'],
  [/\b(?:HD)\s+(?=\w)/g, ''],
  // Ennéagramme (toutes formes : "Ennéagramme 4w3", "Ennéagramme 4", "Type 4 Ennéagramme", "Ennéagramme" seul)
  [/\bEnn[eé]agramme\s+\d+[wW]\d+/gi, 'profil de personnalité'],
  [/\bEnn[eé]agramme\s+\d+/gi, 'profil de personnalité'],
  [/\b[Tt]ype\s+\d+\s+Enn[eé]agramme\b/gi, 'profil de personnalité'],
  [/\bEnn[eé]agramme\b/gi, 'profil de personnalité'],
  // Autorités HD
  [/\bAutorit[eé]\s+[ÉE]motionnelle\b/gi, 'clarté qui vient avec le temps'],
  [/\bAutorit[eé]\s+[Ss]acrale\b/gi, 'réponse corporelle directe'],
  [/\bAutorit[eé]\s+[Ss]plénique\b/gi, 'intuition instantanée'],
  [/\bAutorit[eé]\s+[Mm]entale\b/gi, 'clarté par le partage'],
  [/\bAutorit[eé]\s+[Ee]gotique\b/gi, 'impulsion naturelle d\'initier'],
  [/\bAutorit[eé]\s+[Ll]unaire\b/gi, 'clarté sur un cycle entier'],
  // Types HD
  [/\bGénérateur [Mm]anifestant\b/gi, 'type multi-directionnel'],
  [/\b[Mm]anifesteur\b/gi, 'type initiateur'],
  [/\bProjecteur\b/gi, 'type focalisé'],
  [/\b[Rr]éflecteur\b/gi, 'type miroir'],
  [/\bGénérateur\b/gi, 'type bâtisseur'],
  // Profils HD (lignes)
  [/\bProfil\s+\d\/\d\b/gi, 'profil naturel'],
  // Numérologie
  [/\bChemin de vie\b/gi, 'orientation profonde'],
  [/\bCdV\s*\d+/gi, 'orientation profonde'],
  [/\bAnn[eé]e personnelle\b/gi, 'cycle annuel actuel'],
  [/\bAP\s*\d+/g, 'cycle actuel'],
  // Kua
  [/\bNombre Kua\b/gi, 'énergie d\'orientation'],
  [/\bKua\s*\d+/gi, 'orientation spatiale'],
  // Planètes (garder discret, pas caricatural)
  [/\b[VvÉé][eé]nus\b/gi, 'sensibilité relationnelle'],
  [/\b[Mm]ars\b(?!\s+[A-ZÀÂÇÈÉÊËÏÎÔÙÛÜ][a-z])/g, 'énergie d\'action'],
  [/\b[Mm]ercure\b/gi, 'mode de communication'],
  [/\b[Jj]upiter\b/gi, 'élan d\'expansion'],
  [/\b[Ss]aturne\b/gi, 'apprentissage structurel'],
  [/\b[Uu]ranus\b/gi, 'besoin de liberté'],
  [/\bNeptune\b/gi, 'sensibilité subtile'],
  [/\b[Pp]luton\b/gi, 'force de transformation'],
]

const JARGON_RULES_EN: [RegExp, string][] = [
  [/\bHuman Design\b/gi, 'energy architecture'],
  [/\b(?:HD)\s+(?=\w)/g, ''],
  [/\bEnneagram\s+\d+[wW]\d+/gi, 'personality type'],
  [/\bEnneagram\s+\d+/gi, 'personality type'],
  [/\bEmotional Authority\b/gi, 'clarity that comes with time'],
  [/\bSacral Authority\b/gi, 'direct body response'],
  [/\bSplenic Authority\b/gi, 'instant intuition'],
  [/\bMental Authority\b/gi, 'clarity through sharing'],
  [/\bEgo Authority\b/gi, 'natural drive to initiate'],
  [/\bLunar Authority\b/gi, 'clarity over a full cycle'],
  [/\bManifesting Generator\b/gi, 'multi-directional type'],
  [/\bManifestor\b/gi, 'initiating type'],
  [/\bProjector\b/gi, 'focused type'],
  [/\bReflector\b/gi, 'mirror type'],
  [/\bGenerator\b/gi, 'builder type'],
  [/\bProfile\s+\d\/\d\b/gi, 'natural profile'],
  [/\bLife Path\b/gi, 'deep orientation'],
  [/\bPersonal Year\b/gi, 'current annual cycle'],
  [/\bKua\s+\d+/gi, 'directional orientation'],
  [/\bVenus\b/gi, 'relational sensitivity'],
  [/\bMars\b(?!\s+[A-Z][a-z])/g, 'drive energy'],
  [/\bMercury\b/gi, 'communication mode'],
  [/\bJupiter\b/gi, 'expansion impulse'],
  [/\bSaturn\b/gi, 'structural learning'],
  [/\bUranus\b/gi, 'need for freedom'],
  [/\bNeptune\b/gi, 'subtle sensitivity'],
  [/\bPluto\b/gi, 'transformative force'],
]

function deJargon(text: string, isFr: boolean): string {
  const rules = isFr ? JARGON_RULES_FR : JARGON_RULES_EN
  let out = text
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement)
  }
  // Nettoyer les doubles espaces créés par les suppressions
  return out.replace(/\s{2,}/g, ' ').trim()
}

// ── Labels de section ─────────────────────────────────────────────────────────

const SECTION_LABELS_FR = {
  s1: 'CE QUI SE PASSE',
  s2: 'POURQUOI ÇA SE JOUE',
  s3: 'CE QUE ÇA PRODUIT DANS TA VIE',
  s4: 'CE QUE TU DOIS FAIRE MAINTENANT',
  s5: 'CLÉ À RETENIR',
} as const

const SECTION_LABELS_EN = {
  s1: 'WHAT IS HAPPENING',
  s2: 'WHY IT PLAYS OUT THIS WAY',
  s3: 'WHAT IT PRODUCES IN YOUR LIFE',
  s4: 'WHAT YOU NEED TO DO NOW',
  s5: 'KEY TO REMEMBER',
} as const

// ── Dérivation du mantra (section 5) ─────────────────────────────────────────

/**
 * Dérive une clé mémorable à partir du rightMovement.
 *
 * Algorithme :
 * 1. Prendre la première clause (avant ' — ' ou ' : ')
 * 2. Nettoyer le jargon
 * 3. Capitaliser + ponctuer
 * 4. Tronquer à 90 chars si nécessaire
 */
function deriveMantra(rightMovement: string, isFr: boolean): string {
  if (!rightMovement || rightMovement.length < 5) {
    return isFr
      ? 'Le bon mouvement vient d\'une clarté intérieure, pas d\'une pression externe.'
      : 'The right movement comes from inner clarity, not external pressure.'
  }

  const cleaned = deJargon(rightMovement, isFr)

  // Première clause (avant tiret long ou deux-points)
  const firstClause = cleaned
    .split(/\s[—–:]\s/)[0]
    ?.trim() ?? cleaned

  // Capitaliser
  const capitalized = firstClause.charAt(0).toUpperCase() + firstClause.slice(1)

  // Ponctuer
  const punctuated = /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`

  // Tronquer si trop long (dernière frontière de mot avant 90 chars)
  if (punctuated.length > 90) {
    const cut = punctuated.slice(0, 90)
    const lastSpace = cut.lastIndexOf(' ')
    const truncated = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
    return `${truncated}.`
  }

  return punctuated
}

// ── Connecteurs de ton ────────────────────────────────────────────────────────

type ToneConnectors = {
  tensionConnector: string
  reliabilityNote: string
}

function getToneConnectors(level: ToneLevel, isFr: boolean): ToneConnectors {
  if (isFr) {
    switch (level) {
      case 'direct':
        return {
          tensionConnector: '\n→ En pratique : ',
          reliabilityNote:  '⚠ Données partielles — lecture indicative.',
        }
      case 'soft':
        return {
          tensionConnector: ' — ',
          reliabilityNote:  '⚠ Données partielles — à croiser avec ton ressenti.',
        }
      default:
        return {
          tensionConnector: '\n',
          reliabilityNote:  '⚠ Données partielles — lecture indicative.',
        }
    }
  } else {
    switch (level) {
      case 'direct':
        return {
          tensionConnector: '\n→ In practice: ',
          reliabilityNote:  '⚠ Partial data — indicative reading.',
        }
      case 'soft':
        return {
          tensionConnector: ' — ',
          reliabilityNote:  '⚠ Partial data — cross with your own sense.',
        }
      default:
        return {
          tensionConnector: '\n',
          reliabilityNote:  '⚠ Partial data — indicative reading.',
        }
    }
  }
}

// ── Formateur de section ──────────────────────────────────────────────────────

function section(label: string, content: string): string {
  return `${label}\n${content}`
}

// ── Méta-phase ────────────────────────────────────────────────────────────────

/**
 * Construit le commentaire de phase pour le LLM.
 * Injecté en tête du bloc pour cadrer le ton de la réponse.
 */
function buildPhaseMeta(phase: UserPhase, isFr: boolean): string | null {
  if (isFr) {
    switch (phase) {
      case 'expansion':
        return "[PHASE: EXPANSION — Ton direct et orienté action. Vocabulaire de mouvement. Priorité à l'action concrète.]"
      case 'transition':
        return '[PHASE: TRANSITION — Ton explicatif et rassurant. Valider avant de guider. Ne pas précipiter.]'
      case 'stabilisation':
        return '[PHASE: STABILISATION — Ton posé et structuré. Clarté avant engagement.]'
    }
  } else {
    switch (phase) {
      case 'expansion':
        return '[PHASE: EXPANSION — Direct, action-oriented tone. Movement vocabulary. Prioritize concrete action.]'
      case 'transition':
        return '[PHASE: TRANSITION — Explanatory, reassuring tone. Validate before guiding. Do not rush.]'
      case 'stabilisation':
        return '[PHASE: STABILISATION — Steady, structured tone. Clarity before engagement.]'
    }
  }
  return null
}

// ── Méta-zone ─────────────────────────────────────────────────────────────────

/**
 * Construit le commentaire de zone de vie pour le LLM.
 * Injecté en tête du bloc pour orienter le focus de la réponse.
 */
function buildZoneMeta(zone: LifeZone, isFr: boolean): string | null {
  if (isFr) {
    switch (zone) {
      case 'relation':
        return '[ZONE: RELATION — Accent sur la dynamique humaine, le lien et la réciprocité.]'
      case 'work':
        return "[ZONE: TRAVAIL — Accent sur l'action concrète et les leviers pratiques.]"
      case 'identity':
        return '[ZONE: IDENTITÉ — Accent sur la compréhension de soi et du fonctionnement naturel.]'
      case 'energy':
        return "[ZONE: ÉNERGIE — Accent sur le ressenti intérieur et l'état actuel.]"
      case 'decision':
        return '[ZONE: DÉCISION — Accent sur le timing, le choix juste et l\'alignement.]'
    }
  } else {
    switch (zone) {
      case 'relation':
        return '[ZONE: RELATION — Focus on human dynamics, connection, and reciprocity.]'
      case 'work':
        return '[ZONE: WORK — Focus on concrete action and practical levers.]'
      case 'identity':
        return '[ZONE: IDENTITY — Focus on self-understanding and natural functioning.]'
      case 'energy':
        return '[ZONE: ENERGY — Focus on inner state and current feeling.]'
      case 'decision':
        return '[ZONE: DECISION — Focus on timing, the right choice, and alignment.]'
    }
  }
  return null
}

// ── Micro-ouvertures (M1) ──────────────────────────────────────────────────────

// 3 variantes par zone — rotées par sessionDepth
// Ton : naturel, jamais commercial, max 1 phrase
// Mots interdits : acheter, payer, upgrade, offre, limité

type MicroOpeningPool = { fr: string[]; en: string[] }

const MICRO_OPENINGS: Record<string, MicroOpeningPool> = {
  relation: {
    fr: [
      "On peut aller plus loin sur ce qui se joue entre vous si tu veux.",
      "Si tu veux, je peux affiner la dynamique relationnelle plus précisément.",
      "On peut creuser ensemble ce qui se joue dans cette relation.",
    ],
    en: [
      "We can look more closely at what's happening between you, if you want.",
      "I can break down this dynamic more precisely if you'd like.",
      "We can dig into what's really at play in this relationship.",
    ],
  },
  work: {
    fr: [
      "Je peux t'aider à identifier le levier exact si tu veux.",
      "On peut affiner ce qui bloque concrètement si tu veux aller plus loin.",
      "Si tu veux, on peut voir ensemble l'action la plus prioritaire.",
    ],
    en: [
      "I can help you identify the exact lever if you want.",
      "We can look more closely at what's concretely blocking, if you'd like.",
      "If you want, we can find the most important action together.",
    ],
  },
  identity: {
    fr: [
      "On peut creuser ton fonctionnement naturel encore plus loin si tu veux.",
      "Si tu veux, je peux te montrer ce qui se passe vraiment en profondeur.",
      "On peut aller plus loin sur ce qui te définit si tu veux.",
    ],
    en: [
      "We can dig deeper into your natural functioning if you want.",
      "I can show you what's really happening at a deeper level.",
      "We can go further into what defines you if you want.",
    ],
  },
  energy: {
    fr: [
      "Je peux affiner ce que tu traverses en ce moment si tu veux.",
      "On peut regarder de plus près ce que tu ressens réellement.",
      "Si tu veux, on peut identifier ce qui draine ton énergie précisément.",
    ],
    en: [
      "I can refine what you're going through right now, if you want.",
      "We can look more closely at what you're actually feeling.",
      "If you want, we can identify precisely what's draining your energy.",
    ],
  },
  decision: {
    fr: [
      "On peut affiner le timing exact si tu veux aller plus loin.",
      "Je peux t'aider à clarifier le choix plus précisément si tu veux.",
      "Si tu veux, on peut identifier le signal décisif ensemble.",
    ],
    en: [
      "We can refine the exact timing if you want to go further.",
      "I can help clarify the choice more precisely if you'd like.",
      "If you want, we can identify the decisive signal together.",
    ],
  },
}

/**
 * Construit la micro-ouverture de fin de lecture.
 *
 * Conditions :
 * - Seulement si readingLevel === 'standard'
 * - Rotation par sessionDepth (évite la répétition)
 *
 * @param zone          Zone de vie
 * @param sessionDepth  Profondeur de session (1+)
 * @param isFr          Langue
 * @returns             Phrase d'ouverture ou null
 */
function buildMicroOpening(
  zone: LifeZone,
  sessionDepth: number,
  isFr: boolean,
): string | null {
  const pool = MICRO_OPENINGS[zone]
  if (!pool) return null
  const variants = isFr ? pool.fr : pool.en
  if (!variants || variants.length === 0) return null

  // Rotation stable basée sur sessionDepth
  const idx = (sessionDepth - 1) % variants.length
  return variants[idx] ?? null
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Transforme le CompactReadingCore en lecture premium structurée (5 blocs).
 *
 * Output : texte structuré, sans jargon, prêt pour injection dans le
 * system prompt comme intentCompactBlock (guide de lecture pour le LLM).
 *
 * @param input  RenderPremiumInput (core + options)
 * @returns      Texte premium structuré en 5 sections
 */
export function renderPremiumReading(input: RenderPremiumInput): string {
  const {
    core,
    firstName,
    lang = 'fr',
    sunSign,
    readingLevel = 'standard',
    userPhase = 'stabilisation',
    lifeZone = 'identity',
    sessionDepth = 1,
  } = input
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const labels = isFr ? SECTION_LABELS_FR : SECTION_LABELS_EN

  // Profil solaire pour la directivité
  const solarProfile = sunSign ? getSolarToneProfile(sunSign, isFr) : null
  const toneLevel = resolveToneLevel(core.solarToneHint, core.toneHint)
  const connectors = getToneConnectors(toneLevel, isFr)

  // Préfixe de prénom (optionnel)
  const namePrefix = firstName ? `${firstName}, ` : ''

  // ── Nettoyage des 5 composants core ────────────────────────────────────────
  const dominant = deJargon(core.dominantDynamic, isFr)
  const hidden   = deJargon(core.hiddenMechanism, isFr)
  const tension  = deJargon(core.realTension, isFr)
  const visible  = deJargon(core.visibleEffect, isFr)
  const movement = deJargon(core.rightMovement, isFr)

  // ── Section 1 — CE QUI SE PASSE ────────────────────────────────────────────
  const s1 = `${namePrefix}${dominant}`

  // ── Section 2 — POURQUOI ÇA SE JOUE ───────────────────────────────────────
  // Adapté selon le niveau de lecture :
  // deep    → toujours les deux composants (mécanisme + tension)
  // short   → premier segment du mécanisme uniquement (bref)
  // standard → logique actuelle (tension combinée si distincte)
  let s2: string
  if (readingLevel === 'deep') {
    const tensionDistinct =
      tension.length > 20 && !hidden.includes(tension.slice(0, 30))
    s2 = tensionDistinct
      ? `${hidden}${connectors.tensionConnector}${tension}`
      : hidden
  } else if (readingLevel === 'short') {
    // Raccourci : première clause du mécanisme (avant '.' ou ' — ')
    const firstClause = hidden.split(/[.\n]|(?:\s[—–]\s)/)[0]?.trim() ?? hidden
    s2 = firstClause.endsWith('.') ? firstClause : `${firstClause}.`
  } else {
    // Standard + M3 : à depth 2+, toujours combiner hidden + tension pour plus de précision
    const alwaysCombine = sessionDepth >= 2
    const tensionIsDistinct = alwaysCombine
      ? tension.length > 10
      : (tension !== hidden && tension.length > 20 && !hidden.includes(tension.slice(0, 30)))
    s2 = tensionIsDistinct
      ? `${hidden}${connectors.tensionConnector}${tension}`
      : hidden
  }

  // ── Section 3 — CE QUE ÇA PRODUIT ─────────────────────────────────────────
  const s3 = visible

  // ── Section 4 — CE QUE TU DOIS FAIRE ──────────────────────────────────────
  // M3 : à depth 3+, ajouter un préfixe de personnalisation (mode standard uniquement)
  const actionPrefix =
    readingLevel === 'standard' && sessionDepth >= 3
      ? (isFr ? 'Concrètement pour toi : ' : 'Concretely for you: ')
      : ''
  const s4 = actionPrefix ? `${actionPrefix}${movement}` : movement

  // ── Section 5 — CLÉ À RETENIR ─────────────────────────────────────────────
  const s5 = deriveMantra(core.rightMovement, isFr)

  // ── Assemblage selon niveau de lecture ─────────────────────────────────────
  let parts: string[]
  if (readingLevel === 'short') {
    // 3 blocs essentiels (plan free ou override "court")
    parts = [
      section(labels.s1, s1),
      section(labels.s2, s2),
      section(labels.s4, s4),
    ]
  } else {
    // Standard ou deep : 5 blocs complets
    parts = [
      section(labels.s1, s1),
      section(labels.s2, s2),
      section(labels.s3, s3),
      section(labels.s4, s4),
      section(labels.s5, s5),
    ]
  }

  // Note de fiabilité si confiance basse (< 0.6)
  if (core.signalConfidence < 0.6) {
    parts.push(connectors.reliabilityNote)
  }

  // Méta-ton solaire (guide LLM — directivité + intensité vocabulaire)
  if (solarProfile) {
    const meta = isFr
      ? `[TON SOLAIRE: ${solarProfile.tonalite} · directivité ${solarProfile.directivite} · intensité vocabulaire ${solarProfile.intensiteVocabulaire}/3]`
      : `[SOLAR TONE: ${solarProfile.tonalite} · directivity ${solarProfile.directivite} · vocabulary intensity ${solarProfile.intensiteVocabulaire}/3]`
    parts.unshift(meta)
  }

  // Méta-phase (colore le ton selon la phase détectée)
  const phaseMeta = buildPhaseMeta(userPhase, isFr)
  if (phaseMeta) parts.unshift(phaseMeta)

  // Méta-zone (oriente le focus selon la zone de vie)
  const zoneMeta = buildZoneMeta(lifeZone, isFr)
  if (zoneMeta) parts.unshift(zoneMeta)

  // ── Micro-ouverture M1 ───────────────────────────────────────────────────────
  // Uniquement en mode 'standard' — invitation naturelle, jamais commerciale
  if (readingLevel === 'standard') {
    const microOpening = buildMicroOpening(lifeZone, sessionDepth, isFr)
    if (microOpening) parts.push(microOpening)
  }

  return parts.join('\n\n')
}

// ── Exemples (documentation vivante) ──────────────────────────────────────────

/**
 * AVANT / APRÈS — 3 exemples de transformation
 *
 * ─── EXEMPLE 1 : RELATION ───────────────────────────────────────────────────
 *
 * CORE BRUT :
 *   dominantDynamic  : "Projecteur 2/4 — fonctionnement sur invitation et reconnaissance"
 *   hiddenMechanism  : "Autorité Émotionnelle : la clarté vient avec le temps, pas dans l'urgence"
 *   realTension      : "Tension entre l'envie d'initier et le besoin d'être reconnu d'abord"
 *   visibleEffect    : "Connexions qui s'éteignent quand l'énergie est poussée sans retour"
 *   rightMovement    : "ne pas projeter d'énergie sans retour — attendre que l'intérêt de l'autre soit réel"
 *   solarToneHint    : "Ton direct et profond. Ne pas rester en surface." (Scorpion)
 *   toneHint         : "Ton direct — valider l'émotion vive avant de guider" (Lune Bélier)
 *
 * OUTPUT PREMIUM :
 *   [TON SOLAIRE: Intense, pénétrant, transformatif · directivité high · intensité vocabulaire 3/3]
 *
 *   CE QUI SE PASSE
 *   Type focalisé 2/4 — fonctionnement sur invitation et reconnaissance
 *
 *   POURQUOI ÇA SE JOUE
 *   Clarté qui vient avec le temps : la clarté vient avec le temps, pas dans l'urgence
 *   → En pratique : Tension entre l'envie d'initier et le besoin d'être reconnu d'abord
 *
 *   CE QUE ÇA PRODUIT DANS TA VIE
 *   Connexions qui s'éteignent quand l'énergie est poussée sans retour
 *
 *   CE QUE TU DOIS FAIRE MAINTENANT
 *   ne pas projeter d'énergie sans retour — attendre que l'intérêt de l'autre soit réel
 *
 *   CLÉ À RETENIR
 *   Ne pas projeter d'énergie sans retour.
 *
 * ─── EXEMPLE 2 : BLOCAGE ────────────────────────────────────────────────────
 *
 * CORE BRUT :
 *   dominantDynamic  : "Blocage lié à l'absence d'invitation réelle dans ton activité"
 *   hiddenMechanism  : "Tu pousses là où le signal ne vient pas — l'énergie se dépense sans retour"
 *   realTension      : "Tension entre la volonté d'avancer et l'absence de reconnaissance"
 *   visibleEffect    : "Efforts qui ne débouchent pas, sentiment de tourner en rond"
 *   rightMovement    : "identifier où l'invitation manque — arrêter d'initier sans retour réel"
 *
 * OUTPUT PREMIUM :
 *   CE QUI SE PASSE
 *   Blocage lié à l'absence d'invitation réelle dans ton activité
 *
 *   POURQUOI ÇA SE JOUE
 *   Tu pousses là où le signal ne vient pas — l'énergie se dépense sans retour
 *   → En pratique : Tension entre la volonté d'avancer et l'absence de reconnaissance
 *
 *   CE QUE ÇA PRODUIT DANS TA VIE
 *   Efforts qui ne débouchent pas, sentiment de tourner en rond
 *
 *   CE QUE TU DOIS FAIRE MAINTENANT
 *   identifier où l'invitation manque — arrêter d'initier sans retour réel
 *
 *   CLÉ À RETENIR
 *   Identifier où l'invitation manque.
 *
 * ─── EXEMPLE 3 : TIMING ─────────────────────────────────────────────────────
 *
 * CORE BRUT :
 *   dominantDynamic  : "Cycle annuel 3 (expression, partage) — énergie en mouvement"
 *   hiddenMechanism  : "Orientation profonde 7 : besoin de maîtrise avant d'exposer"
 *   realTension      : "Tension entre la pression d'agir vite et le besoin de maturation"
 *   visibleEffect    : "Hésitations chroniques sur le bon moment, opportunités manquées"
 *   rightMovement    : "laisser le bon signal venir jusqu'à toi avant d'engager ton énergie"
 *
 * OUTPUT PREMIUM (ton doux — Cancer hypothétique) :
 *   CE QUI SE PASSE
 *   Cycle annuel 3 (expression, partage) — énergie en mouvement
 *
 *   POURQUOI ÇA SE JOUE
 *   Orientation profonde 7 : besoin de maîtrise avant d'exposer — Tension entre la
 *   pression d'agir vite et le besoin de maturation
 *
 *   CE QUE ÇA PRODUIT DANS TA VIE
 *   Hésitations chroniques sur le bon moment, opportunités manquées
 *
 *   CE QUE TU DOIS FAIRE MAINTENANT
 *   laisser le bon signal venir jusqu'à toi avant d'engager ton énergie
 *
 *   CLÉ À RETENIR
 *   Laisser le bon signal venir jusqu'à toi avant d'engager ton énergie.
 */

/**
 * buildDirectKnowledgeBlock — Hexastra Coach
 *
 * Extrait et formate les données factuelles brutes depuis le payload /chart/fusion
 * pour répondre directement aux questions courtes et possessives :
 *   "mes canaux", "mon kua", "mon ennéagramme", "mon chemin de vie", etc.
 *
 * NE fait PAS d'interprétation — retourne les valeurs calculées, formatées en
 * liste claire pour injection dans le prompt système.
 *
 * Utilisé par le pipeline direct_knowledge_query uniquement.
 */

import { buildCompactHumanDesignContext } from '@/lib/humandesign/compactContext'
import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'
import {
  findFirstMatchingValueDeep,
  mergeFusionExactSectionWithLegacy,
  LEGACY_KUA_KEYS,
  LEGACY_NUMEROLOGY_KEYS,
} from '@/lib/hexastra/api/normalizeFusionExactData'

// ── Types ──────────────────────────────────────────────────────────────────────

export type DirectTopic =
  | 'hd_channels'    // canaux définis
  | 'hd_centers'     // centres définis et ouverts
  | 'hd_gates'       // portes/gates actives
  | 'hd_type'        // type + stratégie + signature
  | 'hd_authority'   // autorité + stratégie
  | 'hd_profile'     // profil numérique
  | 'hd_full'        // Human Design complet
  | 'enneagram'      // type + aile
  | 'kua'            // nombre kua + directions
  | 'numerology'     // chemin de vie + année personnelle
  | 'astro_basics'   // soleil + lune + ascendant
  | 'astro_full'     // thème complet
  | 'all'            // fallback : toutes les données disponibles

// ── Utilitaires ────────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function safeStr(v: unknown): string | null {
  if (!v) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number') return String(v)
  return null
}

function safeArr(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const v = obj[key]
    if (v !== null && v !== undefined) return v
  }

  return findFirstMatchingValueDeep(obj, keys)
}

// ── Détection du topic depuis le message ──────────────────────────────────────

const TOPIC_DETECTION: { topic: DirectTopic; patterns: RegExp[] }[] = [
  {
    topic: 'hd_channels',
    patterns: [/\b(canaux|channels|canal[x]? defini[s]?)\b/i],
  },
  {
    topic: 'hd_centers',
    patterns: [/\b(centres?|centers?|centres? (definis?|ouverts?|ind[ée]finis?))\b/i],
  },
  {
    topic: 'hd_gates',
    patterns: [/\b(gates?|portes?|porte[s]? activ[eé]e?[s]?)\b/i],
  },
  {
    topic: 'hd_authority',
    patterns: [/\b(autorit[eé]( hd)?)\b/i],
  },
  {
    topic: 'hd_profile',
    patterns: [/\b(profil hd|profil [0-9][/\\][0-9])\b/i],
  },
  {
    topic: 'hd_type',
    patterns: [/\b(type hd|type human design|type de design|generateur|projecteur|manifesteur|reflecteur)\b/i],
  },
  {
    topic: 'hd_full',
    patterns: [/\b(human design|design humain|mon hd\b|bodygraph)\b/i],
  },
  {
    topic: 'enneagram',
    patterns: [/\b(enn[eé]a(gramme)?|type enn[eé]|enn[eé]agramme)\b/i],
  },
  {
    topic: 'kua',
    patterns: [/\b(kua|direction[s]? (favorable[s]?|kua)|gps kua|neurokua)\b/i],
  },
  {
    topic: 'numerology',
    patterns: [/\b(chemin de vie|ann[eé]e personnelle|ann[eé]e perso|numerolog)\b/i],
  },
  {
    topic: 'astro_full',
    patterns: [/\b(planetes?|maisons?|theme natal|th[eè]me astral|carte du ciel)\b/i],
  },
  {
    topic: 'astro_basics',
    patterns: [/\b(signe solaire|signe lunaire|ma lune|mon soleil|mon ascendant|mon signe)\b/i],
  },
]

/**
 * Détecte le topic factuel demandé dans le message.
 * Retourne 'all' si aucun topic précis n'est identifié.
 */
export function detectDirectTopic(message: string): DirectTopic {
  const norm = deaccent((message || '').toLowerCase())
  for (const { topic, patterns } of TOPIC_DETECTION) {
    if (patterns.some((p) => p.test(norm))) return topic
  }
  return 'all'
}

// ── Extracteurs par topic ─────────────────────────────────────────────────────

function buildHDTopicBlock(
  raw: Record<string, unknown>,
  topic: DirectTopic,
  isFr: boolean,
): string {
  const hd = buildCompactHumanDesignContext(raw)
  if (!hd) return ''

  const lines: string[] = []
  const t = (fr: string, en: string) => (isFr ? fr : en)

  const header = t('DONNÉES HUMAN DESIGN (vérifiées — source de vérité)', 'HUMAN DESIGN DATA (verified — source of truth)')
  lines.push(header)

  if (topic === 'hd_channels' || topic === 'hd_full' || topic === 'all') {
    const channels = hd.hdDefinedChannels ?? []
    if (channels.length) {
      lines.push(`● ${t('CANAUX DÉFINIS', 'DEFINED CHANNELS')} (${channels.length}) : ${channels.join(', ')}`)
    } else {
      lines.push(`● ${t('CANAUX DÉFINIS', 'DEFINED CHANNELS')} : ${t('non disponible', 'not available')}`)
    }
  }

  if (topic === 'hd_centers' || topic === 'hd_full' || topic === 'all') {
    const defined = hd.hdDefinedCenters ?? []
    const open = hd.hdOpenCenters ?? []
    if (defined.length) lines.push(`● ${t('CENTRES DÉFINIS', 'DEFINED CENTERS')} : ${defined.join(', ')}`)
    if (open.length) lines.push(`● ${t('CENTRES OUVERTS', 'OPEN CENTERS')} : ${open.join(', ')}`)
    if (!defined.length && !open.length) {
      lines.push(`● ${t('CENTRES', 'CENTERS')} : ${t('non disponible', 'not available')}`)
    }
  }

  if (topic === 'hd_gates' || topic === 'hd_full' || topic === 'all') {
    const gates = hd.hdActivatedGates ?? []
    if (gates.length) {
      lines.push(`● ${t('PORTES ACTIVES', 'ACTIVATED GATES')} : ${gates.slice(0, 15).join(', ')}`)
    } else {
      lines.push(`● ${t('PORTES ACTIVES', 'ACTIVATED GATES')} : ${t('non disponible', 'not available')}`)
    }
  }

  if (topic === 'hd_type' || topic === 'hd_full' || topic === 'all') {
    if (hd.hdType) lines.push(`● ${t('TYPE', 'TYPE')} : ${hd.hdType}`)
    if (hd.hdStrategy) lines.push(`● ${t('STRATÉGIE', 'STRATEGY')} : ${hd.hdStrategy}`)
    if (hd.hdSignature) lines.push(`● ${t('SIGNATURE', 'SIGNATURE')} : ${hd.hdSignature}`)
    if (hd.hdNotSelfTheme) lines.push(`● ${t('THÈME NON-SOI', 'NOT-SELF THEME')} : ${hd.hdNotSelfTheme}`)
  }

  if (topic === 'hd_authority' || topic === 'hd_full' || topic === 'all') {
    if (hd.hdAuthority) lines.push(`● ${t('AUTORITÉ', 'AUTHORITY')} : ${hd.hdAuthority}`)
  }

  if (topic === 'hd_profile' || topic === 'hd_full' || topic === 'all') {
    if (hd.hdProfile) lines.push(`● ${t('PROFIL', 'PROFILE')} : ${hd.hdProfile}`)
  }

  if (topic === 'hd_full' || topic === 'all') {
    if (hd.hdDefinition) lines.push(`● ${t('DÉFINITION', 'DEFINITION')} : ${hd.hdDefinition}`)
    if (hd.hdIncarnationCross) lines.push(`● ${t("CROIX D'INCARNATION", 'INCARNATION CROSS')} : ${hd.hdIncarnationCross}`)
  }

  return lines.join('\n')
}

function buildEnneagramBlock(raw: Record<string, unknown>, isFr: boolean): string {
  const merged: Record<string, unknown> = {
    ...((raw.enneagram ?? {}) as object),
    ...raw,
  }

  const typeVal = safeStr(pick(merged, 'type_enn', 'enneagram_type', 'ennType', 'type', 'enneagramType'))
  const wing = safeStr(pick(merged, 'wing', 'aile', 'aile_enn', 'enneagramWing'))
  const isHeuristic = !!(merged.is_heuristic || merged.isHeuristic)
  const t = (fr: string, en: string) => (isFr ? fr : en)

  const lines: string[] = [t('DONNÉES ENNÉAGRAMME', 'ENNEAGRAM DATA')]

  if (typeVal) {
    lines.push(`● ${t('TYPE', 'TYPE')} : ${typeVal}${isHeuristic ? ` (${t('estimé', 'estimated')})` : ''}`)
  } else {
    lines.push(`● ${t('TYPE', 'TYPE')} : ${t('non disponible', 'not available')}`)
  }

  if (wing) lines.push(`● ${t('AILE', 'WING')} : ${wing}`)
  if (isHeuristic) {
    lines.push(`⚠ ${t('Données heuristiques — moins fiables que les autres sciences', 'Heuristic data — less reliable than other sciences')}`)
  }

  return lines.join('\n')
}

function buildKuaBlock(raw: Record<string, unknown>, isFr: boolean): string {
  const merged = mergeFusionExactSectionWithLegacy(raw, 'kuaDirections', LEGACY_KUA_KEYS)

  const kuaNumber = safeStr(pick(merged, 'kua', 'kua_number', 'nombre_kua', 'kuaNumber', 'kua_num'))
  const goodDirs = safeArr(pick(merged, 'good_directions', 'directions_favorables', 'favorable_directions', 'best_directions'))
  const badDirs = safeArr(pick(merged, 'bad_directions', 'directions_defavorables', 'unfavorable_directions'))
  const element = safeStr(pick(merged, 'element', 'kua_element'))
  const group = safeStr(pick(merged, 'group', 'groupe', 'kua_group'))
  const t = (fr: string, en: string) => (isFr ? fr : en)

  const lines: string[] = [t('DONNÉES KUA', 'KUA DATA')]

  if (kuaNumber) {
    lines.push(`● ${t('NOMBRE KUA', 'KUA NUMBER')} : ${kuaNumber}`)
  } else {
    lines.push(`● ${t('NOMBRE KUA', 'KUA NUMBER')} : ${t('non disponible', 'not available')}`)
  }

  if (goodDirs.length) {
    lines.push(`● ${t('DIRECTIONS FAVORABLES', 'FAVORABLE DIRECTIONS')} : ${goodDirs.join(', ')}`)
  }
  if (badDirs.length) {
    lines.push(`● ${t('DIRECTIONS À ÉVITER', 'DIRECTIONS TO AVOID')} : ${badDirs.join(', ')}`)
  }
  if (element) lines.push(`● ${t('ÉLÉMENT', 'ELEMENT')} : ${element}`)
  if (group) lines.push(`● ${t('GROUPE', 'GROUP')} : ${group}`)

  return lines.join('\n')
}

function buildNumerologyBlock(raw: Record<string, unknown>, isFr: boolean): string {
  const merged = mergeFusionExactSectionWithLegacy(raw, 'numerologyCycles', LEGACY_NUMEROLOGY_KEYS)

  const lifePath = safeStr(pick(merged, 'chemin_de_vie', 'life_path', 'lifePath', 'cheminVie', 'lifePathNumber'))
  const personalYear = safeStr(pick(merged, 'annee_personnelle', 'personal_year', 'personalYear', 'yearNumber'))
  const personalMonth = safeStr(pick(merged, 'mois_personnel', 'personal_month', 'personalMonth'))
  const expression = safeStr(pick(merged, 'expression', 'nombre_expression', 'expressionNumber'))
  const t = (fr: string, en: string) => (isFr ? fr : en)

  const lines: string[] = [t('DONNÉES NUMÉROLOGIE', 'NUMEROLOGY DATA')]

  if (lifePath) {
    lines.push(`● ${t('CHEMIN DE VIE', 'LIFE PATH')} : ${lifePath}`)
  } else {
    lines.push(`● ${t('CHEMIN DE VIE', 'LIFE PATH')} : ${t('non disponible', 'not available')}`)
  }
  if (personalYear) lines.push(`● ${t('ANNÉE PERSONNELLE', 'PERSONAL YEAR')} : ${personalYear}`)
  if (personalMonth) lines.push(`● ${t('MOIS PERSONNEL', 'PERSONAL MONTH')} : ${personalMonth}`)
  if (expression) lines.push(`● ${t('NOMBRE EXPRESSION', 'EXPRESSION NUMBER')} : ${expression}`)

  return lines.join('\n')
}

function buildAstroBlock(raw: Record<string, unknown>, topic: DirectTopic, isFr: boolean): string {
  try {
    const ctx = buildCompactNatalReadingContext(raw, 2000)
    const t = (fr: string, en: string) => (isFr ? fr : en)
    const lines: string[] = [t('DONNÉES ASTROLOGIE', 'ASTROLOGY DATA')]

    if (ctx.sunSign) lines.push(`● ${t('SIGNE SOLAIRE', 'SUN SIGN')} : ${ctx.sunSign}`)
    if (ctx.moonSign) lines.push(`● ${t('SIGNE LUNAIRE', 'MOON SIGN')} : ${ctx.moonSign}`)
    if (ctx.risingSign) lines.push(`● ${t('ASCENDANT', 'RISING SIGN')} : ${ctx.risingSign}`)

    if (topic === 'astro_full' || topic === 'all') {
      if (ctx.venusSign) lines.push(`● ${t('VÉNUS', 'VENUS')} : ${ctx.venusSign}`)
      if (ctx.marsSign) lines.push(`● ${t('MARS', 'MARS')} : ${ctx.marsSign}`)
      if (ctx.mercurySign) lines.push(`● ${t('MERCURE', 'MERCURY')} : ${ctx.mercurySign}`)
      if (ctx.jupiterSign) lines.push(`● ${t('JUPITER', 'JUPITER')} : ${ctx.jupiterSign}`)
      if (ctx.saturnSign) lines.push(`● ${t('SATURNE', 'SATURN')} : ${ctx.saturnSign}`)
    }

    if (!lines.some((l) => l.startsWith('●'))) {
      lines.push(`● ${t('Données astrologiques non disponibles', 'Astrology data not available')}`)
    }

    return lines.join('\n')
  } catch {
    return isFr ? 'DONNÉES ASTROLOGIE\n● non disponible' : 'ASTROLOGY DATA\n● not available'
  }
}

// ── Constructeur principal ────────────────────────────────────────────────────

/**
 * Construit un bloc de données factuelles formaté pour injection dans le prompt.
 *
 * @param raw       Payload brute de /chart/fusion
 * @param topic     Topic détecté par detectDirectTopic()
 * @param firstName Prénom de l'utilisateur (optionnel)
 * @param lang      Langue ('fr' ou 'en')
 */
export function buildDirectKnowledgeBlock(
  raw: Record<string, unknown>,
  topic: DirectTopic,
  firstName: string | null,
  lang: string,
): string {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const t = (fr: string, en: string) => (isFr ? fr : en)

  const header = firstName
    ? `${t('DONNÉES DIRECTES POUR', 'DIRECT DATA FOR')} ${firstName.toUpperCase()}`
    : t('DONNÉES DIRECTES', 'DIRECT DATA')

  let dataBlock = ''

  // HD topics
  if (
    topic === 'hd_channels' ||
    topic === 'hd_centers' ||
    topic === 'hd_gates' ||
    topic === 'hd_type' ||
    topic === 'hd_authority' ||
    topic === 'hd_profile' ||
    topic === 'hd_full'
  ) {
    dataBlock = buildHDTopicBlock(raw, topic, isFr)
  } else if (topic === 'enneagram') {
    dataBlock = buildEnneagramBlock(raw, isFr)
  } else if (topic === 'kua') {
    dataBlock = buildKuaBlock(raw, isFr)
  } else if (topic === 'numerology') {
    dataBlock = buildNumerologyBlock(raw, isFr)
  } else if (topic === 'astro_basics' || topic === 'astro_full') {
    dataBlock = buildAstroBlock(raw, topic, isFr)
  } else {
    // topic === 'all' : toutes les données disponibles
    const blocks: string[] = []
    const hdBlock = buildHDTopicBlock(raw, 'hd_full', isFr)
    if (hdBlock) blocks.push(hdBlock)
    const astroBlock = buildAstroBlock(raw, 'astro_full', isFr)
    if (astroBlock) blocks.push(astroBlock)
    const numeBlock = buildNumerologyBlock(raw, isFr)
    if (numeBlock) blocks.push(numeBlock)
    const ennBlock = buildEnneagramBlock(raw, isFr)
    if (ennBlock) blocks.push(ennBlock)
    const kuaBlock = buildKuaBlock(raw, isFr)
    if (kuaBlock) blocks.push(kuaBlock)
    dataBlock = blocks.join('\n\n')
  }

  return [`── ${header} ──`, dataBlock].filter(Boolean).join('\n')
}

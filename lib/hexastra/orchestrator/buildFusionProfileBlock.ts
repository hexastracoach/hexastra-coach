/**
 * buildFusionProfileBlock — Hexastra Coach
 *
 * Builds a multi-science profile block from the Railway /chart/fusion raw response.
 * Used for fusion_answer readings: injects real profile data from all 5 sciences
 * so the AI can produce a personalized, non-generic response.
 *
 * Output format:
 *   PROFIL FUSIONNÉ [NOM] — SOURCE DE VÉRITÉ POUR CETTE LECTURE:
 *   [Astrologie] ...
 *   [Human Design] ...
 *   [Numérologie] ...
 *   [Ennéagramme] ...
 *   [Kua] ...
 *
 *   SYNTHÈSE MULTI-SCIENCES (base de raisonnement obligatoire):
 *   ...2-4 sentences describing the cross-science pattern and inner gap...
 */

import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'
import { buildCompactHumanDesignContext } from '@/lib/humandesign/compactContext'

// ── Types ──────────────────────────────────────────────────────────────────────

export type FusionProfileBlock = {
  astro: string | null
  humanDesign: string | null
  numerology: string | null
  enneagram: string | null
  kua: string | null
  fusionSummary: string
  fullBlock: string
  sciences: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function mergeNested(raw: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const key of keys) {
    const nested = raw[key]
    if (nested && typeof nested === 'object') {
      Object.assign(merged, nested)
    }
  }
  Object.assign(merged, raw)
  return merged
}

function findValue(source: Record<string, unknown>, ...aliases: string[]): string | number | null {
  for (const alias of aliases) {
    const v = source[alias]
    if (v !== undefined && v !== null && v !== '') return v as string | number
  }
  return null
}

// ── Element inference ──────────────────────────────────────────────────────────

const FIRE_SIGNS = new Set(['bélier', 'lion', 'sagittaire', 'aries', 'leo', 'sagittarius'])
const AIR_SIGNS = new Set(['gémeaux', 'balance', 'verseau', 'gemini', 'libra', 'aquarius'])
const WATER_SIGNS = new Set(['cancer', 'scorpion', 'poissons', 'scorpio', 'pisces'])
const EARTH_SIGNS = new Set(['taureau', 'vierge', 'capricorne', 'taurus', 'virgo', 'capricorn'])

function getElement(sign: string | null | undefined): 'fire' | 'air' | 'water' | 'earth' | null {
  if (!sign) return null
  const d = deaccent(sign)
  if (FIRE_SIGNS.has(d)) return 'fire'
  if (AIR_SIGNS.has(d)) return 'air'
  if (WATER_SIGNS.has(d)) return 'water'
  if (EARTH_SIGNS.has(d)) return 'earth'
  return null
}

// ── Science extractors ─────────────────────────────────────────────────────────

function extractAstroSummary(raw: Record<string, unknown>): string | null {
  try {
    const ctx = buildCompactNatalReadingContext(raw, 1600)
    const parts: string[] = []

    if (ctx.sunSign) parts.push(`Soleil ${ctx.sunSign}${ctx.sunDegree != null ? ` (${ctx.sunDegree}°)` : ''}`)
    if (ctx.moonSign) parts.push(`Lune ${ctx.moonSign}`)
    if (ctx.risingSign) parts.push(`Ascendant ${ctx.risingSign}`)
    if (ctx.mercurySign) parts.push(`Mercure ${ctx.mercurySign}`)
    if (ctx.venusSign) parts.push(`Vénus ${ctx.venusSign}`)
    if (ctx.marsSign) parts.push(`Mars ${ctx.marsSign}`)

    if (ctx.dominantElements?.length) parts.push(`Éléments dominants: ${ctx.dominantElements.join(', ')}`)
    if (ctx.dominantModalities?.length) parts.push(`Modalités: ${ctx.dominantModalities.join(', ')}`)
    if (ctx.stelliums?.length) parts.push(`Stellium(s): ${ctx.stelliums.join(', ')}`)

    return parts.length > 0 ? parts.join(' | ') : null
  } catch {
    return null
  }
}

function extractHDSummary(raw: Record<string, unknown>): string | null {
  try {
    const ctx = buildCompactHumanDesignContext(raw)
    if (!ctx) return null
    const parts: string[] = []

    if (ctx.hdType) parts.push(`Type: ${ctx.hdType}`)
    if (ctx.hdProfile) parts.push(`Profil: ${ctx.hdProfile}`)
    if (ctx.hdAuthority) parts.push(`Autorité: ${ctx.hdAuthority}`)
    if (ctx.hdStrategy) parts.push(`Stratégie: ${ctx.hdStrategy}`)
    if (ctx.hdDefinition) parts.push(`Définition: ${ctx.hdDefinition}`)
    if (ctx.hdIncarnationCross) parts.push(`Croix: ${ctx.hdIncarnationCross}`)
    if (ctx.hdDefinedCenters?.length) parts.push(`Centres définis: ${ctx.hdDefinedCenters.join(', ')}`)

    return parts.length > 0 ? parts.join(' | ') : null
  } catch {
    return null
  }
}

function extractNumerologySummary(raw: Record<string, unknown>): string | null {
  const src = mergeNested(raw, 'numerology', 'numerologie', 'numbers')
  const parts: string[] = []

  const lifePath = findValue(src, 'chemin_de_vie', 'life_path', 'lifePath', 'lifePathNumber', 'cheminVie')
  if (lifePath != null) parts.push(`Chemin de vie: ${lifePath}`)

  const expression = findValue(src, 'expression', 'expression_number', 'expressionNumber')
  if (expression != null) parts.push(`Expression: ${expression}`)

  const soul = findValue(src, 'ame', 'soul', 'soul_number', 'soulNumber')
  if (soul != null) parts.push(`Âme: ${soul}`)

  const personality = findValue(src, 'personnalite_num', 'personality', 'personality_number')
  if (personality != null) parts.push(`Personnalité: ${personality}`)

  const personalYear = findValue(src, 'annee_personnelle', 'personal_year', 'personalYear')
  if (personalYear != null) parts.push(`Année personnelle: ${personalYear}`)

  const personalMonth = findValue(src, 'mois_personnel', 'personal_month', 'personalMonth')
  if (personalMonth != null) parts.push(`Mois personnel: ${personalMonth}`)

  return parts.length > 0 ? parts.join(' | ') : null
}

function extractEnneagramSummary(raw: Record<string, unknown>): string | null {
  const src = mergeNested(raw, 'enneagram', 'enneagramme')
  const parts: string[] = []

  const type = findValue(src, 'type_enn', 'type', 'enneagram_type')
  if (type != null) parts.push(`Type: ${type}`)

  const wing = findValue(src, 'aile_enn', 'wing', 'enneagram_wing', 'aile')
  if (wing != null) parts.push(`Aile: ${wing}`)

  const instinct = findValue(src, 'instinct_enn', 'instinct', 'instinctual_variant')
  if (instinct != null) parts.push(`Instinct: ${instinct}`)

  return parts.length > 0 ? parts.join(' | ') : null
}

function extractKuaSummary(raw: Record<string, unknown>): string | null {
  const src = mergeNested(raw, 'kua')
  const parts: string[] = []

  const kua = findValue(src, 'nombre_kua', 'kua', 'kua_number', 'numero_kua')
  if (kua != null) parts.push(`Kua: ${kua}`)

  const directions = findValue(src, 'direction_kua', 'directions', 'favorable_directions')
  if (directions != null) parts.push(`Directions favorables: ${directions}`)

  return parts.length > 0 ? parts.join(' | ') : null
}

// ── Synthesis builder ──────────────────────────────────────────────────────────

type SynthesisParams = {
  hdType: string | null
  hdAuthority: string | null
  hdStrategy: string | null
  sunSign: string | null
  moonSign: string | null
  mercurySign: string | null
  lifePath: number | string | null
  enneagramType: number | string | null
  enneagramWing: number | string | null
  lang: string
}

const HD_TYPE_PATTERNS: Record<string, { fr: string; en: string }> = {
  'manifesting generator': {
    fr: 'fonctionne avec une énergie rapide et multi-directionnelle, tend à sauter des étapes que les autres n\'ont pas encore franchies',
    en: 'operates with fast multi-directional energy, tends to skip steps others haven\'t taken yet',
  },
  'manifestor': {
    fr: 'initie et agit sans toujours informer, ce qui peut créer des résistances ou de la confusion dans son sillage',
    en: 'initiates and acts without always informing others, which can create resistance or confusion',
  },
  'generator': {
    fr: 'dispose d\'une énergie stable et constante, mais peut répondre trop vite avant d\'avoir vraiment écouté',
    en: 'has stable consistent energy but may respond too fast before truly listening',
  },
  'projector': {
    fr: 'fonctionne sur le mode de la reconnaissance — sans invitation, son énergie et ses insights passent souvent inaperçus',
    en: 'operates on recognition — without invitation, their energy and insights often go unnoticed',
  },
  'reflector': {
    fr: 'absorbe et reflète l\'environnement, a besoin de temps pour discerner — souvent incompris dans sa lenteur délibérée',
    en: 'absorbs and reflects the environment, needs time to discern — often misunderstood in their deliberate pace',
  },
}

const ELEMENT_PATTERNS: Record<string, { fr: string; en: string }> = {
  fire: {
    fr: 'son expression naturelle est directe, vive, parfois perçue comme trop intense ou prématurée',
    en: 'natural expression is direct and vivid, sometimes perceived as too intense or premature',
  },
  air: {
    fr: 'sa pensée est rapide et sautillante, ce qui peut dérouter les interlocuteurs cherchant plus de linéarité',
    en: 'thinking is fast and jumping, which can disorient people seeking more linearity',
  },
  water: {
    fr: 'ressent profondément et perçoit les sous-textes — sa profondeur émotionnelle peut sembler difficile d\'accès ou trop intense',
    en: 'feels deeply and picks up subtexts — emotional depth can seem hard to access or too intense',
  },
  earth: {
    fr: 'ancré et pragmatique, peut paraître peu expressif ou difficilement mobilisable émotionnellement',
    en: 'grounded and pragmatic, can seem unexpressive or hard to mobilize emotionally',
  },
}

const LIFE_PATH_PATTERNS: Record<number, { fr: string; en: string }> = {
  1: { fr: 'sa dynamique de fond est celle d\'un leader naturel qui cherche à tracer sa propre voie — ce qui peut intimider ou sembler peu collaboratif', en: 'underlying drive is a natural leader seeking their own path — can feel intimidating or non-collaborative' },
  2: { fr: 'a besoin d\'harmonie et de coopération — peut avoir du mal à s\'affirmer clairement et être vu comme hésitant', en: 'needs harmony and cooperation — may struggle to assert clearly and be seen as hesitant' },
  3: { fr: 'sa créativité et son expressivité naturelles le poussent vers la communication — mais peut manquer de structure, ce qui disperse l\'attention', en: 'natural creativity and expressivity push toward communication — but may lack structure, dispersing attention' },
  4: { fr: 'cherche la structure et la stabilité — peut sembler trop rigide ou lent à s\'adapter aux changements', en: 'seeks structure and stability — can seem too rigid or slow to adapt' },
  5: { fr: 'moteur de liberté et d\'exploration — son imprévisibilité peut déstabiliser l\'entourage', en: 'driven by freedom and exploration — unpredictability can destabilize those around them' },
  6: { fr: 'porte un sens fort de la responsabilité et du soin — peut s\'imposer des standards inaccessibles aux autres', en: 'carries strong responsibility and care — may impose standards others can\'t match' },
  7: { fr: 'analytique et introspectif — peut sembler distant, difficile à rejoindre dans son monde intérieur', en: 'analytical and introspective — can seem distant, hard to reach in their inner world' },
  8: { fr: 'autorité naturelle et ambition — peut être perçu comme dominant ou imposant même sans le vouloir', en: 'natural authority and ambition — can be perceived as dominant or imposing even unintentionally' },
  9: { fr: 'vision large, empathie profonde — peut se perdre dans la complexité au détriment de la clarté immédiate', en: 'broad vision, deep empathy — can get lost in complexity at the expense of immediate clarity' },
  11: { fr: 'sensibilité et vision aiguë — souvent en décalage avec le rythme et la compréhension de son entourage proche', en: 'acute sensitivity and vision — often out of step with the pace and understanding of close environment' },
  22: { fr: 'architecte de grandes structures — son ambition et son niveau d\'exigence peuvent isoler', en: 'architect of large structures — ambition and high standards can isolate' },
  33: { fr: 'dévotion et enseignement — peut s\'épuiser à vouloir tout porter et tout transformer', en: 'devotion and teaching — can exhaust themselves trying to carry and transform everything' },
}

function buildFusionSynthesis(params: SynthesisParams): string {
  const isFr = (params.lang ?? 'fr').slice(0, 2).toLowerCase() !== 'en'
  const sentences: string[] = []

  // Layer 1: HD type pattern
  const hdTypeLower = deaccent(params.hdType ?? '')
  let hdPattern: { fr: string; en: string } | null = null
  for (const [key, val] of Object.entries(HD_TYPE_PATTERNS)) {
    if (hdTypeLower.includes(key)) { hdPattern = val; break }
  }

  // Layer 2: Solar element pattern
  const sunElement = getElement(params.sunSign)
  const elementPattern = sunElement ? ELEMENT_PATTERNS[sunElement] : null

  // Layer 3: Life path pattern
  const lpNum = typeof params.lifePath === 'string' ? parseInt(params.lifePath, 10) : (params.lifePath ?? null)
  const lpPattern = lpNum && !isNaN(lpNum) ? LIFE_PATH_PATTERNS[lpNum] : null

  // Combine into 2–4 sentences
  if (hdPattern && elementPattern) {
    if (isFr) {
      sentences.push(
        `Cette personne ${hdPattern.fr}, et ${elementPattern.fr}.`
      )
    } else {
      sentences.push(
        `This person ${hdPattern.en}, and ${elementPattern.en}.`
      )
    }
  } else if (hdPattern) {
    sentences.push(isFr ? `Cette personne ${hdPattern.fr}.` : `This person ${hdPattern.en}.`)
  } else if (elementPattern) {
    sentences.push(isFr ? `Solaire: ${elementPattern.fr}.` : `Solar: ${elementPattern.en}.`)
  }

  if (lpPattern) {
    sentences.push(isFr ? `En profondeur: ${lpPattern.fr}.` : `Deeper drive: ${lpPattern.en}.`)
  }

  // Cross-science gap sentence
  if (sentences.length > 0) {
    if (isFr) {
      sentences.push('Ce décalage entre le rythme intérieur et la réception extérieure est le fil conducteur de cette lecture.')
    } else {
      sentences.push('This gap between inner pace and external reception is the thread running through this reading.')
    }
  }

  if (sentences.length === 0) {
    return isFr
      ? 'Profil disponible — utilise les données ci-dessus pour ancrer chaque bloc de la lecture dans le fonctionnement réel de cette personne.'
      : 'Profile available — use the data above to ground each block of the reading in this person\'s actual functioning.'
  }

  return sentences.join('\n')
}

// ── Main builder ───────────────────────────────────────────────────────────────

/**
 * Build a multi-science profile block from Railway /chart/fusion raw data.
 *
 * @param raw      Raw Railway response
 * @param lang     'fr' | 'en'
 * @param firstName Optional first name for personalization
 */
export function buildFusionProfileBlock(
  raw: Record<string, unknown>,
  lang = 'fr',
  firstName?: string | null,
): FusionProfileBlock {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const astro = extractAstroSummary(raw)
  const humanDesign = extractHDSummary(raw)
  const numerology = extractNumerologySummary(raw)
  const enneagram = extractEnneagramSummary(raw)
  const kua = extractKuaSummary(raw)
  const sciences: string[] = []

  // Get HD params for synthesis
  let hdType: string | null = null
  let hdAuthority: string | null = null
  let hdStrategy: string | null = null
  try {
    const hdCtx = buildCompactHumanDesignContext(raw)
    hdType = hdCtx?.hdType ?? null
    hdAuthority = hdCtx?.hdAuthority ?? null
    hdStrategy = hdCtx?.hdStrategy ?? null
  } catch { /* ignore */ }

  // Get astro params for synthesis
  let sunSign: string | null = null
  let moonSign: string | null = null
  let mercurySign: string | null = null
  try {
    const astroCtx = buildCompactNatalReadingContext(raw, 800)
    sunSign = astroCtx.sunSign
    moonSign = astroCtx.moonSign
    mercurySign = astroCtx.mercurySign
  } catch { /* ignore */ }

  // Get numerology life path for synthesis
  const numeRaw = mergeNested(raw, 'numerology', 'numerologie', 'numbers')
  const lifePath = findValue(numeRaw, 'chemin_de_vie', 'life_path', 'lifePath', 'lifePathNumber', 'cheminVie')

  // Get enneagram type for synthesis
  const ennRaw = mergeNested(raw, 'enneagram', 'enneagramme')
  const enneagramType = findValue(ennRaw, 'type_enn', 'type', 'enneagram_type')
  const enneagramWing = findValue(ennRaw, 'aile_enn', 'wing', 'enneagram_wing', 'aile')

  const fusionSummary = buildFusionSynthesis({
    hdType,
    hdAuthority,
    hdStrategy,
    sunSign,
    moonSign,
    mercurySign,
    lifePath,
    enneagramType,
    enneagramWing,
    lang,
  })

  // Build the full block
  const nameTag = firstName ? ` — ${firstName.toUpperCase()}` : ''
  const header = isFr
    ? `PROFIL FUSIONNÉ${nameTag} — SOURCE DE VÉRITÉ POUR CETTE LECTURE:`
    : `FUSED PROFILE${nameTag} — SOURCE OF TRUTH FOR THIS READING:`

  const lines: string[] = [header]

  if (astro) {
    sciences.push('astrology')
    lines.push(isFr ? `[Astrologie] ${astro}` : `[Astrology] ${astro}`)
  }
  if (humanDesign) {
    sciences.push('human_design')
    lines.push(`[Human Design] ${humanDesign}`)
  }
  if (numerology) {
    sciences.push('numerology')
    lines.push(isFr ? `[Numérologie] ${numerology}` : `[Numerology] ${numerology}`)
  }
  if (enneagram) {
    sciences.push('enneagram')
    lines.push(isFr ? `[Ennéagramme] ${enneagram}` : `[Enneagram] ${enneagram}`)
  }
  if (kua) {
    sciences.push('kua')
    lines.push(`[Kua] ${kua}`)
  }

  const synthLabel = isFr
    ? 'SYNTHÈSE MULTI-SCIENCES (base de raisonnement obligatoire pour ancrer la réponse):'
    : 'MULTI-SCIENCE SYNTHESIS (mandatory reasoning base to ground the response):'

  lines.push('')
  lines.push(synthLabel)
  lines.push(fusionSummary)

  const rules = isFr
    ? [
        '',
        'RÈGLES D\'UTILISATION:',
        '- Utilise cette synthèse comme fil directeur pour chaque bloc de la réponse.',
        '- Ne jamais produire de conseils génériques non reliés à ces données.',
        '- Chaque bloc doit contenir au moins un lien explicite avec le fonctionnement réel de la personne.',
        '- Interdiction d\'inventer des valeurs absentes de ce bloc.',
      ]
    : [
        '',
        'USAGE RULES:',
        '- Use this synthesis as the guiding thread for each block of the response.',
        '- Never produce generic advice not linked to this data.',
        '- Each block must contain at least one explicit link to this person\'s actual functioning.',
        '- Never invent values absent from this block.',
      ]

  lines.push(...rules)

  return {
    astro,
    humanDesign,
    numerology,
    enneagram,
    kua,
    fusionSummary,
    fullBlock: lines.join('\n'),
    sciences,
  }
}

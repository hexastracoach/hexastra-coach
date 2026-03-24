/**
 * Exact Data Guard - Hexastra Coach
 *
 * Deterministic guards for exact-data routes. For astrology exact reads,
 * the compact natal block must stay pinned to the validated tropical source.
 */

import { normalizeAstroSign, resolveStrictAstroContext, type CoreAstroPlacement } from './extractCoreAstro'

/** All subcategory keys where deterministic API data is mandatory */
export const EXACT_DATA_REQUIRED_SUBCATEGORIES = new Set<string>([
  'ascendant',
  'theme_natal',
  'maisons',
  'signe_lunaire',
  'planetes',
  'transits',
  'aspects',
  'cycle',
  'retrograde',
  'chemin_de_vie',
  'expression',
  'ame',
  'personnalite_num',
  'annee_personnelle',
  'mois_personnel',
  'jour_personnel',
  'human_design_exact',
  'type_hd',
  'strategie_hd',
  'autorite_hd',
  'profil_hd',
  'centres_hd',
  'portes_hd',
  'canaux_hd',
  'croix_incarnation',
  'definition_hd',
  'transits_hd',
  'nombre_kua',
  'direction_kua',
  'orientation_habitat',
  'orientation_bureau',
  'direction_sommeil',
  'type_enn',
  'aile_enn',
])

/** Whether a subcategory requires exact calculated API data */
export function requiresExactData(subcategory: string | null | undefined): boolean {
  if (!subcategory) return false
  return EXACT_DATA_REQUIRED_SUBCATEGORIES.has(subcategory)
}

/** Whether a specializedResult contains actual resolved data (not a fallback) */
export function hasResolvedExactData(specializedResult: {
  raw: Record<string, unknown> | null
  publicSummary?: string
} | null | undefined): boolean {
  if (!specializedResult) return false
  if (specializedResult.raw === null || specializedResult.raw === undefined) return false
  return Object.keys(specializedResult.raw).length > 0
}

/** Format available raw data as a structured fact block for the system prompt. */
export function formatExactDataBlock(raw: Record<string, unknown>): string {
  const lines: string[] = ['DONNEES EXACTES CALCULEES (source de verite - ne jamais completer par invention):']

  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined || value === '') continue
    const formattedKey = key.replace(/_/g, ' ').toUpperCase()
    const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    lines.push(`- ${formattedKey}: ${formattedValue}`)
  }

  return lines.join('\n')
}

const PRIORITY_EXACT_KEYS = new Set([
  'sun', 'moon', 'ascendant', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron',
  'soleil', 'lune', 'mercure', 'mars_planet',
  'houses', 'maisons', 'house_cusps',
  'aspects', 'aspects_principaux', 'major_aspects',
  'dominant_signs', 'dominant_elements', 'dominant_modalities',
  'stelliums', 'chart_shape',
  'transits', 'current_transits', 'transits_actifs',
  'chemin_de_vie', 'life_path', 'expression', 'ame', 'soul',
  'annee_personnelle', 'personal_year', 'mois_personnel', 'personal_month',
  'type_hd', 'hd_type', 'type', 'autorite_hd', 'authority',
  'profil_hd', 'profile', 'centres_hd', 'defined_centers',
  'croix_incarnation', 'incarnation_cross',
  'nombre_kua', 'kua_number', 'kua', 'direction_kua',
  'publicsummary', 'publicSummary', 'summary', 'synthese', 'synthesis',
  'reading', 'interpretation', 'bilan',
])

/** Capped version of formatExactDataBlock. */
export function formatExactDataBlockCapped(
  raw: Record<string, unknown>,
  maxChars = 4000,
): string {
  const header = 'DONNEES EXACTES CALCULEES (source de verite - ne jamais completer par invention):'
  const lines: string[] = [header]

  const entries = Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== '')
  const priority = entries.filter(([k]) => PRIORITY_EXACT_KEYS.has(k) || PRIORITY_EXACT_KEYS.has(k.toLowerCase()))
  const secondary = entries.filter(([k]) => !PRIORITY_EXACT_KEYS.has(k) && !PRIORITY_EXACT_KEYS.has(k.toLowerCase()))

  for (const [key, value] of [...priority, ...secondary]) {
    const formattedKey = key.replace(/_/g, ' ').toUpperCase()
    let formattedValue: string
    if (typeof value === 'object') {
      const json = JSON.stringify(value)
      formattedValue = json.length > 400 ? `${json.slice(0, 400)}...` : json
    } else {
      formattedValue = String(value)
    }

    lines.push(`- ${formattedKey}: ${formattedValue}`)
    if (lines.join('\n').length >= maxChars) {
      lines.push(`...[${entries.length - lines.length + 1} champs supplementaires disponibles - non affiches pour limiter le contexte]`)
      break
    }
  }

  return lines.join('\n')
}

export type CompactNatalContext = {
  sunSign: string | null
  sunDegree: number | null
  moonSign: string | null
  moonDegree: number | null
  risingSign: string | null
  risingDegree: number | null
  risingRaw?: CoreAstroPlacement | null
  mercurySign: string | null
  venusSign: string | null
  marsSign: string | null
  jupiterSign: string | null
  saturnSign: string | null
  dominantSigns: string[]
  dominantElements: string[]
  dominantModalities: string[]
  stelliums: string[]
  keyAspects: string[]
  dominantHouses: string[]
  chartShape: string | null
  natalSummarySeeds: string[]
  fieldSources: Partial<Record<'sun' | 'moon' | 'ascendant' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn', string>>
  missingFields: string[]
  compactDataBlock: string
}

export type AstroExactRenderValidation = {
  valid: boolean
  violations: string[]
}

export type AstroExactRenderEnforcementResult = {
  message: string
  validation: AstroExactRenderValidation
  usedFallback: boolean
  fallbackType: 'astro_exact_local' | 'astro_exact_simple_local' | null
}

function extractStr(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function extractList(obj: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const value = obj[key]
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') return JSON.stringify(item).slice(0, 100)
          return null
        })
        .filter(Boolean) as string[]
    }

    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }

  return []
}

function appendCompactLine(lines: string[], line: string, maxChars: number): boolean {
  if (lines.join('\n').length + line.length >= maxChars) {
    lines.push('...[donnees exactes supplementaires disponibles - non affichees pour limiter le contexte]')
    return false
  }

  lines.push(line)
  return true
}

function formatValidatedSign(sign: string | null, degree: number | null): string {
  if (!sign) return 'indisponible'
  return degree !== null ? `${sign} (${degree}°)` : sign
}

function buildPlacementLine(label: string, sign: string | null, degree: number | null): string {
  return `- ${label}: ${formatValidatedSign(sign, degree)}`
}

function normalizeRenderedSignToken(raw: string): string | null {
  return normalizeAstroSign(raw)
}

function normalizeAstroValidationText(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type AstroPlanetKey =
  | 'sun'
  | 'moon'
  | 'ascendant'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'

const ASTRO_PLANET_REFERENCES: Array<{ key: AstroPlanetKey; tokens: string[] }> = [
  { key: 'sun', tokens: ['soleil', 'sun', 'signe solaire', 'sun sign'] },
  { key: 'moon', tokens: ['lune', 'moon', 'signe lunaire', 'moon sign'] },
  { key: 'ascendant', tokens: ['ascendant', 'rising', 'rising sign'] },
  { key: 'mercury', tokens: ['mercure', 'mercury'] },
  { key: 'venus', tokens: ['venus'] },
  { key: 'mars', tokens: ['mars'] },
  { key: 'jupiter', tokens: ['jupiter'] },
  { key: 'saturn', tokens: ['saturne', 'saturn'] },
]

const ASTRO_ASPECT_REFERENCES: Array<{ key: string; tokens: string[] }> = [
  { key: 'conjunction', tokens: ['conjunction', 'conjonction', 'conjunct'] },
  { key: 'opposition', tokens: ['opposition', 'oppose'] },
  { key: 'trine', tokens: ['trine', 'trigone'] },
  { key: 'square', tokens: ['square', 'carre'] },
  { key: 'sextile', tokens: ['sextile'] },
  { key: 'quincunx', tokens: ['quincunx', 'quinconce'] },
]

function containsToken(text: string, token: string): boolean {
  const pattern = token
    .split(/\s+/)
    .map((part) => escapeRegExp(part))
    .join('\\s+')
  return new RegExp(`\\b${pattern}\\b`, 'i').test(text)
}

function extractAspectToken(raw: string): string | null {
  const text = normalizeAstroValidationText(raw)
  const aspect = ASTRO_ASPECT_REFERENCES.find((entry) =>
    entry.tokens.some((token) => containsToken(text, token)),
  )?.key

  const planets = ASTRO_PLANET_REFERENCES
    .filter((entry) => entry.tokens.some((token) => containsToken(text, token)))
    .map((entry) => entry.key)
  const uniquePlanets = Array.from(new Set(planets)).sort()

  if (!aspect || uniquePlanets.length < 2) return null

  return `${aspect}:${uniquePlanets[0]}:${uniquePlanets[1]}`
}

function buildPlanetValueMap(ctx: CompactNatalContext): Record<AstroPlanetKey, string | null> {
  return {
    sun: ctx.sunSign,
    moon: ctx.moonSign,
    ascendant: ctx.risingSign,
    mercury: ctx.mercurySign,
    venus: ctx.venusSign,
    mars: ctx.marsSign,
    jupiter: ctx.jupiterSign,
    saturn: ctx.saturnSign,
  }
}

export function isSimpleAstroFactQuestion(params: {
  message: string
  subcategory?: string | null
  requestKind?: string | null
}): boolean {
  const text = normalizeAstroValidationText(params.message)
  const isLongReading =
    /(analyse|lecture|portrait|bilan|theme natal|theme astral|transit|aspect|maison|interpret|explique|pourquoi|comment)/.test(
      text,
    )

  if (isLongReading) return false

  const asksSun =
    /(quel est mon signe|je suis quel signe|c est quoi mon signe|cest quoi mon signe|mon signe astro|signe solaire|signe du soleil|sun sign|my sun sign)/.test(
      text,
    ) || params.subcategory === 'signe_solaire'
  const asksMoon =
    /(signe lunaire|moon sign|my moon sign|quelle est ma lune|ma lune est)/.test(text) ||
    params.subcategory === 'signe_lunaire'
  const asksRising =
    /(quel est mon ascendant|mon ascendant|rising sign|my rising)/.test(text) ||
    params.subcategory === 'ascendant'
  const isQuestionLike =
    /(\?|quel|quelle|quels|quelles|what is|tell me|give me|c est quoi|cest quoi|je suis quel)/.test(
      text,
    ) || params.requestKind === 'exact_fact'

  return isQuestionLike && [asksSun, asksMoon, asksRising].filter(Boolean).length === 1
}

export function buildDeterministicAstroExactAnswer(params: {
  message: string
  ctx: CompactNatalContext
  language: string
  subcategory?: string | null
  requestKind?: string | null
}): string | null {
  if (!isSimpleAstroFactQuestion(params)) return null

  const text = normalizeAstroValidationText(params.message)
  const isEn = (params.language || 'fr').slice(0, 2).toLowerCase() === 'en'
  const target: AstroPlanetKey =
    /(signe lunaire|moon sign|my moon sign|quelle est ma lune|ma lune est)/.test(text) ||
    params.subcategory === 'signe_lunaire'
      ? 'moon'
      : /(quel est mon ascendant|mon ascendant|rising sign|my rising)/.test(text) ||
          params.subcategory === 'ascendant'
        ? 'ascendant'
        : 'sun'

  const values = buildPlanetValueMap(params.ctx)
  const sign = values[target]

  if (isEn) {
    if (target === 'moon') {
      return sign
        ? `Your moon sign is ${sign}.`
        : 'Your moon sign is unavailable in the validated exact data.'
    }

    if (target === 'ascendant') {
      return sign
        ? `Your rising sign is ${sign}.`
        : 'Your rising sign is unavailable in the validated exact data.'
    }

    return sign
      ? `Your sun sign is ${sign}.`
      : 'Your sun sign is unavailable in the validated exact data.'
  }

  if (target === 'moon') {
    return sign
      ? `Ton signe lunaire est ${sign}.`
      : 'Ton signe lunaire est indisponible dans les donnees exactes validees.'
  }

  if (target === 'ascendant') {
    return sign
      ? `Ton ascendant est ${sign}.`
      : 'Ton ascendant est indisponible dans les donnees exactes validees.'
  }

  return sign
    ? `Ton signe solaire est ${sign}.`
    : 'Ton signe solaire est indisponible dans les donnees exactes validees.'
}

/**
 * Extract a minimal, astrology-only context from /chart/fusion raw data.
 * When `raw.tropical` exists, this function reads exclusively from that branch.
 */
export function buildCompactNatalReadingContext(
  raw: Record<string, unknown>,
  maxChars = 2000,
): CompactNatalContext {
  const strictAstro = resolveStrictAstroContext(raw)
  const astro = strictAstro.source
  const astroPath = strictAstro.path

  const sunSign = strictAstro.placements.sun.placement?.sign ?? null
  const sunDegree = strictAstro.placements.sun.placement?.degree ?? null
  const moonSign = strictAstro.placements.moon.placement?.sign ?? null
  const moonDegree = strictAstro.placements.moon.placement?.degree ?? null
  const risingSign = strictAstro.placements.ascendant.placement?.sign ?? null
  const risingDegree = strictAstro.placements.ascendant.placement?.degree ?? null
  const risingRaw = strictAstro.placements.ascendant.placement ?? null
  const mercurySign = strictAstro.placements.mercury.placement?.sign ?? null
  const venusSign = strictAstro.placements.venus.placement?.sign ?? null
  const marsSign = strictAstro.placements.mars.placement?.sign ?? null
  const jupiterSign = strictAstro.placements.jupiter.placement?.sign ?? null
  const saturnSign = strictAstro.placements.saturn.placement?.sign ?? null

  const fieldSources = {
    sun: strictAstro.placements.sun.sourcePath ?? undefined,
    moon: strictAstro.placements.moon.sourcePath ?? undefined,
    ascendant: strictAstro.placements.ascendant.sourcePath ?? undefined,
    mercury: strictAstro.placements.mercury.sourcePath ?? undefined,
    venus: strictAstro.placements.venus.sourcePath ?? undefined,
    mars: strictAstro.placements.mars.sourcePath ?? undefined,
    jupiter: strictAstro.placements.jupiter.sourcePath ?? undefined,
    saturn: strictAstro.placements.saturn.sourcePath ?? undefined,
  }

  console.log('[COMPACT_NATAL] resolved astro source', {
    astroPath,
    usesTropical: strictAstro.usesTropical,
    fieldsInSource: Object.keys(astro).length,
    sampleKeys: Object.keys(astro).slice(0, 15),
  })

  const dominantSigns = extractList(astro, 'dominant_signs', 'signes_dominants', 'dominant_sign').slice(0, 5)
  const dominantElements = extractList(astro, 'dominant_elements', 'elements_dominants', 'dominant_element').slice(0, 4)
  const dominantModalities = extractList(astro, 'dominant_modalities', 'modalites_dominantes', 'dominant_modality').slice(0, 3)
  const stelliums = extractList(astro, 'stelliums', 'stellium').slice(0, 3)
  const chartShape = extractStr(astro, 'chart_shape', 'forme_theme', 'chart_pattern') ?? null

  const aspectsRaw = astro.aspects ?? astro.aspects_principaux ?? astro.major_aspects
  const keyAspects: string[] = []
  if (Array.isArray(aspectsRaw)) {
    aspectsRaw.slice(0, 5).forEach((aspect) => {
      if (typeof aspect === 'string') keyAspects.push(aspect)
      else if (aspect && typeof aspect === 'object') keyAspects.push(JSON.stringify(aspect).slice(0, 100))
    })
  }

  const housesRaw = astro.houses ?? astro.maisons ?? astro.house_cusps
  const dominantHouses: string[] = []
  if (Array.isArray(housesRaw)) {
    housesRaw.slice(0, 3).forEach((house) => {
      if (typeof house === 'string') dominantHouses.push(house)
      else if (house && typeof house === 'object') dominantHouses.push(JSON.stringify(house).slice(0, 80))
    })
  }

  const natalSummarySeeds: string[] = []
  for (const key of ['publicSummary', 'publicsummary', 'summary', 'synthese', 'reading', 'interpretation', 'bilan']) {
    const value = astro[key]
    if (typeof value === 'string' && value.trim()) {
      natalSummarySeeds.push(value.slice(0, 300))
      break
    }
  }

  const missingFields = Array.from(new Set([
    ...strictAstro.missingFields,
    ...(keyAspects.length === 0 ? ['aspects'] : []),
    ...(dominantHouses.length === 0 ? ['houses'] : []),
    ...(dominantSigns.length === 0 ? ['dominant_signs'] : []),
    ...(dominantElements.length === 0 ? ['dominant_elements'] : []),
    ...(dominantModalities.length === 0 ? ['dominant_modalities'] : []),
    ...(stelliums.length === 0 ? ['stelliums'] : []),
  ]))

  const blockLines = [
    'PLACEMENTS ASTRO EXACTS VALIDES (source de verite absolue - utiliser uniquement ces donnees) :',
  ]
  appendCompactLine(blockLines, buildPlacementLine('SOLEIL', sunSign, sunDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('LUNE', moonSign, moonDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('ASCENDANT', risingSign, risingDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('MERCURE', mercurySign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('VENUS', venusSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('MARS', marsSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('JUPITER', jupiterSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('SATURNE', saturnSign, null), maxChars)
  appendCompactLine(
    blockLines,
    `- ASPECTS CLES VALIDES: ${keyAspects.length ? keyAspects.join(' | ') : 'indisponible'}`,
    maxChars,
  )
  appendCompactLine(blockLines, `- MAISONS DOMINANTES: ${dominantHouses.length ? dominantHouses.join(' | ') : 'indisponible'}`, maxChars)
  appendCompactLine(blockLines, `- SIGNES DOMINANTS: ${dominantSigns.length ? dominantSigns.join(', ') : 'indisponible'}`, maxChars)

  const compactDataBlock = blockLines.join('\n')
  if (risingSign) {
    console.log('[COMPACT_NATAL] rising included', {
      sourcePath: fieldSources.ascendant ?? null,
      sign: risingSign,
      degree: risingDegree,
      includedInCompactBlock: compactDataBlock.includes('ASCENDANT'),
    })
  }
  console.log('[COMPACT_NATAL] block built', {
    astroPath,
    fieldSources,
    missingFields,
    blockChars: compactDataBlock.length,
    linesCount: blockLines.length,
  })

  return {
    sunSign,
    sunDegree,
    moonSign,
    moonDegree,
    risingSign,
    risingDegree,
    risingRaw,
    mercurySign,
    venusSign,
    marsSign,
    jupiterSign,
    saturnSign,
    dominantSigns,
    dominantElements,
    dominantModalities,
    stelliums,
    keyAspects,
    dominantHouses,
    chartShape,
    natalSummarySeeds,
    fieldSources,
    missingFields,
    compactDataBlock,
  }
}

export function buildValidatedAstroExactFallback(
  ctx: CompactNatalContext,
  language: string,
  firstName: string | null,
): string {
  const isFr = (language || 'fr').slice(0, 2).toLowerCase() !== 'en'
  const suffix = firstName ? `, ${firstName}` : ''

  const lines = [
    isFr ? `Voici les donnees astro exactes validees${suffix} :` : `Here are the validated exact astrology values${suffix}:`,
    '',
    isFr ? `Soleil: ${formatValidatedSign(ctx.sunSign, ctx.sunDegree)}` : `Sun: ${formatValidatedSign(ctx.sunSign, ctx.sunDegree)}`,
    isFr ? `Lune: ${formatValidatedSign(ctx.moonSign, ctx.moonDegree)}` : `Moon: ${formatValidatedSign(ctx.moonSign, ctx.moonDegree)}`,
    isFr ? `Ascendant: ${formatValidatedSign(ctx.risingSign, ctx.risingDegree)}` : `Rising: ${formatValidatedSign(ctx.risingSign, ctx.risingDegree)}`,
    isFr ? `Mercure: ${ctx.mercurySign ?? 'indisponible'}` : `Mercury: ${ctx.mercurySign ?? 'unavailable'}`,
    isFr ? `Venus: ${ctx.venusSign ?? 'indisponible'}` : `Venus: ${ctx.venusSign ?? 'unavailable'}`,
    isFr ? `Mars: ${ctx.marsSign ?? 'indisponible'}` : `Mars: ${ctx.marsSign ?? 'unavailable'}`,
    isFr
      ? `Aspects cles: ${ctx.keyAspects.length ? ctx.keyAspects.join(' | ') : 'indisponible'}`
      : `Key aspects: ${ctx.keyAspects.length ? ctx.keyAspects.join(' | ') : 'unavailable'}`,
    '',
    isFr
      ? 'Je n ajoute aucune valeur absente de la source tropicale exacte.'
      : 'I am not adding any value that is absent from the exact tropical source.',
  ]

  return lines.join('\n')
}

function validateAstroExactRenderLegacy(
  message: string,
  ctx: CompactNatalContext,
): AstroExactRenderValidation {
  const checks = [
    {
      label: 'sun',
      expected: ctx.sunSign,
      patterns: [/\b(?:soleil|signe solaire)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:sun|sun sign)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'moon',
      expected: ctx.moonSign,
      patterns: [/\b(?:lune|signe lunaire)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:moon|moon sign)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'ascendant',
      expected: ctx.risingSign,
      patterns: [/\b(?:ascendant)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:rising|rising sign|ascendant)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'mercury',
      expected: ctx.mercurySign,
      patterns: [/\b(?:mercure)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:mercury)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'venus',
      expected: ctx.venusSign,
      patterns: [/\b(?:venus|vénus)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:venus)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'mars',
      expected: ctx.marsSign,
      patterns: [/\b(?:mars)\s*(?:en|:)\s*([A-Za-zÀ-ÿ-]+)/gi, /\b(?:mars)\s*(?:in|:)\s*([A-Za-zÀ-ÿ-]+)/gi],
    },
  ]

  const violations: string[] = []
  for (const check of checks) {
    for (const pattern of check.patterns) {
      const matches = Array.from((message || '').matchAll(pattern))
      for (const match of matches) {
        const renderedSign = normalizeRenderedSignToken(match[1] ?? '')
        if (!renderedSign) continue

        if (!check.expected) {
          violations.push(`${check.label}:rendered_without_validated_source:${renderedSign}`)
          continue
        }

        if (renderedSign !== check.expected) {
          violations.push(`${check.label}:expected_${check.expected}:received_${renderedSign}`)
        }
      }
    }
  }

  const uniqueViolations = Array.from(new Set(violations))

  return {
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
  }
}

export function validateAstroExactRender(
  message: string,
  ctx: CompactNatalContext,
): AstroExactRenderValidation {
  const checks = [
    {
      label: 'sun',
      expected: ctx.sunSign,
      patterns: [/\b(?:soleil|signe solaire)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:sun|sun sign)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'moon',
      expected: ctx.moonSign,
      patterns: [/\b(?:lune|signe lunaire)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:moon|moon sign)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'ascendant',
      expected: ctx.risingSign,
      patterns: [/\b(?:ascendant)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:rising|rising sign|ascendant)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'mercury',
      expected: ctx.mercurySign,
      patterns: [/\b(?:mercure)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:mercury)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'venus',
      expected: ctx.venusSign,
      patterns: [/\b(?:venus|vénus)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:venus)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'mars',
      expected: ctx.marsSign,
      patterns: [/\b(?:mars)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:mars)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'jupiter',
      expected: ctx.jupiterSign,
      patterns: [/\b(?:jupiter)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:jupiter)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
    {
      label: 'saturn',
      expected: ctx.saturnSign,
      patterns: [/\b(?:saturne|saturn)\s*(?:(?:est\s+en|est|en)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi, /\b(?:saturn)\s*(?:(?:is\s+in|is|in)\s*|:\s*)([A-Za-zÀ-ÿ-]+)/gi],
    },
  ]

  const legacyValidation = validateAstroExactRenderLegacy(message, ctx)
  const violations = [...legacyValidation.violations]

  for (const check of checks) {
    for (const pattern of check.patterns) {
      const matches = Array.from((message || '').matchAll(pattern))
      for (const match of matches) {
        const renderedSign = normalizeRenderedSignToken(match[1] ?? '')
        if (!renderedSign) continue

        if (!check.expected) {
          violations.push(`${check.label}:rendered_without_validated_source:${renderedSign}`)
          continue
        }

        if (renderedSign !== check.expected) {
          violations.push(`${check.label}:expected_${check.expected}:received_${renderedSign}`)
        }
      }
    }
  }

  const allowedAspectTokens = new Set(
    ctx.keyAspects.map((aspect) => extractAspectToken(aspect)).filter(Boolean) as string[],
  )
  const renderedAspectTokens = (message || '')
    .split(/[\n.!?;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => extractAspectToken(part))
    .filter(Boolean) as string[]

  for (const renderedAspectToken of renderedAspectTokens) {
    if (allowedAspectTokens.size === 0 || !allowedAspectTokens.has(renderedAspectToken)) {
      violations.push(`aspect:rendered_without_validated_source:${renderedAspectToken}`)
    }
  }

  const uniqueViolations = Array.from(new Set(violations))

  return {
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
  }
}

export function enforceAstroExactRender(params: {
  message: string
  ctx: CompactNatalContext
  language: string
  firstName: string | null
  latestUserMessage: string
  subcategory?: string | null
  requestKind?: string | null
}): AstroExactRenderEnforcementResult {
  const validation = validateAstroExactRender(params.message, params.ctx)

  if (validation.valid) {
    return {
      message: params.message,
      validation,
      usedFallback: false,
      fallbackType: null,
    }
  }

  const simpleAnswer = buildDeterministicAstroExactAnswer({
    message: params.latestUserMessage,
    ctx: params.ctx,
    language: params.language,
    subcategory: params.subcategory,
    requestKind: params.requestKind,
  })

  return {
    message:
      simpleAnswer ??
      buildValidatedAstroExactFallback(params.ctx, params.language, params.firstName),
    validation,
    usedFallback: true,
    fallbackType: simpleAnswer ? 'astro_exact_simple_local' : 'astro_exact_local',
  }
}

/**
 * Logs the data source audit for a given request.
 * Returns a log-friendly object - log it externally with your logger.
 */
export function buildExactDataAuditLog(params: {
  subcategory: string | null
  requiresExact: boolean
  resolvedExact: boolean
  hasRaw: boolean
  specializedSource: string | null
  birthDataPresent: boolean
  birthDataFields: string[]
}): Record<string, unknown> {
  return {
    exact_data_required: params.requiresExact,
    exact_data_resolved: params.resolvedExact,
    has_raw_data: params.hasRaw,
    subcategory: params.subcategory,
    specialized_source: params.specializedSource,
    birth_data_present: params.birthDataPresent,
    birth_data_fields: params.birthDataFields,
  }
}

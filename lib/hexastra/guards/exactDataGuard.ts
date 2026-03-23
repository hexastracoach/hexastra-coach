/**
 * Exact Data Guard - Hexastra Coach
 *
 * Deterministic guards for exact-data routes. For astrology exact reads,
 * the compact natal block must stay pinned to the validated tropical source.
 */

import { normalizeAstroSign, resolveStrictAstroContext } from './extractCoreAstro'

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
    'DONNEES THEME NATAL VALIDEES (source tropicale exacte - citer exactement et ne rien inventer) :',
  ]
  appendCompactLine(blockLines, buildPlacementLine('SOLEIL', sunSign, sunDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('LUNE', moonSign, moonDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('ASCENDANT', risingSign, risingDegree), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('MERCURE', mercurySign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('VENUS', venusSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('MARS', marsSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('JUPITER', jupiterSign, null), maxChars)
  appendCompactLine(blockLines, buildPlacementLine('SATURNE', saturnSign, null), maxChars)
  appendCompactLine(blockLines, `- ASPECTS CLES: ${keyAspects.length ? keyAspects.join(' | ') : 'indisponible'}`, maxChars)
  appendCompactLine(blockLines, `- MAISONS DOMINANTES: ${dominantHouses.length ? dominantHouses.join(' | ') : 'indisponible'}`, maxChars)
  appendCompactLine(blockLines, `- SIGNES DOMINANTS: ${dominantSigns.length ? dominantSigns.join(', ') : 'indisponible'}`, maxChars)

  const compactDataBlock = blockLines.join('\n')
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

export function validateAstroExactRender(
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

  return {
    valid: violations.length === 0,
    violations,
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

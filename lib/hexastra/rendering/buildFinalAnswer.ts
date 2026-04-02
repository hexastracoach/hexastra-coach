import type { KnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { OpeningSignalSelection } from '@/lib/hexastra/orchestrator/selectOpeningSignal'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { unwrapDisplayText } from '@/lib/hexastra/utils/unwrapDisplayValue'
import { getFusionFallbackCopy } from '@/lib/hexastra/rendering/getFusionFallbackCopy'
import {
  buildYearlyPriorityAnswer,
  detectYearlyFocusAngle,
  type YearlyFocusAngle,
} from '@/lib/hexastra/rendering/buildYearlyPriorityAnswer'

export type FinalAnswerInput = {
  userMessage: string
  responseMode: string
  openingSignal: OpeningSignalSelection | null
  prioritizedSignals: StructuredSignal[]
  knowledgePacket: KnowledgePacket
  yearlyFocusAngle?: YearlyFocusAngle | null
}

export type FinalAnswer = {
  text: string
  sections?: {
    opening?: string
    explanation?: string
    action?: string
    key?: string
  }
}

type SignalSnippetVariant = 'opening' | 'explanation'

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentence(value: string | null | undefined, fallback = ''): string {
  const text = normalize(value ?? fallback)
  if (!text) return ''

  const capitalized = text.charAt(0).toUpperCase() + text.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function compact(value: string, maxChars = 180): string {
  const cleaned = normalize(value)
  if (cleaned.length <= maxChars) return cleaned
  const cut = cleaned.lastIndexOf(' ', maxChars)
  return `${cleaned.slice(0, cut > 70 ? cut : maxChars).trim()}...`
}

function uniqSentences(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const cleaned = normalize(value ?? '')
    if (!cleaned) continue

    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(sentence(cleaned))
  }

  return output
}

function flattenScalarTexts(value: unknown, limit = 6, bucket: string[] = []): string[] {
  if (bucket.length >= limit || value === null || value === undefined) {
    return bucket
  }

  if (typeof value === 'string') {
    const cleaned = normalize(value)
    if (cleaned) bucket.push(cleaned)
    return bucket
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    bucket.push(String(value))
    return bucket
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      flattenScalarTexts(entry, limit, bucket)
      if (bucket.length >= limit) break
    }
    return bucket
  }

  if (typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      flattenScalarTexts(entry, limit, bucket)
      if (bucket.length >= limit) break
    }
  }

  return bucket
}

function getPathValue(value: unknown, path: string): unknown {
  let current: unknown = value
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return null
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function findByPaths(value: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const candidate = getPathValue(value, path)
    if (candidate !== null && candidate !== undefined && candidate !== '') {
      return candidate
    }
  }
  return null
}

function stringifyCandidate(value: unknown): string | null {
  const unwrapped = unwrapDisplayText(value)
  if (unwrapped) {
    return normalize(unwrapped)
  }

  if (typeof value === 'string') {
    return normalize(value)
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    const parts = flattenScalarTexts(value, 4)
    return parts.length > 0 ? parts.join(', ') : null
  }
  return null
}

function humanizeSubCategory(subCategory: string): string {
  return subCategory
    .replace(/^astro_/, '')
    .replace(/^hd_/, '')
    .replace(/^num_/, '')
    .replace(/^kua_/, '')
    .replace(/^fusion_/, '')
    .replace(/_/g, ' ')
    .trim()
}

function looksLikeInternalSignalKey(value: string): boolean {
  const normalized = normalize(value).toLowerCase()
  return (
    /^(astro|hd|num|kua|fusion|timing|ennea)(_[a-z0-9]+)+$/.test(normalized) ||
    /^(exact_profile|inner_state|life_period|blocage|relationship|career_guidance|fusion_general_question)$/.test(
      normalized,
    )
  )
}

function resolveHumanFallbackSnippet(
  signal: StructuredSignal,
  variant: SignalSnippetVariant,
  responseMode: string,
): string {
  if (signal.science === 'fusion') {
    const copy = getFusionFallbackCopy({
      subCategory: signal.subCategory,
      responseMode,
    })
    return variant === 'opening' ? copy.opening : copy.explanation
  }

  return humanizeSubCategory(signal.subCategory) || 'la dynamique principale du moment'
}

function sanitizeSnippetCandidate(
  signal: StructuredSignal,
  candidate: string | null,
): string | null {
  const cleaned = normalize(candidate ?? '')
  if (!cleaned) {
    return null
  }

  return looksLikeInternalSignalKey(cleaned) ? null : cleaned
}

function resolveSignalSnippet(
  signal: StructuredSignal,
  variant: SignalSnippetVariant = 'opening',
  responseMode = 'concise_fusion_answer',
): string {
  if (signal.sourceType === 'retrieval') {
    const documentsValue = signal.value as { documents?: Array<{ excerpt?: string }> }
    const excerpt = documentsValue.documents?.[0]?.excerpt
    const sanitizedExcerpt = sanitizeSnippetCandidate(signal, excerpt ?? null)
    if (sanitizedExcerpt) {
      return compact(sanitizedExcerpt, 170)
    }
  }

  switch (signal.subCategory) {
    case 'hd_type': {
      const typeValue = stringifyCandidate(findByPaths(signal.value, ['hdType', 'type', 'type_hd']))
      const strategyValue = stringifyCandidate(
        findByPaths(signal.value, ['hdStrategy', 'strategy', 'strategie']),
      )
      const safeTypeValue = sanitizeSnippetCandidate(signal, typeValue)
      const safeStrategyValue = sanitizeSnippetCandidate(signal, strategyValue)
      if (safeTypeValue && safeStrategyValue) {
        return `tu es ${safeTypeValue} et ta bonne direction passe par ${safeStrategyValue.toLowerCase()}`
      }
      if (safeTypeValue) {
        return `tu es ${safeTypeValue}`
      }
      break
    }

    case 'hd_profile': {
      const profileValue = stringifyCandidate(findByPaths(signal.value, ['hdProfile', 'profile']))
      const safeProfileValue = sanitizeSnippetCandidate(signal, profileValue)
      if (safeProfileValue) {
        return `ton profil ${safeProfileValue} decrit une maniere bien precise d avancer et d apprendre`
      }
      break
    }

    case 'num_personal_year': {
      const yearValue = stringifyCandidate(
        findByPaths(signal.value, ['yearly.personalYearNumber', 'personalYearNumber', 'personalYear']),
      )
      const safeYearValue = sanitizeSnippetCandidate(signal, yearValue)
      if (safeYearValue) {
        return `tu es dans une annee personnelle ${safeYearValue}`
      }
      break
    }

    case 'num_life_path': {
      const lifePath = stringifyCandidate(findByPaths(signal.value, ['chemin_de_vie', 'lifePath']))
      const safeLifePath = sanitizeSnippetCandidate(signal, lifePath)
      if (safeLifePath) {
        return `ton chemin de vie est ${safeLifePath}`
      }
      break
    }

    case 'kua_number': {
      const kuaNumber = stringifyCandidate(findByPaths(signal.value, ['kua_number', 'kuaNumber']))
      const safeKuaNumber = sanitizeSnippetCandidate(signal, kuaNumber)
      if (safeKuaNumber) {
        return `ton nombre Kua est ${safeKuaNumber}`
      }
      break
    }

    case 'kua_favorable_directions': {
      const directions = stringifyCandidate(
        findByPaths(signal.value, ['favorable_directions', 'favorableDirections']),
      )
      const safeDirections = sanitizeSnippetCandidate(signal, directions)
      if (safeDirections) {
        return `tes directions favorables sont ${safeDirections}`
      }
      break
    }

    case 'kua_bed_orientation': {
      const direction = stringifyCandidate(findByPaths(signal.value, ['bed_orientation', 'bedOrientation']))
      const safeDirection = sanitizeSnippetCandidate(signal, direction)
      if (safeDirection) {
        return `pour le repos, l orientation la plus soutenante est ${safeDirection}`
      }
      break
    }

    case 'kua_desk_orientation': {
      const direction = stringifyCandidate(findByPaths(signal.value, ['desk_orientation', 'deskOrientation']))
      const safeDirection = sanitizeSnippetCandidate(signal, direction)
      if (safeDirection) {
        return `pour le bureau, l orientation la plus soutenante est ${safeDirection}`
      }
      break
    }

    case 'astro_solar_return': {
      const annualTheme = stringifyCandidate(findByPaths(signal.value, ['annual_theme', 'theme', 'emphasis']))
      const safeAnnualTheme = sanitizeSnippetCandidate(signal, annualTheme)
      if (safeAnnualTheme) {
        return `ton retour solaire ouvre une phase de ${safeAnnualTheme.toLowerCase()}`
      }
      break
    }

    case 'astro_progressions': {
      const progression = stringifyCandidate(
        findByPaths(signal.value, ['secondary_progressions.moon', 'moon', 'progressed_moon']),
      )
      const safeProgression = sanitizeSnippetCandidate(signal, progression)
      if (safeProgression) {
        return safeProgression
      }
      break
    }
  }

  const preferredPaths: Record<string, string[]> = {
    astro_transits_current: ['saturn', 'mars', 'moon', 'sun', 'summary'],
    astro_transits_timing: ['saturn', 'mars', 'moon', 'summary'],
    astro_transits_energy: ['mars', 'moon', 'sun', 'summary'],
    hd_current_transits: ['current_cycle', 'summary'],
    hd_current_cycle: ['current_cycle', 'summary'],
    fusion_general: ['publicSummary', 'summary', 'message'],
    fusion_life_situation: ['publicSummary', 'summary', 'message'],
    fusion_timing: ['publicSummary', 'summary', 'message'],
    fusion_blockage: ['publicSummary', 'summary', 'message'],
    fusion_decision: ['publicSummary', 'summary', 'message'],
    fusion_energy_state: ['publicSummary', 'summary', 'message'],
  }

  const preferred = preferredPaths[signal.subCategory]
  if (preferred) {
    const candidate = sanitizeSnippetCandidate(
      signal,
      stringifyCandidate(findByPaths(signal.value, preferred)),
    )
    if (candidate) {
      return compact(candidate, 170)
    }
  }

  const firstScalar = sanitizeSnippetCandidate(signal, flattenScalarTexts(signal.value, 3)[0] ?? null)
  if (firstScalar) {
    return compact(firstScalar, 170)
  }

  return resolveHumanFallbackSnippet(signal, variant, responseMode)
}

function buildOpeningText(
  responseMode: string,
  openingSelection: OpeningSignalSelection | null,
  prioritizedSignals: StructuredSignal[],
  knowledgePacket: KnowledgePacket,
): string {
  const openingSignal = openingSelection?.signal ?? prioritizedSignals[0] ?? null
  if (!openingSignal) {
    const fallbackHint = knowledgePacket.fusionHints?.[0] ?? 'le mouvement principal du moment'
    if (looksLikeInternalSignalKey(fallbackHint)) {
      if (fallbackHint.startsWith('fusion_') || fallbackHint === 'timing_fusion') {
        return sentence(
          getFusionFallbackCopy({
            subCategory: fallbackHint,
            responseMode,
          }).opening,
        )
      }

      return sentence('le point central, pour l instant, demande surtout de lire la dynamique principale avant de conclure')
    }

    return sentence(`le point central, pour l instant, tourne autour de ${fallbackHint.replace(/_/g, ' ')}`)
  }

  const snippet = resolveSignalSnippet(openingSignal, 'opening', responseMode)

  if (openingSelection?.dominantOpeningScience === null && openingSelection?.dominantOpeningSubCategory === null) {
    return sentence(`la question reste ouverte et demande de garder plusieurs angles vivants avant de conclure trop vite`)
  }

  if (responseMode === 'direct_answer' || responseMode === 'calculated_reading') {
    return sentence(snippet)
  }

  if (responseMode === 'timing_strategic_response') {
    return sentence(`en ce moment, le signal le plus net montre que ${snippet}`)
  }

  if (responseMode === 'interpretive_reading') {
    return sentence(`ce qui ressort d abord, c est que ${snippet}`)
  }

  if (openingSignal.science === 'fusion') {
    return sentence(snippet)
  }

  return sentence(`actuellement, ${snippet}`)
}

function selectExplanationSignals(
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
): StructuredSignal[] {
  const chosen: StructuredSignal[] = []
  const seen = new Set<string>()

  const candidates = [
    ...(openingSignal ? [openingSignal] : []),
    ...prioritizedSignals,
  ]

  for (const signal of candidates) {
    const key = `${signal.science}:${signal.subCategory}`
    if (seen.has(key)) continue
    seen.add(key)
    chosen.push(signal)
    if (chosen.length >= 3) break
  }

  return chosen
}

function buildFactSentence(signal: StructuredSignal, responseMode: string): string {
  const snippet = resolveSignalSnippet(signal, 'explanation', responseMode)

  if (signal.science === 'fusion') {
    return sentence(snippet)
  }

  if (signal.sourceType === 'exact_data') {
    return sentence(`le point le plus concret ici est que ${snippet}`)
  }

  return sentence(`le signal qui appuie cette lecture parle de ${snippet}`)
}

function buildContextSentence(signal: StructuredSignal, responseMode: string): string {
  const snippet = resolveSignalSnippet(signal, 'explanation', responseMode)

  if (signal.science === 'fusion') {
    return sentence(`au fond, ${snippet}`)
  }

  return sentence(`ce contexte ajoute aussi ${snippet}`)
}

function buildExplanationText(
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
  responseMode: string,
): string {
  const signals = selectExplanationSignals(openingSignal, prioritizedSignals)
  const primary = signals[0] ?? null
  const secondary =
    signals.find((signal) => signal !== primary && signal.science === 'fusion') ??
    signals.find((signal) => signal !== primary) ??
    null
  const tertiary =
    signals.find((signal) => signal !== primary && signal !== secondary) ?? null

  return uniqSentences([
    primary ? buildFactSentence(primary, responseMode) : null,
    secondary ? buildContextSentence(secondary, responseMode) : null,
    tertiary && tertiary.science !== secondary?.science
      ? buildContextSentence(tertiary, responseMode)
      : null,
  ]).join(' ')
}

function buildActionFromSignal(signal: StructuredSignal | null, responseMode: string): string {
  if (!signal) {
    return sentence(`avance sur une seule priorite concrete, puis regarde ce qui devient plus simple quand tu arretes de te disperser`)
  }

  switch (signal.subCategory) {
    case 'hd_type':
    case 'hd_strategy':
    case 'hd_current_transits':
    case 'hd_current_cycle':
      return sentence(`attends un vrai signal de reponse avant d initier, puis engage-toi seulement quand le corps ou l environnement confirme clairement`)

    case 'num_personal_year':
      return sentence(`choisis ce qui consolide ton cycle actuel et coupe ce qui t oblige a accelerer sans base solide`)

    case 'kua_favorable_directions':
    case 'kua_bed_orientation':
    case 'kua_desk_orientation':
    case 'kua_number':
      return sentence(`utilise cette information comme repere spatial concret et ajuste d abord l orientation la plus importante avant de changer tout le reste`)

    case 'astro_transits_current':
    case 'astro_transits_timing':
    case 'astro_solar_return':
    case 'astro_progressions':
      return sentence(`observe ce qui revient avec le plus d insistance maintenant, puis prends une seule decision a partir de ce signal au lieu de forcer la cadence`)

    case 'fusion_decision':
      return sentence(`ne cherche pas a trancher trop vite; clarifie d abord ce qui est vraiment non negociable, puis pose une action simple dans les 24 a 48 heures`)

    case 'fusion_blockage':
      return sentence(`arrete de lutter sur tous les fronts; traite le point de friction principal, puis teste un petit mouvement concret plutot qu un grand virage`)

    default:
      return sentence(
        responseMode === 'timing_strategic_response'
          ? `privilegie le bon moment au bon geste: attends le signal le plus stable, puis avance sans surcharge`
          : `ramene ton energie sur un seul axe concret et laisse ce signal guider la prochaine action utile`,
      )
  }
}

function buildActionText(
  primary: StructuredSignal | null,
  secondary: StructuredSignal | null,
  responseMode: string,
): string {
  return uniqSentences([
    buildActionFromSignal(primary, responseMode),
    secondary && secondary.science !== primary?.science
      ? buildActionFromSignal(secondary, responseMode)
      : null,
  ])
    .slice(0, 2)
    .join(' ')
}

function buildKeyText(primary: StructuredSignal | null, responseMode: string): string {
  if (!primary) {
    return sentence(`la clarte vient quand tu suis le signal principal au lieu de tout traiter au meme niveau`)
  }

  switch (primary.subCategory) {
    case 'hd_type':
    case 'hd_strategy':
      return sentence(`ta bonne direction vient d une reponse juste, pas d une initiative sous pression`)

    case 'num_personal_year':
      return sentence(`le cycle porte mieux ce que tu consolides que ce que tu forces`)

    case 'kua_favorable_directions':
    case 'kua_bed_orientation':
    case 'kua_desk_orientation':
      return sentence(`l espace juste soutient une decision plus claire`)

    case 'astro_transits_current':
    case 'astro_transits_timing':
    case 'astro_progressions':
    case 'astro_solar_return':
      return sentence(`la clarte vient du bon rythme, pas de la precipitation`)

    default:
      return sentence(
        responseMode === 'interpretive_reading'
          ? `ce que tu traverses devient plus lisible quand tu honores le mouvement dominant au lieu de le contrer`
          : `la clarte ne vient pas en forcant, mais en repondant au signal le plus juste`,
      )
  }
}

export function buildFinalAnswer(input: FinalAnswerInput): FinalAnswer {
  if (input.responseMode === 'yearly_priority_answer') {
    return {
      text: buildYearlyPriorityAnswer({
        userMessage: input.userMessage,
        openingSignal: input.openingSignal,
        prioritizedSignals: input.prioritizedSignals,
        focusAngle: input.yearlyFocusAngle ?? detectYearlyFocusAngle(input.userMessage),
      }),
    }
  }

  const prioritizedSignals = input.prioritizedSignals.slice(0, 6)
  const openingSignal = input.openingSignal?.signal ?? prioritizedSignals[0] ?? null
  const explanationSignals = selectExplanationSignals(openingSignal, prioritizedSignals)
  const primaryActionSignal = explanationSignals[0] ?? openingSignal ?? null
  const secondaryActionSignal =
    explanationSignals.find((signal) => signal !== primaryActionSignal) ?? null

  const sections = {
    opening: buildOpeningText(
      input.responseMode,
      input.openingSignal,
      prioritizedSignals,
      input.knowledgePacket,
    ),
    explanation: buildExplanationText(openingSignal, prioritizedSignals, input.responseMode),
    action: buildActionText(primaryActionSignal, secondaryActionSignal, input.responseMode),
    key: buildKeyText(primaryActionSignal, input.responseMode),
  }

  const openingTitle =
    input.responseMode === 'direct_answer' || input.responseMode === 'calculated_reading'
      ? '-> L essentiel'
      : '-> Ce qui se passe'
  const explanationTitle =
    input.responseMode === 'direct_answer' || input.responseMode === 'calculated_reading'
      ? '-> Ce que cela montre'
      : '-> Pourquoi'

  return {
    text: [
      openingTitle,
      sections.opening,
      '',
      explanationTitle,
      sections.explanation,
      '',
      '-> Ce que tu peux faire',
      sections.action,
      '',
      '-> Cle a retenir',
      sections.key,
    ].join('\n'),
    sections,
  }
}

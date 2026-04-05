import type { OpeningSignalSelection } from '@/lib/hexastra/orchestrator/selectOpeningSignal'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { normalizeUserPlan } from '@/lib/hexastra/rendering/normalizeUserPlan'
import type { UserPlan } from '@/lib/hexastra/rendering/selectRenderProfile'
import { unwrapDisplayText } from '@/lib/hexastra/utils/unwrapDisplayValue'

export type YearlyPriorityAnswerInput = {
  userMessage: string
  openingSignal: OpeningSignalSelection | null
  prioritizedSignals: StructuredSignal[]
  focusAngle?: YearlyFocusAngle | null
  userPlan?: UserPlan | null
}

export type YearlyFocusAngle =
  | 'concentration'
  | 'direction_choice'
  | 'stop_cut_remove'
  | 'energy_leak'
  | 'execution_push'

export type YearlyPriorityFocusAngle = YearlyFocusAngle

type AnnualFamily =
  | 'cap'
  | 'maturation'
  | 'rythme'
  | 'alignement'
  | 'direction'
  | 'cycle'

type PriorityTemplate = {
  title: string
  orientationAxis: string
  orientationMeaning: string
  whyPriority: string
  realLife: string
  pitfall: string
  timingStart: string
  timingMiddle: string
  timingEnd: string
  immediateAction: string
}

type PrioritySelection = {
  signal: StructuredSignal | null
  family: AnnualFamily
  isRadical: boolean
}

export type YearlyPriorityValidation = {
  valid: boolean
  issues: string[]
  priorityCount: number
}

type YearlyPlanStyle = {
  orientationSentences: number
  whySentences: number
  realLifeSentences: number
  keySentences: number
  showSimpleKey: boolean
  pitfallSentences: number
  pitfallCount: number
  timingSentences: number
  actionCount: number
}

type YearlyValidationProfile = {
  requireWhy: boolean
  requireRealLife: boolean
  requireSimpleKey: boolean
  requireRadicalPriority: boolean
  requireNumberedActions: boolean
  minPitfalls: number
  maxPitfalls: number
  minActions: number
  maxActions: number
}

const FORBIDDEN_ANNUAL_WORDS = ['true', 'false', 'vrai', 'faux', 'signal', 'confidence'] as const
const FORBIDDEN_ANNUAL_TECHNICAL_PATTERNS = [
  { key: 'solar_return', pattern: /\b(?:astro[_ ]?)?solar[_ ]return\b/gi, replacement: 'la dynamique annuelle' },
  { key: 'lunar_return', pattern: /\b(?:astro[_ ]?)?lunar[_ ]return\b/gi, replacement: 'la dynamique du moment' },
  { key: 'progressions', pattern: /\b(?:astro[_ ]?)?progressions?\b/gi, replacement: 'les evolutions de fond' },
  { key: 'transits', pattern: /\b(?:astro[_ ]?)?transits?(?:[_ ](?:current|timing|energy))?\b/gi, replacement: 'les mouvements de l annee' },
  { key: 'human_design_transits', pattern: /\b(?:hd[_ ]current[_ ]transits|human[_ ]design[_ ]transits)\b/gi, replacement: 'les mouvements de ton energie' },
  { key: 'numerology_cycles', pattern: /\b(?:numerology[_ ]cycles?|num[_ ]personal[_ ]year)\b/gi, replacement: 'le cycle en cours' },
  { key: 'kua_directions', pattern: /\b(?:kua[_ ]directions?|kua[_ ]annual[_ ]influence|kua[_ ]favorable[_ ]directions)\b/gi, replacement: 'les repères de ton cadre' },
  { key: 'iso_date', pattern: /\b20\d{2}-\d{2}-\d{2}\b/g, replacement: 'cette periode' },
] as const
const RADICAL_PRIORITY_PATTERN = /\b(stop|supprime|coupe|refuse)\b/i
const RADICAL_FAMILY_PRIORITY: AnnualFamily[] = ['cap', 'alignement', 'cycle', 'direction']
const PRIORITY_LINE_PATTERN = /^\s*\d+[.)]\s+/gm
const ANNUAL_EVIDENCE_FILLER_WORDS = new Set([
  'a',
  'an',
  'annee',
  'by',
  'c',
  'ca',
  'ce',
  'ces',
  'cette',
  'dans',
  'de',
  'des',
  'du',
  'en',
  'est',
  'et',
  'il',
  'la',
  'le',
  'les',
  'l',
  'mon',
  'ma',
  'mes',
  'par',
  'pour',
  'sur',
  'the',
  'this',
  'un',
  'une',
  'y',
])
const ANNUAL_HEADING_PATTERN = /^(ORIENTATION\s+20\d{2}|TES\s+3\s+PRIORITES\s+REELLES|CE\s+QUI\s+VA\s+TE\s+FREINER|TON\s+TIMING|ACTION\s+IMMEDIATE)$/i
const DEFAULT_YEARLY_USER_PLAN: UserPlan = 'premium'
const YEARLY_PLAN_STYLES: Record<UserPlan, YearlyPlanStyle> = {
  free: {
    orientationSentences: 2,
    whySentences: 1,
    realLifeSentences: 1,
    keySentences: 1,
    showSimpleKey: false,
    pitfallSentences: 1,
    pitfallCount: 1,
    timingSentences: 1,
    actionCount: 1,
  },
  essentiel: {
    orientationSentences: 3,
    whySentences: 1,
    realLifeSentences: 2,
    keySentences: 1,
    showSimpleKey: false,
    pitfallSentences: 1,
    pitfallCount: 2,
    timingSentences: 2,
    actionCount: 2,
  },
  premium: {
    orientationSentences: 4,
    whySentences: 2,
    realLifeSentences: 2,
    keySentences: 1,
    showSimpleKey: true,
    pitfallSentences: 2,
    pitfallCount: 4,
    timingSentences: 2,
    actionCount: 3,
  },
  praticien: {
    orientationSentences: 4,
    whySentences: 2,
    realLifeSentences: 2,
    keySentences: 1,
    showSimpleKey: true,
    pitfallSentences: 2,
    pitfallCount: 4,
    timingSentences: 3,
    actionCount: 3,
  },
}

const YEARLY_VALIDATION_PROFILES: Record<UserPlan, YearlyValidationProfile> = {
  free: {
    requireWhy: false,
    requireRealLife: false,
    requireSimpleKey: false,
    requireRadicalPriority: false,
    requireNumberedActions: false,
    minPitfalls: 1,
    maxPitfalls: 3,
    minActions: 1,
    maxActions: 1,
  },
  essentiel: {
    requireWhy: true,
    requireRealLife: true,
    requireSimpleKey: false,
    requireRadicalPriority: false,
    requireNumberedActions: false,
    minPitfalls: 1,
    maxPitfalls: 3,
    minActions: 1,
    maxActions: 2,
  },
  premium: {
    requireWhy: true,
    requireRealLife: true,
    requireSimpleKey: true,
    requireRadicalPriority: true,
    requireNumberedActions: true,
    minPitfalls: 3,
    maxPitfalls: 4,
    minActions: 2,
    maxActions: 3,
  },
  praticien: {
    requireWhy: true,
    requireRealLife: true,
    requireSimpleKey: true,
    requireRadicalPriority: true,
    requireNumberedActions: true,
    minPitfalls: 3,
    maxPitfalls: 4,
    minActions: 2,
    maxActions: 3,
  },
}

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeIntentText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectYearlyFocusAngle(message: string): YearlyFocusAngle {
  const normalized = normalizeIntentText(message)

  if (
    /(comment avancer|comment accelerer|passer au niveau superieur|arreter de stagner|sortir de la stagnation|passer a l action|enfin passer a l action|me remettre en mouvement|debloquer l execution)/.test(
      normalized,
    )
  ) {
    return 'execution_push'
  }

  if (normalized.includes('concentrer') || normalized.includes('focus')) {
    return 'concentration'
  }

  if (normalized.includes('axe') || normalized.includes('direction') || normalized.includes('choisir')) {
    return 'direction_choice'
  }

  if (
    /(qu est ce que je dois arreter|que dois je arreter|quoi arreter|laisser tomber|supprimer|couper|refuser|stopper|arreter)/.test(
      normalized,
    )
  ) {
    return 'stop_cut_remove'
  }

  if (
    /(ou je perds mon energie|ou je perd mon energie|ce qui me disperse|ce qui me fait perdre du temps|fuite d energie|fuites d energie|ce qui me vide|energie|fatigue|epuise|epuisee)/.test(
      normalized,
    )
  ) {
    return 'energy_leak'
  }

  return 'concentration'
}

export const detectYearlyPriorityFocusAngle = detectYearlyFocusAngle

function adaptPriorityLabel(base: string, angle: YearlyFocusAngle) {
  switch (angle) {
    case 'concentration':
      return `Reduis a l essentiel : ${base}`
    case 'direction_choice':
      return `Choisis ton axe principal : ${base}`
    case 'stop_cut_remove':
      return `Arrete ce qui te freine : ${base}`
    case 'energy_leak':
      return `Protege ton energie : ${base}`
    case 'execution_push':
      return `Passe en execution : ${base}`
    default:
      return base
  }
}

function sanitizeAnnualContent(text: string): string {
  let cleaned = normalize(text)
    .replace(/\b(?:true|false|vrai|faux)\b/gi, ' ')
    .replace(/\bconfidence\b/gi, 'fiabilite')
    .replace(/\bsignal\b/gi, 'point cle')

  for (const { pattern, replacement } of FORBIDDEN_ANNUAL_TECHNICAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  return normalize(cleaned.replace(/\s*([,;:])\s*/g, '$1 '))
}

type SanitizeYearlyPriorityRenderedTextOptions = {
  userPlan?: UserPlan | null
}

export type RepairYearlyPriorityPitfallsOptions = {
  userPlan?: UserPlan | null
  focusAngle?: YearlyFocusAngle | null
}

function normalizePitfallBullet(line: string): string | null {
  const cleaned = sanitizeAnnualContent(line.replace(/^\s*-\s*/, ''))
  if (!cleaned) return null
  return `- ${sentence(cleaned)}`
}

function buildDefaultYearlyPitfalls(focusAngle: YearlyFocusAngle): string[] {
  switch (focusAngle) {
    case 'concentration':
      return [
        'Tu risques de te disperser si tu gardes trop de choses ouvertes.',
        'Tu risques de dire oui trop vite au lieu de proteger le bon front.',
        'Tu risques de rester occupe sans faire avancer le principal.',
      ]
    case 'direction_choice':
      return [
        'Tu risques d hesiter trop longtemps au lieu de choisir.',
        'Tu risques de rouvrir des options qui brouillent ton cap.',
        'Tu risques de changer d axe des qu une autre option apparait.',
      ]
    case 'stop_cut_remove':
      return [
        'Tu risques de garder un sujet mort pour ne pas fermer la porte.',
        'Tu risques de repousser la coupure claire et de payer le prix en silence.',
        'Tu risques de maintenir le secondaire par habitude.',
      ]
    case 'energy_leak':
      return [
        'Tu risques de perdre de l energie si tu avances sans priorite claire.',
        'Tu risques de laisser des drains repetes prendre ta meilleure energie.',
        'Tu risques de remplir ton agenda avant de proteger ton axe utile.',
      ]
    case 'execution_push':
      return [
        'Tu risques de trop preparer au lieu de sortir un premier pas concret.',
        'Tu risques de lancer beaucoup et de finir trop peu.',
        'Tu risques d attendre le bon moment parfait au lieu d avancer.',
      ]
    default:
      return [
        'Tu risques de te disperser si tu gardes trop de choses ouvertes.',
        'Tu risques de perdre de l energie si tu avances sans priorite claire.',
        'Tu risques d hesiter trop longtemps au lieu de choisir.',
      ]
  }
}

export function repairYearlyPriorityPitfalls(
  text: string,
  options?: RepairYearlyPriorityPitfallsOptions,
): { text: string; injectedCount: number } {
  let normalizedText = (text || '').replace(/\r\n?/g, '\n').trim()
  if (!normalizedText) {
    return { text: normalizedText, injectedCount: 0 }
  }

  const userPlan = resolveYearlyUserPlan(options?.userPlan)
  const focusAngle = options?.focusAngle ?? 'concentration'
  const minPitfalls = resolveYearlyValidationProfile(userPlan).minPitfalls
  const defaultPitfalls = buildDefaultYearlyPitfalls(focusAngle).map((line) => normalizePitfallBullet(line)).filter(Boolean) as string[]
  const pitfallSectionPattern = /(^CE QUI VA TE FREINER\b[^\n]*\n?)([\s\S]*?)(?=^\s*TON TIMING\b|^\s*ACTION IMMEDIATE\b|$)/im
  const pitfallMatch = normalizedText.match(pitfallSectionPattern)

  const existingBullets = (() => {
    if (!pitfallMatch) return [] as string[]

    const content = pitfallMatch[2] ?? ''
    const candidateLines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !ANNUAL_HEADING_PATTERN.test(line))

    return candidateLines
      .map((line) => normalizePitfallBullet(line))
      .filter(Boolean) as string[]
  })()

  const dedupedPitfalls = [...new Set(existingBullets.map((line) => line.toLowerCase()))]
  const repairedPitfalls = existingBullets.filter((line, index) => dedupedPitfalls.indexOf(line.toLowerCase()) === index)
  let injectedCount = 0

  for (const fallback of defaultPitfalls) {
    if (repairedPitfalls.length >= minPitfalls) break
    if (repairedPitfalls.some((line) => line.toLowerCase() === fallback.toLowerCase())) continue
    repairedPitfalls.push(fallback)
    injectedCount += 1
  }

  if (pitfallMatch) {
    const repairedSection = `${pitfallMatch[1]}${repairedPitfalls.join('\n')}\n`
    normalizedText = normalizedText.replace(pitfallSectionPattern, repairedSection)
  } else if (repairedPitfalls.length > 0) {
    const sectionBlock = `CE QUI VA TE FREINER\n${repairedPitfalls.join('\n')}\n\n`
    if (/^\s*TON TIMING\b/im.test(normalizedText)) {
      normalizedText = normalizedText.replace(/^\s*TON TIMING\b/im, `${sectionBlock}TON TIMING`)
    } else if (/^\s*ACTION IMMEDIATE\b/im.test(normalizedText)) {
      normalizedText = normalizedText.replace(/^\s*ACTION IMMEDIATE\b/im, `${sectionBlock}ACTION IMMEDIATE`)
    } else {
      normalizedText = `${normalizedText}\n\n${sectionBlock.trim()}`
    }
    injectedCount = repairedPitfalls.length
  }

  return {
    text: normalizedText.replace(/\n{3,}/g, '\n\n').trim(),
    injectedCount,
  }
}

function trimImmediateActionsToMax(text: string, maxActions: number): string {
  if (maxActions < 1) return text

  const normalizedText = (text || '').replace(/\r\n?/g, '\n')
  const headingMatch = normalizedText.match(/(^ACTION\s+IMMEDIATE\b[^\n]*\n?)([\s\S]*)$/im)
  if (!headingMatch) return text

  const sectionContent = headingMatch[2] ?? ''
  const sectionLines = sectionContent.split('\n')
  const actionLinePattern = /^\s*(?:Action\s+\d+:\s+|-\s+|\d+[.)]\s+)/i
  let actionCount = 0
  let originalActionCount = 0
  const trimmedLines: string[] = []

  for (const line of sectionLines) {
    const trimmed = line.trim()

    if (!trimmed) {
      if (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1] !== '') {
        trimmedLines.push('')
      }
      continue
    }

    if (actionLinePattern.test(trimmed)) {
      originalActionCount += 1
      if (actionCount >= maxActions) continue
      actionCount += 1
    }

    trimmedLines.push(line.trimEnd())
  }

  if (originalActionCount <= maxActions) return text

  const trimmedSection = trimmedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  return `${normalizedText.slice(0, headingMatch.index)}${headingMatch[1]}${trimmedSection}`.trim()
}

export function sanitizeYearlyPriorityRenderedText(
  text: string,
  options?: SanitizeYearlyPriorityRenderedTextOptions,
): string {
  const sanitized = (text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (ANNUAL_HEADING_PATTERN.test(trimmed)) return trimmed
      return sanitizeAnnualContent(trimmed)
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const userPlan = resolveYearlyUserPlan(options?.userPlan)
  if (userPlan === 'essentiel') {
    return trimImmediateActionsToMax(sanitized, 2)
  }

  return sanitized
}

function simplifyText(text: string): string {
  return (text || '')
    .replace(/\bconcretement\b/gi, '')
    .replace(/\bdans ce contexte\b/gi, '')
    .replace(/\bil faut\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.!?])/g, '$1')
    .trim()
}

function wordCount(text: string): number {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean).length
}

function chunkSentence(text: string, maxWords = 14): string[] {
  const words = normalize(text).split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return [normalize(text)]

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    let end = Math.min(start + maxWords, words.length)
    if (end < words.length) {
      for (let cursor = end; cursor > start + 7; cursor -= 1) {
        if (/^(et|mais|puis|car|donc|alors|quand|si)$/i.test(words[cursor - 1])) {
          end = cursor - 1
          break
        }
      }
    }

    chunks.push(words.slice(start, end).join(' '))
    start = end
  }

  return chunks.filter(Boolean)
}

function capitalizeSentence(text: string): string {
  const cleaned = normalize(text)
  if (!cleaned) return ''
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function enforceShortSentences(text: string): string {
  const normalized = simplifyText(text)
    .replace(/[;]+/g, '. ')
    .replace(/\s*,\s*/g, '. ')

  const fragments = normalized
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^(et|mais|puis|car|donc|alors)\s+/i, '').trim())
    .filter(Boolean)

  const sentences = fragments.flatMap((fragment) => chunkSentence(fragment))

  return sentences
    .map((sentencePart) => capitalizeSentence(sentencePart))
    .filter(Boolean)
    .join('. ')
    .trim()
}

function resolveYearlyUserPlan(value: UserPlan | null | undefined): UserPlan {
  return normalizeUserPlan(value ?? DEFAULT_YEARLY_USER_PLAN)
}

function splitAnnualSentences(text: string): string[] {
  return normalize(text)
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function limitAnnualSentences(text: string, maxSentences: number): string {
  return splitAnnualSentences(text)
    .slice(0, maxSentences)
    .join('. ')
    .trim()
}

function formatAnnualBodyLine(text: string): string {
  const simplified = enforceShortSentences(text)
  return simplified ? `${simplified}.`.replace(/\.\./g, '.') : ''
}

function polishAnnualLine(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  if (ANNUAL_HEADING_PATTERN.test(trimmed)) return trimmed

  const prefixedPatterns = [
    /^(TA LIGNE DIRECTRICE\s+20\d{2}:\s+)(.+)$/i,
    /^(\d+\.\s+)(.+)$/i,
    /^(Pourquoi:\s+)(.+)$/i,
    /^(Dans la vraie vie:\s+)(.+)$/i,
    /^(Cle simple:\s+)(.+)$/i,
    /^(Debut d annee:\s+)(.+)$/i,
    /^(Milieu d annee:\s+)(.+)$/i,
    /^(Fin d annee:\s+)(.+)$/i,
    /^(Action\s+\d+:\s+)(.+)$/i,
    /^(-\s+)(.+)$/i,
  ]

  for (const pattern of prefixedPatterns) {
    const match = trimmed.match(pattern)
    if (!match) continue
    const [, prefix, body] = match
    const polishedBody = pattern.source.startsWith('^(\\d')
      ? simplifyText(body)
      : formatAnnualBodyLine(body)
    return `${prefix}${polishedBody}`.trim()
  }

  return formatAnnualBodyLine(trimmed)
}

function polishYearlyPriorityAnswer(text: string): string {
  return text
    .split('\n')
    .map((line) => polishAnnualLine(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isMeaningfulAnnualEvidence(text: string): boolean {
  const normalized = normalize(text)
    .toLowerCase()
    .replace(/[’']/g, ' ')

  if (!normalized) return false

  const informativeTokens = normalized
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !ANNUAL_EVIDENCE_FILLER_WORDS.has(token))

  return informativeTokens.length >= 2 || normalized.length >= 28
}

function sanitizeAnnualEvidence(text: string): string | null {
  const cleaned = sanitizeAnnualContent(text)
  return isMeaningfulAnnualEvidence(cleaned) ? cleaned : null
}

function sentence(value: string | null | undefined): string {
  const cleaned = sanitizeAnnualContent(value ?? '')
  if (!cleaned) return ''
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function compact(value: string, maxChars = 165): string {
  const cleaned = sanitizeAnnualContent(value)
  if (cleaned.length <= maxChars) return cleaned
  const cut = cleaned.lastIndexOf(' ', maxChars)
  return `${cleaned.slice(0, cut > 90 ? cut : maxChars).trim()}...`
}

function flattenScalarTexts(value: unknown, limit = 6, bucket: string[] = []): string[] {
  if (bucket.length >= limit || value === null || value === undefined) return bucket

  if (typeof value === 'string') {
    const cleaned = normalize(value)
    if (cleaned) bucket.push(cleaned)
    return bucket
  }

  if (typeof value === 'number') {
    bucket.push(String(value))
    return bucket
  }

  if (typeof value === 'boolean') {
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
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null
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
  if (unwrapped) return sanitizeAnnualEvidence(unwrapped)

  if (typeof value === 'string') return sanitizeAnnualEvidence(value)
  if (typeof value === 'number') return sanitizeAnnualEvidence(String(value))
  if (typeof value === 'boolean') return null

  if (Array.isArray(value)) {
    const parts = flattenScalarTexts(value, 4)
      .map((entry) => sanitizeAnnualEvidence(entry))
      .filter((entry): entry is string => Boolean(entry))
    return parts.length > 0 ? sanitizeAnnualEvidence(parts.join(', ')) : null
  }

  return null
}

function extractRequestedYear(message: string): string {
  const match = message.match(/\b(20\d{2})\b/)
  if (match) return match[1]

  if (/\bcette annee\b|\bmon annee\b|\bthis year\b/i.test(message)) {
    return String(new Date().getFullYear())
  }

  return String(new Date().getFullYear())
}

function familyFromSignal(signal: StructuredSignal | null): AnnualFamily | null {
  if (!signal) return null
  const key = normalize(signal.subCategory).toLowerCase()

  if (/annual_guidance|solar_return|fusion_general|fusion_timing|fusion_decision/.test(key)) return 'cap'
  if (/progressions|lunar_return/.test(key)) return 'maturation'
  if (/hd_current_transits|hd_current_cycle/.test(key)) return 'alignement'
  if (/transits|timing/.test(key)) return 'rythme'
  if (/kua/.test(key)) return 'direction'
  if (/num_personal_year|numerology|cycle/.test(key)) return 'cycle'

  return 'cap'
}

function describePersonalYear(signal: StructuredSignal): string | null {
  const numberCandidate = findByPaths(signal.value, [
    'yearly.personalYearNumber',
    'personalYearNumber',
    'personalYear',
  ])

  const number = typeof numberCandidate === 'number'
    ? numberCandidate
    : typeof numberCandidate === 'string'
      ? Number(numberCandidate)
      : null

  if (!number || !Number.isFinite(number)) return null

  const map: Record<number, string> = {
    1: 'un cycle d initiative et de relance nette',
    2: 'un cycle d alliance, de patience strategique et d ajustement relationnel',
    3: 'un cycle d expression, de visibilite utile et de mise en mouvement',
    4: 'un cycle de structure, de cadre et de fondations solides',
    5: 'un cycle de mouvement, de tri rapide et de reconfiguration',
    6: 'un cycle de responsabilite, d engagement durable et de stabilisation',
    7: 'un cycle de recul, d approfondissement et de recentrage',
    8: 'un cycle de consolidation, de responsabilite et de resultats mesurables',
    9: 'un cycle de cloture, de tri final et de detachement utile',
  }

  return map[number] ?? `un cycle ${number} qui demande une lecture plus strategique de tes priorites`
}

function describeSignal(signal: StructuredSignal | null): string {
  if (!signal) return 'ton annee demande un tri net des engagements et une meilleure allocation de ton energie'

  if (signal.subCategory === 'num_personal_year') {
    const personalYear = describePersonalYear(signal)
    if (personalYear) return personalYear
  }

  const exactPaths: Record<string, string[]> = {
    annual_guidance: ['publicSummary', 'summary', 'message'],
    astro_solar_return: ['annual_theme', 'theme', 'emphasis', 'summary'],
    astro_progressions: ['secondary_progressions.moon', 'moon', 'progressed_moon', 'summary'],
    astro_lunar_return: ['theme', 'summary', 'annual_theme'],
    astro_transits_current: ['summary', 'saturn', 'mars', 'moon', 'sun'],
    astro_transits_timing: ['summary', 'saturn', 'mars', 'moon', 'sun'],
    hd_current_transits: ['current_cycle', 'summary'],
    hd_current_cycle: ['current_cycle', 'summary'],
    kua_annual_influence: ['summary', 'annualInfluence', 'annualDirection'],
    kua_favorable_directions: ['favorable_directions', 'favorableDirections', 'summary'],
  }

  const candidate = stringifyCandidate(findByPaths(signal.value, exactPaths[signal.subCategory] ?? ['summary', 'message']))
  if (candidate) return compact(candidate)

  const firstScalar = stringifyCandidate(flattenScalarTexts(signal.value, 3)[0] ?? null)
  if (firstScalar) return compact(firstScalar)

  switch (familyFromSignal(signal)) {
    case 'cap':
      return 'il faut fermer des projets ouverts, clarifier les engagements prioritaires et choisir un cap qui guide vraiment l execution'
    case 'maturation':
      return 'un projet, une decision ou une prise de parole doit etre retravaille avant d etre expose dans le reel'
    case 'rythme':
      return 'l execution peut accelerer, mais seulement sur quelques actions qui donnent deja des resultats visibles'
    case 'alignement':
      return 'tes engagements doivent etre tries plus severement pour que ton energie soutienne ce qui avance vraiment'
    case 'direction':
      return 'ton cadre quotidien doit mieux soutenir l execution: agenda, espace, priorites visibles et points de friction'
    case 'cycle':
      return 'le cycle en cours favorise les resultats mesurables, les engagements tenables et la fermeture des projets ouverts sans preuve'
    default:
      return 'l annee demande de fermer des projets ouverts et de clarifier les engagements qui meritent encore ton energie'
  }
}

function priorityTemplate(family: AnnualFamily, year: string): PriorityTemplate {
  switch (family) {
    case 'maturation':
      return {
        title: 'Maturer avant d exposer',
        orientationAxis: 'maturation de fond et positionnement plus juste',
        orientationMeaning: 'ce qui compte ne doit pas sortir trop tot; la qualite prime sur la vitesse d affichage',
        whyPriority: `En ${year}, cette priorite compte parce que ce qui est encore flou ou trop brut perdra de sa force si tu le pousses trop vite.`,
        realLife: 'Reprends ce qui est prometteur mais encore brouillon, affine le fond, teste-le sur un terrain limite, puis seulement ensuite rends-le visible.',
        pitfall: 'Montrer trop tot quelque chose qui n a pas encore passe le test du reel.',
        timingStart: `Observe ce qui murit reellement en debut de ${year} et retire ce qui demande encore trop d effort pour trop peu de clarte.`,
        timingMiddle: 'Expose seulement ce qui a gagne en solidite et en coherence.',
        timingEnd: 'Consolide ce qui a tenu dans la duree et laisse tomber ce qui reste a moitie prepare.',
        immediateAction: 'Dans les 72 prochaines heures, reprends un projet ou une decision importante, clarifie ce qui manque encore, puis planifie un seul test concret avant toute exposition plus large.',
      }
    case 'rythme':
      return {
        title: 'Cadencer l execution',
        orientationAxis: 'acceleration selective et cadence mieux tenue',
        orientationMeaning: 'l annee ne te demande pas plus d activite, mais une meilleure lecture de la traction et du bon moment',
        whyPriority: `Cette priorite est centrale en ${year} parce que la qualite du rythme fera la difference entre avancee utile et dispersion epuisante.`,
        realLife: 'Travaille sur peu de sujets a forte traction, bloque des plages nettes de concentration, et evite les relances reactives qui te font changer de cap toutes les deux heures.',
        pitfall: 'Relancer dix sujets a la fois des que l anxiete ou la pression monte.',
        timingStart: `En debut de ${year}, lis d abord la traction reelle avant d ajouter de nouveaux chantiers.`,
        timingMiddle: 'Accelere franchement seulement la ou le reel repond deja et ou un axe devient plus evident.',
        timingEnd: 'Ralentis pour stabiliser le bon rythme au lieu de finir l annee dans l empilement.',
        immediateAction: 'Dans les 24 a 72 heures, bloque un creneau de 90 minutes sur un seul sujet a traction prouvee, puis supprime une relance ou une reunion qui brouille ton rythme.',
      }
    case 'alignement':
      return {
        title: 'Nettoyer tes oui',
        orientationAxis: 'selection energetique et engagements plus propres',
        orientationMeaning: 'ce qui t eleve cette annee ne vient pas d un plus grand volume, mais d une meilleure qualite de tes oui',
        whyPriority: `C est prioritaire cette annee parce que ton energie devient un filtre strategique: mal engagee, elle te disperse; bien engagee, elle clarifie tout le reste.`,
        realLife: 'Accepte moins de sollicitations, dis oui seulement quand le corps et le contexte repondent, et coupe les efforts qui consomment beaucoup sans produire de veritable avancee.',
        pitfall: 'Dire oui pour calmer la pression, rester agreable ou ne pas decevoir, puis avancer a vide.',
        timingStart: `Le debut de ${year} sert a nettoyer les sollicitations, les obligations parasites et les oui reflexes.`,
        timingMiddle: 'Engage-toi sur peu de sujets, mais engage-toi vraiment quand la reponse est claire.',
        timingEnd: 'Protege ton energie et mesure ce qui t a reellement nourrie ou epuisee.',
        immediateAction: 'Dans les 24 a 72 heures, liste les engagements qui te vident, ferme explicitement un non, puis confirme un seul oui vraiment aligne.',
      }
    case 'direction':
      return {
        title: 'Reconfigurer le cadre',
        orientationAxis: 'repositionnement concret du cadre et du cap',
        orientationMeaning: 'la clarte viendra moins d une grande revelation que d un meilleur alignement entre ton environnement, ton axe et tes decisions',
        whyPriority: `Cette priorite compte en ${year} parce que ton cadre quotidien soutient ou sabote directement ton cap: si le decor reste flou, l execution restera floue aussi.`,
        realLife: 'Simplifie ton environnement, redefinis le prochain cap visible, reordonne tes priorites de semaine, et fais converger tes decisions concretes avec l axe que tu veux vraiment tenir.',
        pitfall: 'Changer le decor, les outils ou l organisation sans changer la vraie decision de fond.',
        timingStart: `En debut de ${year}, reconfigure ton cadre: agenda, espace, priorites et points de friction visibles.`,
        timingMiddle: 'Fais converger tes choix de temps, d espace et d attention avec le cap retenu.',
        timingEnd: 'Stabilise les reperes qui ont vraiment soutenu ta direction et coupe le superflu.',
        immediateAction: 'Dans les 72 prochaines heures, choisis ton axe prioritaire, modifie un point concret de ton environnement pour le soutenir, puis rattache une action visible a cet axe.',
      }
    case 'cycle':
      return {
        title: 'Consolider ce qui tient',
        orientationAxis: 'consolidation, responsabilites utiles et resultats durables',
        orientationMeaning: 'l annee favorise ce qui se construit proprement, se mesure, et peut etre tenu dans la duree',
        whyPriority: `En ${year}, cette priorite est strategique parce que les resultats viendront davantage de la consolidation que d un nouveau grand saut mal prepare.`,
        realLife: 'Termine ce qui a deja de la valeur, renforce ce qui donne des resultats clairs, pose une base durable, et ferme les sujets qui restent eternellement au stade de l intention.',
        pitfall: 'Empiler des debuts enthousiasmants sans fermer, cadrer ni mesurer ce qui doit vraiment grandir.',
        timingStart: `Le debut de ${year} sert a fermer les vieux fronts et a clarifier ce qui merite vraiment une base solide.`,
        timingMiddle: 'Mets l energie au milieu d annee sur la construction, le cadre et la preuve de resultat.',
        timingEnd: 'Consolide ce qui tient, mesure ce qui a vraiment avance et laisse mourir ce qui reste sans assise.',
        immediateAction: 'Dans les 48 a 72 heures, ferme un chantier sans elan reel et consacre un bloc de travail net a ce qui construit la base la plus durable de ton annee.',
      }
    case 'cap':
    default:
      return {
        title: 'Trier pour choisir',
        orientationAxis: 'tri strategique et structuration du cap',
        orientationMeaning: 'ce qui doit grandir cette annee passe par moins de fronts ouverts et plus de choix assumes',
        whyPriority: `Cette priorite est decisive en ${year} parce qu un cap brouille disperse tes ressources, alors qu un cap assume rend l execution beaucoup plus lisible.`,
        realLife: 'Trie tes projets, nomme clairement ta priorite numero un, coupe les engagements tiedes, et cesse de traiter au meme niveau ce qui est central et ce qui est secondaire.',
        pitfall: 'Garder des projets tiedes ouverts pour ne decevoir personne et finir par diluer ton axe principal.',
        timingStart: `Le debut de ${year} sert a faire l inventaire, nommer le cap et sortir des engagements qui n ont plus de vraie traction.`,
        timingMiddle: 'Mets ensuite tes moyens uniquement sur ce qui confirme ce cap dans le reel.',
        timingEnd: 'Stabilise la priorite choisie et coupe ce qui voudrait rouvrir la dispersion.',
        immediateAction: 'Dans les 24 a 72 heures, ecris noir sur blanc tes 3 vraies priorites, reporte un engagement secondaire et bloque un premier livrable visible sur la priorite numero un.',
      }
  }
}

function focusAngleLead(angle: YearlyFocusAngle, year: string, userPlan: UserPlan): string {
  switch (angle) {
    case 'concentration':
      return userPlan === 'free'
        ? `En ${year}, avance sur moins de fronts.`
        : userPlan === 'essentiel'
          ? `En ${year}, le vrai gain vient de moins de fronts et de plus de tenue.`
          : userPlan === 'praticien'
            ? `En ${year}, la progression vient d une concentration nette sur ce qui prend deja du poids.`
            : `En ${year}, la bonne question n est pas quoi ajouter, mais ou concentrer tes moyens pour obtenir le plus d effet.`
    case 'direction_choice':
      return userPlan === 'free'
        ? `En ${year}, tu avances si tu choisis une direction claire.`
        : userPlan === 'essentiel'
          ? `En ${year}, une bonne decision vaut plus que trois options ouvertes.`
          : userPlan === 'praticien'
            ? `En ${year}, l avancee depend d un axe clair qui gouverne enfin tes choix et tes renoncements.`
            : `En ${year}, tu avances quand une direction claire prend le dessus sur les options concurrentes.`
    case 'stop_cut_remove':
      return userPlan === 'free'
        ? `En ${year}, tu avances d abord en retirant ce qui te freine.`
        : userPlan === 'essentiel'
          ? `En ${year}, enlever le secondaire te redonne de la place pour l essentiel.`
          : userPlan === 'praticien'
            ? `En ${year}, ce que tu retires conditionne directement ce que tu peux porter proprement ensuite.`
            : `En ${year}, ta progression depend d abord de ce que tu arretes, refuses ou retires de ton champ.`
    case 'energy_leak':
      return userPlan === 'free'
        ? `En ${year}, tu avances si tu coupes ce qui te vide.`
        : userPlan === 'essentiel'
          ? `En ${year}, ton energie revient quand tu fermes les drains repetitifs.`
          : userPlan === 'praticien'
            ? `En ${year}, l enjeu central est de retirer les drains repetes qui prennent du poids sur ton axe utile.`
            : `En ${year}, l enjeu n est pas d en faire plus, mais de stopper ce qui vide ton energie utile.`
    case 'execution_push':
      return userPlan === 'free'
        ? `En ${year}, tu avances si tu termines enfin ce que tu lances.`
        : userPlan === 'essentiel'
          ? `En ${year}, ton elan revient quand tu passes du projet au pas concret.`
          : userPlan === 'praticien'
            ? `En ${year}, la progression passe par une execution suivie, des preuves simples et un rythme qui tient.`
            : `En ${year}, tu progresses quand tu transformes enfin le cap en gestes repetes et visibles.`
    default:
      return `En ${year}, la progression la plus juste vient d une focalisation nette sur ce qui doit vraiment avancer.`
  }
}

function buildGuidingLine(year: string, focusAngle: YearlyFocusAngle, userPlan: UserPlan): string {
  switch (userPlan) {
    case 'free':
      switch (focusAngle) {
        case 'concentration':
          return `TA LIGNE DIRECTRICE ${year} : Reduis. Concentre. Avance.`
        case 'direction_choice':
          return `TA LIGNE DIRECTRICE ${year} : Choisis. Coupe. Tiens le cap.`
        case 'stop_cut_remove':
          return `TA LIGNE DIRECTRICE ${year} : Trie. Coupe. Stabilise.`
        case 'energy_leak':
          return `TA LIGNE DIRECTRICE ${year} : Protege. Coupe. Respire.`
        case 'execution_push':
          return `TA LIGNE DIRECTRICE ${year} : Lance. Termine. Recommence.`
        default:
          return `TA LIGNE DIRECTRICE ${year} : Clarifie. Choisis. Avance.`
      }
    case 'essentiel':
      switch (focusAngle) {
        case 'concentration':
          return `TA LIGNE DIRECTRICE ${year} : Garde peu de fronts. Fais avancer le bon.`
        case 'direction_choice':
          return `TA LIGNE DIRECTRICE ${year} : Choisis un axe. Aligne le reste dessus.`
        case 'stop_cut_remove':
          return `TA LIGNE DIRECTRICE ${year} : Retire ce qui freine. Garde ce qui tient.`
        case 'energy_leak':
          return `TA LIGNE DIRECTRICE ${year} : Coupe les fuites. Garde ton energie utile.`
        case 'execution_push':
          return `TA LIGNE DIRECTRICE ${year} : Avance par pas nets. Termine avant d ajouter.`
        default:
          return `TA LIGNE DIRECTRICE ${year} : Clarifie ton axe. Fais-le avancer.`
      }
    case 'praticien':
      switch (focusAngle) {
        case 'concentration':
          return `TA LIGNE DIRECTRICE ${year} : Coupe le bruit pour donner du poids a ce qui avance deja.`
        case 'direction_choice':
          return `TA LIGNE DIRECTRICE ${year} : Une direction claire vaut mieux que trois axes sous-alimentes.`
        case 'stop_cut_remove':
          return `TA LIGNE DIRECTRICE ${year} : Ce que tu retires cette annee conditionne ce que tu peux vraiment porter.`
        case 'energy_leak':
          return `TA LIGNE DIRECTRICE ${year} : La recuperation vient d abord du tri de tes drains repetitifs.`
        case 'execution_push':
          return `TA LIGNE DIRECTRICE ${year} : L elan vient d une execution suivie, pas d une relance ponctuelle.`
        default:
          return `TA LIGNE DIRECTRICE ${year} : Donne du poids a ce qui repond. Coupe le reste.`
      }
    case 'premium':
    default:
      switch (focusAngle) {
        case 'concentration':
          return `TA LIGNE DIRECTRICE ${year} : Reduis tes fronts pour faire grandir ce qui repond deja.`
        case 'direction_choice':
          return `TA LIGNE DIRECTRICE ${year} : Choisis une direction forte, puis retire les axes concurrents.`
        case 'stop_cut_remove':
          return `TA LIGNE DIRECTRICE ${year} : Coupe le secondaire pour redonner du poids a l essentiel.`
        case 'energy_leak':
          return `TA LIGNE DIRECTRICE ${year} : Protege ton energie pour la remettre au service de ton vrai cap.`
        case 'execution_push':
          return `TA LIGNE DIRECTRICE ${year} : Transforme ton cap en preuves concretes, semaine apres semaine.`
        default:
          return `TA LIGNE DIRECTRICE ${year} : Clarifie ton axe, puis fais converger tes moyens.`
      }
  }
}

function applyFocusAngleToTemplate(
  template: PriorityTemplate,
  selection: PrioritySelection,
  year: string,
  focusAngle: YearlyFocusAngle,
): PriorityTemplate {
  switch (focusAngle) {
    case 'concentration':
      switch (selection.family) {
        case 'cap':
          return {
            ...template,
            orientationAxis: 'concentration strategique et allocation nette des moyens',
            orientationMeaning: 'ce qui doit avancer cette annee demande moins de fronts ouverts et plus de ressources concentrees au bon endroit',
            ...(selection.isRadical ? {} : { title: 'Concentre le principal' }),
            whyPriority: `En ${year}, ta progression vient moins du volume que de la concentration de tes moyens sur ce qui repond deja dans le reel.`,
            realLife: 'Reduis le nombre de sujets actifs, protege un chantier central, et reserve ton meilleur temps a ce qui produit deja le plus de traction.',
          }
        case 'rythme':
          return {
            ...template,
            title: 'Protege tes plages fortes',
            whyPriority: `Cette annee, te concentrer ne veut pas dire en faire plus, mais defendre les moments ou ton attention produit vraiment quelque chose.`,
            realLife: 'Bloque des plages sans interruption, traite les urgences apres le bloc central, et evite de casser ton elan toutes les trente minutes.',
          }
        case 'alignement':
          return {
            ...template,
            title: 'Garde ton energie pour le bon oui',
            whyPriority: `En ${year}, la concentration depend aussi de ce que tu acceptes de ne plus porter quand cela mange ton energie sans renforcer l essentiel.`,
            realLife: 'Repousse une sollicitation secondaire, garde un seul engagement fort, et coupe ce qui consomme sans faire avancer.',
          }
        default:
          return template
      }

    case 'direction_choice':
      switch (selection.family) {
        case 'cap':
          return {
            ...template,
            title: selection.isRadical ? 'Choisis puis coupe' : 'Nommer le cap',
            orientationAxis: 'direction claire et arbitrage strategique',
            orientationMeaning: 'tu avances quand une ligne directrice nette gouverne tes choix et fait tomber les options concurrentes',
            whyPriority: `En ${year}, ton probleme n est pas un manque d options mais un manque d arbitrage clair sur celle qui doit structurer tes decisions.`,
            realLife: 'Formule ton axe en une phrase, compare chaque projet a cette phrase, et retire ce qui ouvre une direction concurrente.',
          }
        case 'direction':
          return {
            ...template,
            title: 'Choisis une ligne directrice',
            orientationAxis: 'ligne directrice claire et cadre coherent',
            orientationMeaning: 'la clarte vient d un axe assume, puis d un cadre qui le soutient dans le reel',
            whyPriority: `Cette priorite compte en ${year} parce qu une bonne direction doit devenir visible dans ton agenda, ton cadre et tes arbitrages de semaine.`,
            realLife: 'Choisis un axe central, fais converger ton temps avec lui, et retire les decisions qui entretiennent encore le flou.',
          }
        case 'alignement':
          return {
            ...template,
            title: 'Aligne tes oui sur ce cap',
            whyPriority: `En ${year}, ton cap restera theorique si tes oui, tes rendez-vous et tes efforts partent encore dans plusieurs directions a la fois.`,
            realLife: 'Dis oui seulement a ce qui renforce l axe retenu, ralentis le reste, et coupe les demandes qui reouvrent l indecision.',
          }
        case 'rythme':
          return {
            ...template,
            title: 'Mets ton temps au service d un axe',
            whyPriority: `Cette annee, ta cadence doit servir une direction choisie, pas seulement repondre a ce qui crie le plus fort.`,
            realLife: 'Place tes meilleurs creneaux sur le cap retenu, puis traite le secondaire apres au lieu de l inverse.',
          }
        default:
          return template
      }

    case 'stop_cut_remove':
      switch (selection.family) {
        case 'cap':
          return {
            ...template,
            orientationAxis: 'soustraction strategique et tri net',
            orientationMeaning: 'ce qui doit avancer cette annee a besoin de place reelle, pas d une accumulation de fronts tiedes',
            ...(selection.isRadical ? {} : { title: 'Ferme les fronts tiedes' }),
            whyPriority: `En ${year}, enlever ce qui n a plus d elan est plus utile que d ajouter un nouveau plan de progression.`,
            realLife: 'Ferme un projet qui stagne, retire un engagement de maintien, et laisse tomber ce qui occupe de la place sans produire de vrai mouvement.',
          }
        case 'alignement':
          return {
            ...template,
            title: 'Refuse ce qui te draine',
            whyPriority: `Cette annee, chaque oui par inertie te coute du temps, de l energie et de la disponibilite pour ce qui merite encore d avancer.`,
            realLife: 'Refuse une demande qui n est plus alignee, coupe une collaboration tiede, et retire une obligation que tu maintiens uniquement par habitude.',
          }
        case 'cycle':
          return {
            ...template,
            title: selection.isRadical ? 'Coupe les chantiers sans preuve' : 'Arrete ce qui ne tient pas',
            whyPriority: `En ${year}, ce qui ne montre ni resultat, ni traction, ni base solide doit cesser de monopoliser ton energie.`,
            realLife: 'Arrete un chantier qui reste au stade de l intention, supprime une tache de maintien sans impact, et renonce a relancer ce qui n a pas de preuve de vie.',
          }
        default:
          return template
      }

    case 'energy_leak':
      switch (selection.family) {
        case 'alignement':
          return {
            ...template,
            title: selection.isRadical ? 'Refuse ce qui te vide' : 'Repere les fuites d energie',
            orientationAxis: 'reprise en main des fuites d energie',
            orientationMeaning: 'ta clarte revient quand tu cesses d alimenter ce qui te vide sans nourrir ton axe',
            whyPriority: `En ${year}, tu recuperes plus d energie en coupant les drains repetitifs qu en cherchant a te motiver davantage.`,
            realLife: 'Observe ce qui te laisse vide apres coup, retire un oui reflexe, et garde ton energie pour les engagements qui te rendent plus nette au lieu de te brouiller.',
          }
        case 'rythme':
          return {
            ...template,
            title: selection.isRadical ? 'Stoppe la dispersion reactive' : 'Ralentis les fuites de temps',
            whyPriority: `Cette annee, une partie de ta fatigue vient de la dispersion micro-reactive plus que de la charge utile elle-meme.`,
            realLife: 'Coupe les relances inutiles, limite les changements de contexte, et arrete de traiter comme urgents des sujets qui ne meritaient meme pas ton attention.',
          }
        case 'cap':
          return {
            ...template,
            title: selection.isRadical ? 'Ferme les fronts qui te vident' : 'Trie ce qui te draine',
            whyPriority: `En ${year}, tant que des projets froids restent ouverts, ils continuent de te prendre de l energie de fond meme quand tu ne les traites pas.`,
            realLife: 'Ferme un front qui te suit mentalement depuis trop longtemps, coupe un projet sans elan, et retire un engagement qui te vide sans renforcer ton axe.',
          }
        default:
          return template
      }

    case 'execution_push':
      switch (selection.family) {
        case 'cap':
          return {
            ...template,
            title: selection.isRadical ? 'Coupe puis avance' : 'Pousse ce qui repond',
            orientationAxis: 'execution claire et progression visible',
            orientationMeaning: 'l annee te demande moins d intention et plus d avancee mesurable sur un axe deja choisi',
            whyPriority: `En ${year}, ta progression depend de ce que tu fais avancer chaque semaine, pas de ce que tu gardes seulement en tete.`,
            realLife: 'Choisis un chantier central, sors un livrable visible, et mesure ce qui avance vraiment au lieu de tout preparer en meme temps.',
          }
        case 'rythme':
          return {
            ...template,
            title: 'Accelere sur traction',
            orientationAxis: 'execution reguliere et acceleration utile',
            orientationMeaning: 'tu avances mieux quand tu renforces ce qui repond deja au lieu de repartir de zero',
            whyPriority: `Cette annee, l elan vient d une cadence tenue, pas d un gros sprint suivi d une coupure.`,
            realLife: 'Mets ton meilleur temps sur un sujet qui reagit deja, fais un pas visible, puis recommence la semaine suivante.',
          }
        case 'cycle':
          return {
            ...template,
            title: 'Passe du potentiel au resultat',
            orientationAxis: 'resultats visibles et base plus solide',
            orientationMeaning: 'l annee recompense ce qui devient concret, utile et tenable',
            whyPriority: `En ${year}, rester au stade du potentiel te bloque plus que le manque d idees.`,
            realLife: 'Termine une etape claire, montre une preuve de progression, et ferme ce qui reste toujours au stade du projet.',
          }
        case 'alignement':
          return {
            ...template,
            title: 'Garde ton elan pour l utile',
            whyPriority: `Cette annee, tu avances quand ton energie sert l execution au lieu de partir dans des oui secondaires.`,
            realLife: 'Retire une sollicitation parasite, garde ton energie pour un sujet central, et protege le temps de production reel.',
          }
        default:
          return template
      }

    default:
      return template
  }
}

function buildFocusedPriorityTemplate(
  selection: PrioritySelection,
  year: string,
  focusAngle: YearlyFocusAngle,
): PriorityTemplate {
  return applyFocusAngleToTemplate(buildPriorityTemplateForSelection(selection, year), selection, year, focusAngle)
}

function buildPriorityTemplateForSelection(selection: PrioritySelection, year: string): PriorityTemplate {
  const base = priorityTemplate(selection.family, year)

  if (!selection.isRadical) {
    return base
  }

  switch (selection.family) {
    case 'maturation':
      return {
        ...base,
        title: 'Ne montre pas trop tot',
        whyPriority: `En ${year}, montrer trop tot ce qui est encore en construction te ferait perdre en credibilite et en justesse.`,
        realLife: 'Stoppe les annonces prematurees, refuse de presenter un projet encore flou, et coupe les prises de parole qui te forcent a afficher avant d etre prete.',
      }
    case 'rythme':
      return {
        ...base,
        title: 'Stoppe l agitation reactive',
        whyPriority: `Cette annee, la vraie progression passe par moins de reactions impulsives et plus de cadence choisie.`,
        realLife: 'Stoppe les relances dans tous les sens, supprime une urgence artificielle, et refuse d ouvrir un nouveau front tant que le precedent n a pas prouve sa traction.',
      }
    case 'alignement':
      return {
        ...base,
        title: 'Refuse les oui flous',
        whyPriority: `En ${year}, chaque oui non aligne te retire de l energie sur ce qui devrait vraiment avancer.`,
        realLife: 'Refuse une demande qui te sort de ton axe, coupe une collaboration tiede, et supprime un engagement que tu maintiens seulement pour rester disponible.',
      }
    case 'direction':
      return {
        ...base,
        title: 'Supprime le bruit du cadre',
        whyPriority: `Cette annee, ton cadre doit soutenir ton cap; s il reste encombre, tu perdras en lisibilite et en execution.`,
        realLife: 'Supprime un rituel inutile, coupe un usage qui brouille ton attention, et refuse d empiler de nouveaux outils avant d avoir clarifie le cap.',
      }
    case 'cycle':
      return {
        ...base,
        title: 'Coupe les chantiers sans preuve',
        whyPriority: `En ${year}, ce qui ne montre ni traction ni resultat commence a couter plus qu a promettre.`,
        realLife: 'Coupe un projet qui ne bouge pas, supprime une tache de maintien sans impact, et refuse d alimenter un chantier qui reste au stade de l intention.',
      }
    case 'cap':
    default:
      return {
        ...base,
        title: 'Coupe le secondaire',
        whyPriority: `En ${year}, laisser ouverts des fronts tiedes te coute plus que ce qu ils t apportent; ta progression depend d un tri plus net.`,
        realLife: 'Coupe un projet secondaire, refuse une opportunite non alignee, et supprime un engagement qui disperse ton attention sans renforcer ton axe principal.',
      }
  }
}

function buildPrioritySignals(
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
): PrioritySelection[] {
  const chosen: PrioritySelection[] = []
  const seenFamilies = new Set<AnnualFamily>()
  const candidates = [...(openingSignal ? [openingSignal] : []), ...prioritizedSignals]

  for (const signal of candidates) {
    const family = familyFromSignal(signal)
    if (!family || seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal, family, isRadical: false })
    if (chosen.length === 3) break
  }

  for (const family of ['cap', 'rythme', 'cycle', 'alignement', 'direction', 'maturation'] as AnnualFamily[]) {
    if (chosen.length >= 3) break
    if (seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal: null, family, isRadical: false })
    if (chosen.length === 3) break
  }

  const radicalFamily =
    RADICAL_FAMILY_PRIORITY.find((family) => chosen.some((selection) => selection.family === family)) ??
    chosen[0]?.family ??
    null

  return chosen.map((selection) => ({
    ...selection,
    isRadical: selection.family === radicalFamily,
  }))
}

function buildOrientationPlanTail(
  userPlan: UserPlan,
  focusAngle: YearlyFocusAngle,
  primaryEvidence: string,
): string | null {
  switch (userPlan) {
    case 'essentiel':
      switch (focusAngle) {
        case 'concentration':
          return 'Ce qui marche deja doit prendre plus de place.'
        case 'direction_choice':
          return 'Le reste doit redevenir secondaire.'
        case 'stop_cut_remove':
          return 'Ce que tu retires te rend plus disponible.'
        case 'energy_leak':
          return 'Ce que tu coupes te rend plus nette.'
        case 'execution_push':
          return 'Ce que tu termines nourrit la suite.'
        default:
          return null
      }
    case 'premium':
      return primaryEvidence ? `Un point revient deja: ${primaryEvidence}` : null
    case 'praticien': {
      const practitionerTail =
        focusAngle === 'concentration'
          ? 'Si tout reste ouvert, rien ne prend vraiment de poids.'
          : focusAngle === 'direction_choice'
            ? 'Sans arbitrage, tes ressources restent divisees.'
            : focusAngle === 'stop_cut_remove'
              ? 'Ce que tu gardes par inertie continue de te couter.'
              : focusAngle === 'energy_leak'
                ? 'Chaque drain repete retire du poids a ton axe utile.'
                : 'Sans cadence visible, l elan retombe vite.'

      return primaryEvidence
        ? `Un point revient deja: ${primaryEvidence}. ${practitionerTail}`
        : practitionerTail
    }
    case 'free':
    default:
      return null
  }
}

function buildFreeOrientationSupport(focusAngle: YearlyFocusAngle): string {
  switch (focusAngle) {
    case 'concentration':
      return 'Garde le bon front. Coupe le reste.'
    case 'direction_choice':
      return 'Choisis une voie claire. Laisse le reste attendre.'
    case 'stop_cut_remove':
      return 'Ferme un poids mort. Garde de la place.'
    case 'energy_leak':
      return 'Coupe un drain net. Recupere ton energie.'
    case 'execution_push':
      return 'Finis un pas simple. Recommence vite.'
    default:
      return 'Choisis mieux. Coupe le reste.'
  }
}

function buildEssentialOrientationSupport(focusAngle: YearlyFocusAngle): string {
  switch (focusAngle) {
    case 'concentration':
      return 'Mets plus de temps sur ce qui avance deja. Arrete d ouvrir du secondaire.'
    case 'direction_choice':
      return 'Choisis un axe clair. Laisse les autres options en pause.'
    case 'stop_cut_remove':
      return 'Coupe ce qui ne sert plus. Garde seulement ce qui tient.'
    case 'energy_leak':
      return 'Ferme les drains repetes. Protege le temps qui te sert vraiment.'
    case 'execution_push':
      return 'Termine un pas visible. Evite de trop preparer.'
    default:
      return 'Garde le bon axe. Laisse le reste apres.'
  }
}

function buildPriorityWhyTail(
  userPlan: UserPlan,
  focusAngle: YearlyFocusAngle,
  evidence: string,
): string | null {
  if (userPlan === 'free') return null

  if (userPlan === 'essentiel') {
    switch (focusAngle) {
      case 'concentration':
        return 'Mets plus de temps sur ce qui avance deja.'
      case 'direction_choice':
        return 'Laisse les autres options en pause.'
      case 'stop_cut_remove':
        return 'Ce que tu retires te rend du temps clair.'
      case 'energy_leak':
        return 'Ce que tu coupes te rend de l energie utile.'
      case 'execution_push':
        return 'Ce que tu termines relance ton elan.'
      default:
        return null
    }
  }

  const evidenceTail = evidence ? `Un point revient deja: ${evidence}.` : ''

  if (userPlan === 'praticien') {
    const practitionerTail =
      focusAngle === 'concentration'
        ? 'Si tu ne concentres pas tes moyens, tout reste sous-alimente.'
        : focusAngle === 'direction_choice'
          ? 'Sans arbitrage, tu multiplies les fronts faibles.'
          : focusAngle === 'stop_cut_remove'
            ? 'Le maintien passif te coute plus que la coupure claire.'
            : focusAngle === 'energy_leak'
              ? 'Un drain repete finit par diriger ton annee a ta place.'
              : 'Sans preuve concrete, l execution retombe dans l intention.'

    return [evidenceTail, practitionerTail].filter(Boolean).join(' ')
  }

  return evidenceTail || null
}

function buildPriorityRealLifeTail(
  userPlan: UserPlan,
  focusAngle: YearlyFocusAngle,
): string | null {
  switch (userPlan) {
    case 'free':
      return null
    case 'essentiel':
      switch (focusAngle) {
        case 'concentration':
          return 'Garde un seul front ouvert.'
        case 'direction_choice':
          return 'Laisse deux options en pause.'
        case 'stop_cut_remove':
          return 'Ferme-le pour de vrai.'
        case 'energy_leak':
          return 'Recupere du temps et du calme.'
        case 'execution_push':
          return 'Sors un pas visible.'
        default:
          return null
      }
    case 'premium':
      switch (focusAngle) {
        case 'concentration':
          return 'Protege ton meilleur temps.'
        case 'direction_choice':
          return 'Fais converger ton agenda.'
        case 'stop_cut_remove':
          return 'Fais-le clairement.'
        case 'energy_leak':
          return 'Redeploie ce temps.'
        case 'execution_push':
          return 'Montre une preuve simple.'
        default:
          return null
      }
    case 'praticien':
      switch (focusAngle) {
        case 'concentration':
          return 'Observe ce qui prend du poids. Puis coupe le reste.'
        case 'direction_choice':
          return 'Teste l axe retenu une semaine. Puis mesure sa traction.'
        case 'stop_cut_remove':
          return 'Nomme la coupure. Puis retire le maintien passif.'
        case 'energy_leak':
          return 'Repere le drain. Puis redeploie cette marge sur le bon front.'
        case 'execution_push':
          return 'Sors une preuve. Puis fixe tout de suite la suite.'
        default:
          return null
      }
    default:
      return null
  }
}

function buildPrioritySimpleKey(
  selection: PrioritySelection,
  focusAngle: YearlyFocusAngle,
): string {
  switch (focusAngle) {
    case 'concentration':
      switch (selection.family) {
        case 'cap':
          return 'Moins de fronts donne plus d elan.'
        case 'rythme':
          return 'Ton meilleur temps vaut plus que ta disponibilite totale.'
        case 'alignement':
          return 'Chaque oui secondaire brouille ton axe.'
        default:
          return 'Ce qui compte a besoin de plus de place.'
      }
    case 'direction_choice':
      switch (selection.family) {
        case 'cap':
        case 'direction':
          return 'Une bonne direction simplifie le reste.'
        case 'alignement':
          return 'Tes oui doivent suivre ton axe.'
        default:
          return 'Choisir clarifie plus que reflechir encore.'
      }
    case 'stop_cut_remove':
      switch (selection.family) {
        case 'cap':
        case 'cycle':
          return 'Ce que tu retires te fait avancer.'
        case 'alignement':
          return 'Couper un drain vaut mieux qu ajouter un effort.'
        default:
          return 'L arret juste redonne de la place.'
      }
    case 'energy_leak':
      switch (selection.family) {
        case 'alignement':
        case 'rythme':
          return 'Ton energie revient quand tu fermes les drains repetes.'
        default:
          return 'Ce qui te vide ne doit plus diriger ton annee.'
      }
    case 'execution_push':
      switch (selection.family) {
        case 'cap':
        case 'cycle':
          return 'Ce que tu termines change vraiment l annee.'
        case 'rythme':
          return 'Un pas visible vaut mieux qu un grand plan.'
        default:
          return 'L action repetee cree l elan.'
      }
    default:
      return 'Ce qui est clair devient plus facile a porter.'
  }
}

function buildExtraPitfalls(
  focusAngle: YearlyFocusAngle,
  year: string,
): string[] {
  switch (focusAngle) {
    case 'concentration':
      return [
        sentence(`En ${year}, dire oui trop vite a chaque nouvelle demande.`),
        sentence('Rester occupe toute la journee sans finir une seule chose utile.'),
      ]
    case 'direction_choice':
      return [
        sentence(`En ${year}, changer d axe des qu une option plus seduisante apparait.`),
        sentence('Demander encore un avis quand la vraie decision est deja la.'),
      ]
    case 'stop_cut_remove':
      return [
        sentence(`En ${year}, garder un sujet mort juste pour ne pas fermer la porte.`),
        sentence('Reporter la coupure claire et continuer a payer le prix en silence.'),
      ]
    case 'energy_leak':
      return [
        sentence(`En ${year}, laisser ton agenda se remplir avant de proteger ton energie.`),
        sentence('Passer du temps sur des urgences qui ne t apportent rien de solide.'),
      ]
    case 'execution_push':
      return [
        sentence(`En ${year}, preparer encore alors qu un premier test peut sortir maintenant.`),
        sentence('Attendre le bon moment parfait au lieu de finir un pas simple.'),
      ]
    default:
      return [
        sentence(`En ${year}, disperser ton temps sur trop de fronts moyens.`),
        sentence('Confondre occupation et progression reelle.'),
      ]
  }
}

function buildTimingDirective(
  phase: 'start' | 'middle' | 'end',
  focusAngle: YearlyFocusAngle,
): string {
  if (phase === 'start') {
    switch (focusAngle) {
      case 'concentration':
        return 'Fais le tri. Evite les nouveaux fronts.'
      case 'direction_choice':
        return 'Choisis ton axe. Evite les options concurrentes.'
      case 'stop_cut_remove':
        return 'Ferme le secondaire. Evite de maintenir par habitude.'
      case 'energy_leak':
        return 'Repere les drains. Evite les oui reflexes.'
      case 'execution_push':
        return 'Lance un pas simple. Evite de trop preparer.'
      default:
        return 'Clarifie ton axe. Evite la dispersion.'
    }
  }

  if (phase === 'middle') {
    switch (focusAngle) {
      case 'concentration':
        return 'Renforce ce qui repond. Corrige la dispersion.'
      case 'direction_choice':
        return 'Renforce l axe choisi. Corrige les demi-choix.'
      case 'stop_cut_remove':
        return 'Tiens les coupures. Corrige les retours en arriere.'
      case 'energy_leak':
        return 'Protege ton energie. Corrige les pertes repetitives.'
      case 'execution_push':
        return 'Accelere sur preuve. Corrige les lenteurs inutiles.'
      default:
        return 'Renforce ce qui avance. Corrige le reste.'
    }
  }

  switch (focusAngle) {
    case 'concentration':
      return 'Garde ce qui tient. Laisse tomber le bruit.'
    case 'direction_choice':
      return 'Garde la bonne direction. Laisse tomber les detours.'
    case 'stop_cut_remove':
      return 'Garde la place creee. Laisse tomber les vieux retours.'
    case 'energy_leak':
      return 'Garde l energie recuperee. Laisse tomber les drains.'
    case 'execution_push':
      return 'Garde ce qui produit. Laisse tomber ce qui stagne.'
    default:
      return 'Garde ce qui marche. Laisse tomber le reste.'
  }
}

function buildImmediateActionSteps(
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string[] {
  const actionCount = YEARLY_PLAN_STYLES[userPlan].actionCount

  const byAngle: Record<YearlyFocusAngle, string[]> = {
    concentration: [
      'Choisis un seul front central pour les 72 prochaines heures.',
      'Bloque deux creneaux fixes pour ce front cette semaine.',
      'Coupe une demande secondaire avant vendredi.',
    ],
    direction_choice: [
      'Ecris ton axe en une phrase claire aujourd hui.',
      'Passe tes projets ouverts contre cette phrase demain.',
      'Ralentis ou coupe le chantier le moins aligne.',
    ],
    stop_cut_remove: [
      'Liste trois choses a arreter dans les 24 heures.',
      'Ferme-en une concretement cette semaine.',
      'Envoie le message qui officialise cet arret.',
    ],
    energy_leak: [
      'Note les trois situations qui te vident le plus.',
      'Coupe la plus lourde cette semaine.',
      'Redeploie ce temps sur un sujet qui te nourrit.',
    ],
    execution_push: [
      'Choisis un livrable simple a finir en 72 heures.',
      'Refais ce meme type de pas la semaine prochaine.',
      'Supprime une habitude qui retarde le passage a l action.',
    ],
  }

  return byAngle[focusAngle].slice(0, actionCount)
}

function buildPitfallTail(userPlan: UserPlan, family: AnnualFamily): string | null {
  if (userPlan === 'free' || userPlan === 'essentiel') return null

  if (userPlan === 'praticien') {
    switch (pitfallVarietyKey(family)) {
      case 'selection':
        return 'Tu gardes de la presence partout. Tu perds du poids nulle part.'
      case 'cadre':
        return 'Tu optimises le decor. Tu reportes l arbitrage.'
      case 'consolidation':
        return 'Tu entretiens le potentiel. Tu retardes la preuve.'
      case 'cadence':
        return 'Tu reponds au bruit. Tu nourris peu la traction.'
      case 'exposition':
      default:
        return 'Tu exposes avant maturite. Tu reviens ensuite corriger sous tension.'
    }
  }

  switch (pitfallVarietyKey(family)) {
    case 'selection':
      return 'Tu restes occupe. Tu n avances plus.'
    case 'cadre':
      return 'Tu changes l outil. Pas la decision.'
    case 'consolidation':
      return 'Tu relances trop. Tu ne mesures rien.'
    case 'cadence':
      return 'Tu reagis vite. Tu n executes pas vraiment.'
    case 'exposition':
    default:
      return 'Tu montres trop tot. Puis tu corriges sous pression.'
  }
}

function buildTimingTail(
  userPlan: UserPlan,
  focusAngle: YearlyFocusAngle,
  phase: 'start' | 'middle' | 'end',
): string | null {
  if (userPlan === 'free') return null

  if (userPlan === 'essentiel') {
    if (phase === 'start') {
      switch (focusAngle) {
        case 'concentration':
          return 'Garde peu de fronts.'
        case 'direction_choice':
          return 'Vois ce que tu veux vraiment garder.'
        case 'stop_cut_remove':
          return 'Liste ce que tu retires.'
        case 'energy_leak':
          return 'Repere ce qui te vide.'
        case 'execution_push':
          return 'Choisis un terrain simple.'
        default:
          return null
      }
    }

    if (phase === 'middle') {
      switch (focusAngle) {
        case 'concentration':
          return 'Donne plus de place a ce qui marche.'
        case 'direction_choice':
          return 'Aligne tes choix sur l axe retenu.'
        case 'stop_cut_remove':
          return 'Confirme les vraies coupures.'
        case 'energy_leak':
          return 'Remets ton energie au bon endroit.'
        case 'execution_push':
          return 'Fais un pas visible.'
        default:
          return null
      }
    }

    switch (focusAngle) {
      case 'concentration':
        return 'Stabilise le bon rythme.'
      case 'direction_choice':
        return 'Tiens la direction choisie.'
      case 'stop_cut_remove':
        return 'Ne rouvre pas le secondaire.'
      case 'energy_leak':
        return 'Garde la marge recuperee.'
      case 'execution_push':
        return 'Consolide ce qui a bouge.'
      default:
        return null
    }
  }

  if (userPlan === 'praticien') {
    switch (phase) {
      case 'start':
        return 'Ne relance rien par reflexe.'
      case 'middle':
        return 'Renforce seulement ce qui repond.'
      case 'end':
      default:
        return 'Ferme ce qui ne tient pas.'
    }
  }

  return null
}

function buildOrientation(
  year: string,
  priorities: PrioritySelection[],
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string {
  const primary = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }
  const primaryTemplate = buildFocusedPriorityTemplate(primary, year, focusAngle)
  const primaryEvidence = describeSignal(primary.signal)
  const secondary = priorities[1] ?? primary
  const stopSentence =
    secondary.family === 'alignement' || secondary.family === 'cap'
      ? 'Arrete de garder ouverts les fronts tiedes.'
      : secondary.family === 'rythme'
        ? 'Arrete de reagir a tout dans la minute.'
        : 'Arrete de nourrir ce qui ne tient pas.'
  const resultSentence =
    focusAngle === 'execution_push'
      ? 'Les resultats viennent de gestes simples et repetes.'
      : focusAngle === 'energy_leak'
        ? 'Les resultats viennent quand ton energie revient au bon endroit.'
        : 'Les resultats viennent quand ton axe devient plus visible.'

  if (userPlan === 'free') {
    return limitAnnualSentences(
      [focusAngleLead(focusAngle, year, userPlan), buildFreeOrientationSupport(focusAngle)].join(' '),
      YEARLY_PLAN_STYLES[userPlan].orientationSentences,
    )
  }

  if (userPlan === 'essentiel') {
    return limitAnnualSentences(
      [focusAngleLead(focusAngle, year, userPlan), buildEssentialOrientationSupport(focusAngle)].join(' '),
      YEARLY_PLAN_STYLES[userPlan].orientationSentences,
    )
  }

  return limitAnnualSentences(
    [
      focusAngleLead(focusAngle, year, userPlan),
      `Le mouvement dominant prend la forme de ${primaryTemplate.orientationAxis}: ${primaryTemplate.orientationMeaning}`,
      buildOrientationPlanTail(userPlan, focusAngle, primaryEvidence),
      stopSentence,
      resultSentence,
    ]
      .filter(Boolean)
      .join(' '),
    YEARLY_PLAN_STYLES[userPlan].orientationSentences,
  )
}

function buildPriorityBlock(
  year: string,
  selection: PrioritySelection,
  index: number,
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string {
  const template = buildFocusedPriorityTemplate(selection, year, focusAngle)
  const evidence = describeSignal(selection.signal)
  const style = YEARLY_PLAN_STYLES[userPlan]
  const whyText = limitAnnualSentences(
    [template.whyPriority, buildPriorityWhyTail(userPlan, focusAngle, evidence)].filter(Boolean).join(' '),
    style.whySentences,
  )
  const realLifeText = limitAnnualSentences(
    [template.realLife, buildPriorityRealLifeTail(userPlan, focusAngle)].filter(Boolean).join(' '),
    style.realLifeSentences,
  )

  if (userPlan === 'free') {
    return `${index}. ${sentence(adaptPriorityLabel(template.title, focusAngle)).replace(/[.]$/, '')}`
  }

  return [
    `${index}. ${adaptPriorityLabel(template.title, focusAngle)}`,
    `Pourquoi: ${sentence(whyText)}`,
    `Dans la vraie vie: ${sentence(realLifeText)}`,
    style.showSimpleKey
      ? `Cle simple: ${sentence(limitAnnualSentences(buildPrioritySimpleKey(selection, focusAngle), style.keySentences))}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')
}

function pitfallVarietyKey(family: AnnualFamily): string {
  switch (family) {
    case 'cap':
    case 'alignement':
      return 'selection'
    case 'direction':
      return 'cadre'
    case 'cycle':
      return 'consolidation'
    case 'rythme':
      return 'cadence'
    case 'maturation':
    default:
      return 'exposition'
  }
}

function buildPitfalls(
  year: string,
  priorities: PrioritySelection[],
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string {
  const pitfalls: string[] = []
  const seenVarietyKeys = new Set<string>()
  const style = YEARLY_PLAN_STYLES[userPlan]

  for (const selection of priorities) {
    const varietyKey = pitfallVarietyKey(selection.family)
    if (seenVarietyKeys.has(varietyKey)) continue
    seenVarietyKeys.add(varietyKey)
    const pitfallText = limitAnnualSentences(
      [priorityTemplate(selection.family, year).pitfall, buildPitfallTail(userPlan, selection.family)]
        .filter(Boolean)
        .join(' '),
      style.pitfallSentences,
    )
    pitfalls.push(sentence(pitfallText))
    if (pitfalls.length === style.pitfallCount) break
  }

  const completedPitfalls = [
    ...pitfalls,
    ...buildExtraPitfalls(focusAngle, year),
  ].slice(0, style.pitfallCount)

  return completedPitfalls.map((entry) => `- ${entry}`).join('\n')
}

function timingLead(phase: 'start' | 'middle' | 'end', family: AnnualFamily): string {
  if (phase === 'start') {
    switch (family) {
      case 'maturation':
        return 'Observe et trie'
      case 'rythme':
        return 'Cadre et trie'
      case 'alignement':
        return 'Nettoie et trie'
      case 'direction':
        return 'Reorganise et trie'
      case 'cycle':
        return 'Trie et ferme'
      case 'cap':
      default:
        return 'Trie et clarifie'
    }
  }

  if (phase === 'middle') {
    switch (family) {
      case 'maturation':
        return 'Teste sans surexposer'
      case 'rythme':
        return 'Accelere sur preuve'
      case 'alignement':
        return 'Engage-toi nettement'
      case 'direction':
        return 'Repositionne et execute'
      case 'cycle':
        return 'Construis et mesure'
      case 'cap':
      default:
        return 'Teste et accelere'
    }
  }

  switch (family) {
    case 'maturation':
      return 'Consolide ce qui a tenu'
    case 'rythme':
      return 'Stabilise le rythme'
    case 'alignement':
      return 'Consolide les bons oui'
    case 'direction':
      return 'Fixe le cadre'
    case 'cycle':
      return 'Consolide les resultats'
    case 'cap':
    default:
      return 'Consolide sans rouvrir'
  }
}

function buildTiming(year: string, priorities: PrioritySelection[], focusAngle: YearlyFocusAngle, userPlan: UserPlan): string {
  const first = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }
  const second = priorities[1] ?? first
  const third = priorities[2] ?? second

  const firstTemplate = priorityTemplate(first.family, year)
  const secondTemplate = priorityTemplate(second.family, year)
  const thirdTemplate = priorityTemplate(third.family, year)
  const style = YEARLY_PLAN_STYLES[userPlan]

  const buildTimingLine = (
    label: string,
    phase: 'start' | 'middle' | 'end',
    family: AnnualFamily,
    detail: string,
  ) => {
    const compactText = [
      buildTimingDirective(phase, focusAngle),
      userPlan === 'free' ? null : detail,
      buildTimingTail(userPlan, focusAngle, phase),
    ]
      .filter(Boolean)
      .join(' ')

    return `${label}: ${sentence(limitAnnualSentences(compactText, style.timingSentences))}`
  }

  return [
    buildTimingLine('Debut d annee', 'start', first.family, firstTemplate.timingStart),
    buildTimingLine('Milieu d annee', 'middle', second.family, secondTemplate.timingMiddle),
    buildTimingLine('Fin d annee', 'end', third.family, thirdTemplate.timingEnd),
  ].join('\n')
}

function buildImmediateAction(year: string, primary: PrioritySelection): string {
  const template = priorityTemplate(primary.family, year)
  return sentence(template.immediateAction)
}

function focusAngleImmediateAction(
  year: string,
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string | null {
  if (userPlan === 'free') {
    switch (focusAngle) {
      case 'concentration':
        return 'Dans les 24 a 72 heures, choisis un seul sujet et bloque un creneau pour lui.'
      case 'direction_choice':
        return 'Dans les 24 a 72 heures, ecris ton axe et coupe un sujet secondaire.'
      case 'stop_cut_remove':
        return 'Dans les 24 a 72 heures, liste trois arrets et ferme-en un.'
      case 'energy_leak':
        return 'Dans les 24 a 72 heures, repere ta plus grosse fuite et coupe-la.'
      case 'execution_push':
        return 'Dans les 24 a 72 heures, termine un pas simple et visible.'
      default:
        return null
    }
  }

  if (userPlan === 'essentiel') {
    switch (focusAngle) {
      case 'concentration':
        return 'Dans les 24 a 72 heures, choisis deux priorites maximum. Bloque un creneau net pour la premiere.'
      case 'direction_choice':
        return 'Dans les 24 a 72 heures, ecris ton axe en une phrase. Ralentis le chantier le moins aligne.'
      case 'stop_cut_remove':
        return 'Dans les 24 a 72 heures, liste trois arrets. Ferme-en un. Envoie le message utile.'
      case 'energy_leak':
        return 'Dans les 24 a 72 heures, note trois drains. Coupe-en un. Redeploie ce temps sur le bon front.'
      case 'execution_push':
        return 'Dans les 24 a 72 heures, choisis un livrable court. Termine-le. Fixe ensuite le prochain pas.'
      default:
        return null
    }
  }

  if (userPlan === 'praticien') {
    switch (focusAngle) {
      case 'concentration':
        return 'Dans les 24 a 72 heures, nomme ton front prioritaire. Coupe un front concurrent. Verrouille deux plages de travail protegées.'
      case 'direction_choice':
        return 'Dans les 24 a 72 heures, formule l axe directeur. Passe chaque chantier contre ce filtre. Retire celui qui dilue le plus la direction.'
      case 'stop_cut_remove':
        return 'Dans les 24 a 72 heures, nomme trois arrets. Officialise le premier. Supprime ensuite le maintien passif qui lui restait accroche.'
      case 'energy_leak':
        return 'Dans les 24 a 72 heures, identifie le drain principal. Coupe-le. Redeploie aussitot cette marge sur le front qui compte.'
      case 'execution_push':
        return 'Dans les 24 a 72 heures, sors une preuve simple. Mesure-la. Fixe ensuite la prochaine preuve avant la fin de semaine.'
      default:
        return null
    }
  }

  switch (focusAngle) {
    case 'concentration':
      return `Dans les 24 a 72 heures, choisis un seul chantier central, bloque deux plages de concentration pour lui, et reporte explicitement une demande secondaire.`
    case 'direction_choice':
      return `Dans les 24 a 72 heures, ecris ton axe directeur en une phrase, compare-lui tes trois chantiers ouverts, puis coupe celui qui l affaiblit.`
    case 'stop_cut_remove':
      return `Dans les 24 a 72 heures, liste trois choses a arreter, ferme-en une concretement, puis envoie le message qui officialise cet arret.`
    case 'energy_leak':
      return `Dans les 24 a 72 heures, note les trois situations qui te vident le plus, coupe-en une cette semaine, puis redeploie ce temps sur ce qui nourrit vraiment ton axe.`
    case 'execution_push':
      return `Dans les 24 a 72 heures, choisis un livrable simple, termine-le, puis fixe le prochain pas avant la fin de la semaine.`
    default:
      return null
  }
}

function buildImmediateActionWithAngle(
  year: string,
  primary: PrioritySelection,
  focusAngle: YearlyFocusAngle,
  userPlan: UserPlan,
): string {
  const baseActions = buildImmediateActionSteps(focusAngle, userPlan)
  const fallbackAction = focusAngleImmediateAction(year, focusAngle, userPlan) ?? buildImmediateAction(year, primary)
  const actions = baseActions.length > 0 ? baseActions : [fallbackAction]

  return actions
    .slice(0, YEARLY_PLAN_STYLES[userPlan].actionCount)
    .map((action, index) => `Action ${index + 1}: ${sentence(limitAnnualSentences(action, 1))}`)
    .join('\n')
}

export function buildYearlyPriorityAnswer(input: YearlyPriorityAnswerInput): string {
  const prioritizedSignals = input.prioritizedSignals.slice(0, 8)
  const openingSignal = input.openingSignal?.signal ?? prioritizedSignals[0] ?? null
  const year = extractRequestedYear(input.userMessage)
  const focusAngle = input.focusAngle ?? detectYearlyFocusAngle(input.userMessage)
  const userPlan = resolveYearlyUserPlan(input.userPlan)
  const priorities = buildPrioritySignals(openingSignal, prioritizedSignals)
  const primary = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }

  const rawAnswer = [
    `ORIENTATION ${year}`,
    buildGuidingLine(year, focusAngle, userPlan),
    buildOrientation(year, priorities, focusAngle, userPlan),
    '',
    'TES 3 PRIORITES REELLES',
    priorities
      .map((selection, index) => buildPriorityBlock(year, selection, index + 1, focusAngle, userPlan))
      .join('\n\n'),
    '',
    'CE QUI VA TE FREINER',
    buildPitfalls(year, priorities, focusAngle, userPlan),
    '',
    'TON TIMING',
    buildTiming(year, priorities, focusAngle, userPlan),
    '',
    'ACTION IMMEDIATE',
    buildImmediateActionWithAngle(year, primary, focusAngle, userPlan),
  ].join('\n')

  return sanitizeYearlyPriorityRenderedText(polishYearlyPriorityAnswer(rawAnswer), { userPlan })
}

function extractPrioritySection(text: string): string {
  const match = text.match(
    /TES\s+3\s+PRIORITES\s+REELLES\b\s*:?\s*([\s\S]*?)(?:\n\s*CE\s+QUI\s+VA\s+TE\s+FREINER\b|$)/i,
  )

  return match?.[1]?.trim() ?? ''
}

function extractPriorityBlocks(text: string): string[] {
  const section = extractPrioritySection(text)
  if (!section) return []

  const lines = section.split('\n')
  const blocks: string[] = []
  let current: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      if (current.length > 0) current.push('')
      continue
    }

    if (/^\d+[.)]\s+/.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join('\n').trim())
      }
      current = [line]
      continue
    }

    if (current.length > 0) {
      current.push(line)
    }
  }

  if (current.length > 0) {
    blocks.push(current.join('\n').trim())
  }

  return blocks.filter(Boolean)
}

function extractAnnualSection(text: string, heading: string, nextHeading?: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedNextHeading = nextHeading?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `${escapedHeading}\\s*\\n([\\s\\S]*?)(?:\\n\\s*${escapedNextHeading ?? '$'}|$)`,
    'i',
  )

  return text.match(pattern)?.[1]?.trim() ?? ''
}

function normalizeYearlyPriorityTextForValidation(text: string): string {
  return (text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .split('\n')
    .map((line) =>
      line
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[*_`~]+/g, '')
        .replace(/^\s*#{1,6}\s*/, '')
        .replace(/^\s*>\s*/, '')
        .replace(/^\s*[-+]\s+(?=(?:ORIENTATION|TES|CE|TON|ACTION)\b)/i, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .join('\n')
}

type ValidateYearlyPriorityAnswerOptions = {
  userPlan?: UserPlan | null
}

function resolveYearlyValidationProfile(userPlan?: UserPlan | null): YearlyValidationProfile {
  return YEARLY_VALIDATION_PROFILES[resolveYearlyUserPlan(userPlan)]
}

export function validateYearlyPriorityAnswerFormat(
  text: string,
  options?: ValidateYearlyPriorityAnswerOptions,
): YearlyPriorityValidation {
  const normalizedText = normalizeYearlyPriorityTextForValidation(text)
  const cleaned = normalize(normalizedText)
  const issues: string[] = []
  const userPlan = resolveYearlyUserPlan(options?.userPlan)
  const validationProfile = resolveYearlyValidationProfile(userPlan)
  const prioritySection = extractPrioritySection(normalizedText)
  const pitfallSection = extractAnnualSection(normalizedText, 'CE QUI VA TE FREINER', 'TON TIMING')
  const actionSection = extractAnnualSection(normalizedText, 'ACTION IMMEDIATE')
  const priorityBlocks = extractPriorityBlocks(normalizedText)
  const requiredHeadings = [
    /ORIENTATION\s+20\d{2}\b/i,
    /TES\s+3\s+PRIORITES\s+REELLES\b/i,
    /CE\s+QUI\s+VA\s+TE\s+FREINER\b/i,
    /TON\s+TIMING\b/i,
    /ACTION\s+IMMEDIATE\b/i,
  ]
  const disallowedPatterns = [
    /CE QUI SE PASSE/i,
    /POURQUOI\s+(?:CA|\u00C7A)\s+BLOQUE/i,
    /CE QUE TU DOIS FAIRE/i,
    /CLE\s+A\s+RETENIR/i,
    /SPH(?:ERE|\u00C8RE|\u00E8RE)/i,
  ]

  for (const pattern of requiredHeadings) {
    if (!pattern.test(cleaned)) issues.push(`missing_heading:${pattern.source}`)
  }

  for (const pattern of disallowedPatterns) {
    if (pattern.test(cleaned)) issues.push(`disallowed_block:${pattern.source}`)
  }

  const priorityCount = (prioritySection.match(PRIORITY_LINE_PATTERN) ?? []).length
  const pitfallCount = (pitfallSection.match(/^\s*-\s+/gm) ?? []).length
  const actionCount = (actionSection.match(/^\s*Action\s+\d+:\s+/gim) ?? []).length
  const pitfallHasContent = Boolean(normalize(pitfallSection))
  const actionHasContent = Boolean(normalize(actionSection))
  if (priorityCount !== 3) issues.push(`invalid_priority_count:${priorityCount}`)
  if (
    pitfallCount > validationProfile.maxPitfalls ||
    (
      pitfallCount < validationProfile.minPitfalls &&
      !((userPlan === 'free' || userPlan === 'essentiel') && pitfallHasContent)
    )
  ) {
    issues.push(`invalid_pitfall_count:${pitfallCount}`)
  }
  if (
    actionCount > validationProfile.maxActions ||
    (validationProfile.requireNumberedActions
      ? actionCount < validationProfile.minActions
      : actionCount < validationProfile.minActions && !actionHasContent)
  ) {
    issues.push(`invalid_action_count:${actionCount}`)
  }
  if (validationProfile.requireRadicalPriority && !priorityBlocks.some((block) => RADICAL_PRIORITY_PATTERN.test(block))) {
    issues.push('missing_radical_priority')
  }
  if (validationProfile.requireWhy && !priorityBlocks.every((block) => /Pourquoi:/i.test(block))) {
    issues.push('missing_priority_why')
  }
  if (validationProfile.requireRealLife && !priorityBlocks.every((block) => /Dans la vraie vie:/i.test(block))) {
    issues.push('missing_priority_real_life')
  }
  if (validationProfile.requireSimpleKey && !priorityBlocks.every((block) => /Cle simple:/i.test(block))) {
    issues.push('missing_priority_simple_key')
  }

  for (const word of FORBIDDEN_ANNUAL_WORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(cleaned)) {
      issues.push(`forbidden_word:${word}`)
    }
  }

  for (const { key, pattern } of FORBIDDEN_ANNUAL_TECHNICAL_PATTERNS) {
    const normalizedPattern = new RegExp(pattern.source, pattern.flags.replace('g', ''))
    if (normalizedPattern.test(cleaned)) {
      issues.push(`forbidden_token:${key}`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    priorityCount,
  }
}

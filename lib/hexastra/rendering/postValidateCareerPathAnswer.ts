import { normalizeUserPlan } from '@/lib/hexastra/rendering/normalizeUserPlan'
import type { UserPlan } from '@/lib/hexastra/rendering/selectRenderProfile'

type CareerSectionKey = 'natural' | 'aligned' | 'blocked' | 'actions'

type CareerSectionMap = Record<CareerSectionKey, string>

type CareerPlanRule = {
  minNatural: number
  maxNatural: number
  minAligned: number
  maxAligned: number
  minBlocked: number
  maxBlocked: number
  minActions: number
  maxActions: number
  minChars: number
  maxChars: number
}

export type CareerPostValidationResult = {
  text: string
  valid: boolean
  corrected: boolean
  correctedSections: CareerSectionKey[]
  issues: string[]
  qualityScore: number
  fallbackRecommended: boolean
}

type CareerPostValidationOptions = {
  userPlan?: UserPlan | null
  fallbackText: string
}

const CAREER_SECTION_ORDER: CareerSectionKey[] = ['natural', 'aligned', 'blocked', 'actions']

const CAREER_HEADINGS: Record<CareerSectionKey, string> = {
  natural: '→ CE QUI TE CORRESPOND NATURELLEMENT',
  aligned: '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
  blocked: '→ CE QUI VA TE BLOQUER',
  actions: '→ CE QUE TU PEUX FAIRE MAINTENANT',
}

const CAREER_PLAN_RULES: Record<UserPlan, CareerPlanRule> = {
  free: {
    minNatural: 1,
    maxNatural: 2,
    minAligned: 2,
    maxAligned: 3,
    minBlocked: 1,
    maxBlocked: 1,
    minActions: 1,
    maxActions: 1,
    minChars: 180,
    maxChars: 900,
  },
  essentiel: {
    minNatural: 2,
    maxNatural: 3,
    minAligned: 3,
    maxAligned: 4,
    minBlocked: 1,
    maxBlocked: 2,
    minActions: 1,
    maxActions: 2,
    minChars: 320,
    maxChars: 1400,
  },
  premium: {
    minNatural: 3,
    maxNatural: 4,
    minAligned: 4,
    maxAligned: 4,
    minBlocked: 1,
    maxBlocked: 2,
    minActions: 1,
    maxActions: 2,
    minChars: 450,
    maxChars: 1800,
  },
  praticien: {
    minNatural: 3,
    maxNatural: 4,
    minAligned: 4,
    maxAligned: 5,
    minBlocked: 1,
    maxBlocked: 2,
    minActions: 1,
    maxActions: 2,
    minChars: 520,
    maxChars: 2200,
  },
}

const FORBIDDEN_CAREER_PHRASES = [
  /tout est possible/gi,
  /tu peux faire beaucoup de choses/gi,
  /tu es fait pour aider les autres/gi,
]

const LIGHT_GENERIC_REPLACEMENTS = [
  {
    pattern: /\baccompagnement\b/gi,
    replacement: 'cadre ou ta presence aide quelqu un a avancer ou decider',
  },
  {
    pattern: /\bcommunication\b/gi,
    replacement: 'role ou tu rends une idee claire et comprehensible',
  },
  {
    pattern: /\bconseil\b/gi,
    replacement: 'role ou tu aides a clarifier, reformuler et faire choisir',
  },
  {
    pattern: /\bcoordination\b/gi,
    replacement: 'poste ou tu relies des personnes, des besoins et des priorites',
  },
]

const NORMALIZED_CAREER_HEADINGS: Record<CareerSectionKey, string> = {
  natural: '',
  aligned: '',
  blocked: '',
  actions: '',
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentence(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function trimSection(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim()
}

function normalizeHeadingLine(line: string): string {
  return normalize(
    line
      .replace(/[*_`~]+/g, '')
      .replace(/^#+\s*/, '')
      .replace(/^[>\-\s→]+/, ''),
  )
}

function parseCareerSections(text: string): {
  sections: CareerSectionMap
  headingCount: number
} {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n')
  const sections: CareerSectionMap = {
    natural: '',
    aligned: '',
    blocked: '',
    actions: '',
  }
  const buffers: Record<CareerSectionKey, string[]> = {
    natural: [],
    aligned: [],
    blocked: [],
    actions: [],
  }
  let current: CareerSectionKey | null = null
  let headingCount = 0

  for (const rawLine of lines) {
    const normalizedLine = normalizeHeadingLine(rawLine)
    const headingKey = CAREER_SECTION_ORDER.find(
      (key) => NORMALIZED_CAREER_HEADINGS[key] === normalizedLine,
    )

    if (headingKey) {
      current = headingKey
      headingCount += 1
      continue
    }

    if (!current) continue
    buffers[current].push(rawLine.trimEnd())
  }

  for (const key of CAREER_SECTION_ORDER) {
    sections[key] = trimSection(buffers[key].join('\n'))
  }

  return { sections, headingCount }
}

for (const key of CAREER_SECTION_ORDER) {
  NORMALIZED_CAREER_HEADINGS[key] = normalizeHeadingLine(CAREER_HEADINGS[key])
}

function splitSentences(text: string): string[] {
  return uniq(
    (text || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n+/)
      .flatMap((line) => line.split(/(?<=[.!?])\s+/))
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function stripListPrefix(line: string): string {
  return line.replace(/^\s*(?:[-*]\s+|Action\s+\d+\s*:\s+|\d+[.)]\s+)/i, '').trim()
}

function parseListItems(text: string): string[] {
  const cleaned = trimSection(text)
  if (!cleaned) return []

  const listLines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(stripListPrefix)
    .filter(Boolean)

  if (listLines.length > 1) {
    return listLines
  }

  if (cleaned.includes(',')) {
    return cleaned
      .split(',')
      .map((item) => stripListPrefix(item))
      .filter(Boolean)
  }

  return splitSentences(cleaned).map(stripListPrefix).filter(Boolean)
}

function applyLightCareerCorrections(text: string): {
  text: string
  applied: boolean
  issues: string[]
} {
  let corrected = text
  let applied = false
  const issues: string[] = []

  for (const pattern of FORBIDDEN_CAREER_PHRASES) {
    if (pattern.test(corrected)) {
      corrected = corrected.replace(pattern, '')
      issues.push(`forbidden_phrase:${pattern.source}`)
      applied = true
    }
  }

  for (const replacement of LIGHT_GENERIC_REPLACEMENTS) {
    if (replacement.pattern.test(corrected)) {
      corrected = corrected.replace(replacement.pattern, replacement.replacement)
      issues.push(`generic_rewritten:${replacement.pattern.source}`)
      applied = true
    }
  }

  corrected = corrected
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { text: corrected, applied, issues }
}

function fillWithFallback(
  items: string[],
  fallbackItems: string[],
  maxCount: number,
): string[] {
  const resolved = [...items]

  for (const item of fallbackItems) {
    if (resolved.length >= maxCount) break
    const normalizedItem = normalize(item)
    if (!normalizedItem) continue
    if (resolved.some((entry) => normalize(entry) === normalizedItem)) continue
    resolved.push(item)
  }

  return resolved
}

function repairNaturalSection(
  rawSection: string,
  fallbackSection: string,
  rule: CareerPlanRule,
  issues: string[],
): string {
  const corrected = applyLightCareerCorrections(rawSection)
  issues.push(...corrected.issues)

  let sentences = splitSentences(corrected.text)
  if (sentences.length === 0) {
    sentences = splitSentences(fallbackSection)
  }
  if (sentences.length < rule.minNatural) {
    sentences = fillWithFallback(sentences, splitSentences(fallbackSection), rule.maxNatural)
  }

  return sentences
    .slice(0, rule.maxNatural)
    .map((line) => sentence(line))
    .join('\n')
}

function repairListSection(args: {
  rawSection: string
  fallbackSection: string
  minCount: number
  maxCount: number
  issues: string[]
  label: string
}): string {
  const corrected = applyLightCareerCorrections(args.rawSection)
  args.issues.push(...corrected.issues)

  let items = uniq(parseListItems(corrected.text))
  const initialCount = items.length

  if (items.length < args.minCount) {
    items = fillWithFallback(items, parseListItems(args.fallbackSection), args.maxCount)
  }

  const normalizedSet = new Set<string>()
  items = items.filter((item) => {
    const key = normalize(item)
    if (!key) return false
    if (normalizedSet.has(key)) {
      args.issues.push(`duplicate_${args.label}_item`)
      return false
    }
    normalizedSet.add(key)
    return true
  })

  if (initialCount !== items.length) {
    items = fillWithFallback(items, parseListItems(args.fallbackSection), args.maxCount)
  }

  return items
    .slice(0, args.maxCount)
    .map((item) => `- ${sentence(item)}`)
    .join('\n')
}

function buildCareerText(sections: CareerSectionMap): string {
  return [
    CAREER_HEADINGS.natural,
    sections.natural,
    '',
    CAREER_HEADINGS.aligned,
    sections.aligned,
    '',
    CAREER_HEADINGS.blocked,
    sections.blocked,
    '',
    CAREER_HEADINGS.actions,
    sections.actions,
  ].join('\n')
}

function countListItems(section: string): number {
  return (section.match(/^\s*-\s+/gm) ?? []).length
}

function computeQualityScore(args: {
  text: string
  headingCount: number
  issues: string[]
  alignedCount: number
  actionCount: number
  userPlan: UserPlan
}): number {
  const rule = CAREER_PLAN_RULES[args.userPlan]
  let score = 1

  score -= Math.max(0, 4 - args.headingCount) * 0.08
  score -= args.issues.filter((issue) => issue.startsWith('forbidden_phrase:')).length * 0.12
  score -= args.issues.filter((issue) => issue.startsWith('generic_rewritten:')).length * 0.03
  score -= args.issues.filter((issue) => issue.startsWith('duplicate_')).length * 0.05

  if (args.alignedCount < rule.minAligned) score -= 0.15
  if (args.actionCount < rule.minActions || args.actionCount > rule.maxActions) score -= 0.12
  if (args.text.length < rule.minChars || args.text.length > rule.maxChars) score -= 0.05

  return Math.max(0, Math.min(1, Number(score.toFixed(2))))
}

function hasAllRequiredSections(sections: CareerSectionMap): boolean {
  return CAREER_SECTION_ORDER.every((key) => normalize(sections[key]).length > 0)
}

export function postValidateCareerPathAnswer(
  text: string,
  options: CareerPostValidationOptions,
): CareerPostValidationResult {
  const userPlan = normalizeUserPlan(options.userPlan)
  const rule = CAREER_PLAN_RULES[userPlan]
  const original = parseCareerSections(text)
  const fallback = parseCareerSections(options.fallbackText)
  const issues: string[] = []
  const correctedSections: CareerSectionKey[] = []

  const repairedSections: CareerSectionMap = {
    natural: repairNaturalSection(original.sections.natural, fallback.sections.natural, rule, issues),
    aligned: repairListSection({
      rawSection: original.sections.aligned,
      fallbackSection: fallback.sections.aligned,
      minCount: rule.minAligned,
      maxCount: rule.maxAligned,
      issues,
      label: 'aligned',
    }),
    blocked: repairListSection({
      rawSection: original.sections.blocked,
      fallbackSection: fallback.sections.blocked,
      minCount: rule.minBlocked,
      maxCount: rule.maxBlocked,
      issues,
      label: 'blocked',
    }),
    actions: repairListSection({
      rawSection: original.sections.actions,
      fallbackSection: fallback.sections.actions,
      minCount: rule.minActions,
      maxCount: rule.maxActions,
      issues,
      label: 'actions',
    }),
  }

  for (const key of CAREER_SECTION_ORDER) {
    if (normalize(original.sections[key]) !== normalize(repairedSections[key])) {
      correctedSections.push(key)
    }
    if (!normalize(original.sections[key])) {
      issues.push(`missing_section:${key}`)
    }
  }

  const correctedText = buildCareerText(repairedSections)
  const alignedCount = countListItems(repairedSections.aligned)
  const actionCount = countListItems(repairedSections.actions)
  const valid =
    hasAllRequiredSections(repairedSections) &&
    alignedCount >= rule.minAligned &&
    alignedCount <= rule.maxAligned &&
    actionCount >= rule.minActions &&
    actionCount <= rule.maxActions &&
    !FORBIDDEN_CAREER_PHRASES.some((pattern) => pattern.test(correctedText))

  const qualityScore = computeQualityScore({
    text: correctedText,
    headingCount: original.headingCount,
    issues,
    alignedCount,
    actionCount,
    userPlan,
  })

  const fallbackRecommended =
    !valid ||
    original.headingCount <= 1 ||
    correctedText.length < 120

  return {
    text: correctedText,
    valid,
    corrected: normalize(correctedText) !== normalize(text),
    correctedSections,
    issues: uniq(issues),
    qualityScore,
    fallbackRecommended,
  }
}

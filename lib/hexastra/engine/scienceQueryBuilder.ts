import {
  SCIENCE_SUBCATEGORY_INDEX,
  SCIENCE_TAXONOMY,
  type Science,
  type ScienceSubCategory,
  type UserIntent,
} from '@/lib/hexastra/taxonomy/scienceTaxonomy'
import { prepareQuery } from '@/lib/hexastra/taxonomy/scienceSynonyms'
import {
  detectIntentsFromText,
  getSciencesForIntent,
  getSubCategoriesForIntent,
} from '@/lib/hexastra/taxonomy/intentScienceMap'

export type ScienceMatch = {
  science: Science
  subCategory: string
  score: number
  matchedTerms: string[]
}

export type ScienceDetectionResult = {
  normalizedQuery: string
  sciences: Science[]
  subCategories: string[]
  intents: UserIntent[]
  matches: ScienceMatch[]
  fallbackUsed: boolean
}

type IndexedCategory = {
  category: ScienceSubCategory
  terms: string[]
}

type CategoryScore = {
  category: ScienceSubCategory
  score: number
  matchedTerms: string[]
}

const MIN_CATEGORY_SCORE = 4.5

const SCIENCE_TERMS_RAW: Record<Science, string[]> = {
  astro: ['astro', 'astrologie', 'theme natal', 'theme astral', 'zodiaque'],
  numerology: ['numerologie', 'chemin de vie', 'annee personnelle', 'heure miroir'],
  human_design: ['human design', 'bodygraph', 'type hd', 'autorite hd'],
  enneagram: ['enneagramme', 'ennea', 'type enneagramme', 'aile enneagramme'],
  kua: ['kua', 'nombre kua', 'feng shui perso', 'direction favorable'],
  fusion: ['lecture generale', 'lecture globale', 'situation de vie', 'que dois je faire'],
}

const SCIENCE_TERMS: Record<Science, string[]> = Object.fromEntries(
  Object.entries(SCIENCE_TERMS_RAW).map(([science, terms]) => [
    science,
    [...new Set(terms.map((term) => prepareQuery(term)).filter(Boolean))],
  ]),
) as Record<Science, string[]>

const CATEGORY_INDEX: IndexedCategory[] = SCIENCE_TAXONOMY.map((category) => ({
  category,
  terms: [
    ...new Set(
      [...category.keywords, ...(category.aliases ?? [])]
        .map((term) => prepareQuery(term))
        .filter(Boolean),
    ),
  ],
}))

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function hasWholeTerm(text: string, term: string): boolean {
  if (!text || !term) {
    return false
  }

  return new RegExp(`(^|\\s)${escapeRegExp(term)}(?=\\s|$)`).test(text)
}

function getTermWeight(term: string): number {
  const compact = term.replace(/\s+/g, '')

  if (/^\d+$/.test(compact)) {
    return 4
  }

  if (/\d/.test(compact) && /[a-z]/i.test(compact)) {
    return 4
  }

  if (term.includes(' ')) {
    return 5
  }

  if (compact.length <= 3) {
    return 2
  }

  if (compact.length <= 5) {
    return 3
  }

  return 4
}

function getScienceContextMatch(science: Science, normalizedQuery: string): {
  score: number
  matchedTerms: string[]
} {
  const matchedTerms = SCIENCE_TERMS[science].filter((term) => hasWholeTerm(normalizedQuery, term))

  if (matchedTerms.length === 0) {
    return { score: 0, matchedTerms: [] }
  }

  return {
    score: 2 + Math.min(matchedTerms.length, 2) * 0.5,
    matchedTerms,
  }
}

function scoreIndexedCategory(indexedCategory: IndexedCategory, normalizedQuery: string): CategoryScore | null {
  const matchedTerms: string[] = []
  let score = 0

  for (const term of indexedCategory.terms) {
    if (!hasWholeTerm(normalizedQuery, term)) {
      continue
    }

    matchedTerms.push(term)
    score += getTermWeight(term)
  }

  if (matchedTerms.length === 0) {
    return null
  }

  if (indexedCategory.category.key === 'num_repeating_numbers') {
    const numericMatches = matchedTerms.filter((term) => /^\d+$/.test(term.replace(/\s+/g, ''))).length
    const contextualMatches = matchedTerms.length - numericMatches

    if (numericMatches < 2 && contextualMatches === 0) {
      return null
    }
  }

  const scienceContext = getScienceContextMatch(indexedCategory.category.science, normalizedQuery)
  score += scienceContext.score
  score += (indexedCategory.category.priority ?? 50) / 100

  if (score < MIN_CATEGORY_SCORE) {
    return null
  }

  return {
    category: indexedCategory.category,
    score,
    matchedTerms: uniq([...matchedTerms, ...scienceContext.matchedTerms]),
  }
}

function collectDirectCategoryScores(normalizedQuery: string): CategoryScore[] {
  return CATEGORY_INDEX
    .map((indexedCategory) => scoreIndexedCategory(indexedCategory, normalizedQuery))
    .filter((entry): entry is CategoryScore => entry !== null)
    .sort((a, b) => b.score - a.score)
}

function resolveIntentList(
  normalizedQuery: string,
  directMatches: CategoryScore[],
): UserIntent[] {
  const scoreMap = new Map<UserIntent, number>()

  for (const intent of detectIntentsFromText(normalizedQuery)) {
    if (intent === 'general') {
      continue
    }

    scoreMap.set(intent, (scoreMap.get(intent) ?? 0) + 3)
  }

  for (const match of directMatches) {
    for (const intent of match.category.intentHints ?? []) {
      scoreMap.set(intent, (scoreMap.get(intent) ?? 0) + Math.max(1, match.score / 4))
    }
  }

  const intents = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([intent]) => intent)

  return intents.length > 0 ? intents : ['general']
}

function resolveScienceList(
  normalizedQuery: string,
  directMatches: CategoryScore[],
  intents: UserIntent[],
): Science[] {
  const scoreMap = new Map<Science, number>()
  const hasNonFusionDirectMatch = directMatches.some((match) => match.category.science !== 'fusion')

  for (const match of directMatches) {
    scoreMap.set(match.category.science, (scoreMap.get(match.category.science) ?? 0) + match.score)
  }

  for (const science of Object.keys(SCIENCE_TERMS) as Science[]) {
    const context = getScienceContextMatch(science, normalizedQuery)
    if (context.score > 0) {
      scoreMap.set(science, (scoreMap.get(science) ?? 0) + context.score)
    }
  }

  if (scoreMap.size === 0) {
    for (const intent of intents) {
      for (const science of getSciencesForIntent(intent)) {
        scoreMap.set(science, (scoreMap.get(science) ?? 0) + 1)
      }
    }
  } else if (!hasNonFusionDirectMatch) {
    for (const intent of intents) {
      for (const science of getSciencesForIntent(intent)) {
        scoreMap.set(science, (scoreMap.get(science) ?? 0) + 1.25)
      }
    }
  }

  if (scoreMap.size === 0) {
    return ['fusion']
  }

  return [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([science]) => science)
}

export function normalizeUserQuery(input: string): string {
  return prepareQuery(input)
}

export function detectSciences(input: string): Science[] {
  const normalizedQuery = normalizeUserQuery(input)
  const directMatches = collectDirectCategoryScores(normalizedQuery)
  const intents = resolveIntentList(normalizedQuery, directMatches)
  return resolveScienceList(normalizedQuery, directMatches, intents)
}

export function detectSubCategories(input: string): ScienceSubCategory[] {
  const normalizedQuery = normalizeUserQuery(input)
  const matches = collectDirectCategoryScores(normalizedQuery)

  if (matches.length === 0) {
    return [SCIENCE_SUBCATEGORY_INDEX.fusion_general]
  }

  return matches.map((match) => match.category)
}

export function detectUserIntent(input: string): UserIntent[] {
  const normalizedQuery = normalizeUserQuery(input)
  const directMatches = collectDirectCategoryScores(normalizedQuery)
  return resolveIntentList(normalizedQuery, directMatches)
}

export function buildScienceDetectionResult(input: string): ScienceDetectionResult {
  const normalizedQuery = normalizeUserQuery(input)
  const directMatches = collectDirectCategoryScores(normalizedQuery)
  const intents = resolveIntentList(normalizedQuery, directMatches)
  const fallbackUsed = directMatches.length === 0
  const shouldExpandFromIntent =
    fallbackUsed || directMatches.every((match) => match.category.science === 'fusion')

  const sciences = resolveScienceList(normalizedQuery, directMatches, intents)

  const subCategories = shouldExpandFromIntent
    ? uniq([
        ...directMatches.map((match) => match.category.key),
        ...intents.flatMap((intent) => getSubCategoriesForIntent(intent)),
      ]).slice(0, 12)
    : directMatches.map((match) => match.category.key)

  return {
    normalizedQuery,
    sciences,
    subCategories: subCategories.length > 0 ? subCategories : ['fusion_general'],
    intents,
    matches: directMatches.map((match) => ({
      science: match.category.science,
      subCategory: match.category.key,
      score: Number(match.score.toFixed(2)),
      matchedTerms: match.matchedTerms,
    })),
    fallbackUsed,
  }
}

export function requiresTransits(subCategories: ScienceSubCategory[]): boolean {
  return subCategories.some((category) => {
    return (
      category.key.startsWith('astro_transits_') ||
      category.key === 'astro_retrogrades_current' ||
      category.key === 'hd_current_transits' ||
      category.key === 'num_transits'
    )
  })
}

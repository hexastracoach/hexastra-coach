import type { RetrievalPlan } from './retrievalPlanBuilder'
import type { LayerResult } from './multiLayerRetrieval'
import type { DocumentScienceTag } from '@/lib/hexastra/vector/documentRegistry'
import { lookupDocumentRegistry } from '@/lib/hexastra/vector/documentRegistry'
import {
  normalizeFusionExactDataWithDiagnostics,
  type FusionExactDataDiagnostics,
  type NormalizedFusionExactData,
  type NormalizedFusionExactDataSection,
} from '@/lib/hexastra/api/normalizeFusionExactData'
import {
  resolveSubCategoryLegacyExactValue,
  resolveSubCategoryNormalizedExactValue,
} from '@/lib/hexastra/retrieval/subCategoryExactData'

export type StructuredSignalSourceType = 'exact_data' | 'retrieval' | 'fusion'

export type StructuredSignal = {
  science: string
  subCategory: string
  score?: number
  sourceType?: StructuredSignalSourceType
  exactDataSection?: NormalizedFusionExactDataSection
  value: unknown
}

type RetrievalSignalValue = {
  documents: Array<{
    filename?: string
    score: number
    source: string
    scienceTag?: DocumentScienceTag | null
    retrievalFocus?: string | null
    excerpt: string
  }>
}

const SCIENCE_TAG_TO_SCIENCE: Partial<Record<DocumentScienceTag, string>> = {
  astrolex: 'astro',
  human_design: 'human_design',
  numerologie: 'numerology',
  enneagramme: 'enneagram',
  kua: 'kua',
  global: 'fusion',
  transverse: 'fusion',
}

function compactExcerpt(text: string, maxChars = 220) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  const cut = cleaned.lastIndexOf(' ', maxChars)
  return `${cleaned.slice(0, cut > 80 ? cut : maxChars).trim()}...`
}

function compactStructuredValue(value: unknown, maxChars = 240): string {
  if (typeof value === 'string') {
    return compactExcerpt(value, maxChars)
  }

  if (Array.isArray(value)) {
    return compactExcerpt(
      value
        .slice(0, 4)
        .map((item) => compactStructuredValue(item, 80))
        .join(' | '),
      maxChars,
    )
  }

  if (value && typeof value === 'object') {
    const preview = Object.entries(value as Record<string, unknown>)
      .slice(0, 6)
      .map(([key, entryValue]) => {
        if (typeof entryValue === 'string') {
          return `${key}: ${compactExcerpt(entryValue, 60)}`
        }

        if (typeof entryValue === 'number' || typeof entryValue === 'boolean') {
          return `${key}: ${String(entryValue)}`
        }

        if (Array.isArray(entryValue)) {
          return `${key}: ${entryValue.length} items`
        }

        if (entryValue && typeof entryValue === 'object') {
          return `${key}: object`
        }

        return `${key}: ${String(entryValue)}`
      })
      .join(' | ')

    return compactExcerpt(preview, maxChars)
  }

  return compactExcerpt(String(value ?? ''), maxChars)
}

function resolveResultScience(result: LayerResult): string | null {
  if (result.scienceTag && SCIENCE_TAG_TO_SCIENCE[result.scienceTag]) {
    return SCIENCE_TAG_TO_SCIENCE[result.scienceTag] ?? null
  }

  const registryEntry = lookupDocumentRegistry(result.filename)
  if (registryEntry && SCIENCE_TAG_TO_SCIENCE[registryEntry.scienceTag]) {
    return SCIENCE_TAG_TO_SCIENCE[registryEntry.scienceTag] ?? null
  }

  return null
}

function groupRetrievalResultsByScience(
  retrievalResults: LayerResult[],
): Map<string, RetrievalSignalValue['documents']> {
  const grouped = new Map<string, RetrievalSignalValue['documents']>()

  for (const result of retrievalResults) {
    const science = resolveResultScience(result)
    if (!science) {
      continue
    }

    const documents = grouped.get(science) ?? []
    documents.push({
      filename: result.filename,
      score: result.score,
      source: result.source,
      scienceTag: result.scienceTag ?? null,
      retrievalFocus: result.retrievalFocus ?? null,
      excerpt: compactExcerpt(result.text),
    })
    grouped.set(science, documents)
  }

  for (const [science, documents] of grouped.entries()) {
    grouped.set(
      science,
      [...documents].sort((a, b) => b.score - a.score).slice(0, 3),
    )
  }

  return grouped
}

export function buildStructuredSignals(args: {
  retrievalPlan: RetrievalPlan
  retrievalResults: LayerResult[]
  exactData?: unknown
  normalizedExactData?: NormalizedFusionExactData
  exactDataDiagnostics?: FusionExactDataDiagnostics
}): StructuredSignal[] {
  const retrievalByScience = groupRetrievalResultsByScience(args.retrievalResults)
  const weightedMatches = args.retrievalPlan.weightedMatches.slice(0, 10)
  const normalizedExactDataResult =
    args.normalizedExactData && args.exactDataDiagnostics
      ? {
          exactData: args.normalizedExactData,
          diagnostics: args.exactDataDiagnostics,
        }
      : normalizeFusionExactDataWithDiagnostics(args.exactData ?? null)

  if (weightedMatches.length === 0) {
    return [
      {
        science: 'fusion',
        subCategory: 'fusion_general',
        sourceType: 'fusion',
        value: {
          sciences: args.retrievalPlan.sciences,
          subCategories: args.retrievalPlan.subCategories,
        },
      },
    ]
  }

  return weightedMatches.map((match) => {
    const normalizedExactValue = resolveSubCategoryNormalizedExactValue({
      exactData: normalizedExactDataResult.exactData,
      diagnostics: normalizedExactDataResult.diagnostics,
      subCategory: match.subCategory,
    })

    if (normalizedExactValue?.kind === 'resolved') {
      return {
        science: match.science,
        subCategory: match.subCategory,
        score: match.score,
        sourceType: 'exact_data',
        exactDataSection: normalizedExactValue.section,
        value: normalizedExactValue.value,
      }
    }

    if (normalizedExactValue?.kind !== 'blocked') {
      const legacyExactValue = resolveSubCategoryLegacyExactValue(
        args.exactData,
        match.science,
        match.subCategory,
      )
      if (legacyExactValue !== null) {
        return {
          science: match.science,
          subCategory: match.subCategory,
          score: match.score,
          sourceType: 'exact_data',
          value: legacyExactValue,
        }
      }
    }

    const retrievalDocuments = retrievalByScience.get(match.science)
    if (retrievalDocuments && retrievalDocuments.length > 0) {
      return {
        science: match.science,
        subCategory: match.subCategory,
        score: match.score,
        sourceType: 'retrieval',
        value: {
          documents: retrievalDocuments,
        } satisfies RetrievalSignalValue,
      }
    }

    return {
      science: match.science,
      subCategory: match.subCategory,
      score: match.score,
      sourceType: 'fusion',
      value: {
        weightedMatch: match,
        exactDataHints: args.retrievalPlan.exactDataHints.slice(0, 5),
        vectorNamespaces: args.retrievalPlan.vectorNamespaces.slice(0, 5),
      },
    }
  })
}

export function buildStructuredRetrievalSignalsBlock(args: {
  retrievalPlan: RetrievalPlan
  structuredSignals: StructuredSignal[]
  intent?: string
  flowType?: string
}): string | null {
  const { retrievalPlan, structuredSignals, intent, flowType } = args

  if (!structuredSignals.length) {
    return null
  }

  const lines: string[] = [
    '━━━ RETRIEVAL STRUCTURE HEXASTRA ━━━',
    `SCIENCES : ${retrievalPlan.sciences.join(', ') || 'fusion'}`,
    `SUBCATEGORIES : ${retrievalPlan.subCategories.slice(0, 8).join(', ') || 'fusion_general'}`,
    `TOP_K : ${retrievalPlan.preferredTopK} | FALLBACK : ${retrievalPlan.fallbackUsed ? 'oui' : 'non'}`,
    intent ? `INTENT : ${intent}${flowType ? ` | FLOW : ${flowType}` : ''}` : null,
    '',
  ].filter((line): line is string => Boolean(line))

  for (const signal of structuredSignals.slice(0, 6)) {
    lines.push(
      `[${signal.science} :: ${signal.subCategory}] source=${signal.sourceType ?? 'fusion'} score=${typeof signal.score === 'number' ? signal.score.toFixed(2) : 'n/a'}`,
    )
    if (signal.exactDataSection) {
      lines.push(`section=${signal.exactDataSection}`)
    }
    lines.push(compactStructuredValue(signal.value))
    lines.push('')
  }

  const weightedBlock = retrievalPlan.weightedMatches
    .slice(0, 5)
    .map(
      (match) =>
        `${match.subCategory} (${match.science}) score=${match.score.toFixed(2)} priority=${match.retrievalPriority}`,
    )
    .join(' | ')

  if (weightedBlock) {
    lines.push(`MATCHES : ${weightedBlock}`)
  }

  return lines.join('\n')
}

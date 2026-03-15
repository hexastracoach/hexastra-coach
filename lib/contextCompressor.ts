/**
 * Context Compressor — post-processes raw vector search results
 * into a clean, token-efficient knowledge block.
 *
 * Pipeline:
 *   1. Filter below-threshold results (already done in vectorSearch)
 *   2. Sort by relevance score desc
 *   3. Deduplicate near-identical chunks (Jaccard similarity on word sets)
 *   4. Truncate documents exceeding maxCharsPerDoc
 *   5. Enforce maxDocsAfterDedup limit
 *   6. Enforce total maxContextChars budget
 *   7. Format as a labeled injection block
 */

import type { SearchResult } from './vectorSearch'
import type { RetrievalConfig } from './retrievalPolicy'

// ── Deduplication ─────────────────────────────────────────────────────────────

/** Normalise text to a word set for Jaccard comparison */
function toWordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zàâäéèêëïîôùûüç\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const word of a) {
    if (b.has(word)) intersection++
  }
  return intersection / (a.size + b.size - intersection)
}

/**
 * Remove near-duplicate documents.
 * Two documents are considered duplicates if Jaccard similarity > threshold.
 * Among duplicates, keep the higher-scored one.
 */
function deduplicateResults(
  results: SearchResult[],
  similarityThreshold = 0.6,
): SearchResult[] {
  const kept: SearchResult[] = []
  const keptSets: Set<string>[] = []

  for (const candidate of results) {
    const candidateSet = toWordSet(candidate.text)
    const isDuplicate = keptSets.some(
      (existingSet) => jaccardSimilarity(candidateSet, existingSet) > similarityThreshold,
    )
    if (!isDuplicate) {
      kept.push(candidate)
      keptSets.push(candidateSet)
    }
  }

  return kept
}

// ── Text cleaning ─────────────────────────────────────────────────────────────

function cleanChunk(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')       // collapse excessive blank lines
    .replace(/[ \t]{2,}/g, ' ')        // collapse multiple spaces
    .replace(/^[\s*#\-_=]{3,}$/gm, '') // remove pure separator lines
    .trim()
}

function truncateToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text

  // Try to cut at a sentence boundary within the limit
  const cutAt = text.lastIndexOf('.', maxChars)
  if (cutAt > maxChars * 0.6) return text.slice(0, cutAt + 1).trim()

  // Fallback: cut at word boundary
  const wordCut = text.lastIndexOf(' ', maxChars)
  if (wordCut > maxChars * 0.5) return text.slice(0, wordCut).trim() + '…'

  return text.slice(0, maxChars).trim() + '…'
}

// ── Main compressor ───────────────────────────────────────────────────────────

export type CompressedContext = {
  /** Ready-to-inject text block — null if no useful content */
  block: string | null
  /** Number of documents included */
  docCount: number
  /** Approximate character count of the injected block */
  charCount: number
}

export function compressKnowledgeContext(
  results: SearchResult[],
  config: RetrievalConfig,
): CompressedContext {
  if (results.length === 0) {
    return { block: null, docCount: 0, charCount: 0 }
  }

  // 1. Sort by relevance desc
  const sorted = [...results].sort((a, b) => b.score - a.score)

  // 2. Deduplicate
  const deduped = deduplicateResults(sorted)

  // 3. Apply maxDocsAfterDedup
  const capped = deduped.slice(0, config.maxDocsAfterDedup)

  // 4. Clean + truncate each document
  const processed: string[] = []
  let totalChars = 0

  for (const doc of capped) {
    if (totalChars >= config.maxContextChars) break

    const cleaned = cleanChunk(doc.text)
    if (!cleaned) continue

    const remaining = config.maxContextChars - totalChars
    const truncated = truncateToChars(cleaned, Math.min(config.maxCharsPerDoc, remaining))

    if (truncated.length < 50) continue // skip near-empty after truncation

    processed.push(truncated)
    totalChars += truncated.length
  }

  if (processed.length === 0) {
    return { block: null, docCount: 0, charCount: 0 }
  }

  // 5. Format injection block
  const block = processed.join('\n\n---\n\n')

  return {
    block,
    docCount: processed.length,
    charCount: block.length,
  }
}

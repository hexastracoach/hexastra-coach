import type { NormalizedPlace } from './normalizeOpenCageResult'

type CacheEntry = { timestamp: number; results: NormalizedPlace[]; cached: boolean }

const CACHE_TTL_MS = 1000 * 60 * 60 * 12 // 12h
const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<CacheEntry>>()

function now() {
  return Date.now()
}

function isFresh(entry: CacheEntry) {
  return now() - entry.timestamp < CACHE_TTL_MS
}

export function getCached(query: string): CacheEntry | null {
  const key = normalizeKey(query)
  const entry = cache.get(key)
  if (entry && isFresh(entry)) return entry
  return null
}

export function setCache(query: string, results: NormalizedPlace[], cached = false) {
  const key = normalizeKey(query)
  const entry: CacheEntry = { timestamp: now(), results, cached }
  cache.set(key, entry)
  return entry
}

export function getInflight(query: string) {
  return inflight.get(normalizeKey(query))
}

export function setInflight(query: string, promise: Promise<CacheEntry>) {
  inflight.set(normalizeKey(query), promise)
}

export function clearInflight(query: string) {
  inflight.delete(normalizeKey(query))
}

export function normalizeKey(q: string) {
  return q.trim().toLowerCase()
}

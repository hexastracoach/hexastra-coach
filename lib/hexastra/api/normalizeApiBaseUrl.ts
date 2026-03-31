export const DEFAULT_HEXASTRA_API_BASE_URL = 'https://hexastra-api-production.up.railway.app'

export type NormalizedApiBaseUrlResult = {
  url: string
  input: string
  addedProtocol: boolean
  removedTrailingSlash: boolean
  collapsedDuplicateSlashes: boolean
  usedFallback: boolean
  warning: 'missing' | 'missing_protocol' | 'railway_http_upgraded_to_https' | 'invalid_url' | null
}

const PROTOCOL_PREFIX_RE = /^[a-z][a-z0-9+.-]*:\/\//i

type NormalizedCandidate = {
  url: string
  addedProtocol: boolean
  removedTrailingSlash: boolean
  collapsedDuplicateSlashes: boolean
  upgradedRailwayHttpToHttps: boolean
}

function trimTrailingSlashes(pathname: string): string {
  if (!pathname || pathname === '/') {
    return ''
  }

  return pathname.replace(/\/+$/, '')
}

function isRailwayHostname(hostname: string): boolean {
  return /(^|\.)railway\.app$/i.test(hostname)
}

function toPublicCandidate(normalized: NormalizedCandidate) {
  const { upgradedRailwayHttpToHttps: _ignored, ...publicCandidate } = normalized
  return publicCandidate
}

function normalizeCandidate(candidate: string): NormalizedCandidate {
  const addedProtocol = !PROTOCOL_PREFIX_RE.test(candidate)
  const withProtocol = addedProtocol ? `https://${candidate.replace(/^\/+/, '')}` : candidate
  const parsed = new URL(withProtocol)

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`)
  }

  const upgradedRailwayHttpToHttps =
    isRailwayHostname(parsed.hostname) &&
    /^http:$/i.test(parsed.protocol)

  if (upgradedRailwayHttpToHttps) {
    parsed.protocol = 'https:'
  }

  const collapsedPathname = parsed.pathname.replace(/\/{2,}/g, '/')
  const trimmedPathname = trimTrailingSlashes(collapsedPathname)

  return {
    url: `${parsed.protocol}//${parsed.host}${trimmedPathname}`,
    addedProtocol,
    removedTrailingSlash:
      candidate.replace(/\?.*$/, '').replace(/#.*$/, '').endsWith('/') &&
      `${parsed.protocol}//${parsed.host}${collapsedPathname}` !==
        `${parsed.protocol}//${parsed.host}${trimmedPathname}`,
    collapsedDuplicateSlashes: parsed.pathname !== collapsedPathname,
    upgradedRailwayHttpToHttps,
  }
}

export function normalizeApiBaseUrl(
  raw: string | null | undefined,
  options?: { fallback?: string | null },
): NormalizedApiBaseUrlResult {
  const input = String(raw ?? '').trim()
  const fallback = String(options?.fallback ?? '').trim()

  if (input) {
    try {
      const normalized = normalizeCandidate(input)
      return {
        input,
        usedFallback: false,
        warning:
          normalized.upgradedRailwayHttpToHttps
            ? 'railway_http_upgraded_to_https'
            : normalized.addedProtocol
              ? 'missing_protocol'
              : null,
        ...toPublicCandidate(normalized),
      }
    } catch {
      if (fallback) {
        try {
          const normalizedFallback = normalizeCandidate(fallback)
          return {
            input,
            usedFallback: true,
            warning: 'invalid_url',
            ...toPublicCandidate(normalizedFallback),
          }
        } catch {
          // Fall through to an empty result below.
        }
      }

      return {
        url: '',
        input,
        addedProtocol: false,
        removedTrailingSlash: false,
        collapsedDuplicateSlashes: false,
        usedFallback: false,
        warning: 'invalid_url',
      }
    }
  }

  if (fallback) {
    try {
      const normalizedFallback = normalizeCandidate(fallback)
      return {
        input,
        usedFallback: false,
        warning: null,
        ...toPublicCandidate(normalizedFallback),
      }
    } catch {
      // Fall through to an empty result below.
    }
  }

  return {
    url: '',
    input,
    addedProtocol: false,
    removedTrailingSlash: false,
    collapsedDuplicateSlashes: false,
    usedFallback: false,
    warning: 'missing',
  }
}

export const DEFAULT_HEXASTRA_API_BASE_URL = 'https://hexastra-api-production.up.railway.app'

export type NormalizedApiBaseUrlResult = {
  url: string
  input: string
  addedProtocol: boolean
  removedTrailingSlash: boolean
  collapsedDuplicateSlashes: boolean
  usedFallback: boolean
  warning: 'missing' | 'missing_protocol' | 'invalid_url' | null
}

const PROTOCOL_PREFIX_RE = /^[a-z][a-z0-9+.-]*:\/\//i

function trimTrailingSlashes(pathname: string): string {
  if (!pathname || pathname === '/') {
    return ''
  }

  return pathname.replace(/\/+$/, '')
}

function normalizeCandidate(candidate: string) {
  const addedProtocol = !PROTOCOL_PREFIX_RE.test(candidate)
  const withProtocol = addedProtocol ? `https://${candidate.replace(/^\/+/, '')}` : candidate
  const parsed = new URL(withProtocol)

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`)
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
        warning: normalized.addedProtocol ? 'missing_protocol' : null,
        ...normalized,
      }
    } catch {
      if (fallback) {
        try {
          const normalizedFallback = normalizeCandidate(fallback)
          return {
            input,
            usedFallback: true,
            warning: 'invalid_url',
            ...normalizedFallback,
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
        ...normalizedFallback,
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

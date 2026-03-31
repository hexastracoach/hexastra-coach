import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HEXASTRA_API_BASE_URL,
  normalizeApiBaseUrl,
} from '@/lib/hexastra/api/normalizeApiBaseUrl'

describe('normalizeApiBaseUrl', () => {
  it('adds https when the protocol is missing', () => {
    const normalized = normalizeApiBaseUrl('hexastra-api-production.up.railway.app')

    expect(normalized.url).toBe('https://hexastra-api-production.up.railway.app')
    expect(normalized.warning).toBe('missing_protocol')
    expect(normalized.addedProtocol).toBe(true)
  })

  it('upgrades Railway http urls to https', () => {
    const normalized = normalizeApiBaseUrl('http://hexastra-api-production.up.railway.app')

    expect(normalized.url).toBe('https://hexastra-api-production.up.railway.app')
    expect(normalized.warning).toBe('railway_http_upgraded_to_https')
    expect(normalized.addedProtocol).toBe(false)
  })

  it('removes a trailing slash from an already valid url', () => {
    const normalized = normalizeApiBaseUrl('https://hexastra-api-production.up.railway.app/')

    expect(normalized.url).toBe('https://hexastra-api-production.up.railway.app')
    expect(normalized.removedTrailingSlash).toBe(true)
  })

  it('falls back cleanly when the provided url is invalid', () => {
    const normalized = normalizeApiBaseUrl('https://', {
      fallback: DEFAULT_HEXASTRA_API_BASE_URL,
    })

    expect(normalized.url).toBe(DEFAULT_HEXASTRA_API_BASE_URL)
    expect(normalized.warning).toBe('invalid_url')
    expect(normalized.usedFallback).toBe(true)
  })
})

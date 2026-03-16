'use server'

import { NextResponse } from 'next/server'
import { normalizeOpenCageResult, type NormalizedPlace } from '@/lib/location/normalizeOpenCageResult'
import { formatLocationLabel } from '@/lib/location/formatLocationLabel'
import {
  getCached,
  setCache,
  getInflight,
  setInflight,
  clearInflight,
  normalizeKey,
} from '@/lib/location/locationSearchCache'

export const runtime = 'nodejs'

type LocationSearchResponse = {
  query: string
  results: NormalizedPlace[]
  cached?: boolean
}

const MIN_LEN = 3

async function fetchOpenCage(query: string, country?: string): Promise<NormalizedPlace[]> {
  const key = process.env.OPENCAGE_API_KEY
  if (key) {
    const url = new URL('https://api.opencagedata.com/geocode/v1/json')
    url.searchParams.set('q', query)
    url.searchParams.set('key', key)
    url.searchParams.set('limit', '10')
    url.searchParams.set('no_annotations', '1')
    url.searchParams.set('pretty', '0')
    if (country) url.searchParams.set('countrycode', country.toLowerCase())

    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.results ?? [])
      .map(normalizeOpenCageResult)
      .filter((p: NormalizedPlace) => p.city && p.country)
  }

  // Fallback to Nominatim if no OpenCage key configured
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '10')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('featuretype', 'city')
  if (country) url.searchParams.set('countrycodes', country.toLowerCase())

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'fr', 'User-Agent': 'HexAstra-Coach/1.0' },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const json = await res.json()
  return (json as any[])
    .map((r: any): NormalizedPlace => {
      const addr = r.address || {}
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.hamlet ||
        addr.locality ||
        ''
      const postalCode = addr.postcode || ''
      const region =
        addr.state ||
        addr.region ||
        addr.county ||
        addr.province ||
        addr.state_district ||
        ''
      const countryName = addr.country || ''
      const label = formatLocationLabel({
        city,
        postalCode,
        region,
        country: countryName,
      })
      return {
        city,
        postalCode: postalCode || undefined,
        region: region || undefined,
        country: countryName,
        lat: Number(r.lat),
        lng: Number(r.lon),
        label,
      }
    })
    .filter((p) => p.city && p.country)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()
  const country = searchParams.get('country') || undefined

  if (query.length < MIN_LEN) {
    return NextResponse.json<LocationSearchResponse>({
      query,
      results: [],
      cached: true,
    })
  }

  const cached = getCached(query)
  if (cached) {
    return NextResponse.json<LocationSearchResponse>({
      query,
      results: cached.results,
      cached: true,
    })
  }

  const inflight = getInflight(query)
  if (inflight) {
    const entry = await inflight
    return NextResponse.json<LocationSearchResponse>({
      query,
      results: entry.results,
      cached: true,
    })
  }

  const promise = (async () => {
    const fresh = await fetchOpenCage(query, country)
    const deduped = Array.from(
      fresh.reduce((map, place) => map.set(normalizeKey(place.label), place), new Map<string, NormalizedPlace>())
        .values()
    )
    return setCache(query, deduped, false)
  })()

  setInflight(query, promise)

  try {
    const entry = await promise
    return NextResponse.json<LocationSearchResponse>({
      query,
      results: entry.results,
      cached: false,
    })
  } finally {
    clearInflight(query)
  }
}

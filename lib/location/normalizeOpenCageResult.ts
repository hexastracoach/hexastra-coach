import { formatLocationLabel } from './formatLocationLabel'
import { preferDisplayName, splitLocationSegments } from './locationNameUtils'

export type NormalizedPlace = {
  city: string
  postalCode?: string
  region?: string
  country: string
  lat?: number
  lng?: number
  label: string
}

export function normalizeOpenCageResult(result: any): NormalizedPlace {
  const c = result?.components || {}
  const formattedSegments = splitLocationSegments(result?.formatted)

  const city = preferDisplayName(
    c.city ||
    c.town ||
    c.village ||
    c.municipality ||
    c.hamlet ||
    c.locality ||
    c.city_district ||
    c._normalized_city ||
    c.state ||
    '',
    [formattedSegments[0]],
  )

  const postalCode = c.postcode || ''

  const region = preferDisplayName(
    c.state ||
    c.region ||
    c.county ||
    c.province ||
    c.state_district ||
    '',
    [formattedSegments.length > 2 ? formattedSegments[formattedSegments.length - 2] : ''],
  )

  const country = preferDisplayName(c.country || '', [formattedSegments[formattedSegments.length - 1]])

  const lat = result?.geometry?.lat
  const lng = result?.geometry?.lng

  const label = formatLocationLabel({
    city,
    postalCode,
    region,
    country,
  })

  return {
    city,
    postalCode: postalCode || undefined,
    region: region || undefined,
    country,
    lat,
    lng,
    label,
  }
}

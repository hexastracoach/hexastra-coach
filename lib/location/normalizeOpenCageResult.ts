import { formatLocationLabel } from './formatLocationLabel'

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

  const city =
    c.city ||
    c.town ||
    c.village ||
    c.municipality ||
    c.hamlet ||
    c.locality ||
    ''

  const postalCode = c.postcode || ''

  const region =
    c.state ||
    c.region ||
    c.county ||
    c.province ||
    c.state_district ||
    ''

  const country = c.country || ''

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

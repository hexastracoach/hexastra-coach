import type { NormalizedPlace } from './normalizeOpenCageResult'
import { formatLocationLabel } from './formatLocationLabel'
import { preferDisplayName, splitLocationSegments } from './locationNameUtils'

export function normalizeNominatimResult(result: any): NormalizedPlace {
  const addr = result?.address || {}
  const namedetails = result?.namedetails || {}
  const displaySegments = splitLocationSegments(result?.display_name)

  const city = preferDisplayName(
    addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.hamlet ||
      addr.locality ||
      addr.city_district ||
      addr.state ||
      result?.name ||
      '',
    [
      namedetails['name:en'],
      namedetails.int_name,
      namedetails.name,
      displaySegments[0],
    ],
  )

  const postalCode = addr.postcode || ''

  const region = preferDisplayName(
    addr.state ||
      addr.region ||
      addr.county ||
      addr.province ||
      addr.state_district ||
      '',
    [displaySegments.length > 2 ? displaySegments[displaySegments.length - 2] : ''],
  )

  const country = preferDisplayName(addr.country || '', [displaySegments[displaySegments.length - 1]])

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
    lat: Number(result?.lat),
    lng: Number(result?.lon),
    label,
  }
}

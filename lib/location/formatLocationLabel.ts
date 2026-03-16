export function formatLocationLabel(input: {
  city?: string | null
  postalCode?: string | null
  region?: string | null
  state?: string | null
  province?: string | null
  department?: string | null
  county?: string | null
  country?: string | null
}) {
  const area =
    input.region ||
    input.state ||
    input.province ||
    input.department ||
    input.county ||
    ''

  const parts = [
    input.city,
    input.postalCode,
    area,
    input.country,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)

  return [...new Set(parts)].join(', ')
}

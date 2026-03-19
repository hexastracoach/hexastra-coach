function cleanPart(value?: string | null): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

const NON_LATINISH_RE = /[^\p{Script=Latin}\p{Number}\s'.,()/-]/u

export function splitLocationSegments(value?: string | null): string[] {
  const clean = cleanPart(value)
  if (!clean) return []
  return clean
    .split(',')
    .map((part) => cleanPart(part))
    .filter(Boolean)
}

export function isLatinFriendly(value?: string | null): boolean {
  const clean = cleanPart(value)
  if (!clean) return false
  return !NON_LATINISH_RE.test(clean)
}

export function preferDisplayName(
  primary?: string | null,
  fallbacks: Array<string | null | undefined> = [],
): string {
  const candidates = [primary, ...fallbacks]
    .map((value) => cleanPart(value))
    .filter(Boolean)

  if (candidates.length === 0) return ''
  if (isLatinFriendly(candidates[0])) return candidates[0]

  const latinCandidate = candidates.find((candidate) => isLatinFriendly(candidate))
  return latinCandidate ?? candidates[0]
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const YEAR_REFERENCE_PATTERNS: RegExp[] = [
  /\b20(?:2[6-9]|[3-9]\d)\b/,
  /\bcette annee\b/,
  /\bmon annee\b/,
  /\bpour cette annee\b/,
  /\bpour l annee\b/,
  /\bsur l annee\b/,
  /\bthis year\b/,
  /\bmy year\b/,
  /\bnext year\b/,
]

const STRATEGIC_PRIORITY_PATTERNS: RegExp[] = [
  /\bpriorite?s?\b/,
  /\bsur quoi (?:me |se )?concentrer\b/,
  /\b(?:me |se )?concentrer sur\b/,
  /\bprivilegier\b/,
  /\baxe principal\b/,
  /\baxe de l annee\b/,
  /\bcap de l annee\b/,
  /\borientation dominante\b/,
  /\bou mettre (?:mon|ma|mes|son|sa|ses)? ?energie\b/,
  /\bmettre (?:mon|ma|mes|son|sa|ses)? ?energie\b/,
]

export function isYearlyPriorityQuestion(message: string): boolean {
  const normalized = normalize(message)
  if (!normalized) {
    return false
  }

  const hasYearReference = YEAR_REFERENCE_PATTERNS.some((pattern) => pattern.test(normalized))
  if (!hasYearReference) {
    return false
  }

  return STRATEGIC_PRIORITY_PATTERNS.some((pattern) => pattern.test(normalized))
}

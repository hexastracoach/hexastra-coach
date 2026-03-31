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
  /\ben 20(?:2[6-9]|[3-9]\d)\b/,
  /\bcycle annuel\b/,
  /\bthis year\b/,
  /\bmy year\b/,
  /\bnext year\b/,
]

const STRATEGIC_PRIORITY_PATTERNS: RegExp[] = [
  /\bpriorite?s?\b/,
  /\bsur quoi (?:(?:je|tu|on) dois )?(?:me |se )?concentrer\b/,
  /\bsur quoi (?:me |se )?concentrer\b/,
  /\b(?:me |se )?concentrer sur\b/,
  /\bou (?:(?:je|tu|on) dois )?(?:me |se )?concentrer\b/,
  /\bprivilegier\b/,
  /\baxe principal\b/,
  /\baxe de l annee\b/,
  /\bcap de l annee\b/,
  /\borientation dominante\b/,
  /\bquelle direction prendre\b/,
  /\bquel axe choisir\b/,
  /\bquel cap choisir\b/,
  /\bou mettre (?:mon|ma|mes|son|sa|ses)? ?energie\b/,
  /\bmettre (?:mon|ma|mes|son|sa|ses)? ?energie\b/,
  /\bqu(?: est ce que|e) je dois (?:arreter|stopper|laisser tomber|supprimer|couper)\b/,
  /\bquoi (?:arreter|stopper|laisser tomber|supprimer|couper)\b/,
  /\bce que je dois laisser tomber\b/,
  /\bou je perd[s]? mon energie\b/,
  /\bce qui me disperse\b/,
  /\bce qui me fait perdre du temps\b/,
]

const STANDALONE_STRATEGIC_PATTERNS: RegExp[] = [
  /\bmon annee\s+20(?:2[6-9]|[3-9]\d)\b/,
  /\bquel axe choisir\b/,
  /\bquel cap choisir\b/,
  /\bou je perd[s]? mon energie\b/,
  /\bce qui me disperse\b/,
  /\bce qui me fait perdre du temps\b/,
  /\bqu(?: est ce que|e) je dois (?:arreter|stopper|laisser tomber|supprimer|couper)\b/,
  /\bquoi (?:arreter|stopper|laisser tomber|supprimer|couper)\b/,
  /\bce que je dois laisser tomber\b/,
  /\bsur quoi (?:(?:je|tu|on) dois )?(?:me )?concentrer\b/,
  /\bou mettre (?:mon|ma|mes)? ?energie\b/,
]

export function isYearlyPriorityQuestion(message: string): boolean {
  const normalized = normalize(message)
  if (!normalized) {
    return false
  }

  const hasYearReference = YEAR_REFERENCE_PATTERNS.some((pattern) => pattern.test(normalized))
  const hasStrategicPrioritySignal = STRATEGIC_PRIORITY_PATTERNS.some((pattern) => pattern.test(normalized))
  const hasStandaloneStrategicSignal = STANDALONE_STRATEGIC_PATTERNS.some((pattern) => pattern.test(normalized))

  return hasStrategicPrioritySignal && (hasYearReference || hasStandaloneStrategicSignal)
}

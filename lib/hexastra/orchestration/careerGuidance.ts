function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const CAREER_GUIDANCE_KEYWORDS = [
  'quel metier est fait pour moi',
  'quel metier je peux faire',
  'quels metiers me correspondent',
  'dans quoi je pourrais travailler',
  'dans quoi travailler',
  'quel travail est fait pour moi',
  'quel travail me convient',
  'quel job je peux faire',
  'quel job me correspond',
  'quel metier me correspond',
  'pour quel metier suis je fait',
  'quelle carriere me correspond',
  'quelle voie pro me correspond',
  'quelle voie pro est faite pour moi',
  'dans quel domaine je peux reussir',
  'dans quel domaine je pourrais reussir',
  'quel boulot est aligne pour moi',
  'quel type de metier est fait pour moi',
  'quel travail me conviendrait',
  'quel type de poste me convient',
  'orientation professionnelle',
  'voie professionnelle',
  'dans quoi suis je bon au travail',
  'trouver ma vocation',
  'ma vocation professionnelle',
] as const

const CAREER_GUIDANCE_PATTERNS: RegExp[] = [
  /\bquel (metier|travail) est fait pour moi\b/i,
  /\bquel(?:s)? (?:sont )?les? metiers? que je peu[xt] faire\b/i,
  /\bquels? metiers? me correspond(?:ent)?\b/i,
  /\bdans quoi(?: je pourrais)? travailler\b/i,
  /\bquel travail me convient\b/i,
  /\bquel job je peu[xt] faire\b/i,
  /\bquel job me correspond\b/i,
  /\bquel metier me correspond\b/i,
  /\bpour quel metier suis[- ]?je fait\b/i,
  /\bquelle carriere me correspond\b/i,
  /\bquelle voie pro me correspond\b/i,
  /\bquelle voie pro est faite pour moi\b/i,
  /\bdans quel domaine je peux reussir\b/i,
  /\bdans quel domaine je pourrais reussir\b/i,
  /\bquel boulot est aligne pour moi\b/i,
  /\bquel type de metier est fait pour moi\b/i,
  /\bquel travail me conviendrait\b/i,
  /\bquel type de poste me convient\b/i,
  /\b(orientation|voie) professionnelle\b/i,
  /\bdans quoi suis[- ]?je bon au travail\b/i,
  /\b(trouver|quelle est) ma vocation( professionnelle)?\b/i,
]

export function isCareerGuidanceQuery(text: string): boolean {
  const normalized = normalize(text)
  return CAREER_GUIDANCE_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function hasCareerPathTerms(text: string): boolean {
  const normalized = normalize(text)
  return /\b(metier|metiers|travail|job|boulot|voie pro|voie professionnelle|carriere|domaine)\b/i.test(
    normalized,
  )
}

export function isCareerOrientationPrompt(text: string): boolean {
  const normalized = normalize(text)
  if (isCareerGuidanceQuery(normalized)) return true

  const hasCareerNoun =
    /\b(metier|metiers|travail|travailler|job|boulot|voie|carriere|profession|poste|domaine)\b/i.test(
      normalized,
    )
  const hasOrientationFrame =
    /\b(quel|quels|quelle|quelles|dans quoi|dans quel|quel type|quelle voie|me correspond|me convient|me conviendrait|est fait pour moi|faite pour moi|je peux faire|je pourrais travailler|je peux reussir|je pourrais reussir|est aligne pour moi)\b/i.test(
      normalized,
    )

  return hasCareerNoun && hasOrientationFrame
}

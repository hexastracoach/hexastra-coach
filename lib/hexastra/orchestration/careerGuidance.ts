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
  'quel boulot est aligne pour moi',
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
  /\bquel boulot est aligne pour moi\b/i,
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

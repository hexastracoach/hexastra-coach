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
  'quel travail est fait pour moi',
  'quel metier me correspond',
  'pour quel metier suis je fait',
  'quelle carriere me correspond',
  'quelle voie pro me correspond',
  'orientation professionnelle',
  'voie professionnelle',
  'dans quoi suis je bon au travail',
  'trouver ma vocation',
  'ma vocation professionnelle',
] as const

const CAREER_GUIDANCE_PATTERNS: RegExp[] = [
  /\bquel (metier|travail) est fait pour moi\b/i,
  /\bquel metier me correspond\b/i,
  /\bpour quel metier suis[- ]?je fait\b/i,
  /\bquelle carriere me correspond\b/i,
  /\bquelle voie pro me correspond\b/i,
  /\b(orientation|voie) professionnelle\b/i,
  /\bdans quoi suis[- ]?je bon au travail\b/i,
  /\b(trouver|quelle est) ma vocation( professionnelle)?\b/i,
]

export function isCareerGuidanceQuery(text: string): boolean {
  const normalized = normalize(text)
  return CAREER_GUIDANCE_PATTERNS.some((pattern) => pattern.test(normalized))
}

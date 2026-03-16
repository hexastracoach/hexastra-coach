export type LightRoute =
  | 'greeting'
  | 'small_talk'
  | 'navigation'
  | 'business_analysis'
  | 'practitioner_analysis'
  | 'inappropriate'

const NAVIGATION_TERMS = /\b(menu|angle|angles|navigation|explorer les angles|exploiter les angles|revenir au menu)\b/i
const GREETING_TERMS = /^(salut|bonjour|hello|coucou|hey)\b/i
const SMALL_TALK_TERMS = /\b(ça va|comment tu vas|tu vas bien|merci)\b/i
const PRACTITIONER_TERMS = /\b(praticien|praticienne|mode praticien|lecture praticien|analyse praticien)\b/i
const INAPPROPRIATE_TERMS = /\b(insulte|connard|fdp|nique|suicide|terrorisme)\b/i

export function lightRoute(message: string): LightRoute {
  const text = (message || '').trim().toLowerCase()
  if (!text) return 'small_talk'
  if (INAPPROPRIATE_TERMS.test(text)) return 'inappropriate'
  if (NAVIGATION_TERMS.test(text)) return 'navigation'
  if (PRACTITIONER_TERMS.test(text)) return 'practitioner_analysis'
  if (GREETING_TERMS.test(text)) return 'greeting'
  if (SMALL_TALK_TERMS.test(text)) return 'small_talk'
  // par défaut, tout ce qui ressemble à une question/exploration métier
  if (/[?]|pourquoi|comment|analyse|lecture|décision|travail|relation|problème|conflit/.test(text)) {
    return 'business_analysis'
  }
  return 'business_analysis'
}

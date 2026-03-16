export type Intent =
  | 'greeting'
  | 'small_talk'
  | 'gratitude'
  | 'navigation'
  | 'emotion'
  | 'question'
  | 'analysis'
  | 'decision'
  | 'project'
  | 'relationship'
  | 'career'
  | 'life'
  | 'hexastra_reading'
  | 'conversation'

export type IntentResult = { intent: Intent; confidence: number }

const MATCHERS: Array<[Intent, RegExp, number]> = [
  ['greeting', /^(salut|bonjour|hello|hey|coucou)\b/, 0.95],
  ['small_talk', /\b(ça va|comment tu vas|comment ça va)\b/, 0.9],
  ['gratitude', /\bmerci\b/, 0.8],
  ['navigation', /\b(menu|angle|angles|navigation|explorer les angles|exploiter les angles)\b/, 0.95],
  ['hexastra_reading', /\b(lecture|scan hexastra|lecture hexastra)\b/, 0.9],
  ['analysis', /\b(analyse|analyse-moi|lecture de situation|scan)\b/, 0.85],
  ['decision', /\b(hésite|choix|décision|trancher)\b/, 0.8],
  ['emotion', /\b(je suis|je me sens|émotion|ressens)\b/, 0.75],
  ['project', /\bprojet\b/, 0.7],
  ['relationship', /\b(couple|relation|famille|ami)\b/, 0.7],
  ['career', /\b(travail|job|carrière|boulot|entreprise)\b/, 0.7],
  ['question', /\b(pourquoi|comment|que faire|quand|quoi)\b/, 0.65],
  ['life', /\b(vie|orientation|sens)\b/, 0.6],
]

export function detectIntent(message: string): IntentResult {
  const text = (message || '').trim().toLowerCase()
  if (!text) return { intent: 'conversation', confidence: 0.2 }

  for (const [intent, rx, conf] of MATCHERS) {
    if (rx.test(text)) return { intent, confidence: conf }
  }

  return { intent: 'conversation', confidence: 0.4 }
}

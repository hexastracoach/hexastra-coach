export type Intent =
  | 'greeting'
  | 'small_talk'
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

export function detectIntent(message: string): IntentResult {
  const text = (message || '').trim().toLowerCase()
  if (!text) return { intent: 'conversation', confidence: 0.2 }

  const tests: Array<[Intent, RegExp, number]> = [
    ['greeting', /^(salut|bonjour|hello|hey|coucou)\b/, 0.9],
    ['small_talk', /\bça va\b|\bcomment tu vas\b/, 0.8],
    ['gratitude' as Intent, /\bmerci\b/, 0.7],
    ['hexastra_reading', /\blecture\b|\banalyse\b|\bscan\b/, 0.9],
    ['analysis', /\b(analyse|lecture|th[eè]me|multi-angle)\b/, 0.8],
    ['decision', /\b(hésite|hésitation|choix|décision)\b/, 0.75],
    ['emotion', /\b(je suis|je me sens)\b/, 0.7],
    ['project', /\bprojet\b/, 0.7],
    ['relationship', /\b(couple|relation|famille|ami)\b/, 0.7],
    ['career', /\b(travail|job|carrière|boulot|entreprise)\b/, 0.7],
    ['question', /\b(pourquoi|comment|que faire|quand)\b/, 0.65],
    ['life', /\b(vie|orientation|sens)\b/, 0.6],
  ]

  for (const [intent, rx, conf] of tests) {
    if (rx.test(text)) return { intent, confidence: conf }
  }

  return { intent: 'conversation', confidence: 0.4 }
}

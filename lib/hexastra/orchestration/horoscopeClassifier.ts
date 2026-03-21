/**
 * Horoscope Classifier — Hexastra Coach
 *
 * Detects horoscope intent from user messages and determines the variant
 * (daily or weekly). Used to route directly to the HexAstra Horoscope
 * structured template — never to generic analysis or micro_profile.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type HoroscopeVariant = 'daily' | 'weekly'

// ── Trigger patterns ───────────────────────────────────────────────────────────

/** Patterns that signal a daily horoscope request */
const DAILY_TRIGGERS: RegExp[] = [
  /\bhoroscope\b/i,
  /horoscope (du jour|d.aujourd.hui|journalier|personnalisé|personnalise)/i,
  /mon horoscope/i,
  /hexastra horoscope/i,
  /lecture (du jour|horoscope)/i,
  /scan du jour/i,
  /énergie du jour/i,
  /energie du jour/i,
  /horoscope hexastra/i,
]

/** Patterns that signal a 7-day / weekly horoscope request */
const WEEKLY_TRIGGERS: RegExp[] = [
  /horoscope (de la semaine|hebdomadaire|7 jours|sept jours)/i,
  /scan (de la semaine|hebdomadaire|7 jours)/i,
  /lecture (de la semaine|hebdomadaire|sur 7 jours|sur sept jours)/i,
  /prévisions? (de la semaine|pour la semaine|7 jours)/i,
  /7 jours/i,
  /sept jours/i,
]

// ── Normalizer ─────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ── Main functions ─────────────────────────────────────────────────────────────

/**
 * Returns true if the user message contains a horoscope intent.
 *
 * Used to route to template = mandatory_structured_horoscope.
 * NEVER route to micro_profile, guided_analysis, or generic reading.
 */
export function isHoroscopeRequest(message: string): boolean {
  const n = normalize(message)
  return (
    DAILY_TRIGGERS.some((p) => p.test(n) || p.test(message.toLowerCase())) ||
    WEEKLY_TRIGGERS.some((p) => p.test(n) || p.test(message.toLowerCase()))
  )
}

/**
 * Detects whether the request is for a daily or weekly (7-day) horoscope.
 * Defaults to 'daily' when ambiguous.
 */
export function detectHoroscopeVariant(message: string): HoroscopeVariant {
  const n = normalize(message)
  if (WEEKLY_TRIGGERS.some((p) => p.test(n) || p.test(message.toLowerCase()))) {
    return 'weekly'
  }
  return 'daily'
}

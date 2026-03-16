import type { Msg } from '@/app/chat/_lib/chat'

export type DepthLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4'

type PlanKey = 'free' | 'essential' | 'premium' | 'praticien' | string

function countSignalWords(message: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, rx) => (rx.test(message) ? acc + 1 : acc), 0)
}

/**
 * Heuristic detector. No network, lightweight, evolves with conversation length.
 */
export function detectUserDepthLevel(
  message: string,
  history: Msg[],
  plan: PlanKey
): DepthLevel {
  const text = message.toLowerCase()
  const len = message.length
  const totalUserMsgs = history.filter((m) => m.role === 'user').length

  const advancedSignals = countSignalWords(text, [
    /multi[-\s]?angle/,
    /\banalyse\b/,
    /\bsyst[ée]mique\b/,
    /\barch[ée]types?\b/,
    /\bdynamique\b/,
    /\btension (interne|intr[ée]ieure)/,
    /\bpolarité\b/,
  ])

  const practSignals = countSignalWords(text, [
    /\bpraticien\b/,
    /\blecture avanc[ée]e\b/,
    /\bmod[ée]liser\b/,
    /\bprotocoles?\b/,
  ])

  const curiousSignals = countSignalWords(text, [
    /\bexplorer\b/,
    /\bcomprendre\b/,
    /\bpourquoi\b/,
    /\bangle\b/,
    /\btiraillement\b/,
  ])

  // Practitioner tier unlocks ceiling
  if (plan === 'praticien' || practSignals > 0) return 'LEVEL_4'

  if (advancedSignals >= 2 || len > 220) return 'LEVEL_3'
  if (curiousSignals >= 1 || len > 120 || totalUserMsgs > 6) return 'LEVEL_2'
  return 'LEVEL_1'
}

type AdjustOptions = {
  level: DepthLevel
  plan: PlanKey
  isReading?: boolean
}

/**
 * Shapes the response depth. Keeps original text, but nudges length and framing.
 */
export function adjustResponseDepth(reply: string, { level, plan, isReading }: AdjustOptions): string {
  if (!reply) return reply
  let lines = reply.trim().split(/\r?\n/).filter(Boolean)

  // Soft cap per level when not a reading block
  if (!isReading) {
    const cap =
      level === 'LEVEL_1' ? 6 :
      level === 'LEVEL_2' ? 9 :
      level === 'LEVEL_3' ? 14 : 18
    if (lines.length > cap) lines = lines.slice(0, cap)
  }

  // Add framing per level (lightweight)
  const join = () => lines.join('\n')

  switch (level) {
    case 'LEVEL_1':
      return `${join()}\n\nSi tu veux, on avance étape par étape.`
    case 'LEVEL_2':
      return `${join()}\n\nOn peut ouvrir un ou deux angles si tu le souhaites.`
    case 'LEVEL_3':
      return `${join()}\n\nOn peut affiner la dynamique ou regarder le mouvement sous-jacent.`
    case 'LEVEL_4': {
      const multi = plan === 'praticien'
        ? `\n\nSi tu veux, on peut prendre plusieurs axes (matière, énergie, relation) pour compléter.`
        : ''
      return `${join()}${multi}`
    }
    default:
      return join()
  }
}

export function adaptSuggestions(level: DepthLevel): string[] {
  switch (level) {
    case 'LEVEL_1':
      return ['Clarifier ce qui te pèse le plus', 'Identifier une première petite étape']
    case 'LEVEL_2':
      return ['Explorer ce qui crée ce tiraillement intérieur', 'Regarder ce qui changerait si tu ajustais un point']
    case 'LEVEL_3':
      return ['Lire la tension entre stabilité et expansion', 'Observer la dynamique interne qui veut évoluer']
    case 'LEVEL_4':
      return ['Cartographier les forces qui structurent ce moment', 'Comparer deux scénarios pour voir l’alignement']
  }
}

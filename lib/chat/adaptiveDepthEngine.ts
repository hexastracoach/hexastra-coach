import type { Msg } from '@/app/chat/_lib/chat'

export type DepthLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4'

type PlanKey = 'free' | 'essential' | 'premium' | 'praticien' | string

function countSignalWords(message: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, rx) => (rx.test(message) ? acc + 1 : acc), 0)
}

export function detectUserDepthLevel(
  message: string,
  history: Msg[],
  plan: PlanKey,
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

export function adjustResponseDepth(reply: string, { level, plan, isReading }: AdjustOptions): string {
  if (!reply) return reply
  let lines = reply.trim().split(/\r?\n/).filter(Boolean)

  if (!isReading) {
    const planCap =
      plan === 'free'
        ? 6
        : plan === 'essential'
          ? 9
          : plan === 'premium'
            ? 14
            : 18
    const levelCap = level === 'LEVEL_1' ? 6 : level === 'LEVEL_2' ? 9 : level === 'LEVEL_3' ? 14 : 18
    const cap = Math.min(planCap, levelCap)
    if (lines.length > cap) lines = lines.slice(0, cap)
  }

  return lines.join('\n')
}

export function adaptSuggestions(level: DepthLevel): string[] {
  switch (level) {
    case 'LEVEL_1':
      return ['Clarifier ce qui te pese le plus', 'Identifier une premiere petite etape']
    case 'LEVEL_2':
      return ['Explorer ce qui cree ce tiraillement interieur', 'Regarder ce qui changerait si tu ajustais un point']
    case 'LEVEL_3':
      return ['Lire la tension entre stabilite et expansion', 'Observer la dynamique interne qui veut evoluer']
    case 'LEVEL_4':
      return ['Cartographier les forces qui structurent ce moment', 'Comparer deux scenarios pour voir l alignement']
  }
}

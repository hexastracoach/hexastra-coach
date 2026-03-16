type Energy = 'stress' | 'lost' | 'fatigue' | 'curious' | 'neutral'

type SilenceCtx = {
  intent?: string
  userMessage?: string
  isReading?: boolean
}

const SHORT_UTTERANCES = [
  /^salut\b/i,
  /^hello\b/i,
  /^hey\b/i,
  /^coucou\b/i,
  /^merci\b/i,
  /^(ok|oui|non|d'accord|je vois|intéressant)\b/i,
  /^ça va\b/i,
]

const MINIMAL_SHAPES = {
  A: "Je suis là.\nQu’est-ce qui te pèse le plus en ce moment ?",
  B: "Je vois.\nQuelque chose semble demander à être clarifié ici.",
  C: "Oui, ça arrive.\nOn peut regarder ça simplement.",
  D: "Merci.\nContinue, je te suis.",
  E: "Je comprends.\nOù sens-tu que ça bloque le plus ?",
}

function pickShape(intent?: string, energy?: Energy): string {
  if (energy === 'stress' || energy === 'fatigue') return MINIMAL_SHAPES.E
  if (intent === 'GREETING' || intent === 'SMALL_TALK') return MINIMAL_SHAPES.A
  if (intent === 'EMOTIONAL') return MINIMAL_SHAPES.B
  if (intent === 'DECISION' || intent === 'EXPLORATION' || intent === 'QUESTION') return MINIMAL_SHAPES.E
  return MINIMAL_SHAPES.C
}

function detectEnergy(msg?: string): Energy {
  if (!msg) return 'neutral'
  const t = msg.toLowerCase()
  if (/stress|tendu|angoiss|peur|pression/.test(t)) return 'stress'
  if (/fatigu|épuis|vidé|lassé|marre/.test(t)) return 'fatigue'
  if (/perdu|flou|ne sais pas|hésite|doute/.test(t)) return 'lost'
  if (/curieux|pourquoi|comment|envie de comprendre/.test(t)) return 'curious'
  return 'neutral'
}

function isShortUserMessage(msg?: string): boolean {
  if (!msg) return false
  const t = msg.trim()
  if (t.length <= 12) return true
  return SHORT_UTTERANCES.some((rx) => rx.test(t))
}

function detectOverexplaining(lines: string[]): boolean {
  if (lines.length > 5) return true
  const questions = lines.filter((l) => l.includes('?')).length
  if (questions > 1) return true
  // repeated starters
  const starters = lines.map((l) => l.split(' ').slice(0, 3).join(' ').toLowerCase())
  const unique = new Set(starters)
  return unique.size < starters.length
}

function trimRedundancies(lines: string[]): string[] {
  const seen = new Set<string>()
  const res: string[] = []
  for (const l of lines) {
    const k = l.trim().toLowerCase()
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    // skip filler phrases
    if (/merci pour (ce|ta)/i.test(l) && res.some((r) => /merci/i.test(r))) continue
    res.push(l)
  }
  return res
}

function shouldCompressResponse(lines: string[], ctx: SilenceCtx, energy: Energy): boolean {
  if (ctx.isReading) return false
  if (isShortUserMessage(ctx.userMessage)) return true
  if (energy === 'stress' || energy === 'fatigue' || energy === 'lost') return true
  return detectOverexplaining(lines)
}

export function applyIntelligentSilence(reply: string, ctx: SilenceCtx = {}): string {
  if (!reply) return reply
  const energy = detectEnergy(ctx.userMessage)

  // For analyses/readings, only light trimming of redundancies
  if (ctx.isReading) {
    const lines = trimRedundancies(reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    return lines.join('\n')
  }

  const lines = trimRedundancies(reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))

  if (!shouldCompressResponse(lines, ctx, energy)) {
    return lines.slice(0, 5).join('\n')
  }

  // Compress to a minimal, calm shape
  return pickShape(ctx.intent, energy)
}

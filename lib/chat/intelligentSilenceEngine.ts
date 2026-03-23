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
  /^(ok|oui|non|d'accord|je vois|interessant|intéressant)\b/i,
  /^(ca va|ça va)\b/i,
]

const MINIMAL_SHAPES = {
  A: 'Salut. Je suis là.\nComment tu te sens maintenant ?',
  B: "Je vois.\nQu'est-ce qui demande à être clarifié ici ?",
  C: "D'accord.\nOn peut regarder ça simplement.",
  D: 'Merci.\nJe te suis.',
  E: 'Je comprends.\nOu est-ce que ça bloque le plus ?',
}

function pickShape(intent?: string, energy?: Energy): string {
  const i = intent?.toLowerCase()
  if (energy === 'stress' || energy === 'fatigue') return MINIMAL_SHAPES.E
  if (i === 'greeting' || i === 'small_talk') return MINIMAL_SHAPES.A
  if (i === 'emotional' || i === 'emotion') return MINIMAL_SHAPES.B
  if (i === 'decision' || i === 'exploration' || i === 'question') return MINIMAL_SHAPES.E
  return MINIMAL_SHAPES.C
}

function detectEnergy(msg?: string): Energy {
  if (!msg) return 'neutral'
  const t = msg.toLowerCase()
  if (/stress|tendu|angoiss|peur|pression/.test(t)) return 'stress'
  if (/fatigu|epuis|épuis|vide|vidé|lasse|lassé|marre/.test(t)) return 'fatigue'
  if (/perdu|flou|ne sais pas|hesite|hésite|doute/.test(t)) return 'lost'
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

  if (ctx.isReading) {
    const lines = trimRedundancies(reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
    return lines.join('\n')
  }

  const lines = trimRedundancies(reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))

  if (!shouldCompressResponse(lines, ctx, energy)) {
    return lines.slice(0, 5).join('\n')
  }

  return pickShape(ctx.intent, energy)
}

type Energy = 'stress' | 'lost' | 'curious' | 'fatigue' | 'neutral'

type HumanToneCtx = {
  intent?: string
  userMessage?: string
  isReading?: boolean
}

const RECO_PATTERNS = [
  "Je vois.",
  "Merci de me le dire.",
  "Je t'entends.",
  "Intéressant.",
  "Merci pour ta clarté.",
]

const OPEN_PATTERNS = [
  "Qu'est-ce qui compte le plus pour toi là-dedans ?",
  "On peut regarder ça ensemble.",
  "Dis-moi ce qui te semble prioritaire.",
  "Par quoi tu veux qu'on commence ?",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function detectEnergy(message?: string): Energy {
  if (!message) return 'neutral'
  const txt = message.toLowerCase()
  if (/stress|tendu|pression|angoiss|peur/.test(txt)) return 'stress'
  if (/perdu|flou|ne sais pas|hésite|doute/.test(txt)) return 'lost'
  if (/fatigu|épuis|vidé|lassé|marre/.test(txt)) return 'fatigue'
  if (/pourquoi|comment|curieux|envie de comprendre/.test(txt)) return 'curious'
  return 'neutral'
}

function canUseHumor(intent?: string, energy?: Energy): boolean {
  if (energy === 'stress' || energy === 'fatigue' || energy === 'lost') return false
  if (!intent) return false
  return intent === 'GREETING' || intent === 'SMALL_TALK' || intent === 'QUESTION'
}

function gentleHumorLine(intent?: string): string {
  if (intent === 'GREETING' || intent === 'SMALL_TALK') {
    return "Disons que je n'ai pas encore besoin d'un café supplémentaire, c'est bon signe."
  }
  return "Même les GPS intérieurs recalculent parfois l'itinéraire."
}

export function applyHumanTone(reply: string, ctx: HumanToneCtx = {}): string {
  if (!reply) return reply

  // Avoid touching long structured readings
  if (ctx.isReading) return reply

  const energy = detectEnergy(ctx.userMessage)
  const intent = ctx.intent
  const lines = reply.trim().split(/\r?\n/).filter(Boolean)

  // Add a varied recognition if absent
  const hasRecognition = /^merci\b|^je (vois|t'entends|comprends)/i.test(lines[0] ?? '')
  const prefix = hasRecognition ? lines[0] : pick(RECO_PATTERNS)

  const body = hasRecognition ? lines : [lines[0], ...lines.slice(1)]

  const humor = canUseHumor(intent, energy) ? gentleHumorLine(intent) : null

  const mirror = body.slice(0, 2).join('\n')
  const open = pick(OPEN_PATTERNS)

  const assembled = [
    prefix,
    humor ? humor : null,
    mirror,
    open,
  ].filter(Boolean).join('\n')

  return assembled
}

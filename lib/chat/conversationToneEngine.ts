/**
 * HexAstra conversation tone stabilizer.
 * Ensures every reply stays SHILO: calme, humain, clair, lucide, accessible.
 */

export type ToneContext = {
  intent?: string
  isReading?: boolean
  maxLines?: number
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
}

function softenSystemicPhrases(text: string): string {
  return text
    .replace(/(choisis|selectionne)\s+(une|la)\s+(cat[ée]gorie|option)/gi, 'On peut avancer ensemble sans passer par un menu.')
    .replace(/utilise\s+le\s+menu/gi, 'Dis-moi simplement ce qui compte pour toi, je m’adapte.')
    .replace(/voici\s+(les\s+)?options?\s*:/gi, 'Voilà quelques pistes que je peux explorer avec toi :')
}

function prependRecognition(text: string): string {
  const firstLine = text.split('\n')[0] || ''
  if (/(merci|je t'entends|je comprends|je suis l[àa])/i.test(firstLine)) return text
  return `Merci pour ce que tu partages.\n${text}`
}

function limitLines(text: string, maxLines?: number): string {
  if (!maxLines) return text
  const lines = text.split('\n')
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join('\n')
}

export function ensureHexAstraTone(text: string, ctx: ToneContext = {}): string {
  if (!text) return text
  let t = normalizeWhitespace(text)
  t = softenSystemicPhrases(t)
  if (!ctx.isReading) {
    t = prependRecognition(t)
    t = limitLines(t, ctx.maxLines ?? 8)
  }
  return t
}

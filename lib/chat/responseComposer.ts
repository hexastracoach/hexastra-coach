export type ResponseType = 'GREETING' | 'SMALL_TALK' | 'COACH_RESPONSE' | 'ANALYSIS' | 'EXPLORATION'

type ComposeOptions = {
  intent?: string
  isReading?: boolean
}

function detectResponseType(intent?: string, isReading?: boolean): ResponseType {
  if (isReading) return 'ANALYSIS'
  switch (intent) {
    case 'GREETING':
      return 'GREETING'
    case 'SMALL_TALK':
      return 'SMALL_TALK'
    case 'EXPLORATION':
    case 'QUESTION':
    case 'ANALYSIS_REQUEST':
      return 'EXPLORATION'
    case 'DECISION':
    case 'EMOTIONAL':
    default:
      return 'COACH_RESPONSE'
  }
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const l of lines) {
    const k = l.trim().toLowerCase()
    if (k && !seen.has(k)) {
      seen.add(k)
      result.push(l)
    }
  }
  return result
}

export function composeResponse(text: string, opts: ComposeOptions = {}): string {
  if (!text) return text
  const type = detectResponseType(opts.intent, opts.isReading)

  // Keep analysis verbatim to avoid truncating long readings
  if (type === 'ANALYSIS') return text

  // Split on lines, keep non-empty, dedupe, cap length
  const lines = dedupeLines(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
  )

  const maxLines = 5
  const trimmed = lines.slice(0, maxLines)

  // Ensure minimum 2 lines when possible
  if (trimmed.length === 1 && lines.length > 1) trimmed.push(lines[1])

  return trimmed.join('\n')
}

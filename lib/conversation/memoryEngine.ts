export type ConversationEntities = Record<string, string>

export function extractEntities(message: string): ConversationEntities {
  const entities: ConversationEntities = {}
  const words = (message || '').split(/\s+/)

  for (const w of words) {
    if (!w) continue
    if (w[0] === w[0]?.toUpperCase() && w.slice(1).toLowerCase() !== w.slice(1)) {
      entities.name = w.replace(/[^A-Za-zÀ-ÿ'-]/g, '')
      break
    }
  }

  return entities
}

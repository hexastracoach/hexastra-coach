export type ShortTermMemory = {
  history: string[]
  state: string
}

export type LongTermMemory = {
  profile?: {
    goals?: string[]
    preferences?: string[]
  }
  themes?: string[]
  relations?: string[]
}

export function updateShortTermMemory(mem: ShortTermMemory, message: string): ShortTermMemory {
  const nextHistory = [...(mem.history ?? [])].slice(-9)
  nextHistory.push(message)
  return { ...mem, history: nextHistory }
}

export function mergeLongTermMemory(mem: LongTermMemory, entities: Record<string, string>): LongTermMemory {
  const next = { ...mem }
  if (entities.topic) {
    next.themes = Array.from(new Set([...(next.themes ?? []), entities.topic])).slice(-5)
  }
  if (entities.person) {
    next.relations = Array.from(new Set([...(next.relations ?? []), entities.person])).slice(-5)
  }
  return next
}

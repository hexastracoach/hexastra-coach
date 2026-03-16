export type ExtractedEntities = {
  person?: string
  project?: string
  location?: string
  topic?: string
  date?: string
  goal?: string
}

export function extractEntities(message: string): ExtractedEntities {
  const entities: ExtractedEntities = {}
  const words = (message || '').split(/\s+/)

  for (const w of words) {
    if (w.length > 1 && w[0] === w[0]?.toUpperCase() && w.slice(1) === w.slice(1).toLowerCase()) {
      entities.person = w.replace(/[^A-Za-zÀ-ÿ'-]/g, '')
      break
    }
  }

  if (/projet/i.test(message)) entities.project = 'projet'
  if (/travail|job|boulot|entreprise/i.test(message)) entities.topic = 'travail'
  if (/relation|couple|famille|ami/i.test(message)) entities.topic = 'relation'
  if (/décision|choix/i.test(message)) entities.goal = 'décision'

  return entities
}

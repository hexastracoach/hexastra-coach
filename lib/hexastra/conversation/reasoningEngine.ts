import type { ExtractedEntities } from './entityEngine'

export function runReasoning(input: {
  intent: string
  entities: ExtractedEntities
  message: string
}): string {
  const { intent, entities, message } = input
  if (intent === 'analysis' || intent === 'hexastra_reading') {
    return [
      'Comprendre : je repère ce que tu veux éclairer.',
      `Clarifier : ${entities.topic ? `ça touche ${entities.topic}` : 'précise le point central'}.`,
      'Orienter : on peut regarder le levier le plus simple.',
      'Action : propose-moi ce qui bouge déjà ou ce qui bloque.'
    ].join('\n')
  }

  if (intent === 'decision') {
    return "On peut peser tes options. Qu'est-ce qui compte le plus pour toi dans ce choix ?"
  }

  // fallback conversationnel
  return message
}

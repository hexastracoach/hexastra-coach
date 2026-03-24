/**
 * Suggestions contextuelles — Hexastra Coach
 * Génère des suggestions dynamiques basées sur le contexte de la conversation.
 */

import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import type { PlanKey } from '@/types/subscription'

export const STARTER_SUGGESTIONS = [
  'Explorer votre situation',
  'Voir plus clair avant de décider',
  'Comprendre ce qui bloque en ce moment',
  'Faire le point sur ce qui évolue',
]

const SCIENCE_FOLLOWUPS: Record<string, string[]> = {
  astrology: [
    'Voir ce qui se joue le plus fort maintenant',
    'Approfondir le bon timing',
    'Identifier le point de vigilance utile',
    'Revenir sur ce qui a bougé depuis la dernière fois',
  ],
  numerology: [
    'Lire la phase active en ce moment',
    'Comprendre le rythme de cette période',
    'Voir ce qui demande un ajustement',
    'Faire le point sur ce qui évolue',
  ],
  human_design: [
    'Comprendre ce qui te stabilise le plus',
    'Voir comment avancer plus justement',
    'Identifier le bon levier du moment',
    'Revenir sur ce qui a changé dans la situation',
  ],
  enneagram: [
    'Mieux comprendre ta réaction actuelle',
    'Voir ce qui se rejoue en profondeur',
    "Identifier ton levier d'ajustement",
    'Revenir sur ce qui a bougé depuis la dernière fois',
  ],
  kua: [
    'Voir ce qui te remet le plus en axe',
    "Approfondir l'ajustement concret du moment",
    'Identifier le meilleur recentrage utile',
    'Faire le point sur ce qui évolue',
  ],
  hexastra_fusion: [
    'Voir la situation dans son ensemble',
    'Approfondir ce qui se joue vraiment',
    'Clarifier la meilleure prochaine direction',
    'Revenir sur ce qui a bougé depuis la dernière fois',
  ],
}

export function buildContextualSuggestions(params: {
  messages: Array<{ role: string; content: string }>
  plan: PlanKey
}): string[] {
  const { messages, plan } = params

  if (messages.length === 0) return STARTER_SUGGESTIONS

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser?.content) return STARTER_SUGGESTIONS

  const detected = detectSubcategory(lastUser.content)
  const science = detected.primary?.science

  if (!science || !SCIENCE_FOLLOWUPS[science]) {
    return STARTER_SUGGESTIONS.slice(0, 3)
  }

  const base = [...SCIENCE_FOLLOWUPS[science]].slice(0, 3)

  if (plan !== 'free' && science !== 'hexastra_fusion') {
    base.push('Approfondir la situation avec plus de précision')
  }

  return base
}

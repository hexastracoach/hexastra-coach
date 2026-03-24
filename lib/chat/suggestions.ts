/**
 * Suggestions contextuelles — Hexastra Coach
 * Génère des suggestions dynamiques basées sur le contexte de la conversation.
 */

import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import type { PlanKey } from '@/types/subscription'

export const STARTER_SUGGESTIONS = [
  'Explorer votre situation',
  'Analyse Hexastra',
  'Faire un bilan du moment',
  'Clarifier ma situation actuelle',
]

const SCIENCE_FOLLOWUPS: Record<string, string[]> = {
  astrology: [
    'Voir ce qui se joue le plus fort maintenant',
    'Approfondir le bon timing',
    'Lire les points de vigilance du moment',
    'Obtenir une vue d ensemble plus claire',
  ],
  numerology: [
    'Lire la phase active en ce moment',
    'Comprendre le rythme de cette periode',
    'Voir ce qui demande un ajustement',
    'Obtenir une synthese plus complete',
  ],
  human_design: [
    'Comprendre mon fonctionnement du moment',
    'Voir comment mieux decider',
    'Identifier mon axe de stabilite',
    'Obtenir une lecture plus approfondie',
  ],
  enneagram: [
    'Mieux comprendre ma reaction actuelle',
    'Voir ce qui se rejoue en profondeur',
    'Identifier mon levier d evolution',
    'Obtenir une lecture plus fine',
  ],
  kua: [
    'Voir ce qui me remet le plus en axe',
    'Approfondir la question d environnement',
    'Identifier le meilleur ajustement concret',
    'Obtenir une lecture plus complete',
  ],
  hexastra_fusion: [
    'Analyse Hexastra approfondie',
    'Timing optimal pour agir',
    'Clarifier une relation importante',
    'Voir la situation dans son ensemble',
  ],
}

export function buildContextualSuggestions(params: {
  messages: Array<{ role: string; content: string }>
  plan: PlanKey
}): string[] {
  const { messages, plan } = params

  if (messages.length === 0) return STARTER_SUGGESTIONS

  // Détecter la science depuis le dernier message utilisateur
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser?.content) return STARTER_SUGGESTIONS

  const detected = detectSubcategory(lastUser.content)
  const science = detected.primary?.science

  if (!science || !SCIENCE_FOLLOWUPS[science]) {
    return STARTER_SUGGESTIONS.slice(0, 3)
  }

  const base = [...SCIENCE_FOLLOWUPS[science]].slice(0, 3)

  // Propose une lecture Hexastra approfondie pour les plans payants
  if (plan !== 'free' && science !== 'hexastra_fusion') {
    base.push('Analyse Hexastra approfondie')
  }

  return base
}

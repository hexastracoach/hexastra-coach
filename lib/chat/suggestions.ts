/**
 * Suggestions contextuelles — Hexastra Coach
 * Génère des suggestions dynamiques basées sur le contexte de la conversation.
 */

import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import type { PlanKey } from '@/types/subscription'

export const STARTER_SUGGESTIONS = [
  'Découvrir mon profil Hexastra',
  'Comprendre mon ascendant',
  'Faire un bilan du moment',
  'Analyser ma situation actuelle',
]

const SCIENCE_FOLLOWUPS: Record<string, string[]> = {
  astrology: [
    'Mes transits du jour',
    'Mon ascendant en détail',
    'Mes aspects du moment',
    'Mon thème natal complet',
  ],
  numerology: [
    'Mon année personnelle',
    'Mon chemin de vie',
    'Mon mois personnel',
    'Mon jour numérique',
  ],
  human_design: [
    'Mon type Human Design',
    'Mon autorité intérieure',
    'Ma stratégie HD',
    "Ma croix d'incarnation",
  ],
  enneagram: [
    'Mon type ennéagramme',
    'Mon aile dominante',
    'Mon instinct dominant',
    "Niveau d'intégration ennéa",
  ],
  kua: [
    'Mon nombre Kua',
    'Mes directions favorables',
    'Orientation de mon bureau',
    'Direction de sommeil Kua',
  ],
  hexastra_fusion: [
    'Lecture fusionnée complète',
    'Timing optimal pour agir',
    'Compatibilité Hexastra',
    'Situation globale multi-sciences',
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

  // Propose la fusion pour les plans payants
  if (plan !== 'free' && science !== 'hexastra_fusion') {
    base.push('Lecture fusionnée Hexastra')
  }

  return base
}

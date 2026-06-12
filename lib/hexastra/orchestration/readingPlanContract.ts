import type { PlanKey } from '@/types/subscription'
import { getPlanContract } from './planContracts'

export type ReadingPlanContract = {
  plan: PlanKey
  label: string
  responseDepth: 'short' | 'medium' | 'long' | 'expert'
  maxOutputLength: 'short' | 'medium' | 'long'
  readingDepth: 'discovery' | 'guided' | 'deep' | 'professional'
  maxParagraphs: number
  maxActions: number
  include: {
    exactData: boolean
    synthesis: boolean
    phase: boolean
    lifeZone: boolean
    reliability: boolean
    contradictions: boolean
    practitionerMarkers: boolean
  }
  styleRules: string[]
  finalCoachInstruction: string
}

const PLAN_LABELS: Record<PlanKey, string> = {
  free: 'Gratuit',
  essential: 'Essentiel',
  premium: 'Premium',
  practitioner: 'Praticien',
}

export function buildReadingPlanContract(plan: PlanKey): ReadingPlanContract {
  const contract = getPlanContract(plan)
  const base = {
    plan,
    label: PLAN_LABELS[plan] ?? PLAN_LABELS.free,
    responseDepth: contract.responseDepth,
    maxOutputLength: contract.maxOutputLength,
  }

  if (plan === 'essential') {
    return {
      ...base,
      readingDepth: 'guided',
      maxParagraphs: 5,
      maxActions: 2,
      include: {
        exactData: true,
        synthesis: true,
        phase: true,
        lifeZone: false,
        reliability: false,
        contradictions: false,
        practitionerMarkers: false,
      },
      styleRules: [
        'Reponse structuree, claire et fluide.',
        'Ne pas produire de lecture exhaustive.',
        'Inclure une mise en perspective courte et 1 a 2 actions concretes.',
      ],
      finalCoachInstruction:
        'Plan Essentiel: repondre de facon structuree et personnalisee, avec une profondeur moyenne et sans detail technique superflu.',
    }
  }

  if (plan === 'premium') {
    return {
      ...base,
      readingDepth: 'deep',
      maxParagraphs: 8,
      maxActions: 3,
      include: {
        exactData: true,
        synthesis: true,
        phase: true,
        lifeZone: true,
        reliability: true,
        contradictions: true,
        practitionerMarkers: false,
      },
      styleRules: [
        'Lecture complete, nuancee et multi-dimensionnelle.',
        'Faire ressortir la dynamique dominante, les tensions et les opportunites.',
        'Inclure 2 a 3 actions concretes et une vigilance utile.',
      ],
      finalCoachInstruction:
        'Plan Premium: produire une lecture approfondie, avec synthese, phase, zone de vie, nuances et leviers concrets.',
    }
  }

  if (plan === 'practitioner') {
    return {
      ...base,
      readingDepth: 'professional',
      maxParagraphs: 10,
      maxActions: 4,
      include: {
        exactData: true,
        synthesis: true,
        phase: true,
        lifeZone: true,
        reliability: true,
        contradictions: true,
        practitionerMarkers: true,
      },
      styleRules: [
        'Lecture professionnelle, claire et exploitable pour un adulte non specialiste.',
        'Traduire les termes techniques en langage courant avant toute mention de science.',
        'Inclure les points de support, les points de vigilance et la dynamique systemique sans jargon brut.',
        'Peut utiliser un format professionnel si le contexte praticien ou client est actif, mais doit rester comprehensible par un adulte de 18 ans et plus.',
      ],
      finalCoachInstruction:
        'Plan Praticien: produire une lecture professionnelle, systemique et exploitable, formulee en langage clair pour un adulte non specialiste. Les sciences doivent etre traduites en comportements, tensions, besoins, limites et leviers concrets.',
    }
  }

  return {
    ...base,
    readingDepth: 'discovery',
    maxParagraphs: 3,
    maxActions: 1,
    include: {
      exactData: true,
      synthesis: false,
      phase: false,
      lifeZone: false,
      reliability: false,
      contradictions: false,
      practitionerMarkers: false,
    },
    styleRules: [
      'Reponse courte et directe.',
      'Ne pas faire de lecture complete.',
      'Donner une seule action concrete.',
      'Ne pas mentionner les details techniques ni les sciences si ce n est pas necessaire.',
    ],
    finalCoachInstruction:
      'Plan Gratuit: donner une lecture de decouverte courte, utile et non exhaustive. Ne pas debloquer une analyse profonde.',
  }
}

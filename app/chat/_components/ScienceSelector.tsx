'use client'

import type { PlanKey } from '@/types/subscription'

type ScienceItem = {
  key: string
  label: string
  icon: string
  prompt: string
  minPlan?: PlanKey
}

const SCIENCES: ScienceItem[] = [
  {
    key: 'astrology',
    label: 'Astrologie',
    icon: '✦',
    prompt: 'Je veux explorer mon thème natal et mes transits astrologiques.',
  },
  {
    key: 'numerology',
    label: 'Numérologie',
    icon: '◈',
    prompt: 'Je veux analyser mon chemin de vie et mon année personnelle.',
  },
  {
    key: 'human_design',
    label: 'Human Design',
    icon: '⬡',
    prompt: 'Je veux comprendre mon type Human Design et ma stratégie.',
  },
  {
    key: 'enneagram',
    label: 'Ennéagramme',
    icon: '◉',
    prompt: 'Je veux explorer mon profil ennéagramme et mon aile.',
  },
  {
    key: 'kua',
    label: 'Kua',
    icon: '⊕',
    prompt: 'Je veux connaître mon nombre Kua et mes directions favorables.',
  },
  {
    key: 'fusion',
    label: 'Fusion Hexastra',
    icon: '⬡✦',
    prompt: 'Je veux une lecture fusionnée Hexastra complète.',
    minPlan: 'essential',
  },
]

const PLAN_RANK: Record<PlanKey, number> = {
  free: 0,
  essential: 1,
  premium: 2,
  practitioner: 3,
}

function isAccessible(item: ScienceItem, plan: PlanKey): boolean {
  if (!item.minPlan) return true
  return PLAN_RANK[plan] >= PLAN_RANK[item.minPlan]
}

type Props = {
  plan: PlanKey
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export default function ScienceSelector({ plan, onSelect, disabled }: Props) {
  return (
    <div className="hx-science-selector" role="list" aria-label="Sélectionner une science">
      {SCIENCES.map((science) => {
        const accessible = isAccessible(science, plan)
        return (
          <button
            key={science.key}
            type="button"
            role="listitem"
            className={`hx-science-btn hx-science-btn--${science.key}${!accessible ? ' is-locked' : ''}`}
            onClick={() => accessible && !disabled && onSelect(science.prompt)}
            disabled={disabled || !accessible}
            title={!accessible ? 'Disponible à partir du plan Essentiel' : science.label}
            aria-label={science.label}
          >
            <span className="hx-science-btn-icon" aria-hidden="true">{science.icon}</span>
            <span className="hx-science-btn-label">{science.label}</span>
            {!accessible && <span className="hx-science-btn-lock" aria-hidden="true">✦</span>}
          </button>
        )
      })}
    </div>
  )
}

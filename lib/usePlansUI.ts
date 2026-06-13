'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanUiData } from '@/types/subscription'
import { buildChatEntryHref } from '@/lib/chat/chatEntryHref'

type PlanCopy = {
  freeDesc: string
  freeFeatures: string[]
  essentialDesc: string
  essentialFeatures: string[]
  premiumDesc: string
  premiumFeatures: string[]
  practitionerDesc: string
  practitionerFeatures: string[]
  premiumBadge: string
}

const FR_COPY: PlanCopy = {
  freeDesc: "Pour essayer Hexastra tout de suite, avec un acces decouverte limite chaque jour.",
  freeFeatures: [
    'Acces decouverte immediat',
    "Acces au coeur de l'experience",
    'Messages limites par jour',
    'Sans engagement',
  ],
  essentialDesc: 'Pour continuer quand vous voulez, avec des reponses plus directes et concises.',
  essentialFeatures: [
    'Usage illimite',
    'Reponses concises et fluides',
    'Aucune coupure dans vos echanges',
    'Ideal pour un usage regulier',
  ],
  premiumDesc:
    "Pour obtenir l'analyse la plus profonde, la plus precise et la plus utile sur les situations importantes.",
  premiumFeatures: [
    'Analyses plus profondes',
    'Guidance plus precise',
    'Meilleur soutien aux decisions importantes',
    'Le meilleur equilibre entre clarte et profondeur',
  ],
  practitionerDesc: 'Pour les usages avances et les futures fonctionnalites professionnelles.',
  practitionerFeatures: [
    'Usage avance',
    'Cadre plus expert',
    'Preparation aux futures fonctions pro',
    'Pense pour les praticiens et power users',
  ],
  premiumBadge: 'Recommande',
}

const EN_COPY: PlanCopy = {
  freeDesc: 'Try Hexastra right away with a limited daily discovery access.',
  freeFeatures: [
    'Instant discovery access',
    'Access to the core experience',
    'Limited messages per day',
    'No commitment',
  ],
  essentialDesc: 'Keep going whenever you want, with faster and more concise guidance.',
  essentialFeatures: [
    'Unlimited usage',
    'Concise and fluid responses',
    'No interruption in your thread',
    'Ideal for regular personal use',
  ],
  premiumDesc:
    'Get the deepest, clearest and most precise analysis when the situation really matters.',
  premiumFeatures: [
    'Deeper analysis',
    'More precise guidance',
    'Better support for important decisions',
    'The best balance between clarity and depth',
  ],
  practitionerDesc: 'For advanced usage and future professional features.',
  practitionerFeatures: [
    'Advanced usage',
    'More expert structure',
    'Prepared for future pro features',
    'Designed for practitioners and power users',
  ],
  premiumBadge: 'Recommended',
}

export function usePlansUI(): PlanUiData[] {
  const { t, lang } = useTranslation()

  return useMemo(() => {
    const copy = lang === 'en' ? EN_COPY : FR_COPY

    return [
      {
        key: 'free',
        label: t('pricing.freeLabel'),
        price: '0 EUR',
        period: t('pricing.period'),
        desc: copy.freeDesc,
        features: copy.freeFeatures,
        cta: t('pricing.freeCta'),
        href: buildChatEntryHref({ prompt: t('chat.suggestion1'), source: 'pricing_free' }),
      },
      {
        key: 'essential',
        label: t('pricing.essentialLabel'),
        price: '9,90 EUR',
        period: t('pricing.period'),
        desc: copy.essentialDesc,
        features: copy.essentialFeatures,
        cta: t('pricing.essentialCta'),
        href: '/pricing/essentiel',
      },
      {
        key: 'premium',
        label: t('pricing.premiumLabel'),
        price: '19,90 EUR',
        period: t('pricing.period'),
        desc: copy.premiumDesc,
        features: copy.premiumFeatures,
        cta: t('pricing.premiumCta'),
        href: '/pricing/premium',
        badge: copy.premiumBadge,
        highlighted: true,
      },
      {
        key: 'practitioner',
        label: t('pricing.practitionerLabel'),
        price: '29,90 EUR',
        period: t('pricing.period'),
        desc: copy.practitionerDesc,
        features: copy.practitionerFeatures,
        cta: t('pricing.practitionerCta'),
        href: '/pricing/praticien',
      },
    ]
  }, [lang, t])
}

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
  freeDesc: 'Decouvrez si Hexastra peut reellement vous aider.',
  freeFeatures: [
    'Acces decouverte immediat',
    "Acces au coeur de l'experience",
    'Messages limites par jour',
    'Sans engagement',
  ],
  essentialDesc: 'Pour poser vos questions du quotidien et obtenir une clarte rapide.',
  essentialFeatures: [
    'Usage illimite',
    'Reponses concises et fluides',
    'Aucune coupure dans vos echanges',
    'Ideal pour un usage regulier',
  ],
  premiumDesc: 'Ideal quand une decision compte vraiment.',
  premiumFeatures: [
    'Analyses plus profondes',
    'Guidance plus precise',
    'Meilleur soutien aux decisions importantes',
    'Le meilleur equilibre entre clarte et profondeur',
  ],
  practitionerDesc: 'Pour un usage avance, plus profond et plus structure.',
  practitionerFeatures: [
    'Usage avance',
    'Cadre plus expert',
    'Preparation aux futures fonctions pro',
    'Pense pour les praticiens et power users',
  ],
  premiumBadge: 'Recommande',
}

const EN_COPY: PlanCopy = {
  freeDesc: 'Discover whether Hexastra can truly help you.',
  freeFeatures: [
    'Instant discovery access',
    'Access to the core experience',
    'Limited messages per day',
    'No commitment',
  ],
  essentialDesc: 'Ask your daily questions and get quick clarity.',
  essentialFeatures: [
    'Unlimited usage',
    'Concise and fluid responses',
    'No interruption in your thread',
    'Ideal for regular personal use',
  ],
  premiumDesc: 'Ideal when a decision truly matters.',
  premiumFeatures: [
    'Deeper analysis',
    'More precise guidance',
    'Better support for important decisions',
    'The best balance between clarity and depth',
  ],
  practitionerDesc: 'For advanced, deeper and more structured usage.',
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
        price: '0 €',
        period: t('pricing.period'),
        desc: copy.freeDesc,
        features: copy.freeFeatures,
        cta: t('pricing.freeCta'),
        href: buildChatEntryHref({ prompt: t('chat.suggestion1'), source: 'pricing_free' }),
      },
      {
        key: 'essential',
        label: t('pricing.essentialLabel'),
        price: '9,90 €',
        period: t('pricing.period'),
        desc: copy.essentialDesc,
        features: copy.essentialFeatures,
        cta: t('pricing.essentialCta'),
        href: '/pricing/essentiel',
      },
      {
        key: 'premium',
        label: t('pricing.premiumLabel'),
        price: '19,90 €',
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
        price: '29,90 €',
        period: t('pricing.period'),
        desc: copy.practitionerDesc,
        features: copy.practitionerFeatures,
        cta: t('pricing.practitionerCta'),
        href: '/pricing/praticien',
      },
    ]
  }, [lang, t])
}

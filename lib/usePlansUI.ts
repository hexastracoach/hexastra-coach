'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanUiData } from '@/types/subscription'
import { buildChatEntryHref } from '@/lib/chat/chatEntryHref'

export function usePlansUI(): PlanUiData[] {
  const { t } = useTranslation()
  return useMemo(() => [
    {
      key: 'free',
      label: t('pricing.freeLabel'),
      price: '0€',
      period: t('pricing.period'),
      desc: t('pricing.freeDesc'),
      features: [t('pricing.freeF1'), t('pricing.freeF2'), t('pricing.freeF3'), t('pricing.freeF4')],
      cta: t('pricing.freeCta'),
      href: buildChatEntryHref({ prompt: t('chat.suggestion1'), source: 'pricing_free' }),
    },
    {
      key: 'essential',
      label: t('pricing.essentialLabel'),
      price: '4,90€',
      period: t('pricing.period'),
      desc: t('pricing.essentialDesc'),
      features: [t('pricing.essentialF1'), t('pricing.essentialF2'), t('pricing.essentialF3'), t('pricing.essentialF4')],
      cta: t('pricing.essentialCta'),
      href: '/pricing/essentiel',
    },
    {
      key: 'premium',
      label: t('pricing.premiumLabel'),
      price: '9,90€',
      period: t('pricing.period'),
      desc: t('pricing.premiumDesc'),
      features: [t('pricing.premiumF1'), t('pricing.premiumF2'), t('pricing.premiumF3'), t('pricing.premiumF4')],
      cta: t('pricing.premiumCta'),
      href: '/pricing/premium',
      badge: t('pricing.premiumBadge'),
      highlighted: true,
    },
    {
      key: 'practitioner',
      label: t('pricing.practitionerLabel'),
      price: '24,90€',
      period: t('pricing.period'),
      desc: t('pricing.practitionerDesc'),
      features: [t('pricing.practitionerF1'), t('pricing.practitionerF2'), t('pricing.practitionerF3'), t('pricing.practitionerF4')],
      cta: t('pricing.practitionerCta'),
      href: '/pricing/praticien',
    },
  ], [t])
}

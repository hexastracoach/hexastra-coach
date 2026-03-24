'use client'

import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'
import { useTranslation } from '@/lib/i18n/useTranslation'
import {
  getPlanCheckoutAuthHref,
  getPlanCheckoutHref,
  getUpgradeTarget,
  type PlanKey,
} from '@/lib/plans'

type Props = {
  plan: PlanKey
  resetAt: Date | null
  isAuthenticated?: boolean
}

export default function PaywallBanner({ plan, resetAt, isAuthenticated = false }: Props) {
  const { t, lang } = useTranslation()
  const upgrade = getUpgradeTarget(plan)
  const upgradeLabel = t(upgrade.labelKey)
  const resetLabel = resetAt
    ? resetAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
    : null
  const resetDateLabel = resetAt
    ? resetAt.toLocaleDateString(lang, { day: 'numeric', month: 'long' })
    : null
  const upgradeHref = isAuthenticated
    ? getPlanCheckoutHref(upgrade.plan)
    : getPlanCheckoutAuthHref(upgrade.plan)

  return (
    <div className="hx-paywall-banner">
      <div className="hx-paywall-inner">
        <div className="hx-paywall-icon" aria-hidden="true">
          *
        </div>
        <p className="hx-paywall-title">{t('chat.paywallTitle')}</p>
        <p className="hx-paywall-text">
          {resetLabel
            ? t('chat.paywallResetText')
                .replace('{date}', resetDateLabel ?? '')
                .replace('{time}', resetLabel)
                .replace('{label}', upgradeLabel)
            : t('chat.paywallUnlimitedText').replace('{label}', upgradeLabel)}
        </p>
        <a
          href={upgradeHref}
          className="hx-paywall-cta"
          onClick={() => {
            trackHexastraFunnel('chat_upgrade_clicked', {
              location: 'paywall_banner',
              plan,
              targetPlan: upgrade.plan,
              reason: 'quota_limit',
            })
            trackHexastraFunnel('upgradeClicked', {
              location: 'paywall_banner',
              plan,
              targetPlan: upgrade.plan,
              reason: 'quota_limit',
            })
          }}
        >
          {t('chat.paywallCta').replace('{label}', upgradeLabel)}
        </a>
      </div>
    </div>
  )
}

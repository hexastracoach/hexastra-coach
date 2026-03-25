'use client'

import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'
import { type PlanKey } from '@/lib/plans'

type Props = {
  plan: PlanKey
  resetAt: Date | null
  isAuthenticated?: boolean
  onDismiss: () => void
}

export default function PaywallBanner({ plan, onDismiss }: Props) {
  return (
    <div className="hx-limit-card">
      <p className="hx-limit-main">
        Tu as atteint la limite du plan gratuit pour aujourd&apos;hui.
      </p>
      <p className="hx-limit-sub">Tu pourras reprendre dans 24h.</p>
      <div className="hx-limit-divider" aria-hidden="true" />
      <p className="hx-limit-pitch">
        Si tu veux continuer sans limite,<br />
        les versions superiures sont disponibles.
      </p>
      <div className="hx-limit-actions">
        <a
          href="/pricing"
          className="hx-limit-cta"
          onClick={() => {
            trackHexastraFunnel('chat_upgrade_clicked', {
              location: 'limit_card',
              plan,
              reason: 'quota_limit',
            })
          }}
        >
          Voir les abonnements
        </a>
        <button
          type="button"
          className="hx-limit-dismiss"
          onClick={onDismiss}
        >
          Revenir plus tard
        </button>
      </div>
    </div>
  )
}

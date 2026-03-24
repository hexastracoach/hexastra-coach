import { describe, expect, it } from 'vitest'
import {
  getPlanCheckoutAuthHref,
  getPlanCheckoutHref,
  getUpgradeTarget,
} from '@/lib/plans'

describe('plan checkout hrefs', () => {
  it('builds direct checkout routes for pricing pages', () => {
    expect(getPlanCheckoutHref('essential')).toBe('/pricing/essentiel?checkout=1')
    expect(getPlanCheckoutHref('premium')).toBe('/pricing/premium?checkout=1')
    expect(getPlanCheckoutHref('practitioner')).toBe('/pricing/praticien?checkout=1')
  })

  it('builds auth routes that return to the checkout-start page', () => {
    expect(getPlanCheckoutAuthHref('premium')).toBe(
      '/auth?plan=premium&next=%2Fpricing%2Fpremium%3Fcheckout%3D1',
    )
  })

  it('exposes the upgrade target plan alongside its label and href', () => {
    const freeUpgrade = getUpgradeTarget('free')
    const essentialUpgrade = getUpgradeTarget('essential')

    expect(freeUpgrade.plan).toBe('essential')
    expect(essentialUpgrade.plan).toBe('premium')
    expect(essentialUpgrade.href).toBe('/pricing/premium')
  })
})

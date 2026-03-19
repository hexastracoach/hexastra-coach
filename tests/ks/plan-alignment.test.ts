import { describe, expect, it } from 'vitest'
import {
  buildPlanApiContext,
  canContinueChat,
  getAvailableModes,
  getPlanCapabilities,
  isQuotaLimitedPlan,
  shouldPersistQuotaLocally,
} from '@/lib/plans'

describe('client plan alignment with orchestration contracts', () => {
  it('uses orchestration quota limits for client chat gating', () => {
    expect(getPlanCapabilities('free').maxMessagesPerDay).toBe(10)
    expect(getPlanCapabilities('essential').maxMessagesPerDay).toBe(60)
    expect(canContinueChat('free', 9)).toBe(true)
    expect(canContinueChat('free', 10)).toBe(false)
    expect(canContinueChat('essential', 59)).toBe(true)
    expect(canContinueChat('essential', 60)).toBe(false)
  })

  it('exposes quota-limited plans and local persistence separately', () => {
    expect(isQuotaLimitedPlan('free')).toBe(true)
    expect(isQuotaLimitedPlan('essential')).toBe(true)
    expect(isQuotaLimitedPlan('premium')).toBe(false)
    expect(shouldPersistQuotaLocally('free')).toBe(true)
    expect(shouldPersistQuotaLocally('essential')).toBe(false)
  })

  it('keeps client plan metadata aligned with orchestration-driven capabilities', () => {
    expect(getAvailableModes('premium')).toEqual(['essentiel', 'premium'])
    expect(getAvailableModes('practitioner')).toEqual(['essentiel', 'premium', 'praticien'])

    const practitionerApi = buildPlanApiContext('practitioner')
    const freeApi = buildPlanApiContext('free')

    expect(practitionerApi.practitionerEnabled).toBe(true)
    expect(practitionerApi.professionalUseAllowed).toBe(true)
    expect(freeApi.analysisDepth).toBe('high')
  })
})

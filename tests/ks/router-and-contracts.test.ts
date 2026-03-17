import { describe, expect, it } from 'vitest'
import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import {
  getKsFreeformExecutionContract,
  getKsSelectionExecutionContract,
} from '@/lib/hexastra/ks/ksRegistry'

describe('KS routing and contracts', () => {
  it('routes theme natal requests to fusion logic', () => {
    expect(classifyQuery('Fais-moi mon theme natal')).toBe('fusion')
  })

  it('routes NeuroKua requests to neurokua', () => {
    expect(classifyQuery('Je veux mon bilan NeuroKua du jour')).toBe('neurokua')
  })

  it('routes Astrolex science requests to science', () => {
    expect(classifyQuery('Fais-moi une lecture Astrolex')).toBe('science')
  })

  it('routes Kua orientation requests to gps_kua', () => {
    expect(classifyQuery('Je veux une lecture Kua pour mon orientation')).toBe('gps_kua')
  })

  it('exposes a freeform theme natal execution contract', () => {
    const contract = getKsFreeformExecutionContract('Je veux mon theme astral')

    expect(contract).not.toBeNull()
    expect(contract?.outputStructure).toContain('Signature de naissance')
    expect(contract?.submodules).toContain('KS.ThemeHexAstra.V1')
    expect(contract?.submoduleContracts.some((entry) => entry.key === 'KS.ThemeHexAstra.V1')).toBe(true)
  })

  it('exposes an Astrolex selection contract with execution metadata', () => {
    const contract = getKsSelectionExecutionContract('science_astrolex')

    expect(contract).not.toBeNull()
    expect(contract?.modules).toContain('KS.ASTROLEX.V1')
    expect(contract?.submodules).toEqual(
      expect.arrayContaining(['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.AethericMap'])
    )
    expect(contract?.submoduleContracts.some((entry) => entry.key === 'KS.Planetarium')).toBe(true)
  })
})

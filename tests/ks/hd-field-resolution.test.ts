import { describe, expect, it } from 'vitest'
import {
  resolveHumanDesignCoreFields,
  resolveHumanDesignField,
} from '@/lib/humandesign/fieldResolver'

describe('resolveHumanDesignField', () => {
  it('resolves controlled aliases from humanDesign first', () => {
    const raw = {
      humanDesign: {
        type: 'Projecteur',
        strategy_hd: "Attendre l'invitation",
        authority_hd: 'Splenique',
        profile_hd: '1/3',
      },
      humanDesignFull: {
        designType: 'Manifesteur',
        innerAuthority: 'Emotionnelle',
      },
    }

    expect(resolveHumanDesignField(raw, 'hdType')).toMatchObject({
      value: 'Projecteur',
      alias: 'type',
      source: 'humanDesign',
      path: 'humanDesign.type',
    })
    expect(resolveHumanDesignField(raw, 'hdStrategy')).toMatchObject({
      value: "Attendre l'invitation",
      alias: 'strategy_hd',
      source: 'humanDesign',
      path: 'humanDesign.strategy_hd',
    })
    expect(resolveHumanDesignField(raw, 'hdAuthority')).toMatchObject({
      value: 'Splenique',
      alias: 'authority_hd',
      source: 'humanDesign',
      path: 'humanDesign.authority_hd',
    })
    expect(resolveHumanDesignField(raw, 'hdProfile')).toMatchObject({
      value: '1/3',
      alias: 'profile_hd',
      source: 'humanDesign',
      path: 'humanDesign.profile_hd',
    })
  })

  it('falls back to humanDesignFull when humanDesign misses the field', () => {
    const raw = {
      humanDesign: {
        profile: '2/4',
      },
      humanDesignFull: {
        designType: 'Generateur',
        strategie: 'Repondre',
        innerAuthority: 'Sacrale',
      },
    }

    expect(resolveHumanDesignField(raw, 'hdType')).toMatchObject({
      value: 'Generateur',
      alias: 'designType',
      source: 'humanDesignFull',
      path: 'humanDesignFull.designType',
    })
    expect(resolveHumanDesignField(raw, 'hdStrategy')).toMatchObject({
      value: 'Repondre',
      alias: 'strategie',
      source: 'humanDesignFull',
      path: 'humanDesignFull.strategie',
    })
    expect(resolveHumanDesignField(raw, 'hdAuthority')).toMatchObject({
      value: 'Sacrale',
      alias: 'innerAuthority',
      source: 'humanDesignFull',
      path: 'humanDesignFull.innerAuthority',
    })
    expect(resolveHumanDesignField(raw, 'hdProfile')).toMatchObject({
      value: '2/4',
      alias: 'profile',
      source: 'humanDesign',
      path: 'humanDesign.profile',
    })
  })

  it('keeps legacy root aliases as a compatibility fallback', () => {
    const raw = {
      type_hd: 'Reflecteur',
      strategie_hd: 'Attendre un cycle',
      autorite_hd: 'Lunaire',
      profil_hd: '6/2',
    }

    expect(resolveHumanDesignCoreFields(raw)).toMatchObject({
      hdType: { value: 'Reflecteur', source: 'root', alias: 'type_hd', path: 'type_hd' },
      hdStrategy: { value: 'Attendre un cycle', source: 'root', alias: 'strategie_hd', path: 'strategie_hd' },
      hdAuthority: { value: 'Lunaire', source: 'root', alias: 'autorite_hd', path: 'autorite_hd' },
      hdProfile: { value: '6/2', source: 'root', alias: 'profil_hd', path: 'profil_hd' },
    })
  })

  it('returns null metadata when a field is truly missing', () => {
    const raw = {
      humanDesign: {
        profile: '4/6',
      },
    }

    expect(resolveHumanDesignField(raw, 'hdAuthority')).toMatchObject({
      value: null,
      alias: null,
      source: null,
      path: null,
    })
  })
})

import { describe, it, expect } from 'vitest'
import { buildCompactExactScienceBlock } from '@/lib/exact-data/compactBlocks'
import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'

describe('buildCompactExactScienceBlock', () => {
  it('builds a numerology-only block without leaking other sciences', () => {
    const block = buildCompactExactScienceBlock({
      science: 'numerology',
      requestedSubcategories: ['chemin_de_vie', 'annee_personnelle'],
      raw: {
        publicSummary: 'Soleil en Capricorne, profil 3/5.',
        numerology: {
          core: { lifePathNumber: 8 },
          yearly: { personalYearNumber: 3 },
          summary: 'Cycle de structuration et de concrétisation.',
        },
        humanDesign: { type_hd: 'Projecteur' },
      },
    })

    expect(block).toContain('DONNÉES NUMÉROLOGIQUES')
    expect(block).toContain('CHEMIN DE VIE: 8')
    expect(block).toContain('ANNÉE PERSONNELLE: 3')
    expect(block).not.toContain('Projecteur')
    expect(block).not.toContain('Capricorne')
  })

  it('builds a kua-only block without leaking astrology', () => {
    const block = buildCompactExactScienceBlock({
      science: 'kua',
      requestedSubcategories: ['nombre_kua', 'direction_kua'],
      raw: {
        publicSummary: 'Ascendant Balance.',
        kua: {
          nombre_kua: 1,
          directions_favorables: ['Est', 'Sud-Est', 'Sud', 'Nord'],
        },
        tropical: { sun: { sign: 'Verseau' } },
      },
    })

    expect(block).toContain('DONNÉES KUA')
    expect(block).toContain('NOMBRE KUA: 1')
    expect(block).toContain('DIRECTIONS FAVORABLES: Est, Sud-Est, Sud, Nord')
    expect(block).not.toContain('Verseau')
  })

  it('builds an enneagram-only block without hypothetical leakage', () => {
    const block = buildCompactExactScienceBlock({
      science: 'enneagram',
      requestedSubcategories: ['type_enn', 'aile_enn'],
      raw: {
        summary: 'Si tu étais un type 8...',
        enneagram: {
          type_enn: 6,
          wing: '5',
        },
      },
    })

    expect(block).toContain('DONNÉES ENNÉAGRAMME')
    expect(block).toContain('TYPE: 6')
    expect(block).toContain('AILE: 5')
    expect(block).not.toContain('type 8')
  })
})

describe('buildCompactNatalReadingContext', () => {
  it('keeps the compact astro block limited to validated natal fields', () => {
    const ctx = buildCompactNatalReadingContext({
      tropical: {
        planets: {
          sun: { sign: 'Taureau', degree: 14.5 },
          moon: { sign: 'Cancer', degree: 22.1 },
        },
        ascendant: { sign: 'Lion', degree: 3.8 },
        transits: ['Saturne trigone Soleil', 'Jupiter sextile Lune'],
      },
    })

    expect(ctx.compactDataBlock).not.toContain('TRANSITS ACTIFS')
  })
})

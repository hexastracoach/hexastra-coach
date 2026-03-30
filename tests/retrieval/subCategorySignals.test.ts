import { describe, expect, it } from 'vitest'
import { buildSignals } from '@/lib/hexastra/engine/retrievalSignalExtractor'
import type { SubCategory } from '@/lib/hexastra/taxonomy/scienceTaxonomy'

function makeSubCategory(category: Partial<SubCategory> & Pick<SubCategory, 'key' | 'science'>): SubCategory {
  return {
    key: category.key,
    science: category.science,
    label: category.label ?? category.key,
    keywords: category.keywords ?? [],
  }
}

describe('buildSignals', () => {
  it('reads canonical exactData transits before legacy aliases', () => {
    const [signal] = buildSignals(
      [makeSubCategory({ key: 'astro_transits_current', science: 'astro' })],
      {
        exactData: {
          transits: {
            saturn: 'exact',
          },
        },
        transits: {
          saturn: 'alias',
        },
      },
    )

    expect(signal?.value).toEqual({ saturn: 'exact' })
  })

  it('does not fall back to alias transits when exactData section is explicitly null', () => {
    const [signal] = buildSignals(
      [makeSubCategory({ key: 'astro_transits_current', science: 'astro' })],
      {
        exactData: {
          transits: null,
        },
        transits: {
          saturn: 'alias',
        },
      },
    )

    expect(signal?.value).toBeNull()
  })

  it('keeps legacy profile fallback for non exact-data-backed categories', () => {
    const [signal] = buildSignals(
      [makeSubCategory({ key: 'hd_type', science: 'human_design' })],
      {
        hdProfile: {
          hdType: 'Projector',
          hdAuthority: 'Emotional',
        },
      },
    )

    expect(signal?.value).toEqual({
      hdType: 'Projector',
      hdAuthority: 'Emotional',
    })
  })

  it('reads kua directions from canonical exactData section', () => {
    const [signal] = buildSignals(
      [makeSubCategory({ key: 'kua_bed_orientation', science: 'kua' })],
      {
        exactData: {
          kua_directions: {
            bed_orientation: 'SE',
            favorable_directions: ['SE', 'E'],
          },
        },
      },
    )

    expect(signal?.value).toEqual({
      bed_orientation: 'SE',
      favorable_directions: ['SE', 'E'],
    })
  })
})

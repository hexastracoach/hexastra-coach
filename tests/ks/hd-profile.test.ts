/**
 * Tests — Human Design Profile Reliability
 *
 * Validates that computeHumanDesignProfile and extractHDProfileFromRaw
 * always produce deterministic, rule-based results — never LLM-invented values.
 *
 * Business rule: Profile = PersonalityLine/DesignLine, lines 1–6 only.
 */
import { describe, it, expect } from 'vitest'
import {
  computeHumanDesignProfile,
  extractHDProfileFromRaw,
  isReliableHumanDesignProfile,
  formatHDProfileBlock,
  asksForHDProfile,
} from '@/lib/humandesign/profile'

// ─── computeHumanDesignProfile ───────────────────────────────────────────────

describe('computeHumanDesignProfile — règles de calcul pur', () => {
  it('TC01 — calcule correctement 3/5 depuis des entiers valides', () => {
    const result = computeHumanDesignProfile({ personalityLine: 3, designLine: 5 })
    expect(result.profile).toBe('3/5')
    expect(result.personalityLine).toBe(3)
    expect(result.designLine).toBe(5)
    expect(result.calculated).toBe(true)
  })

  it('TC02 — accepte les lignes sous forme de strings numériques', () => {
    const result = computeHumanDesignProfile({ personalityLine: '2', designLine: '4' })
    expect(result.profile).toBe('2/4')
    expect(result.calculated).toBe(true)
  })

  it('TC03 — retourne calculated=false si personalityLine manque', () => {
    const result = computeHumanDesignProfile({ personalityLine: null, designLine: 5 })
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })

  it('TC09b â€” extrait aussi depuis humanDesignFull.hdProfile', () => {
    const raw = { humanDesignFull: { hdProfile: '1/3' } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('1/3')
    expect(result.calculated).toBe(false)
  })

  it('TC04 — retourne calculated=false si designLine hors plage (0)', () => {
    const result = computeHumanDesignProfile({ personalityLine: 3, designLine: 0 })
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })

  it('TC05 — retourne calculated=false si ligne = 7 (invalide)', () => {
    const result = computeHumanDesignProfile({ personalityLine: 7, designLine: 2 })
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })

  it('TC06 — toutes les combinaisons valides 1–6 sont acceptées', () => {
    for (let p = 1; p <= 6; p++) {
      for (let d = 1; d <= 6; d++) {
        const result = computeHumanDesignProfile({ personalityLine: p, designLine: d })
        expect(result.profile).toBe(`${p}/${d}`)
        expect(result.calculated).toBe(true)
      }
    }
  })
})

// ─── extractHDProfileFromRaw ─────────────────────────────────────────────────

describe('extractHDProfileFromRaw — extraction depuis les données API', () => {
  it('TC07 — extrait depuis human_design.profile (format "3/5")', () => {
    const raw = { human_design: { profile: '3/5', type: 'Generator' } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('3/5')
    expect(result.personalityLine).toBe(3)
    expect(result.designLine).toBe(5)
    expect(result.calculated).toBe(false)
  })

  it('TC08 — extrait depuis human_design.personality_line + design_line', () => {
    const raw = { human_design: { personality_line: 1, design_line: 3 } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('1/3')
    expect(result.calculated).toBe(true)
  })

  it('TC09 — extrait depuis humanDesign.profile (camelCase)', () => {
    const raw = { humanDesign: { profile: '4/6' } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('4/6')
    expect(result.calculated).toBe(false)
  })

  it('TC10 — extrait depuis profil_hd à la racine', () => {
    const raw = { profil_hd: '2/4', type_hd: 'Projector' }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('2/4')
    expect(result.calculated).toBe(false)
  })

  it('TC11 — extrait depuis personality_line + design_line à la racine', () => {
    const raw = { personality_line: 5, design_line: 1 }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('5/1')
    expect(result.calculated).toBe(true)
  })

  it('TC11b — extrait depuis des activations récursives sun/earth quand le champ profile est trompeur', () => {
    const raw = {
      humanDesignFull: {
        profile: '5/1',
        activations: {
          conscious: {
            sun: { line: 3 },
          },
          unconscious: {
            earth: { line: 5 },
          },
        },
      },
    }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBe('3/5')
    expect(result.calculated).toBe(true)
  })

  it('TC12 — retourne calculated=false quand raw est null', () => {
    const result = extractHDProfileFromRaw(null)
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })

  it('TC13 — retourne calculated=false quand aucun champ HD reconnu', () => {
    const raw = { sun: { sign: 'Taureau' }, moon: { sign: 'Cancer' } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })

  it('TC14 — rejette un profil avec lignes hors plage (ex: "7/8")', () => {
    const raw = { human_design: { profile: '7/8' } }
    const result = extractHDProfileFromRaw(raw)
    expect(result.profile).toBeNull()
    expect(result.calculated).toBe(false)
  })
})

// ─── isReliableHumanDesignProfile ────────────────────────────────────────────

describe('isReliableHumanDesignProfile — fiabilité', () => {
  it('retourne true pour un résultat calculé valide', () => {
    const r = computeHumanDesignProfile({ personalityLine: 3, designLine: 5 })
    expect(isReliableHumanDesignProfile(r)).toBe(true)
  })

  it('retourne false pour un résultat non calculé', () => {
    const r = computeHumanDesignProfile({ personalityLine: null, designLine: 5 })
    expect(isReliableHumanDesignProfile(r)).toBe(false)
  })

  it('retourne false pour null', () => {
    expect(isReliableHumanDesignProfile(null)).toBe(false)
  })
})

// ─── formatHDProfileBlock ────────────────────────────────────────────────────

describe('formatHDProfileBlock — bloc système prompt', () => {
  it('génère un bloc avec le profil et la règle absolue (fr)', () => {
    const r = computeHumanDesignProfile({ personalityLine: 3, designLine: 5 })
    const block = formatHDProfileBlock(r, 'fr')
    expect(block).toContain('3/5')
    expect(block).toContain('RÈGLE ABSOLUE')
    expect(block).toContain('PROFIL HUMAN DESIGN')
  })

  it('génère un bloc en anglais si language=en', () => {
    const r = computeHumanDesignProfile({ personalityLine: 2, designLine: 4 })
    const block = formatHDProfileBlock(r, 'en')
    expect(block).toContain('2/4')
    expect(block).toContain('ABSOLUTE RULE')
    expect(block).toContain('HUMAN DESIGN PROFILE')
  })

  it('retourne chaîne vide si calculated=false', () => {
    const r = computeHumanDesignProfile({ personalityLine: null, designLine: 5 })
    const block = formatHDProfileBlock(r, 'fr')
    expect(block).toBe('')
  })
})

// ─── asksForHDProfile ────────────────────────────────────────────────────────

describe('asksForHDProfile — détection intention', () => {
  it('détecte "mon profil hd"', () => {
    expect(asksForHDProfile('mon profil hd')).toBe(true)
  })

  it('détecte "profil human design"', () => {
    expect(asksForHDProfile('mon profil human design')).toBe(true)
  })

  it('ne détecte pas une question hors profil HD', () => {
    expect(asksForHDProfile('quel est mon type HD')).toBe(false)
    expect(asksForHDProfile('mes centres définis')).toBe(false)
  })
})

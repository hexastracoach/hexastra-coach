/**
 * Tests — Human Design Routing
 *
 * Validates the full HD routing pipeline:
 * - classifyQuery: detects "design humain" (French word order) → 'science'
 * - detectContext: returns 'human_design_exact' for HD requests
 * - detectSubcategory: catches "design humain" / "mon hd" → 'human_design_exact'
 * - requiresExactData: 'human_design_exact' is gated
 * - buildCompactHumanDesignContext: extracts only HD fields, caps at maxChars
 */
import { describe, it, expect } from 'vitest'
import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import { requiresExactData } from '@/lib/hexastra/guards/exactDataGuard'
import { buildCompactHumanDesignContext } from '@/lib/humandesign/compactContext'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const RAW_HD_FULL: Record<string, unknown> = {
  type_hd: 'Projecteur',
  profil_hd: '3/5',
  autorite_hd: 'Autorité Splénique',
  strategie_hd: 'Attendre l\'invitation',
  definition_hd: 'Définition simple',
  croix_incarnation: 'Croix du Chercheur',
  centres_hd: ['Gorge', 'G', 'Plexus Solaire'],
  canaux_hd: ['Canal 13-33', 'Canal 7-31'],
  portes_hd: ['13', '33', '7', '31', '2', '14'],
  publicSummary: 'Profil 3/5 : expérimentateur et hérétique pratique.',
  // Non-HD fields that should be excluded
  sun: { sign: 'Taureau', degree: 14.5 },
  moon: { sign: 'Cancer', degree: 22.1 },
  chemin_de_vie: 7,
  nombre_kua: 2,
}

const RAW_HD_MINIMAL: Record<string, unknown> = {
  type_hd: 'Générateur',
  profil_hd: '2/4',
}

const RAW_ASTRO_ONLY: Record<string, unknown> = {
  sun: { sign: 'Bélier', degree: 5.0 },
  moon: { sign: 'Lion', degree: 18.0 },
  chemin_de_vie: 3,
}

const RAW_HD_WITH_GLOBAL_SUMMARY_LEAK: Record<string, unknown> = {
  publicSummary: 'Type Human Design : trine. Profil 5/1.',
  humanDesignFull: {
    type_hd: 'Projecteur',
    strategie_hd: "Attendre l'invitation",
    autorite_hd: 'Splénique',
  },
}

// ─── classifyQuery ────────────────────────────────────────────────────────────

describe('classifyQuery — Human Design detection', () => {
  it('TC01 — "human design" → science', () => {
    expect(classifyQuery('quel est mon human design')).toBe('science')
  })

  it('TC02 — "design humain" (French word order) → science', () => {
    expect(classifyQuery('quel est mon design humain')).toBe('science')
  })

  it('TC03 — "bodygraph" → science', () => {
    expect(classifyQuery('montre moi mon bodygraph')).toBe('science')
  })

  it('TC04 — "mon hd complet" → science', () => {
    expect(classifyQuery('je veux voir mon hd complet')).toBe('science')
  })

  it('TC05 — "profil hd" → science (unchanged)', () => {
    expect(classifyQuery('quel est mon profil hd')).toBe('science')
  })

  it('TC06 — "mon type hd" → science', () => {
    expect(classifyQuery('dis moi mon type hd')).toBe('science')
  })

  it('TC07 — unrelated message does NOT route to science', () => {
    expect(classifyQuery('comment gérer mon stress au travail')).not.toBe('science')
  })
})

// ─── detectContext ────────────────────────────────────────────────────────────

describe('detectContext — human_design_exact', () => {
  it('TC08 — "quel est mon design humain" → human_design_exact', () => {
    const ctx = detectContext('quel est mon design humain')
    expect(ctx.contextType).toBe('human_design_exact')
    expect(ctx.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('TC09 — "human design" → human_design_exact', () => {
    const ctx = detectContext('explique moi mon human design')
    expect(ctx.contextType).toBe('human_design_exact')
  })

  it('TC10 — "bodygraph" → human_design_exact', () => {
    const ctx = detectContext('montre mon bodygraph')
    expect(ctx.contextType).toBe('human_design_exact')
  })

  it('TC11 — "mon type hd" → human_design_exact', () => {
    const ctx = detectContext('quel est mon type hd')
    expect(ctx.contextType).toBe('human_design_exact')
  })

  it('TC12 — "profil hd" → human_design_exact', () => {
    const ctx = detectContext('quel est mon profil hd')
    expect(ctx.contextType).toBe('human_design_exact')
  })

  it('TC13 — "autorité hd" → human_design_exact', () => {
    const ctx = detectContext('quelle est mon autorité hd')
    expect(ctx.contextType).toBe('human_design_exact')
  })

  it('TC14 — "thème natal" does NOT return human_design_exact', () => {
    const ctx = detectContext('montre moi mon thème natal')
    expect(ctx.contextType).toBe('astro_exact')
  })

  it('TC15 — generic profile question does NOT return human_design_exact', () => {
    const ctx = detectContext('qui suis-je vraiment')
    expect(ctx.contextType).not.toBe('human_design_exact')
  })
})

// ─── detectSubcategory ────────────────────────────────────────────────────────

describe('detectSubcategory — human_design_exact catch-all', () => {
  it('TC16 — "design humain" → human_design_exact', () => {
    const result = detectSubcategory('quel est mon design humain')
    expect(result.subcategory).toBe('human_design_exact')
  })

  it('TC17 — "human design" → human_design_exact', () => {
    const result = detectSubcategory('lis mon human design')
    expect(result.subcategory).toBe('human_design_exact')
  })

  it('TC18 — "mon hd complet" → human_design_exact', () => {
    const result = detectSubcategory('donne moi mon hd complet')
    expect(result.subcategory).toBe('human_design_exact')
  })

  it('TC19 — "profil hd" still → profil_hd (higher weight wins)', () => {
    const result = detectSubcategory('mon profil hd 3/5')
    expect(result.subcategory).toBe('profil_hd')
  })

  it('TC20 — "transits hd" still → transits_hd (higher weight wins)', () => {
    const result = detectSubcategory('transits hd du moment')
    expect(result.subcategory).toBe('transits_hd')
  })
})

// ─── requiresExactData ────────────────────────────────────────────────────────

describe('requiresExactData — human_design_exact gated', () => {
  it('TC21 — human_design_exact requires exact data', () => {
    expect(requiresExactData('human_design_exact')).toBe(true)
  })

  it('TC22 — profil_hd requires exact data (unchanged)', () => {
    expect(requiresExactData('profil_hd')).toBe(true)
  })

  it('TC23 — type_hd requires exact data (unchanged)', () => {
    expect(requiresExactData('type_hd')).toBe(true)
  })
})

// ─── buildCompactHumanDesignContext ──────────────────────────────────────────

describe('buildCompactHumanDesignContext — HD-only extraction', () => {
  it('TC24 — extrait type/profil/autorité correctement', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdType).toBe('Projecteur')
    expect(ctx.hdProfile).toBeNull()
    expect(ctx.hdAuthority).toBe('Autorité Splénique')
  })

  it('TC25 — extrait stratégie et définition', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdStrategy).toBe('Attendre l\'invitation')
    expect(ctx.hdDefinition).toBe('Définition simple')
  })

  it('TC26 — extrait croix d\'incarnation', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdIncarnationCross).toBe('Croix du Chercheur')
  })

  it('TC27 — extrait centres définis', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdDefinedCenters.length).toBeGreaterThan(0)
    expect(ctx.hdDefinedCenters).toContain('Gorge')
  })

  it('TC28 — extrait canaux définis', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdDefinedChannels.length).toBeGreaterThan(0)
  })

  it('TC29 — extrait portes actives', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdActivatedGates.length).toBeGreaterThan(0)
  })

  it('TC30 — compactDataBlock ne contient PAS les champs astro/num/kua', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.compactDataBlock).not.toContain('chemin_de_vie')
    expect(ctx.compactDataBlock).not.toContain('nombre_kua')
    expect(ctx.compactDataBlock).not.toContain('Taureau') // sun sign
  })

  it('TC31 — compactDataBlock contient les données HD clés', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.compactDataBlock).toContain('DONNÉES HUMAN DESIGN')
    expect(ctx.compactDataBlock).toContain('Projecteur')
    expect(ctx.compactDataBlock).not.toContain('3/5')
  })

  it('TC32 — respecte la limite maxChars', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL, 500)
    expect(ctx.compactDataBlock.length).toBeLessThanOrEqual(700)
  })

  it('TC33 — fonctionne avec données minimales', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_MINIMAL)
    expect(ctx.hdType).toBe('Générateur')
    expect(ctx.hdProfile).toBeNull()
    expect(ctx.hdDefinedCenters).toHaveLength(0)
    expect(ctx.hdActivatedGates).toHaveLength(0)
  })

  it('TC33b — préfère le profil calculé depuis les activations à un champ profile trompeur', () => {
    const ctx = buildCompactHumanDesignContext({
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
    })
    expect(ctx.hdProfile).toBe('3/5')
    expect(ctx.compactDataBlock).toContain('3/5')
    expect(ctx.compactDataBlock).not.toContain('5/1')
  })

  it('TC34 — retourne null pour type/profil si données absentes', () => {
    const ctx = buildCompactHumanDesignContext(RAW_ASTRO_ONLY)
    expect(ctx.hdType).toBeNull()
    expect(ctx.hdProfile).toBeNull()
    expect(ctx.hdAuthority).toBeNull()
  })

  it('TC35 — filtre une publicSummary qui fuit un profil non vérifié', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_FULL)
    expect(ctx.hdSummarySeeds).toHaveLength(0)
  })

  it('TC36 — ignore une synthèse globale racine qui fuit des valeurs non fiables', () => {
    const ctx = buildCompactHumanDesignContext(RAW_HD_WITH_GLOBAL_SUMMARY_LEAK)
    expect(ctx.compactDataBlock).toContain('Projecteur')
    expect(ctx.compactDataBlock).not.toContain('trine')
    expect(ctx.compactDataBlock).not.toContain('5/1')
    expect(ctx.hdSummarySeeds).toHaveLength(0)
  })
})

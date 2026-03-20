/**
 * Tests — Astro Exact Compact Route
 *
 * Validates the timeout-safe compact rendering path for natal chart readings:
 * - buildCompactNatalReadingContext: extracts only astro fields, caps at maxChars
 * - buildChatPayload: strips knowledge packets, reduces history to 2 messages
 * - buildSystemPrompt: returns compact prompt (< 5000 chars) when isAstroExactCompact
 */
import { describe, it, expect } from 'vitest'
import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'
import { buildChatPayload } from '@/lib/hexastra/payload/buildChatPayload'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const RAW_FUSION_ASTRO: Record<string, unknown> = {
  sun:        { sign: 'Taureau', degree: 14.5 },
  moon:       { sign: 'Cancer', degree: 22.1 },
  ascendant:  { sign: 'Lion', degree: 3.8 },
  mercury:    { sign: 'Bélier', degree: 28 },
  venus:      { sign: 'Gémeaux', degree: 9.2 },
  mars:       { sign: 'Scorpion', degree: 17 },
  aspects:    ['Soleil trigone Lune', 'Vénus carré Mars', 'Mercure sextile Jupiter'],
  houses:     ['Maison 1 en Lion', 'Maison 4 en Scorpion', 'Maison 10 en Taureau'],
  dominant_elements: ['Terre', 'Eau'],
  dominant_modalities: ['Fixe'],
  dominant_signs: ['Taureau'],
  publicSummary: 'Thème natal axé sur la stabilité et la profondeur émotionnelle.',
  // Non-astro fields that should be excluded
  profil_hd: '3/5',
  chemin_de_vie: 7,
  nombre_kua: 2,
}

const RAW_WITH_HD_ONLY: Record<string, unknown> = {
  profil_hd: '3/5',
  type_hd: 'Projector',
  chemin_de_vie: 7,
}

const MOCK_USER_CONTEXT = {
  plan: 'free' as const,
  language: 'fr',
  firstName: 'Marie',
  practitionerUsage: null,
  birthData: null,
  memory: null,
  journeyEnabled: false,
  userId: null,
  profileRow: null,
} as any

const MOCK_SESSION_CONTEXT = {
  currentTheme: null,
  contextType: 'general' as const,
  selectedMenuKey: null,
  selectedSubmenuKey: null,
  readingLevel: 'standard' as const,
  timing: 'exploration' as const,
  emotionalState: 'neutral' as const,
  precision: 'medium' as const,
  dominantPotential: null,
  lifePhase: null,
  domainRoute: 'fusion' as const,
  activeModule: null,
  state: null,
} as any

const HISTORY_6: ChatMessage[] = [
  { role: 'user',      content: 'msg1' },
  { role: 'assistant', content: 'resp1' },
  { role: 'user',      content: 'msg2' },
  { role: 'assistant', content: 'resp2' },
  { role: 'user',      content: 'msg3' },
  { role: 'assistant', content: 'resp3' },
]

// ─── buildCompactNatalReadingContext ─────────────────────────────────────────

describe('buildCompactNatalReadingContext — extraction astro-only', () => {
  it('TC01 — extrait sun/moon/rising correctement', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.sunSign).toBe('Taureau')
    expect(ctx.moonSign).toBe('Cancer')
    expect(ctx.risingSign).toBe('Lion')
  })

  it('TC02 — extrait les degrés', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.sunDegree).toBe(14.5)
    expect(ctx.moonDegree).toBe(22.1)
    expect(ctx.risingDegree).toBe(3.8)
  })

  it('TC03 — extrait aspects (cap à 5)', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.keyAspects.length).toBeGreaterThan(0)
    expect(ctx.keyAspects.length).toBeLessThanOrEqual(5)
  })

  it('TC04 — extrait maisons dominantes (cap à 3)', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.dominantHouses.length).toBeGreaterThan(0)
    expect(ctx.dominantHouses.length).toBeLessThanOrEqual(3)
  })

  it('TC05 — n\'inclut PAS les champs HD/numerologie/kua dans compactDataBlock', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.compactDataBlock).not.toContain('profil_hd')
    expect(ctx.compactDataBlock).not.toContain('chemin_de_vie')
    expect(ctx.compactDataBlock).not.toContain('nombre_kua')
  })

  it('TC06 — respecte la limite maxChars pour compactDataBlock', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO, 500)
    // maxChars=500 → block stops at first line exceeding limit + 1 ellipsis line (~100 chars)
    expect(ctx.compactDataBlock.length).toBeLessThanOrEqual(700)
  })

  it('TC07 — retourne null pour sun/moon/rising si champs absents', () => {
    const ctx = buildCompactNatalReadingContext(RAW_WITH_HD_ONLY)
    expect(ctx.sunSign).toBeNull()
    expect(ctx.moonSign).toBeNull()
    expect(ctx.risingSign).toBeNull()
  })

  it('TC08 — extrait publicSummary comme natalSummarySeeds', () => {
    const ctx = buildCompactNatalReadingContext(RAW_FUSION_ASTRO)
    expect(ctx.natalSummarySeeds.length).toBeGreaterThan(0)
    expect(ctx.natalSummarySeeds[0]).toContain('stabilité')
  })
})

// ─── buildChatPayload — compact mode ─────────────────────────────────────────

describe('buildChatPayload — isAstroExactCompact mode', () => {
  const baseArgs = {
    systemPrompt: 'System prompt test',
    userContext: MOCK_USER_CONTEXT,
    sessionContext: MOCK_SESSION_CONTEXT,
    messages: HISTORY_6,
    knowledgeBlock: 'knowledge block content here',
    readingPacket: { key: 'reading_packet' },
    knowledgePacket: { key: 'knowledge_packet', priorityOrder: [] },
    flowStep: 'analysis' as const,
  }

  it('TC09 — mode compact: historique réduit à 2 messages max', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: true })
    // Count history messages (exclude system + compact context)
    const historyMsgs = payload.input.filter((m) => m.role === 'user' || m.role === 'assistant')
    // 1 compactContext (user) + max 2 history = 3 max
    expect(historyMsgs.length).toBeLessThanOrEqual(3)
  })

  it('TC10 — mode compact: knowledgeBlock exclu du payload', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: true })
    const hasKnowledgeBlock = payload.input.some((m) => m.content.includes('knowledge block content here'))
    expect(hasKnowledgeBlock).toBe(false)
  })

  it('TC11 — mode compact: knowledgePacket exclu du payload', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: true })
    const hasKnowledgePacket = payload.input.some((m) => m.content.includes('knowledge_packet'))
    expect(hasKnowledgePacket).toBe(false)
  })

  it('TC12 — mode compact: readingPacket exclu du payload', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: true })
    const hasReadingPacket = payload.input.some((m) => m.content.includes('reading_packet'))
    expect(hasReadingPacket).toBe(false)
  })

  it('TC13 — mode compact: max_output_tokens = 900', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: true })
    expect(payload.max_output_tokens).toBe(900)
  })

  it('TC14 — mode normal: knowledgeBlock inclus dans le payload', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: false })
    const hasKnowledgeBlock = payload.input.some((m) => m.content.includes('knowledge block content here'))
    expect(hasKnowledgeBlock).toBe(true)
  })

  it('TC15 — mode normal: max_output_tokens = 950 (free, non deep_reading)', () => {
    const payload = buildChatPayload({ ...baseArgs, isAstroExactCompact: false })
    expect(payload.max_output_tokens).toBe(950)
  })
})

// ─── buildSystemPrompt — compact mode ────────────────────────────────────────

describe('buildSystemPrompt — isAstroExactCompact mode', () => {
  const baseInput = {
    plan: 'free' as const,
    mode: 'libre' as const,
    language: 'fr',
    firstName: 'Marie',
    contextType: 'general' as const,
    practitionerUsage: null,
    requestType: 'chat' as const,
    isAstroExactCompact: true,
    exactDataBlock: 'DONNÉES THÈME NATAL:\n- SOLEIL: Taureau 14.5°\n- LUNE: Cancer 22.1°',
  }

  it('TC16 — prompt compact < 5000 chars', () => {
    const prompt = buildSystemPrompt(baseInput)
    expect(prompt.length).toBeLessThan(5000)
  })

  it('TC17 — prompt compact contient la directive de lecture natal', () => {
    const prompt = buildSystemPrompt(baseInput)
    expect(prompt).toMatch(/LECTURE THÈME NATAL|NATAL CHART READING/)
  })

  it('TC18 — prompt compact contient les données exactes', () => {
    const prompt = buildSystemPrompt(baseInput)
    expect(prompt).toContain('DONNÉES THÈME NATAL')
    expect(prompt).toContain('Taureau')
  })

  it('TC19 — prompt compact contient les règles absolues', () => {
    const prompt = buildSystemPrompt(baseInput)
    expect(prompt).toMatch(/RÈGLES ABSOLUES|ABSOLUTE RULES/)
  })

  it('TC20 — prompt compact ne contient PAS les directives KS lourdes', () => {
    const prompt = buildSystemPrompt(baseInput)
    // Heavy KS directives should not appear in compact mode
    expect(prompt).not.toContain('Architecture KS active')
    expect(prompt).not.toContain('KS Signal Envelope')
    expect(prompt).not.toContain('Logique maitresse KS Fusion')
  })

  it('TC21 — mode non-compact: prompt complet > 5000 chars', () => {
    const { isAstroExactCompact: _, ...normalInput } = baseInput
    const prompt = buildSystemPrompt({ ...normalInput, isAstroExactCompact: false })
    expect(prompt.length).toBeGreaterThan(5000)
  })
})

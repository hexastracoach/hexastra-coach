import { describe, expect, it } from 'vitest'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'

describe('buildKnowledgePacket', () => {
  it('prioritizes master prompt and reading structure when present', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'PROMPT_INSTRUCTION.txt',
        fileId: '1',
        text: 'Prompt instruction HexAstra coach. Priorites, ton, garde-fous, logique centrale.',
        score: 0.92,
      },
      {
        source: 'knowledge',
        filename: 'STRUCTURE_DES_LECTURES_HEXASTRA.txt',
        fileId: '2',
        text: 'Structure lecture HexAstra. Reconnaissance, dynamique, mise en perspective, levier, synthese.',
        score: 0.89,
      },
      {
        source: 'domain',
        filename: 'prompt_Neurokua_system.txt',
        fileId: '3',
        text: 'NeuroKua mon etat du jour. Axes, equilibre, ajustement, action utile.',
        score: 0.85,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'neurokua',
      selectedMenuLabel: 'NeuroKua',
      selectedSubmenuLabel: 'Mon état du jour',
      latestUserMessage: 'Je veux mon bilan NeuroKua du jour',
    })

    expect(packet?.masterPrompt?.filename).toBe('PROMPT_INSTRUCTION.txt')
    expect(packet?.readingStructure?.filename).toBe('STRUCTURE_DES_LECTURES_HEXASTRA.txt')
    expect(packet?.sciencePrompt[0]?.filename).toBe('prompt_Neurokua_system.txt')
    expect(packet?.focus.scienceFocus).toBe('neurokua')
    expect(packet?.focus.subscienceFocus).toBe('etat du jour')
  })

  it('falls back to supporting knowledge when no specialized prompt is detected', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Livre_symbolique_01.pdf',
        fileId: '10',
        text: 'Chapitre sur les cycles, les transitions et les dynamiques interieures.',
        score: 0.75,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'general',
      selectedMenuLabel: null,
      selectedSubmenuLabel: null,
      latestUserMessage: 'Je veux une lecture generale',
    })

    expect(packet?.masterPrompt).toBeNull()
    expect(packet?.readingStructure).toBeNull()
    expect(packet?.supportingKnowledge).toHaveLength(1)
    expect(packet?.supportingKnowledge[0]?.filename).toBe('Livre_symbolique_01.pdf')
  })
})

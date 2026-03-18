import { describe, expect, it } from 'vitest'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'
import { lookupDocumentRegistry } from '@/lib/hexastra/vector/documentRegistry'

describe('buildKnowledgePacket', () => {
  it('uses the local document registry for explicit file mapping', () => {
    const entry = lookupDocumentRegistry('KS.NeuroKua.Synesthesia.V1 Architecture officielle.pdf')

    expect(entry?.role).toBe('referenceBook')
    expect(entry?.scienceTag).toBe('neurokua')
  })

  it('uses registry patterns for enneagram and maslow documents', () => {
    const enneagramEntry = lookupDocumentRegistry('Guide_Enneagramme_Type_6.pdf')
    const maslowEntry = lookupDocumentRegistry('Pyramide_de_Maslow_Besoins_du_moment.pdf')

    expect(enneagramEntry?.role).toBe('referenceBook')
    expect(enneagramEntry?.scienceTag).toBe('enneagramme')
    expect(maslowEntry?.role).toBe('referenceBook')
    expect(maslowEntry?.scienceTag).toBe('maslow')
  })

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

  it('ignores noisy files like README and module manifests', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'README.md',
        fileId: '20',
        text: 'Repository readme and setup notes.',
        score: 0.99,
      },
      {
        source: 'knowledge',
        filename: 'module.json',
        fileId: '21',
        text: 'Module descriptor.',
        score: 0.98,
      },
      {
        source: 'knowledge',
        filename: 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
        fileId: '22',
        text: 'Prompt maitre KS Fusion V13 et V13A12.',
        score: 0.9,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Astrologie',
      selectedSubmenuLabel: null,
      latestUserMessage: 'Analyse par science',
    })

    expect(packet?.masterPrompt?.filename).toBe('prompt_maitre_ks_fusion_v13_et_v13a12.txt')
    expect(packet?.ignoredSources).toHaveLength(2)
    expect(packet?.ignoredSources[0]?.filename).toBe('README.md')
  })

  it('promotes curated master and science prompt documents in the hierarchy', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'PROMPT_INSTRUCTION.txt',
        fileId: '30',
        text: 'Prompt instruction general avec ton, cadre et garde-fous.',
        score: 0.98,
      },
      {
        source: 'knowledge',
        filename: 'PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt',
        fileId: '31',
        text: 'Version ultra compacte de la lecture HexAstra.',
        score: 0.83,
      },
      {
        source: 'knowledge',
        filename: 'PROMPT SOUS MODULE KS FUSION V13.pdf',
        fileId: '32',
        text: 'Sous-modules, sous-sciences et logiques d exploitation.',
        score: 0.81,
      },
      {
        source: 'domain',
        filename: 'prompt_Neurokua_system.txt',
        fileId: '33',
        text: 'Prompt NeuroKua systeme, etat du jour et axes de lecture.',
        score: 0.9,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'neurokua',
      selectedMenuLabel: 'NeuroKua',
      selectedSubmenuLabel: 'Mon etat du jour',
      latestUserMessage: 'Je veux une lecture NeuroKua detaillee',
    })

    expect(packet?.masterPrompt?.filename).toBe('PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt')
    expect(packet?.sciencePrompt.map((entry) => entry.filename)).toContain('PROMPT SOUS MODULE KS FUSION V13.pdf')
  })

  it('treats the official KS prompt bundle as a master prompt source', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'KS_FUSION_V13_PROMPTS_OFFICIELS.docx',
        fileId: '40',
        text: 'Recueil officiel des prompts KS Fusion V13.',
        score: 0.76,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Astrologie',
      selectedSubmenuLabel: null,
      latestUserMessage: 'Analyse par science',
    })

    expect(packet?.masterPrompt?.filename).toBe('KS_FUSION_V13_PROMPTS_OFFICIELS.docx')
  })

  it('prioritizes science-aligned reference books before generic support', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'The_Complete_Book_of_Numerology.pdf',
        fileId: '50',
        text: 'Reference numerology book about cycles, life path and monthly influences.',
        score: 0.7,
      },
      {
        source: 'knowledge',
        filename: 'Kybalion.pdf',
        fileId: '51',
        text: 'Transverse symbolic reference.',
        score: 0.91,
      },
      {
        source: 'knowledge',
        filename: 'HexAstra_Knowledge_RAG.json',
        fileId: '52',
        text: 'Knowledge support block with generic retrieval chunks.',
        score: 0.95,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Numerologie',
      selectedSubmenuLabel: 'Cycle annuel',
      latestUserMessage: 'Je veux une lecture de numerologie sur mon cycle annuel',
    })

    expect(packet?.focus.scienceFocus).toBe('numerologie')
    expect(packet?.referenceBook[0]?.filename).toBe('The_Complete_Book_of_Numerology.pdf')
    expect(packet?.referenceBook[0]?.scienceTag).toBe('numerologie')
    expect(packet?.referenceBook[1]?.filename).toBe('Kybalion.pdf')
    expect(packet?.fusionGuide).toContain('fusion')
    const numerologyBookIndex = packet?.orderedSources.findIndex(
      (entry) => entry?.filename === 'The_Complete_Book_of_Numerology.pdf',
    )
    const supportIndex = packet?.orderedSources.findIndex(
      (entry) => entry?.filename === 'HexAstra_Knowledge_RAG.json',
    )

    expect(numerologyBookIndex).toBeGreaterThanOrEqual(0)
    expect(supportIndex).toBeGreaterThanOrEqual(0)
    expect(numerologyBookIndex).toBeLessThan(supportIndex as number)
  })

  it('recognizes enneagram focus in the knowledge packet', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Guide_Enneagramme_Type_6.pdf',
        fileId: '60',
        text: 'Enneagram stress, defense patterns and growth resources.',
        score: 0.78,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Enneagramme',
      selectedSubmenuLabel: 'Stress',
      latestUserMessage: 'Je veux une lecture Enneagramme sur mon fonctionnement sous stress',
    })

    expect(packet?.focus.scienceFocus).toBe('enneagramme')
  })

  it('prioritizes registered supporting knowledge above generic support', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Livre_symbolique_01.pdf',
        fileId: '70',
        text: 'Generic symbolic support.',
        score: 0.97,
      },
      {
        source: 'knowledge',
        filename: 'HEXASTRA – KNOWLEDGE CORE.pdf',
        fileId: '71',
        text: 'Core HexAstra knowledge base.',
        score: 0.7,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'general',
      selectedMenuLabel: null,
      selectedSubmenuLabel: null,
      latestUserMessage: 'Je veux une lecture generale',
    })

    expect(packet?.supportingKnowledge[0]?.filename).toBe('HEXASTRA – KNOWLEDGE CORE.pdf')
  })
})

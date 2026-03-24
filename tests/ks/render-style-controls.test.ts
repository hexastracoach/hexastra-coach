import { describe, expect, it } from 'vitest'
import { adjustResponseDepth } from '@/lib/chat/adaptiveDepthEngine'
import { moderateMessage } from '@/lib/chat/conversationLayer'
import { generateContextualSuggestions } from '@/lib/hexastra/response/contextualSuggestions'
import { enrichReadingResponse } from '@/lib/hexastra/response/enrichReadingResponse'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'

describe('render style controls', () => {
  it('does not append automatic closing prompts in depth adjustment', () => {
    const reply = adjustResponseDepth('Salut, oui ca va.', {
      level: 'LEVEL_1',
      plan: 'free',
      isReading: false,
    })

    expect(reply).toBe('Salut, oui ca va.')
  })

  it('keeps free replies shorter than premium replies at the same depth level', () => {
    const longReply = Array.from({ length: 16 }, (_, index) => `Ligne ${index + 1}`).join('\n')

    const freeReply = adjustResponseDepth(longReply, {
      level: 'LEVEL_4',
      plan: 'free',
      isReading: false,
    })
    const premiumReply = adjustResponseDepth(longReply, {
      level: 'LEVEL_4',
      plan: 'premium',
      isReading: false,
    })

    expect(freeReply.split('\n')).toHaveLength(6)
    expect(premiumReply.split('\n')).toHaveLength(14)
  })

  it('does not block short numeric choices used in guided flows', () => {
    expect(moderateMessage('3')).toBe('SAFE')
  })

  it('does not generate automatic contextual suggestions for the free plan', () => {
    const suggestions = generateContextualSuggestions({
      plan: 'free',
      contextType: 'science',
      domainRoute: 'science',
      lastUserMessage: 'donne moi mon theme natal',
    })

    expect(suggestions).toEqual([])
  })

  it('keeps free-plan reading responses free of decorative enrichment blocks', () => {
    const base = enrichReadingResponse({
      plan: 'free',
      response: {
        message: 'Voici ta lecture.',
        reply: 'Voici ta lecture.',
        mode: 'libre',
        plan: 'free',
        flowState: { step: 'analysis', completed: true },
        conversationId: 'conv_test',
      },
    })

    expect(base.message).toBe('Voici ta lecture.')
    expect(base.reply).toBe('Voici ta lecture.')
  })

  it('explicitly forbids visible four-step headings in the system prompt', () => {
    const prompt = buildSystemPrompt({
      plan: 'free',
      mode: 'libre',
      language: 'fr',
      contextType: 'science',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'science',
      flowStep: 'analysis',
      messages: [{ role: 'user', content: 'donne moi mon theme natal' }],
    })

    expect(prompt).toContain("Interdiction d'afficher automatiquement des rubriques visibles")
    expect(prompt).toContain('Chaque reponse suit 4 mouvements invisibles')
    expect(prompt).toContain('preferer 1 a 4 paragraphes courts')
    expect(prompt).toContain('Phrases courtes. Lignes respirantes.')
    expect(prompt).toContain('Les premieres reponses doivent etre simples et marquantes')
  })

  it('allows an explicit science angle without exposing the whole internal system', () => {
    const prompt = buildSystemPrompt({
      plan: 'free',
      mode: 'libre',
      language: 'fr',
      contextType: 'science',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'science',
      flowStep: 'analysis',
      selectedScience: 'human_design',
      messages: [{ role: 'user', content: 'Montre-moi mon Human Design' }],
    })

    expect(prompt).toContain('Il est permis de nommer publiquement Human Design')
    expect(prompt).toContain('pas a un outil separe, pas a une encyclopedie, pas a un cours')
    expect(prompt).not.toContain(
      'Redirige simplement avec: "Je peux te donner une reponse directe si tu me parles de ta situation."',
    )
  })

  it('keeps maslow as a background support and not a public menu science', () => {
    const libreMenu = getMenuForMode('libre')
    const practitionerMenu = getMenuForMode('praticien')
    const libreKeys = libreMenu.flatMap((item) => [item.key, ...(item.submenu?.map((child) => child.key) ?? [])])
    const practitionerKeys = practitionerMenu.flatMap((item) => [
      item.key,
      ...(item.submenu?.map((child) => child.key) ?? []),
    ])
    const prompt = buildSystemPrompt({
      plan: 'free',
      mode: 'libre',
      language: 'fr',
      contextType: 'science',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'science',
      flowStep: 'analysis',
      messages: [{ role: 'user', content: 'fais moi une lecture generale' }],
    })

    expect(libreKeys).not.toContain('science_maslow')
    expect(practitionerKeys).not.toContain('science_maslow')
    expect(prompt).toContain("La Pyramide de Maslow peut servir de grille d'appui interne")
    expect(prompt).toContain('elle ne doit pas etre proposee spontanement comme science publique')
  })
})

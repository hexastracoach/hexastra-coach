import { describe, expect, it } from 'vitest'
import { applyShiloStyle } from '@/lib/hexastra/rendering/applyShiloStyle'

function countSentences(value: string): number {
  return value
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length
}

describe('applyShiloStyle', () => {
  it('makes a neutral fusion opening more alive without changing the message', () => {
    const styled = applyShiloStyle({
      opening: 'Tu es dans une periode de transition importante.',
      explanation:
        'Le point le plus concret ici est que quelque chose se reorganise. Ce contexte ajoute aussi une reorientation.',
      action:
        'Ramene ton energie sur un seul axe concret et laisse ce signal guider la prochaine action utile.',
      key: 'La clarte ne vient pas en forcant, mais en repondant au signal le plus juste.',
      responseMode: 'concise_fusion_answer',
    })

    expect(styled.opening).toContain('bougent vraiment')
    expect(styled.explanation).toContain("Le plus clair, c'est que")
    expect(styled.key).toBe("La clarte revient quand tu cesses de forcer.")
  })

  it('humanizes a direct action sentence without adding fluff', () => {
    const styled = applyShiloStyle({
      opening: 'Tu es Projector.',
      explanation: 'Le point le plus concret ici est que tu es Projector.',
      action: 'Tu dois attendre avant d agir.',
      key: 'Ta bonne direction vient d une reponse juste, pas d une initiative sous pression.',
      responseMode: 'direct_answer',
    })

    expect(styled.action).toBe("Ce n'est pas le moment de forcer. Laisse venir la bonne reponse.")
    expect(countSentences(styled.action)).toBe(2)
  })

  it('keeps timing language visible in timing mode', () => {
    const styled = applyShiloStyle({
      opening: 'Le signal le plus net montre que quelque chose se precise.',
      explanation: 'Le point le plus concret ici est que le mouvement se rapproche.',
      action: 'Avance sans surcharge.',
      key: 'La clarte vient du bon rythme, pas de la precipitation.',
      responseMode: 'timing_strategic_response',
    })

    expect(styled.opening).toContain('En ce moment')
    expect(styled.action).toMatch(/moment|signal|rythme/i)
    expect(styled.key).toBe("Le bon rythme t'en dira plus que la precipitation.")
  })

  it('translates robotic calculated phrasing into readable french', () => {
    const styled = applyShiloStyle({
      opening: 'Ton retour solaire ouvre une phase de recentrage.',
      explanation:
        'Le point le plus concret ici est que ton retour solaire ouvre une phase de recentrage. Ce contexte ajoute aussi une reorientation.',
      action:
        'Observe ce qui revient avec le plus d insistance maintenant, puis prends une seule decision a partir de ce signal au lieu de forcer la cadence.',
      key: 'Le cycle porte mieux ce que tu consolides que ce que tu forces.',
      responseMode: 'calculated_reading',
    })

    expect(styled.opening).toContain("met l'accent sur")
    expect(styled.explanation).not.toContain('Le point le plus concret ici est que')
    expect(styled.action).toContain("Regarde ce qui revient avec le plus d'insistance maintenant.")
    expect(styled.key).toBe('Ce cycle soutient ce que tu consolides, pas ce que tu forces.')
  })

  it('keeps sections compact and avoids duplicate sentences', () => {
    const styled = applyShiloStyle({
      opening: 'Actuellement, quelque chose bouge. Actuellement, quelque chose bouge.',
      explanation:
        "Ce contexte ajoute aussi une pression. Ce contexte ajoute aussi une pression. Au fond, quelque chose se clarifie.",
      action:
        'Ne cherche pas a trancher trop vite; clarifie d abord ce qui est vraiment non negociable, puis pose une action simple.',
      key: "L espace juste soutient une decision plus claire.",
      responseMode: 'interpretive_reading',
    })

    expect(countSentences(styled.opening)).toBeLessThanOrEqual(2)
    expect(styled.explanation.match(/pression/gi)?.length ?? 0).toBe(1)
    expect(styled.action).toContain('Ne tranche pas trop vite.')
    expect(styled.key).toBe("Quand l'espace est juste, la decision se clarifie.")
  })
})

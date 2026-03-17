import { openai } from '@/lib/openai/client'
import { OPENAI_MODELS } from '@/lib/openai/models'

const SYSTEM_PROMPT = `Classifie l'intention du message utilisateur.

Catégories possibles :
- conversation
- menu
- analysis
- irrelevant

Règles :
- conversation : small talk, salutations, échanges légers.
- menu : navigation, menu, explorer les angles, changer d'angle.
- analysis : question ou besoin d'analyse réelle.
- irrelevant : spam, hors sujet, contenu inapproprié.

Retourne uniquement le mot de catégorie.`

export async function classifyIntent(message: string): Promise<'conversation' | 'menu' | 'analysis' | 'irrelevant'> {
  const prompt = message?.trim() || ''
  if (!prompt) return 'conversation'

  const response = await openai.responses.create({
    model: OPENAI_MODELS.conversation,
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  const raw = (response.output_text || '').trim().toLowerCase()
  if (raw.includes('menu')) return 'menu'
  if (raw.includes('analysis')) return 'analysis'
  if (raw.includes('irrelevant')) return 'irrelevant'
  return 'conversation'
}

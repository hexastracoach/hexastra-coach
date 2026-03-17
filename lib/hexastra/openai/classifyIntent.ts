import { getOpenAIClient } from '@/lib/openai/client'
import { OPENAI_MODELS } from '@/lib/openai/models'

const SYSTEM_PROMPT = `Classifie l'intention du message utilisateur.

Categories possibles :
- conversation
- menu
- analysis
- irrelevant

Regles :
- conversation : small talk, salutations, echanges legers.
- menu : navigation, menu, explorer les angles, changer d'angle.
- analysis : question ou besoin d'analyse reelle.
- irrelevant : spam, hors sujet, contenu inapproprie.

Retourne uniquement le mot de categorie.`

export async function classifyIntent(
  message: string
): Promise<'conversation' | 'menu' | 'analysis' | 'irrelevant'> {
  const prompt = message?.trim() || ''
  if (!prompt) return 'conversation'

  const openai = getOpenAIClient()
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

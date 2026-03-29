/**
 * POST /api/prompt
 *
 * Appelle un prompt stocké OpenAI (Responses API) côté serveur.
 * Le prompt est référencé par OPENAI_PROMPT_ID + OPENAI_PROMPT_VERSION.
 *
 * Body attendu:
 *   { message: string, context?: { userId?, plan?, language? } }
 *
 * Réponse:
 *   { reply: string, promptId: string, usage?: object }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient } from '@/lib/openai/client'

// ── Runtime ────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs'

// ── Validation du body ────────────────────────────────────────────────────────

const RequestSchema = z.object({
  message: z
    .string({ required_error: 'message est requis' })
    .min(1, 'message ne peut pas être vide')
    .max(4000, 'message trop long (max 4000 caractères)'),
  context: z
    .object({
      userId:   z.string().optional(),
      plan:     z.string().optional(),
      language: z.string().default('fr'),
    })
    .optional()
    .default({}),
})

type RequestBody = z.infer<typeof RequestSchema>

// ── Config serveur ─────────────────────────────────────────────────────────────

function getPromptConfig(): { promptId: string; promptVersion: string | undefined } {
  const promptId = process.env.OPENAI_PROMPT_ID
  if (!promptId) {
    throw new Error('OPENAI_PROMPT_ID manquant dans les variables d\'environnement')
  }
  return {
    promptId,
    promptVersion: process.env.OPENAI_PROMPT_VERSION || undefined,
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Valider la config serveur
  let promptId: string
  let promptVersion: string | undefined
  try {
    ;({ promptId, promptVersion } = getPromptConfig())
  } catch (err) {
    console.error('[/api/prompt] Config error:', err)
    return NextResponse.json(
      { error: 'Service non configuré', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  // 2. Parser et valider le body
  let body: RequestBody
  try {
    const raw = await req.json()
    body = RequestSchema.parse(raw)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Corps de requête invalide', details: err.flatten().fieldErrors },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'JSON invalide' },
      { status: 400 },
    )
  }

  // 3. Appel OpenAI Responses API avec prompt stocké
  try {
    const openai = getOpenAIClient()

    const response = await openai.responses.create({
      prompt: {
        id: promptId,
        ...(promptVersion && { version: promptVersion }),
        // Variables injectées dans le template du prompt stocké.
        // Les noms correspondent aux {{variables}} définis dans OpenAI Playground.
        variables: {
          message:  body.message,
          language: body.context.language,
          ...(body.context.plan   && { plan:    body.context.plan }),
          ...(body.context.userId && { user_id: body.context.userId }),
        },
      },
      // `input` appended à la conversation définie dans le prompt stocké.
      // Utilise la syntaxe multi-turn pour un comportement chat propre.
      input: [
        {
          role:    'user',
          content: body.message,
        },
      ],
    })

    const reply = response.output_text ?? ''

    return NextResponse.json({
      reply,
      promptId,
      ...(promptVersion && { promptVersion }),
      usage: response.usage ?? null,
    })
  } catch (err) {
    console.error('[/api/prompt] OpenAI error:', err)

    // Distingue les erreurs OpenAI des erreurs inattendues
    if (err instanceof Error && err.message.includes('401')) {
      return NextResponse.json(
        { error: 'Clé API invalide', code: 'AUTH_ERROR' },
        { status: 500 },
      )
    }
    if (err instanceof Error && err.message.includes('404')) {
      return NextResponse.json(
        { error: 'Prompt introuvable — vérifier OPENAI_PROMPT_ID et OPENAI_PROMPT_VERSION', code: 'PROMPT_NOT_FOUND' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'OPENAI_ERROR' },
      { status: 500 },
    )
  }
}

// ── Méthodes non supportées ────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Méthode non supportée — utiliser POST' },
    { status: 405 },
  )
}

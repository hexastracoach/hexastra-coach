import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY manquante sur le serveur.' },
        { status: 500 },
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const language = String(formData.get('language') || 'fr')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier audio reçu.' },
        { status: 400 },
      )
    }

    const upstreamForm = new FormData()
    upstreamForm.append('file', file, file.name || 'audio.webm')
    upstreamForm.append('model', 'gpt-4o-mini-transcribe')
    upstreamForm.append('language', language)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
      signal: AbortSignal.timeout(45000),
    })

    const text = await response.text()
    let data: any = null

    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }

    if (!response.ok) {
      logger.error('Transcription API error', { status: response.status, data: data || text })

      return NextResponse.json(
        {
          error: 'Échec de transcription.',
          details: data?.error?.message || 'Réponse invalide du serveur de transcription.',
        },
        { status: response.status },
      )
    }

    const transcript = data?.text || ''

    return NextResponse.json({
      text: transcript,
    })
  } catch (error: any) {
    logger.error('Transcribe route error', { err: error })

    return NextResponse.json(
      {
        error: 'Erreur serveur de transcription.',
        details:
          error?.name === 'TimeoutError'
            ? 'La transcription a pris trop de temps.'
            : 'Une erreur inattendue est survenue.',
      },
      { status: 500 },
    )
  }
}
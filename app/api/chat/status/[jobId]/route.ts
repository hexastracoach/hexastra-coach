/**
 * app/api/chat/status/[jobId]/route.ts — Polling du statut d'un job en queue
 *
 * Le client appelle cette route pour savoir si son job est prêt.
 *
 * PROTOCOLE DE POLLING RECOMMANDÉ :
 *   1. /api/chat retourne { status: "queued", jobId: "abc", estimatedWaitSec: 20 }
 *   2. Client attend ~estimatedWaitSec secondes
 *   3. Client GET /api/chat/status/abc
 *   4. Si status == "queued" ou "processing" : attendre 3-5s, repoll
 *   5. Si status == "done" : utiliser result
 *   6. Si status == "failed" : afficher message d'erreur + retry option
 *
 * RÉPONSES :
 *   200 queued      → { status, position, estimatedWaitSec }
 *   200 processing  → { status }
 *   200 done        → { status, result }
 *   200 failed      → { status, message }
 *   404             → job inconnu ou expiré (TTL 15 min)
 *   405             → méthode non autorisée
 */

import { NextRequest, NextResponse } from 'next/server'
import { memoryChatQueue } from '@/lib/queue/memoryChatQueue'

export const runtime = 'nodejs'

// Autoriser GET uniquement
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await params

  if (!jobId || typeof jobId !== 'string' || jobId.length < 10) {
    return NextResponse.json({ error: 'jobId invalide.' }, { status: 400 })
  }

  const state = await memoryChatQueue.getState(jobId)

  if (!state) {
    return NextResponse.json(
      { error: 'Job introuvable ou expiré. Renvoie ta question.' },
      { status: 404 }
    )
  }

  switch (state.status) {
    case 'queued':
      return NextResponse.json({
        status:            'queued',
        position:          state.position,
        estimatedWaitSec:  state.estimatedWaitSec,
      })

    case 'processing':
      return NextResponse.json({ status: 'processing' })

    case 'done':
      return NextResponse.json({
        status: 'done',
        result: state.result,
      })

    case 'failed':
      return NextResponse.json({
        status:  'failed',
        message: 'La requête a échoué. Réessaie dans un instant.',
      })
  }
}

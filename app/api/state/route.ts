// app/api/state/route.ts
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

// Données de démo si n8n non configuré
const DEMO_STATE = {
  userId: 'demo-user',
  mode: 'libre',
  profile: {
    firstName: undefined,
    birthDate: undefined,
    birthTime: undefined,
    birthPlace: undefined,
    language: 'fr',
    modePreferred: 'libre',
    livingSummary: undefined,
    tags: [],
    priorities: [],
  },
  conversations: [],
  deliverables: [],
  analysis: {
    summary: 'Lance une conversation avec HexAstra pour générer ta première analyse.',
    gauges: [
      { key: 'clarity',   label: 'Clarté mentale',        score: 60, hint: 'Tu vois mieux, mais évite la dispersion.' },
      { key: 'energy',    label: 'Élan',                   score: 50, hint: 'Avance par petits pas, constance > intensité.' },
      { key: 'stability', label: 'Stabilité émotionnelle', score: 62, hint: 'Ok, mais protège ton sommeil.' },
      { key: 'direction', label: 'Direction',              score: 70, hint: 'Une piste se confirme. Engage-toi dessus.' },
    ],
    levers: ['Simplifier', 'Dire non', 'Structurer une priorité'],
    risks:  ['Sur-analyse', 'Dispersion', 'Réactivité émotionnelle'],
    plan:   [
      'Choisis 1 priorité unique pour 7 jours',
      'Pose 1 action simple par jour',
      'Reviens en fin de semaine pour une synthèse',
    ],
    updatedAtISO: new Date().toISOString(),
  },
  nextStep: {
    text: 'Choisis une seule priorité pour les 7 prochains jours, puis demande à HexAstra un plan d\'action en 3 étapes.',
    updatedAtISO: new Date().toISOString(),
  },
}

export async function GET() {
  const n8nUrl = process.env.N8N_STATE_URL

  if (!n8nUrl) {
    // Mode démo — retourne données vides structurées
    return NextResponse.json(DEMO_STATE)
  }

  try {
    const r = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'demo-user', // TODO: remplacer par session réelle
      }),
      cache: 'no-store',
    })

    if (!r.ok) throw new Error(`n8n state error: ${r.status}`)
    const data = await r.json()
    return NextResponse.json(data)
  } catch (err) {
    logger.error('[/api/state] n8n fetch failed — falling back to demo state', { err })
    return NextResponse.json(DEMO_STATE)
  }
}

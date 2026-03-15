import { NextRequest } from 'next/server'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, internalError, ok } from '@/lib/utils/apiResponse'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  validateEnv({
    RESEND_API_KEY: {},
    CONTACT_EMAIL_TO: {},
  })

  const resendKey = process.env.RESEND_API_KEY!
  const toEmail = process.env.CONTACT_EMAIL_TO!
  const fromEmail = process.env.EMAIL_FROM ?? 'noreply@hexastra.coach'

  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return badRequest('Corps invalide')
  }

  const { name, email, subject, message } = body

  if (!email || !message) {
    return badRequest('Email et message requis')
  }

  const subjectLabel = subject ? `[${subject.toUpperCase()}] ` : ''

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0d1f1c">Nouveau message — HexAstra Coach</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#555;width:120px"><strong>Nom</strong></td><td>${name ?? '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#555"><strong>Email</strong></td><td>${email}</td></tr>
        <tr><td style="padding:8px 0;color:#555"><strong>Sujet</strong></td><td>${subject ?? '—'}</td></tr>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
      <div style="white-space:pre-wrap;color:#222">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `${subjectLabel}Message de ${name ?? email}`,
      html,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const err = await res.text()
    logger.error('Resend error', { err, status: res.status })
    return internalError('Échec envoi email')
  }

  return ok({ ok: true })
}

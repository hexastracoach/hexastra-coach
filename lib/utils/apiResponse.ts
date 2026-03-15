import { NextResponse } from 'next/server'

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function badRequest(message = 'Requête invalide') {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized(message = 'Non authentifié') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Accès refusé') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function internalError(message = 'Erreur interne') {
  return NextResponse.json({ error: message }, { status: 500 })
}

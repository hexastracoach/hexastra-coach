import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'hexastra-coach',
    timestamp: new Date().toISOString(),
  })
}

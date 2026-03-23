import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, unauthorized, internalError } from '@/lib/utils/apiResponse'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  validateEnv({
    NEXT_PUBLIC_SUPABASE_URL: {},
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
    SUPABASE_SERVICE_ROLE_KEY: {},
  })

  const { fileId } = await params
  if (!fileId) return badRequest('fileId manquant')

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: fileRef, error: fileError } = await supabase
    .from('file_refs').select('*')
    .eq('id', fileId).eq('user_id', user.id).single()

  if (fileError || !fileRef) return internalError('Fichier introuvable')

  const serviceClient = await createSupabaseServer()
  const { data: signedUrl, error: signedError } = await (serviceClient as any).storage
    .from(fileRef.bucket)
    .createSignedUrl(fileRef.storage_path, 60)

  if (signedError || !signedUrl) return internalError('Impossible de générer le lien')

  return new Response(null, { status: 302, headers: { Location: signedUrl.signedUrl } })
}

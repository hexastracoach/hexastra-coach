import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionStateRecord } from '@/lib/hexastra/types'

export async function readSessionState(supabase: SupabaseClient | null, conversationId?: string | null): Promise<SessionStateRecord | null> {
  if (!supabase || !conversationId) return null
  try {
    const { data } = await supabase.from('session_state').select('*').eq('conversation_id', conversationId).maybeSingle()
    return (data as SessionStateRecord | null) ?? null
  } catch {
    return null
  }
}

export async function writeSessionState(
  supabase: SupabaseClient | null,
  conversationId: string,
  patch: Partial<SessionStateRecord>,
): Promise<void> {
  if (!supabase || !conversationId || !Object.keys(patch).length) return
  try {
    await ensureConversation(supabase, conversationId)
    await supabase.from('session_state').upsert({ conversation_id: conversationId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'conversation_id' })
  } catch {
    // fail silently until migrations are applied
  }
}

export async function ensureConversation(
  supabase: SupabaseClient | null,
  conversationId: string,
  patch?: Record<string, unknown>,
): Promise<void> {
  if (!supabase || !conversationId) return
  try {
    await supabase.from('conversations').upsert({ id: conversationId, ...(patch ?? {}), updated_at: new Date().toISOString() })
  } catch {
    // fail silently until migrations are applied
  }
}

export async function readConversationMessages(
  supabase: SupabaseClient | null,
  conversationId: string | null,
  limit = 100,
): Promise<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }[]> {
  if (!supabase || !conversationId) return []
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error || !data) return []
    return data as { id: string; role: 'user' | 'assistant'; content: string; created_at: string }[]
  } catch {
    return []
  }
}

export async function persistConversationMessage(
  supabase: SupabaseClient | null,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!supabase || !conversationId || !content.trim()) return
  try {
    await ensureConversation(supabase, conversationId)
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    })
  } catch {
    // fail silently until migrations are applied
  }
}

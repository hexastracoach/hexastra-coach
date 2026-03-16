import { SHILO_CONVERSATION_PROMPT, SHILO_ANALYSIS_PROMPT } from '@/lib/hexastra/prompts'

const OPENAI_URL = 'https://api.openai.com/v1/responses'

async function callOpenAI(input: unknown, model = 'gpt-4.1-mini'): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return 'OPENAI_API_KEY manquante.'

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
    signal: AbortSignal.timeout(20000),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json) return ''

  const output = Array.isArray((json as any).output) ? (json as any).output : []
  const text = output
    .flatMap((block: any) => (Array.isArray(block?.content) ? block.content : []))
    .filter((item: any) => item?.type === 'output_text' && typeof item.text === 'string')
    .map((item: any) => item.text)
    .join('')
    .trim()

  return text
}

export async function generateConversation(message: string) {
  return await callOpenAI(
    [
      { role: 'system', content: SHILO_CONVERSATION_PROMPT },
      { role: 'user', content: message },
    ],
    'gpt-4.1-mini'
  )
}

export async function formatAnalysis(data: unknown) {
  return await callOpenAI(
    [
      { role: 'system', content: SHILO_ANALYSIS_PROMPT },
      { role: 'user', content: typeof data === 'string' ? data : JSON.stringify(data) },
    ],
    'gpt-4.1'
  )
}

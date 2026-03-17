import OpenAI from 'openai'

let cachedClient: OpenAI | null = null

export function getOpenAIClient() {
  if (cachedClient) return cachedClient

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing')
  }

  cachedClient = new OpenAI({ apiKey })
  return cachedClient
}

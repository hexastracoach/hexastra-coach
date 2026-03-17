import { openai } from '@/lib/openai/client'
import { OPENAI_MODELS } from '@/lib/openai/models'
import { SHILO_CONVERSATION_PROMPT } from '@/lib/hexastra/prompts/shiloConversationPrompt'

export async function generateConversation(userMessage: string) {
  const response = await openai.responses.create({
    model: OPENAI_MODELS.conversation,
    input: [
      {
        role: 'system',
        content: SHILO_CONVERSATION_PROMPT,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
  })

  return response.output_text
}

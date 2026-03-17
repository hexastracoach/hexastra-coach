import { openai } from '@/lib/openai/client'
import { OPENAI_MODELS } from '@/lib/openai/models'
import { SHILO_ANALYSIS_PROMPT } from '@/lib/hexastra/prompts/shiloAnalysisPrompt'

export async function formatAnalysis(analysisData: unknown) {
  const response = await openai.responses.create({
    model: OPENAI_MODELS.analysis, // gpt-5.4
    input: [
      { role: 'system', content: SHILO_ANALYSIS_PROMPT },
      { role: 'user', content: typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData) },
    ],
  })

  return response.output_text
}

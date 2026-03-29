import { Suspense } from 'react'
import PromptChatClient from './_components/PromptChatClient'

export default function PromptPage() {
  return (
    <Suspense>
      <PromptChatClient />
    </Suspense>
  )
}

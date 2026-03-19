import { Suspense } from 'react'
import ChatPageClient from './_components/ChatPageClient'

function ChatLoadingFallback() {
  return (
    <div className="hx-chat-loading-fallback">
      <div className="hx-chat-loading-spinner" aria-label="Chargement…" />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatPageClient />
    </Suspense>
  )
}

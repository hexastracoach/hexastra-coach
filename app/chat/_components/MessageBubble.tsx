'use client'

import { DS, type Msg } from '../_lib/chat'

type Props = {
  message: Msg
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 820,
        margin: '0 auto',
        padding: '6px 0',
        color: DS.text,
        fontSize: 15,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        opacity: isUser ? 0.96 : 0.9,
      }}
    >
      {message.content}
    </div>
  )
}
'use client'

import type { ReactNode } from 'react'

type Props = {
  left?: ReactNode
  right?: ReactNode
  header: ReactNode
  body: ReactNode
  composer: ReactNode
  showLeft: boolean
  showRight: boolean
  onCloseLeft: () => void
  onCloseRight: () => void
  desktopLeft: boolean
  desktopRight: boolean
}

export default function ChatShell({
  left,
  right,
  header,
  body,
  composer,
  showLeft,
  showRight,
  onCloseLeft,
  onCloseRight,
  desktopLeft,
  desktopRight,
}: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background:
          'linear-gradient(115deg, rgba(167,0,30,0.105), transparent 28%), linear-gradient(245deg, rgba(122,169,92,0.075), transparent 31%), linear-gradient(180deg,#120911 0%,#1E0F1C 48%,#080407 100%)',
      }}
    >
      {!desktopLeft && showLeft && (
        <Drawer side="left" onClose={onCloseLeft}>
          {left}
        </Drawer>
      )}

      {!desktopRight && showRight && (
        <Drawer side="right" onClose={onCloseRight}>
          {right}
        </Drawer>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: `${desktopLeft ? '290px ' : ''}minmax(0,1fr)${desktopRight ? ' 320px' : ''}`,
          minHeight: '100vh',
          gap: 0,
        }}
      >
        {desktopLeft && (
          <aside style={{ padding: '18px 0 18px 18px' }}>{left}</aside>
        )}

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {header}

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '24px 28px 18px',
            }}
          >
            {body}
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 19,
              padding: '10px 28px 20px',
              background:
                'linear-gradient(180deg, rgba(18,9,17,0), rgba(18,9,17,0.80) 18%, rgba(8,4,7,0.97) 100%)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            {composer}
          </div>
        </main>

        {desktopRight && (
          <aside style={{ padding: '18px 18px 18px 0' }}>{right}</aside>
        )}
      </div>
    </div>
  )
}

function Drawer({
  children,
  side,
  onClose,
}: {
  children: ReactNode
  side: 'left' | 'right'
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(8, 4, 7, 0.68)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: side === 'left' ? 290 : 320,
          maxWidth: '92vw',
          marginLeft: side === 'right' ? 'auto' : 0,
          padding: 18,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ minHeight: 'calc(100vh - 36px)' }}>{children}</div>
      </div>
    </div>
  )
}

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
          'radial-gradient(circle at 18% 0%, rgba(233,215,190,0.62), transparent 30%), radial-gradient(circle at 84% 16%, rgba(154,184,200,0.28), transparent 32%), linear-gradient(180deg,#F8F6F1 0%,#EFE9DF 100%)',
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
                'linear-gradient(180deg, rgba(248,246,241,0), rgba(248,246,241,0.82) 20%, rgba(248,246,241,0.98) 100%)',
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
        background: 'rgba(46, 42, 38, 0.22)',
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

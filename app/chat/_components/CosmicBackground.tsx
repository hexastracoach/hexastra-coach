'use client'

import Image from 'next/image'

export default function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        background:
          'radial-gradient(circle at 50% 0%, rgba(233,215,190,0.54), transparent 34%), radial-gradient(circle at 82% 16%, rgba(154,184,200,0.24), transparent 28%), linear-gradient(180deg, #F8F6F1 0%, #EFE9DF 100%)',
      }}
    >
      <div className="hx-stars" style={{ opacity: 0.9 }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 18% 20%, rgba(200,169,119,0.18), transparent 42%), radial-gradient(ellipse at 82% 16%, rgba(154,184,200,0.16), transparent 34%), radial-gradient(ellipse at 52% 78%, rgba(184,199,177,0.18), transparent 36%)',
        }}
      />

      <div className="hx-sacred-halo" style={{ opacity: 0.36 }} />

      <div
        className="hx-sacred-geometry"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.07,
        }}
      >
        <Image
          src="/hexastra-sacred-geometry.png"
          alt=""
          width={1120}
          height={1120}
          priority
          style={{
            width: 'min(1120px, 86vw)',
            height: 'auto',
            filter: 'drop-shadow(0 0 80px rgba(200,169,119,0.20)) blur(0.4px) saturate(0.82)',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(200,169,119,0.10) 1px, transparent 1px), linear-gradient(0deg, rgba(154,184,200,0.08) 1px, transparent 1px), radial-gradient(circle at center, transparent 0%, rgba(248,246,241,0.12) 56%, rgba(239,233,223,0.36) 100%)',
          backgroundSize: '64px 64px, 64px 64px, auto',
        }}
      />
    </div>
  )
}

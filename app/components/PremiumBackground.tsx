'use client'

import { useEffect, useRef, useState } from 'react'
import PremiumStarfield from './PremiumStarfield'

type Props = {
  hero?: boolean
  className?: string
}

export default function PremiumBackground({
  hero = false,
  className = '',
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    /* Video only on desktop — saves bandwidth + GPU on mobile */
    if (hero) {
      setShowVideo(window.innerWidth >= 768)
    }

    const root = rootRef.current
    if (!root) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    /* Parallax only on pointer-capable devices */
    if (!window.matchMedia('(pointer: fine)').matches) return

    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 8
      const y = (event.clientY / window.innerHeight - 0.5) * 8
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [hero])

  return (
    <div
      ref={rootRef}
      className={`hx-bg-root hx-parallax-root ${hero ? 'is-hero' : 'is-chat'} ${className}`.trim()}
      aria-hidden="true"
    >
      {showVideo ? (
        <video
          className="hx-bg-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="/nebula/hexastra-nebula.mp4" type="video/mp4" />
        </video>
      ) : null}

      <div className={`hx-bg-space ${hero ? 'is-hero' : ''}`} />
      <div className="hx-bg-aurora hx-bg-aurora-a" />
      <div className="hx-bg-aurora hx-bg-aurora-b" />
      <div className="hx-bg-aurora hx-bg-aurora-c" />

      <div className="hx-bg-canvas-layer">
        <PremiumStarfield />
      </div>

      <div className="hx-bg-nebula hx-bg-nebula-a" />
      <div className="hx-bg-nebula hx-bg-nebula-b" />
      <div className="hx-bg-nebula hx-bg-nebula-c" />

      <div className="hx-bg-grid" />
      <div className="hx-bg-stars hx-bg-stars-1" />
      <div className="hx-bg-stars hx-bg-stars-2" />
      <div className="hx-bg-stars hx-bg-stars-3" />
      {!hero ? <div className="hx-bg-signal" /> : null}
      <div className="hx-bg-vignette" />
    </div>
  )
}

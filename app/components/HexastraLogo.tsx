'use client'

import Image from 'next/image'

type HexastraLogoProps = {
  size?: number
  priority?: boolean
  animated?: boolean
  className?: string
  variant?: string
}

export default function HexastraLogo({
  size = 96,
  priority = false,
  animated = true,
  className = '',
}: HexastraLogoProps) {
  const classes = `hx-logo-wrap ${animated ? 'hx-logo-animated' : ''} ${className}`

  return (
    <div
      className={classes}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="hx-logo-halo hx-logo-halo-1" />
      <div className="hx-logo-halo hx-logo-halo-2" />
      <div className="hx-logo-ring" />

      <div className="hx-logo-core">
        <Image
          src="/logo/hexastra_logo_white_petals_triangles.svg"
          alt="HexAstra"
          width={size}
          height={size}
          priority={priority}
          loading="eager"
          className="hx-logo-image"
          unoptimized
        />
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

type BackButtonProps = {
  children?: ReactNode
  fallbackHref?: string
  className?: string
  ariaLabel?: string
}

export default function BackButton({
  children = 'Retour',
  fallbackHref = '/',
  className,
  ariaLabel,
}: BackButtonProps) {
  const router = useRouter()

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={onBack}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

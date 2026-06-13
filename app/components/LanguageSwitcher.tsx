'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config'
import type { Lang } from '@/lib/i18n/config'

interface Props {
  /** 'flag' shows only flag+code, 'full' shows flag+native label */
  variant?: 'flag' | 'full'
  className?: string
}

export default function LanguageSwitcher({ variant = 'flag', className = '' }: Props) {
  const { lang, setLang } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLUListElement>(null)
  const [mounted, setMounted] = useState(false)

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0]

  useEffect(() => { setMounted(true) }, [])

  // Position the fixed dropdown imperatively to avoid inline JSX style
  useEffect(() => {
    if (!open || !dropRef.current) return
    const rect = triggerRef.current?.getBoundingClientRect()
    const dropdown = dropRef.current
    if (rect) {
      const height = dropdown.offsetHeight || 0
      const top = Math.max(8, rect.top - height - 8) // open upward with small margin
      dropdown.style.top = `${top}px`
      dropdown.style.right = `${window.innerWidth - rect.right}px`
    }
  }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside)
      return () => document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  function select(code: Lang) {
    setLang(code)
    setOpen(false)
  }

  return (
    <div className={`hx-lang-switcher ${className}`} data-open={open}>
      <button
        ref={triggerRef}
        type="button"
        className="hx-lang-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.native}`}
      >
        {variant === 'flag' ? (
          <span className="hx-lang-mark" aria-hidden="true">{current.code.toUpperCase()}</span>
        ) : (
          <span className="hx-lang-flag" aria-hidden="true">{current.flag}</span>
        )}
        {variant === 'full' && (
          <span className="hx-lang-label">{current.native}</span>
        )}
        <svg className="hx-lang-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {mounted && open && createPortal(
        <ul
          ref={dropRef}
          className="hx-lang-dropdown hx-lang-dropdown--portal"
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                className={`hx-lang-option${l.code === lang ? ' is-active' : ''}`}
                onClick={() => select(l.code)}
              >
                <span className="hx-lang-mark" aria-hidden="true">{l.code.toUpperCase()}</span>
                <span className="hx-lang-option-label">{l.native}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}

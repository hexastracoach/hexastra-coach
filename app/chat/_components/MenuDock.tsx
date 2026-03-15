'use client'

import { useMemo, useState } from 'react'
import type { HexastraMenuItem } from '@/lib/hexastra/types'

type Props = {
  items: HexastraMenuItem[]
  title?: string
  onSelect: (item: HexastraMenuItem, parent?: HexastraMenuItem) => void
}

function IconSpark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1.2L8.15 4.35L11.3 5.5L8.15 6.65L7 9.8L5.85 6.65L2.7 5.5L5.85 4.35L7 1.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease',
      }}
    >
      <path
        d="M3.25 5.25L7 9L10.75 5.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function MenuDock({
  items,
  title = 'Explorer un angle',
  onSelect,
}: Props) {
  const [openParentKey, setOpenParentKey] = useState<string | null>(null)

  const safeItems = useMemo(() => {
    return Array.isArray(items) ? items.filter(Boolean) : []
  }, [items])

  if (!safeItems.length) {
    return null
  }

  return (
    <section className="hx-menu-dock hx-menu-dock-compact" aria-label="Choix d’exploration">
      <div className="hx-menu-dock-inline-head">
        <div className="hx-menu-dock-inline-title-wrap">
          <span className="hx-menu-dock-inline-icon">
            <IconSpark />
          </span>
          <div className="hx-menu-dock-inline-copy">
            <div className="hx-menu-dock-inline-title">{title}</div>
            <p className="hx-menu-dock-inline-subtitle">
              Choisis simplement la direction que tu veux approfondir.
            </p>
          </div>
        </div>
      </div>

      <div className="hx-menu-dock-chip-grid" role="list">
        {safeItems.map((item) => {
          const hasSubmenu = Boolean(item.submenu?.length)
          const isOpen = openParentKey === item.key

          return (
            <div
              key={item.key}
              className={`hx-menu-dock-chip-card ${isOpen ? 'is-open' : ''}`}
              role="listitem"
            >
              <div className="hx-menu-dock-chip-row">
                <button
                  type="button"
                  className="hx-menu-dock-chip-main"
                  onClick={() => {
                    if (hasSubmenu) {
                      setOpenParentKey(isOpen ? null : item.key)
                      return
                    }
                    onSelect(item)
                  }}
                  aria-expanded={hasSubmenu ? isOpen : undefined}
                  aria-controls={hasSubmenu ? `submenu-${item.key}` : undefined}
                >
                  <span className="hx-menu-dock-chip-text">
                    <span className="hx-menu-dock-chip-title">{item.label}</span>
                    {item.description ? (
                      <span className="hx-menu-dock-chip-desc">{item.description}</span>
                    ) : null}
                  </span>

                  {hasSubmenu ? (
                    <span className="hx-menu-dock-chip-chevron">
                      <IconChevron open={isOpen} />
                    </span>
                  ) : null}
                </button>
              </div>

              {hasSubmenu && isOpen ? (
                <div
                  id={`submenu-${item.key}`}
                  className="hx-menu-dock-inline-submenu"
                >
                  {item.submenu!.map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      className="hx-menu-dock-inline-subbutton"
                      onClick={() => onSelect(sub, item)}
                    >
                      <span className="hx-menu-dock-inline-subbutton-title">
                        {sub.label}
                      </span>
                      {sub.description ? (
                        <small className="hx-menu-dock-inline-subbutton-desc">
                          {sub.description}
                        </small>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
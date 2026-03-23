'use client'

import { useMemo, useState } from 'react'
import type { HexastraMenuItem } from '@/lib/hexastra/types'
import { createClient } from '@/lib/supabase/client'

type Props = {
  items: HexastraMenuItem[]
  title?: string
  subtitle?: string
  onSelect: (item: HexastraMenuItem, parent?: HexastraMenuItem) => void
  userPlan?: string
  lastUserMessage?: string
  openParentKey?: string | null
  onOpenParentChange?: (key: string | null) => void
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

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 7H10.5M10.5 7L7.75 4.25M10.5 7L7.75 9.75"
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
  subtitle = 'Choisis simplement la direction que tu veux approfondir.',
  onSelect,
  userPlan,
  lastUserMessage,
  openParentKey: controlledOpenParentKey,
  onOpenParentChange,
}: Props) {
  const [uncontrolledOpenParentKey, setUncontrolledOpenParentKey] = useState<string | null>(null)
  const openParentKey =
    controlledOpenParentKey !== undefined ? controlledOpenParentKey : uncontrolledOpenParentKey

  const setOpenParentKey = (key: string | null) => {
    if (controlledOpenParentKey === undefined) {
      setUncontrolledOpenParentKey(key)
    }
    onOpenParentChange?.(key)
  }

  const safeItems = useMemo(() => {
    return Array.isArray(items) ? items.filter(Boolean) : []
  }, [items])

  async function trackAngle(angle: HexastraMenuItem, parent?: HexastraMenuItem) {
    try {
      const supabase = createClient()
      await supabase.from('exploration_usage').insert({
        angle_id: angle.key,
        theme: angle.contextType ?? parent?.contextType ?? null,
        science: angle.domainRoute ?? parent?.domainRoute ?? null,
        plan: userPlan ?? null,
        question_context: lastUserMessage ?? null,
      })
    } catch (e) {
      console.warn('[MenuDock] tracking failed', e)
    }
  }

  if (!safeItems.length) {
    return null
  }

  return (
    <section className="hx-menu-dock hx-menu-dock-compact" aria-label="Choix d'exploration">
      <div className="hx-menu-dock-inline-head">
        <div className="hx-menu-dock-inline-title-wrap">
          <span className="hx-menu-dock-inline-icon">
            <IconSpark />
          </span>
          <div className="hx-menu-dock-inline-copy">
            <div className="hx-menu-dock-inline-title">{title}</div>
            <p className="hx-menu-dock-inline-subtitle">{subtitle}</p>
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
                    void trackAngle(item)
                    onSelect(item)
                  }}
                  aria-expanded={hasSubmenu ? isOpen : undefined}
                  aria-controls={hasSubmenu ? `submenu-${item.key}` : undefined}
                >
                  <span className="hx-menu-dock-chip-text">
                    <span className="hx-menu-dock-chip-eyebrow">
                      {hasSubmenu ? 'Menu' : 'Lecture directe'}
                    </span>
                    <span className="hx-menu-dock-chip-title">{item.label}</span>
                    {item.description ? (
                      <span className="hx-menu-dock-chip-desc">{item.description}</span>
                    ) : null}
                  </span>

                  {hasSubmenu ? (
                    <span className="hx-menu-dock-chip-chevron">
                      <IconChevron open={isOpen} />
                    </span>
                  ) : (
                    <span className="hx-menu-dock-chip-chevron is-action">
                      <IconArrow />
                    </span>
                  )}
                </button>
              </div>

              {hasSubmenu && isOpen ? (
                <div id={`submenu-${item.key}`} className="hx-menu-dock-inline-submenu">
                  <div className="hx-menu-dock-submenu-head">
                    <span className="hx-menu-dock-submenu-kicker">Sous-menus</span>
                    <span className="hx-menu-dock-submenu-title">{item.label}</span>
                  </div>
                  {item.submenu!.map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      className="hx-menu-dock-inline-subbutton"
                      onClick={() => {
                        void trackAngle(sub, item)
                        onSelect(sub, item)
                      }}
                    >
                      <span className="hx-menu-dock-inline-subbutton-kicker">Sous-angle</span>
                      <span className="hx-menu-dock-inline-subbutton-title">{sub.label}</span>
                      {sub.description ? (
                        <small className="hx-menu-dock-inline-subbutton-desc">
                          {sub.description}
                        </small>
                      ) : null}
                      <span className="hx-menu-dock-inline-subbutton-cta">
                        Explorer
                        <IconArrow />
                      </span>
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

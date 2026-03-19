'use client'

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Project, Reading } from '../_lib/chat'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Props = {
  projects: Project[]
  readings: Reading[]
  userInitials?: string
  onNewReading?: () => void
  onCreateProject?: (name: string) => void
  onOpenReading?: (reading: Reading) => void
  onAssignReadingToProject?: (readingId: string, projectId: string) => void
}

function formatReadingDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function isValidReading(r: Reading | null | undefined): r is Reading {
  return !!r?.id && !!r?.title && !!r?.date
}

function isValidProject(p: Project | null | undefined): p is Project {
  return !!p?.id && !!p?.name
}

/* ─── Icons ─── */
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 3.5A1.5 1.5 0 012.5 2h2.382a1 1 0 01.894.553L6.5 4H11.5A1.5 1.5 0 0113 5.5v5A1.5 1.5 0 0111.5 12h-9A1.5 1.5 0 011 10.5v-7z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 2.5A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5v9A1.5 1.5 0 0110.5 13h-7A1.5 1.5 0 012 11.5v-9z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`hx-leftbar-chevron-svg${open ? ' is-open' : ''}`}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1l1.4 3.1L11 4.6l-2.5 2.4.6 3.4L6 8.9l-3.1 1.5.6-3.4L1 4.6l3.6-.5L6 1z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LeftSidebar({
  projects,
  readings,
  userInitials = 'HX',
  onNewReading,
  onCreateProject,
  onOpenReading,
  onAssignReadingToProject,
}: Props) {
  const { t } = useTranslation()
  const safeProjects = useMemo(() => (projects ?? []).filter(isValidProject), [projects])
  const safeReadings = useMemo(() => (readings ?? []).filter(isValidReading), [readings])
  const unassigned = useMemo(() => safeReadings.filter((r) => !r.projectId), [safeReadings])

  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [showProjectInput, setShowProjectInput] = useState(false)
  const [projectInputValue, setProjectInputValue] = useState('')
  const projectInputRef = useRef<HTMLInputElement | null>(null)

  function openProjectInput() {
    setShowProjectInput(true)
    setProjectInputValue('')
    setTimeout(() => projectInputRef.current?.focus(), 50)
  }

  function confirmProjectInput() {
    const name = projectInputValue.trim()
    if (name) onCreateProject?.(name)
    setShowProjectInput(false)
    setProjectInputValue('')
  }

  function cancelProjectInput() {
    setShowProjectInput(false)
    setProjectInputValue('')
  }

  function toggleProject(id: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [lecturesOpen, setLecturesOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return safeReadings
    return safeReadings.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.preview && r.preview.toLowerCase().includes(q)) ||
        (r.science && r.science.toLowerCase().includes(q))
    )
  }, [safeReadings, searchQuery])

  function openSearch() {
    setSearchOpen(true)
    setSearchQuery('')
    setTimeout(() => searchInputRef.current?.focus(), 60)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  function handleDragStart(e: React.DragEvent, readingId: string) {
    e.dataTransfer.setData('reading-id', readingId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(readingId)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverProjectId(null)
  }

  function handleProjectDragOver(e: React.DragEvent, projectId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverProjectId(projectId)
  }

  function handleProjectDragLeave() {
    setDragOverProjectId(null)
  }

  function handleProjectDrop(e: React.DragEvent, projectId: string) {
    e.preventDefault()
    const readingId = e.dataTransfer.getData('reading-id')
    if (readingId) onAssignReadingToProject?.(readingId, projectId)
    setDragOverProjectId(null)
    setDraggingId(null)
  }

  return (
    <div className="hx-leftbar">
      {/* Brand */}
      <div className="hx-leftbar-brand">
        <div className="hx-leftbar-brand-copy">
          <div className="hx-leftbar-brand-title">{t('chat.sidebarBrand')}</div>
          <div className="hx-leftbar-brand-sub">{t('chat.sidebarSub')}</div>
        </div>
        <button
          type="button"
          className="hx-leftbar-search-btn"
          onClick={openSearch}
          aria-label={t('chat.searchPlaceholder')}
          title={t('chat.searchPlaceholder')}
        >
          <IconSearch />
        </button>
      </div>

      {/* New Reading CTA */}
      <div className="hx-leftbar-new-wrap">
        <button
          type="button"
          className="hx-leftbar-new-btn"
          onClick={onNewReading}
        >
          <IconPlus />
          {t('chat.newReading')}
        </button>
      </div>

      {/* Scrollable area */}
      <div className="hx-leftbar-scroll hx-scroll-soft hx-leftbar-body">

        {/* ── Search overlay ── */}
        {searchOpen && (
          <div className="hx-leftbar-search-panel">
            <div className="hx-leftbar-search-header">
              <span className="hx-leftbar-search-icon"><IconSearch /></span>
              <input
                ref={searchInputRef}
                type="text"
                className="hx-leftbar-search-input"
                placeholder={t('chat.searchInputPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="hx-leftbar-search-close"
                onClick={closeSearch}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="hx-leftbar-search-meta">
              {searchQuery.trim()
                ? `${searchResults.length} ${searchResults.length !== 1 ? t('chat.readingsCount', '{n} lectures') : t('chat.readingCount', '{n} lecture')}`.replace('{n}', String(searchResults.length))
                : `${safeReadings.length} ${safeReadings.length !== 1 ? t('chat.readingsCount', '{n} lectures') : t('chat.readingCount', '{n} lecture')}`.replace('{n}', String(safeReadings.length))}
            </div>

            <div className="hx-leftbar-search-results hx-scroll-soft">
              {safeReadings.length === 0 ? (
                <p className="hx-leftbar-empty">{t('chat.noReadings')}</p>
              ) : searchResults.length === 0 ? (
                <p className="hx-leftbar-empty">{t('chat.noReadingsSearch').replace('{q}', searchQuery)}</p>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="hx-leftbar-item hx-leftbar-item-reading hx-leftbar-search-result"
                    onClick={() => { onOpenReading?.(r); closeSearch() }}
                  >
                    <span className="hx-leftbar-result-icon"><IconStar /></span>
                    <div className="hx-leftbar-result-body">
                      <span className="hx-leftbar-item-title">{r.title}</span>
                      <span className="hx-leftbar-item-date">{formatReadingDate(r.date)}</span>
                      {r.preview && (
                        <span className="hx-leftbar-item-preview">{r.preview.slice(0, 80)}…</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Projets section ── */}
        <section className="hx-leftbar-section">
          <div className="hx-leftbar-section-head">
            <button
              type="button"
              className="hx-leftbar-section-toggle"
              onClick={() => setProjectsOpen(!projectsOpen)}
              aria-expanded={projectsOpen}
            >
              <span className="hx-leftbar-section-icon"><IconFolder /></span>
              <span className="hx-leftbar-section-label">{t('chat.sidebarProjects')}</span>
              <IconChevron open={projectsOpen} />
            </button>
            <button
              type="button"
              className="hx-leftbar-add-btn"
              onClick={openProjectInput}
              aria-label={t('chat.newProject')}
              title={t('chat.newProject')}
            >
              <IconPlus />
            </button>
          </div>

          {showProjectInput && (
            <div className="hx-leftbar-project-input-row">
              <input
                ref={projectInputRef}
                type="text"
                className="hx-leftbar-project-input"
                placeholder={t('chat.newProject')}
                value={projectInputValue}
                onChange={(e) => setProjectInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmProjectInput()
                  if (e.key === 'Escape') cancelProjectInput()
                }}
                autoComplete="off"
              />
              <button type="button" className="hx-leftbar-project-input-confirm" onClick={confirmProjectInput}>✓</button>
              <button type="button" className="hx-leftbar-project-input-cancel" onClick={cancelProjectInput}>✕</button>
            </div>
          )}

          {projectsOpen && (
            <div className="hx-leftbar-stack">
              {safeProjects.length === 0 ? (
                <p className="hx-leftbar-empty">
                  {t('chat.emptyProjects')}
                </p>
              ) : (
                safeProjects.map((p) => {
                  const projectReadings = safeReadings.filter((r) => r.projectId === p.id)
                  const isDragOver = dragOverProjectId === p.id
                  const isCollapsed = collapsedProjects.has(p.id)
                  return (
                    <div key={p.id} className="hx-leftbar-project-group">
                      <div
                        className={`hx-leftbar-item hx-leftbar-item-project${isDragOver ? ' is-drag-over' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleProject(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleProject(p.id) }}
                        onDragOver={(e) => handleProjectDragOver(e, p.id)}
                        onDragLeave={handleProjectDragLeave}
                        onDrop={(e) => handleProjectDrop(e, p.id)}
                        aria-expanded={!isCollapsed}
                      >
                        <span className="hx-leftbar-item-icon"><IconFolder /></span>
                        <span className="hx-leftbar-item-title">{p.name}</span>
                        {isDragOver && (
                          <span className="hx-leftbar-drop-hint" aria-hidden="true">↓</span>
                        )}
                        {projectReadings.length > 0 && (
                          <IconChevron open={!isCollapsed} />
                        )}
                      </div>
                      {!isCollapsed && projectReadings.length > 0 && (
                        <div className="hx-leftbar-project-readings">
                          {projectReadings.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className="hx-leftbar-item hx-leftbar-item-reading hx-leftbar-item-nested"
                              onClick={(e) => { e.stopPropagation(); onOpenReading?.(r) }}
                            >
                              <span className="hx-leftbar-item-icon"><IconStar /></span>
                              <span className="hx-leftbar-item-title">{r.title}</span>
                              <span className="hx-leftbar-item-date">{formatReadingDate(r.date)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {/* ── Lectures section ── */}
        <section className="hx-leftbar-section">
          <div className="hx-leftbar-section-head">
            <button
              type="button"
              className="hx-leftbar-section-toggle"
              onClick={() => setLecturesOpen(!lecturesOpen)}
              aria-expanded={lecturesOpen}
            >
              <span className="hx-leftbar-section-icon"><IconBook /></span>
              <span className="hx-leftbar-section-label">{t('chat.sidebarReadings')}</span>
              <IconChevron open={lecturesOpen} />
            </button>
          </div>

          {lecturesOpen && (
            <div className="hx-leftbar-stack">
              {unassigned.length === 0 && safeReadings.length === 0 ? (
                <p className="hx-leftbar-empty">{t('chat.readingsWillAppear')}</p>
              ) : unassigned.length === 0 ? (
                <p className="hx-leftbar-empty">{t('chat.allReadingsInProjects')}</p>
              ) : (
                unassigned.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    draggable
                    className={`hx-leftbar-item hx-leftbar-item-reading${draggingId === r.id ? ' is-dragging' : ''}`}
                    onClick={() => onOpenReading?.(r)}
                    onDragStart={(e) => handleDragStart(e, r.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="hx-leftbar-item-icon"><IconStar /></span>
                    <div className="hx-leftbar-item-top">
                      <span className="hx-leftbar-item-title">{r.title}</span>
                      <span className="hx-leftbar-item-date">{formatReadingDate(r.date)}</span>
                    </div>
                    {r.preview && (
                      <span className="hx-leftbar-item-preview">
                        {r.preview.slice(0, 90)}…
                      </span>
                    )}
                    <span className="hx-leftbar-drag-handle" aria-hidden="true">⠿</span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="hx-leftbar-footer">
        <div className="hx-leftbar-progress">
          <div className="hx-leftbar-progress-track">
            <span
              className="hx-leftbar-progress-fill"
              style={{ '--fill-w': `${Math.min(100, Math.max(6, Math.round((safeReadings.length / 12) * 100)))}%` } as React.CSSProperties}
            />
          </div>
          <span className="hx-leftbar-progress-label">
            {(safeReadings.length !== 1 ? t('chat.readingsCount') : t('chat.readingCount')).replace('{n}', String(safeReadings.length))}
          </span>
        </div>

        <Link href="/account" className="hx-leftbar-avatar" aria-label={t('chat.userProfileLabel')}>
          {userInitials}
        </Link>
      </div>
    </div>
  )
}

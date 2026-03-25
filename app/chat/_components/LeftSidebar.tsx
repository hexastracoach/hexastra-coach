'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Project, Reading } from '../_lib/chat'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/lib/plans'
import HexastraLogo from '@/app/components/HexastraLogo'
import type { ScienceKey } from '@/lib/hexastra/sciences/scienceTaxonomy'

type ScienceEntry = {
  key: ScienceKey
  label: string
  colorClass: string
  Icon: () => JSX.Element
}

const SIDEBAR_SCIENCES: ScienceEntry[] = [
  {
    key: 'fusion_hexastra',
    label: 'Hexastra Fusion',
    colorClass: 'text-emerald-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <polygon points="8,1 9.6,5.8 14.5,5.8 10.5,8.8 12.1,13.6 8,10.6 3.9,13.6 5.5,8.8 1.5,5.8 6.4,5.8" />
      </svg>
    ),
  },
  {
    key: 'astrologie',
    label: 'Astrologie',
    colorClass: 'text-blue-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <ellipse cx="8" cy="8" rx="7" ry="2.8" transform="rotate(-30 8 8)" />
      </svg>
    ),
  },
  {
    key: 'numerologie',
    label: 'Numérologie',
    colorClass: 'text-amber-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <line x1="5.5" y1="3" x2="4.5" y2="13" />
        <line x1="11.5" y1="3" x2="10.5" y2="13" />
        <line x1="3" y1="6" x2="13" y2="6" />
        <line x1="3" y1="10" x2="13" y2="10" />
      </svg>
    ),
  },
  {
    key: 'human_design',
    label: 'Human Design',
    colorClass: 'text-violet-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="8" cy="3.5" r="1.5" />
        <rect x="5.5" y="6" width="5" height="4" rx="1" />
        <line x1="8" y1="5" x2="8" y2="6" />
        <line x1="5.5" y1="8" x2="3" y2="9.5" />
        <line x1="10.5" y1="8" x2="13" y2="9.5" />
        <line x1="8" y1="10" x2="8" y2="13" />
      </svg>
    ),
  },
  {
    key: 'enneagramme',
    label: 'Ennéagramme',
    colorClass: 'text-rose-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" />
        <circle cx="8" cy="1.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="13.2" cy="4.8" r="1" fill="currentColor" stroke="none" />
        <circle cx="13.2" cy="11.2" r="1" fill="currentColor" stroke="none" />
        <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="2.8" cy="11.2" r="1" fill="currentColor" stroke="none" />
        <circle cx="2.8" cy="4.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: 'kua',
    label: 'Kua',
    colorClass: 'text-cyan-400',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" />
        <line x1="8" y1="1.5" x2="8" y2="4" />
        <line x1="8" y1="12" x2="8" y2="14.5" />
        <line x1="1.5" y1="8" x2="4" y2="8" />
        <line x1="12" y1="8" x2="14.5" y2="8" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

const SCIENCE_READING_LABEL: Record<ScienceKey, string> = {
  fusion_hexastra: 'Hexastra Fusion',
  astrologie: 'Astrologie',
  numerologie: 'Numerologie',
  human_design: 'Human Design',
  enneagramme: 'Enneagramme',
  kua: 'Kua',
}

type Props = {
  projects: Project[]
  readings: Reading[]
  userInitials?: string
  userPlan?: PlanKey
  onNewReading?: () => void
  onCreateProject?: (name: string) => void
  onOpenReading?: (reading: Reading) => void
  onAssignReadingToProject?: (readingId: string, projectId: string) => void
  activeScienceKey?: ScienceKey
  onScienceSelect?: (key: ScienceKey) => void
}

function formatReadingDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function planLabel(plan?: PlanKey) {
  switch (plan) {
    case 'essential':
      return 'Essential'
    case 'premium':
      return 'Premium'
    case 'practitioner':
      return 'Practitioner'
    default:
      return 'Free'
  }
}

export default function LeftSidebar({
  readings,
  userInitials = 'HX',
  userPlan = 'free',
  onNewReading,
  onOpenReading,
  activeScienceKey = 'fusion_hexastra',
  onScienceSelect,
}: Props) {
  const { lang } = useTranslation()
  const isEnglish = lang.startsWith('en')

  const filteredReadings = useMemo(() => {
    const all = [...(readings ?? [])].filter((r) => Boolean(r?.id && r?.title))
    if (activeScienceKey === 'fusion_hexastra') return all.slice(0, 20)
    const label = SCIENCE_READING_LABEL[activeScienceKey]
    return all.filter((r) => r.science === label).slice(0, 20)
  }, [readings, activeScienceKey])

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#040d16]/75 text-slate-100 backdrop-blur-2xl">

      {/* Brand */}
      <div className="px-4 pb-3 pt-5">
        <div className="mb-4 flex items-center gap-2.5 px-1">
          <HexastraLogo size={28} animated={false} />
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-slate-100/88">
            Hexastra Coach
          </p>
        </div>

        <button
          type="button"
          onClick={onNewReading}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.07] px-4 py-2.5 text-[13px] font-medium text-emerald-50/90 transition-all duration-150 hover:border-emerald-300/30 hover:bg-emerald-300/[0.13] hover:text-emerald-50 active:scale-[0.98]"
        >
          <span className="text-emerald-300/70 transition-colors group-hover:text-emerald-300">+</span>
          {isEnglish ? 'New reflection' : 'Nouvelle réflexion'}
        </button>
      </div>

      <div className="mx-4 h-px bg-white/[0.05]" />

      {/* Sciences */}
      <div className="px-3 py-3">
        <p className="mb-2 px-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isEnglish ? 'Reading angle' : 'Angle de lecture'}
        </p>
        <div className="space-y-0.5">
          {SIDEBAR_SCIENCES.map(({ key, label, colorClass, Icon }) => {
            const isActive = activeScienceKey === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onScienceSelect?.(key)}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.06]'
                    : 'hover:bg-white/[0.03] active:bg-white/[0.05]'
                }`}
              >
                <span className={`shrink-0 transition-colors ${isActive ? colorClass : 'text-slate-600 group-hover:text-slate-400'}`}>
                  <Icon />
                </span>
                <span className={`truncate text-[12.5px] font-medium transition-colors ${isActive ? 'text-slate-100' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.05]" />

      {/* Readings filtered by science */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isEnglish ? 'Readings' : 'Lectures'}
        </p>

        {filteredReadings.length === 0 ? (
          <p className="px-1.5 py-2 text-[12px] leading-5 text-slate-600">
            {isEnglish
              ? 'No readings for this angle yet.'
              : 'Aucune lecture pour cet angle.'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredReadings.map((reading) => (
              <button
                key={reading.id}
                type="button"
                onClick={() => onOpenReading?.(reading)}
                className="group flex w-full flex-col rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:bg-white/[0.04] active:bg-white/[0.06]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="line-clamp-1 text-[12.5px] font-medium text-slate-200/80 transition-colors group-hover:text-slate-100">
                    {reading.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {formatReadingDate(reading.date)}
                  </span>
                </div>
                {reading.preview ? (
                  <span className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-600">
                    {reading.preview}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="mx-4 h-px bg-white/[0.05]" />
      <div className="px-3 py-3">
        <Link
          href="/account"
          className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-all duration-150 hover:bg-white/[0.04]"
          aria-label={isEnglish ? 'Open profile' : 'Ouvrir le profil'}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-[11px] font-semibold text-slate-200 transition-colors group-hover:border-emerald-300/20 group-hover:bg-emerald-300/[0.07]">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-slate-200/85 group-hover:text-slate-100">
              {isEnglish ? 'My account' : 'Mon espace'}
            </div>
            <div className="text-[11px] text-slate-500">{planLabel(userPlan)}</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

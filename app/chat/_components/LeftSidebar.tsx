'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Project, Reading } from '../_lib/chat'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/lib/plans'

type Props = {
  projects: Project[]
  readings: Reading[]
  userInitials?: string
  userPlan?: PlanKey
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
}: Props) {
  const { lang } = useTranslation()
  const isEnglish = lang.startsWith('en')

  const recentReadings = useMemo(() => {
    return [...(readings ?? [])]
      .filter((reading) => Boolean(reading?.id && reading?.title))
      .slice(0, 14)
  }, [readings])

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#051019]/80 text-slate-100 backdrop-blur-2xl">
      <div className="border-b border-white/8 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(16,185,129,0.05))] shadow-[0_0_40px_rgba(16,185,129,0.12)]">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.75)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400/80">Hexastra</p>
            <p className="truncate text-sm font-medium text-slate-100/90">
              {isEnglish ? 'Clarity & decisions' : 'Clarté et décisions'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewReading}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-3 text-sm font-medium text-emerald-50 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300/[0.14]"
        >
          {isEnglish ? 'New reflection' : 'Nouvelle réflexion'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400/70">
            {isEnglish ? 'Recent history' : 'Historique récent'}
          </p>
          <span className="text-xs text-slate-500">{recentReadings.length}</span>
        </div>

        {recentReadings.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-white/[0.025] px-4 py-5 text-sm leading-6 text-slate-300/68">
            {isEnglish
              ? 'Your reflections will appear here as the conversation grows.'
              : 'Tes réflexions apparaîtront ici au fil des échanges.'}
          </div>
        ) : (
          <div className="space-y-2">
            {recentReadings.map((reading) => (
              <button
                key={reading.id}
                type="button"
                onClick={() => onOpenReading?.(reading)}
                className="group flex w-full flex-col rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-left transition duration-200 hover:border-emerald-300/18 hover:bg-emerald-300/[0.05]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="line-clamp-1 text-sm font-medium text-slate-100/90">
                    {reading.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {formatReadingDate(reading.date)}
                  </span>
                </div>
                {reading.preview ? (
                  <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400/78">
                    {reading.preview}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/8 px-4 py-4">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 transition duration-200 hover:border-emerald-300/18 hover:bg-emerald-300/[0.05]"
          aria-label={isEnglish ? 'Open profile' : 'Ouvrir le profil'}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-slate-100">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100/90">
              {isEnglish ? 'My account' : 'Mon espace'}
            </div>
            <div className="text-xs text-slate-400/75">{planLabel(userPlan)}</div>
          </div>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-2 py-1 text-[11px] font-medium text-emerald-100/80">
            {planLabel(userPlan)}
          </span>
        </Link>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Project, Reading } from '../_lib/chat'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/lib/plans'
import HexastraLogo from '@/app/components/HexastraLogo'

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
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#040d16]/75 text-slate-100 backdrop-blur-2xl">

      {/* Brand */}
      <div className="px-4 pb-4 pt-5">
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

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2.5 px-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isEnglish ? 'Recent' : 'Récent'}
        </p>

        {recentReadings.length === 0 ? (
          <p className="px-1.5 py-2 text-[12px] leading-5 text-slate-500/80">
            {isEnglish
              ? 'Your reflections will appear here.'
              : 'Tes réflexions apparaîtront ici.'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {recentReadings.map((reading) => (
              <button
                key={reading.id}
                type="button"
                onClick={() => onOpenReading?.(reading)}
                className="group flex w-full flex-col rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:bg-white/[0.04] active:bg-white/[0.06]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="line-clamp-1 text-[13px] font-medium text-slate-200/85 transition-colors group-hover:text-slate-100">
                    {reading.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {formatReadingDate(reading.date)}
                  </span>
                </div>
                {reading.preview ? (
                  <span className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-500/80">
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

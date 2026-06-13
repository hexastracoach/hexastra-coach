'use client'
import React from "react";
import Link from 'next/link'
import type { Reading } from '../_lib/chat'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/lib/plans'
import HexastraLogo from '@/app/components/HexastraLogo'
import { SIDEBAR_INTENTS, type UserIntentKey } from '@/lib/hexastra/config/intentContextMap'

type Props = {
  readings: Reading[]
  userInitials?: string
  userPlan?: PlanKey
  onNewReading?: () => void
  onOpenReading?: (reading: Reading) => void
  activeIntentKey?: UserIntentKey
  onIntentSelect?: (key: UserIntentKey) => void
}

function formatReadingDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function planLabel(plan?: PlanKey) {
  switch (plan) {
    case 'essential': return 'Essential'
    case 'premium': return 'Premium'
    case 'practitioner': return 'Practitioner'
    default: return 'Free'
  }
}

// SVG icons per intent
function IconUnderstand() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="5" x2="8" y2="8.5" />
      <circle cx="8" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconDecision() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v5" />
      <path d="M5.5 7H8l2.5 3" />
      <path d="M8 7l-2.5 3" />
      <circle cx="8" cy="2" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconRelationships() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="2.5" />
      <circle cx="10.5" cy="5.5" r="2.5" />
      <path d="M2 13.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5" strokeLinecap="round" />
      <path d="M7 13.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5" strokeLinecap="round" />
    </svg>
  )
}

function IconMoneyWork() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" />
      <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <circle cx="8" cy="8.5" r="1.8" />
    </svg>
  )
}

function IconInnerState() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2.5C5 2.5 2.5 5 2.5 8s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5S11 2.5 8 2.5Z" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  )
}

const INTENT_ICONS: Record<UserIntentKey, React.ComponentType> = {
  understand_situation: IconUnderstand,
  make_decision: IconDecision,
  relationships: IconRelationships,
  money_work: IconMoneyWork,
  inner_state: IconInnerState,
}

const INTENT_COLORS: Record<UserIntentKey, string> = {
  understand_situation: 'text-emerald-400',
  make_decision: 'text-blue-400',
  relationships: 'text-rose-400',
  money_work: 'text-amber-400',
  inner_state: 'text-violet-400',
}

const INTENT_COMPACT_LABELS: Record<UserIntentKey, { fr: string; en: string }> = {
  understand_situation: { fr: 'Comprendre', en: 'Understand' },
  make_decision: { fr: 'Décider', en: 'Decide' },
  relationships: { fr: 'Relation', en: 'Relation' },
  money_work: { fr: 'Travail', en: 'Work' },
  inner_state: { fr: 'Énergie', en: 'Energy' },
}

export default function LeftSidebar({
  readings,
  userInitials = 'HX',
  userPlan = 'free',
  onNewReading,
  onOpenReading,
  activeIntentKey = 'understand_situation',
  onIntentSelect,
}: Props) {
  const { lang } = useTranslation()
  const isEnglish = lang.startsWith('en')

  const filteredReadings = (() => {
    const all = [...(readings ?? [])].filter((r) => Boolean(r?.id && r?.title))
    const activeLabel = SIDEBAR_INTENTS.find((i) => i.key === activeIntentKey)?.[isEnglish ? 'labelEn' : 'label']
    if (!activeLabel) return all.slice(0, 20)
    return all.filter((r) => r.science === activeLabel).slice(0, 20)
  })()

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

      {/* Intent navigation */}
      <div className="px-3 py-3">
        <p className="mb-2 px-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isEnglish ? 'Explore' : 'Explorer'}
        </p>
        <div className="space-y-0.5">
          {SIDEBAR_INTENTS.map((intent) => {
            const isActive = activeIntentKey === intent.key
            const Icon = INTENT_ICONS[intent.key]
            const colorClass = INTENT_COLORS[intent.key]
            return (
              <button
                key={intent.key}
                type="button"
                onClick={() => onIntentSelect?.(intent.key)}
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
                  {isEnglish ? INTENT_COMPACT_LABELS[intent.key].en : INTENT_COMPACT_LABELS[intent.key].fr}
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

      {/* Readings filtered by intent */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isEnglish ? 'Readings' : 'Lectures'}
        </p>

        {filteredReadings.length === 0 ? (
          <p className="px-1.5 py-2 text-[12px] leading-5 text-slate-600">
            {isEnglish
              ? 'No readings for this context yet.'
              : 'Aucune lecture pour ce contexte.'}
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

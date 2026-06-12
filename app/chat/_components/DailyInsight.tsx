'use client'

type DailyInsightProps = {
  compact?: boolean
}

export default function DailyInsight({ compact = false }: DailyInsightProps) {
  return (
    <div className={`hx-daily-insight${compact ? ' is-compact' : ''}`}>
      <span className="hx-daily-insight-dot" aria-hidden="true" />
      <span className="hx-daily-insight-kicker">Aujourd&apos;hui</span>
      <span className="hx-daily-insight-text">quelque chose cherche &agrave; se r&eacute;aligner.</span>
    </div>
  )
}

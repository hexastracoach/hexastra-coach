'use client'

import type { PractitionerUsage } from '@/lib/chat/bootstrapTypes'

type Props = {
  onSelect: (usage: PractitionerUsage) => void
}

export default function PractitionerUsageStep({ onSelect }: Props) {
  return (
    <div className="hx-practitioner-step">
      <div className="hx-practitioner-step-head">
        <span className="hx-practitioner-step-kicker">Mode praticien</span>
        <p className="hx-practitioner-step-question">Mode Praticien actif.</p>
        <p className="hx-practitioner-step-copy">
          Ce mode permet une analyse plus precise, plus structuree, et un vocabulaire plus technique si utile.
        </p>
      </div>

      <p className="hx-practitioner-step-question">Cette analyse est pour :</p>

      <div className="hx-practitioner-step-choices">
        <button
          type="button"
          className="hx-practitioner-btn"
          onClick={() => onSelect('personal')}
        >
          <span className="hx-practitioner-btn-icon" aria-hidden="true">1</span>
          <span className="hx-practitioner-btn-copy">
            <span className="hx-practitioner-btn-kicker">Usage personnel</span>
            <strong>1 - Usage personnel</strong>
            <span className="hx-practitioner-btn-sub">Lecture pour moi-meme</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-practitioner-btn"
          onClick={() => onSelect('client')}
        >
          <span className="hx-practitioner-btn-icon" aria-hidden="true">2</span>
          <span className="hx-practitioner-btn-copy">
            <span className="hx-practitioner-btn-kicker">Usage client</span>
            <strong>2 - Usage client</strong>
            <span className="hx-practitioner-btn-sub">Lecture pour un(e) client(e)</span>
          </span>
        </button>
      </div>
    </div>
  )
}

'use client'

import type { PractitionerUsage } from '@/lib/chat/bootstrapTypes'

type Props = {
  onSelect: (usage: PractitionerUsage) => void
}

export default function PractitionerUsageStep({ onSelect }: Props) {
  return (
    <div className="hx-practitioner-step">
      <p className="hx-practitioner-step-question">Mode Praticien actif.</p>

      <p className="hx-practitioner-btn-sub" style={{ marginBottom: 12 }}>
        Ce mode permet une analyse plus precise, plus structuree, et un vocabulaire plus technique si utile.
      </p>

      <p className="hx-practitioner-step-question">Cette analyse est pour :</p>

      <div className="hx-practitioner-step-choices">
        <button
          type="button"
          className="hx-practitioner-btn"
          onClick={() => onSelect('personal')}
        >
          <span className="hx-practitioner-btn-icon" aria-hidden="true">*</span>
          <span>
            <strong>1 - Usage personnel</strong>
            <span className="hx-practitioner-btn-sub">Lecture pour moi-meme</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-practitioner-btn"
          onClick={() => onSelect('client')}
        >
          <span className="hx-practitioner-btn-icon" aria-hidden="true">+</span>
          <span>
            <strong>2 - Usage client</strong>
            <span className="hx-practitioner-btn-sub">Lecture pour un(e) client(e)</span>
          </span>
        </button>
      </div>
    </div>
  )
}

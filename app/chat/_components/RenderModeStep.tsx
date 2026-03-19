'use client'

import type { RenderMode } from '@/lib/hexastra/sciences/scienceTaxonomy'

type Props = {
  onSelect: (mode: RenderMode) => void
}

export default function RenderModeStep({ onSelect }: Props) {
  return (
    <div className="hx-mode-step">
      <div className="hx-mode-step-head">
        <span className="hx-mode-step-kicker">Mode Praticien</span>
        <p className="hx-mode-step-question">Quel niveau de restitution souhaitez-vous ?</p>
        <p className="hx-mode-step-copy">
          Ce choix adapte la profondeur et la structure des analyses à votre usage professionnel.
        </p>
      </div>

      <div className="hx-mode-step-choices">
        <button
          type="button"
          className="hx-mode-btn"
          onClick={() => onSelect('simple')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">1</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Lecture simple</span>
            <strong className="hx-mode-btn-title">Clair et direct</strong>
            <span className="hx-mode-btn-sub">Résultats clairs et accessibles, utiles pour une première orientation ou un usage non-technique.</span>
            <span className="hx-mode-btn-cta">Choisir ce niveau</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-mode-btn"
          onClick={() => onSelect('approfondie')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">2</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Lecture approfondie</span>
            <strong className="hx-mode-btn-title">Structuré et détaillé</strong>
            <span className="hx-mode-btn-sub">Analyse complète avec jargon technique, dynamiques, risques et leviers — pour une séance de fond.</span>
            <span className="hx-mode-btn-cta">Choisir ce niveau</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-mode-btn hx-mode-btn--fusion"
          onClick={() => onSelect('praticien')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">3</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Synthèse praticien</span>
            <strong className="hx-mode-btn-title">Format professionnel complet</strong>
            <span className="hx-mode-btn-sub">Structure Situation / Phase / Dynamique / Risques / Levier / Recommandation — pour un usage client expert.</span>
            <span className="hx-mode-btn-cta">Choisir ce niveau</span>
          </span>
        </button>
      </div>
    </div>
  )
}

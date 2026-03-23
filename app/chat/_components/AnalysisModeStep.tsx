'use client'

import type { AnalysisMode } from '@/lib/hexastra/sciences/scienceTaxonomy'

type Props = {
  onSelect: (mode: AnalysisMode) => void
}

export default function AnalysisModeStep({ onSelect }: Props) {
  return (
    <div className="hx-mode-step">
      <div className="hx-mode-step-head">
        <span className="hx-mode-step-kicker">Mode de lecture</span>
        <p className="hx-mode-step-question">Comment souhaitez-vous travailler avec Hexastra ?</p>
        <p className="hx-mode-step-copy">
          Ce choix definit votre mode principal d'analyse. Vous pourrez naviguer librement entre les sciences.
        </p>
      </div>

      <div className="hx-mode-step-choices">
        <button
          type="button"
          className="hx-mode-btn"
          onClick={() => onSelect('science_by_science')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">*</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Science par science</span>
            <strong className="hx-mode-btn-title">Analyse ciblee</strong>
            <span className="hx-mode-btn-sub">Explorer une science a la fois: astrologie, numerologie, Human Design, Enneagramme, Kua.</span>
            <span className="hx-mode-btn-cta">Choisir ce mode</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-mode-btn hx-mode-btn--fusion"
          onClick={() => onSelect('hexastra_fusion')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">+</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Fusion Hexastra</span>
            <strong className="hx-mode-btn-title">Synthese multi-sciences</strong>
            <span className="hx-mode-btn-sub">Croiser toutes les sciences pour une lecture unifiee et plus precise.</span>
            <span className="hx-mode-btn-cta">Choisir ce mode</span>
          </span>
        </button>
      </div>
    </div>
  )
}

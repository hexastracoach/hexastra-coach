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
          Ce choix définit votre mode principal d'analyse. Vous pourrez naviguer librement entre les sciences.
        </p>
      </div>

      <div className="hx-mode-step-choices">
        <button
          type="button"
          className="hx-mode-btn"
          onClick={() => onSelect('science_by_science')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">✦</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Science par science</span>
            <strong className="hx-mode-btn-title">Analyse ciblée</strong>
            <span className="hx-mode-btn-sub">Explorer une science à la fois — astrologie, numérologie, Human Design, Ennéagramme, Kua.</span>
            <span className="hx-mode-btn-cta">Choisir ce mode</span>
          </span>
        </button>

        <button
          type="button"
          className="hx-mode-btn hx-mode-btn--fusion"
          onClick={() => onSelect('hexastra_fusion')}
        >
          <span className="hx-mode-btn-icon" aria-hidden="true">⬡</span>
          <span className="hx-mode-btn-copy">
            <span className="hx-mode-btn-kicker">Fusion Hexastra</span>
            <strong className="hx-mode-btn-title">Synthèse multi-sciences</strong>
            <span className="hx-mode-btn-sub">Croiser toutes les sciences pour une lecture unifiée et plus précise.</span>
            <span className="hx-mode-btn-cta">Choisir ce mode</span>
          </span>
        </button>
      </div>
    </div>
  )
}

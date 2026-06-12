'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

type WelcomeHeroProps = {
  onPrompt: (value: string | WelcomePromptPayload) => void
}

type WelcomePromptPayload = {
  message: string
  displayMessage: string
}

type ScienceChoice = {
  label: string
  focus: string
  description: string
  request: string
  displayMessage: string
}

type QuickPrompt = {
  title: string
  description: string
  action: string
  prompt: string
  primary: boolean
  opensSciencePicker?: boolean
}

const scienceChoices: ScienceChoice[] = [
  {
    label: 'Astrologie',
    focus: 'astrologie',
    description: 'Theme astral, maisons, planetes et cycles.',
    request: 'Je veux connaitre mon theme astral. Etudie mon profil astrologique avec les donnees calculees disponibles.',
    displayMessage: 'Étudier mon thème astral',
  },
  {
    label: 'Num\u00e9rologie',
    focus: 'numerologie',
    description: 'Chemin de vie, cycles et nombres personnels.',
    request: 'Je veux connaitre mon chemin de vie et mon profil numerologique avec les donnees calculees disponibles.',
    displayMessage: 'Étudier mon chemin de vie',
  },
  {
    label: 'Enn\u00e9agramme',
    focus: 'enneagramme',
    description: 'Profil, motivations et mecanismes interieurs.',
    request: 'Je veux connaitre mon profil Enneagramme et comprendre mes mecanismes dominants.',
    displayMessage: 'Étudier mon profil Ennéagramme',
  },
  {
    label: 'Hexagramme',
    focus: 'hexagramme',
    description: 'Hexagramme, mutation et dynamique symbolique.',
    request: 'Je veux connaitre mon hexagramme et comprendre la dynamique symbolique qui me concerne.',
    displayMessage: 'Étudier mon hexagramme',
  },
  {
    label: 'Human Design',
    focus: 'human_design',
    description: 'Type, profil, autorite, strategie et centres.',
    request: 'Je veux connaitre mon profil Human Design: type, profil, autorite, strategie et elements importants disponibles.',
    displayMessage: 'Étudier mon profil Human Design',
  },
  {
    label: 'Kua',
    focus: 'kua',
    description: 'Nombre Kua, directions et appuis de lieu.',
    request: 'Je veux connaitre mon profil Kua: nombre Kua, element, directions favorables et lecture associee.',
    displayMessage: 'Étudier mon profil Kua',
  },
]

const quickPrompts: QuickPrompt[] = [
  {
    title: 'Je me sens bloqu\u00e9',
    description: 'Comprendre ce qui me freine int\u00e9rieurement.',
    action: 'Explorer',
    prompt: 'Je me sens bloqu\u00e9 et j ai besoin de comprendre ce qui me freine int\u00e9rieurement.',
    primary: true,
  },
  {
    title: '\u00c9tudier une science',
    description: 'Th\u00e8me astral, chemin de vie, Human Design, Kua...',
    action: 'Choisir la science',
    prompt: '',
    opensSciencePicker: true,
    primary: false,
  },
  {
    title: 'J\u2019ai besoin de comprendre',
    description: 'Mettre des mots sur ce que je traverse.',
    action: 'Comprendre',
    prompt: 'J ai besoin de comprendre ce que je traverse en ce moment.',
    primary: false,
  },
]

export default function WelcomeHero({ onPrompt }: WelcomeHeroProps) {
  const [showSciencePicker, setShowSciencePicker] = useState(false)

  function handleScienceChoice(choice: ScienceChoice) {
    onPrompt({
      displayMessage: choice.displayMessage,
      message: [
        `[intent:science_study] [science_focus:${choice.focus}]`,
        choice.request,
        `Utilise en priorit\u00e9 la science ${choice.label}.`,
        `Si une information manque pour une lecture fiable, demande-moi uniquement la precision necessaire.`,
      ].join(' '),
    })
  }

  return (
    <section className="hx-welcome-hero">
      <div className="hx-welcome-glow" aria-hidden="true" />

      <div className="hx-welcome-orb" aria-hidden="true">
        <span className="hx-welcome-orb-halo" />
        <span className="hx-welcome-orb-ring" />
        <img
          src="/hexastra_logo_white_petals_triangles(2).svg"
          alt=""
          className="hx-welcome-orb-logo"
          draggable={false}
        />
      </div>

      <div className="hx-welcome-badge">
        <span className="hx-welcome-badge-dot" aria-hidden="true" />
        Hexastra
      </div>

      <h1 className="hx-welcome-title">
        <span className="hx-welcome-title-single-line">Dis ce que tu traverses.</span>
      </h1>
      <p className="hx-welcome-subtitle">
        Parfois, voir plus clair commence simplement par &ecirc;tre &eacute;cout&eacute;.
      </p>

      {!showSciencePicker ? (
        <div className="hx-welcome-chips">
          {quickPrompts.map((item) => (
            <button
              key={item.title}
              type="button"
              aria-expanded={item.opensSciencePicker ? showSciencePicker : undefined}
              onClick={() => {
                if (item.opensSciencePicker) {
                  setShowSciencePicker(true)
                  return
                }

                onPrompt(item.prompt)
              }}
              className={`hx-welcome-chip hx-emotion-card${item.primary ? ' is-primary' : ''}`}
            >
              <span className="hx-emotion-card-title">{item.title}</span>
              <span className="hx-emotion-card-description">{item.description}</span>
              <span className="hx-emotion-card-action">-&gt; {item.action}</span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="hx-science-picker"
          role="region"
          aria-label="Choisir une science"
          style={{ position: 'relative', zIndex: 20, width: 'min(860px, 100%)', marginTop: 38, padding: 14 }}
        >
          <div
            className="hx-science-picker-header"
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'center',
              gap: '8px 12px',
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              className="hx-science-back"
              aria-label="Revenir aux propositions"
              onClick={() => setShowSciencePicker(false)}
            >
              <ArrowLeft size={17} strokeWidth={1.9} />
            </button>
            <div className="hx-science-picker-heading">
              <span className="hx-science-picker-kicker">&Eacute;tude d&apos;une science</span>
              <span className="hx-science-picker-title">Choisis ce que tu veux explorer.</span>
            </div>
          </div>
          <div
            className="hx-science-picker-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))',
              gap: 8,
            }}
          >
            {scienceChoices.map((choice) => (
              <button
                key={choice.focus}
                type="button"
                className="hx-science-choice"
                aria-label={`${choice.label}: ${choice.description}`}
                title={choice.description}
                onClick={() => handleScienceChoice(choice)}
                style={{ minHeight: 58, padding: '10px 11px', borderRadius: 16 }}
              >
                <span className="hx-science-choice-name">{choice.label}</span>
                <span className="hx-science-choice-description" style={{ display: 'none' }}>
                  {choice.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

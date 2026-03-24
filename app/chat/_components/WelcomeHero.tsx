'use client'

type WelcomeHeroProps = {
  onPrompt: (value: string) => void
}

const quickPrompts = [
  {
    label: 'Comprendre ce qui se passe',
    prompt: 'Aide-moi à comprendre ce qui se passe dans ma situation en ce moment.',
  },
  {
    label: 'Prendre une décision',
    prompt: "J'ai besoin d'y voir clair pour prendre une décision importante.",
  },
  {
    label: 'Clarifier une relation',
    prompt: "Aide-moi à comprendre ce qui se joue dans cette relation.",
  },
  {
    label: 'Faire le point',
    prompt: 'J\u2019ai besoin de faire le point sur ce que je vis en ce moment.',
  },
]

export default function WelcomeHero({ onPrompt }: WelcomeHeroProps) {
  return (
    <section className="hx-welcome-hero">
      <div className="hx-welcome-glow" aria-hidden="true" />

      <div className="hx-welcome-badge">
        <span className="hx-welcome-badge-dot" aria-hidden="true" />
        Hexastra
      </div>

      <h1 className="hx-welcome-title">
        Tu n&apos;as pas besoin de la question parfaite.
        <br />
        Dis-moi simplement ce que tu vis.
        <br />
        <span className="hx-welcome-title-em">Je t&apos;aide à y voir clair.</span>
      </h1>

      <div className="hx-welcome-chips">
        {quickPrompts.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPrompt(item.prompt)}
            className="hx-welcome-chip"
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  )
}

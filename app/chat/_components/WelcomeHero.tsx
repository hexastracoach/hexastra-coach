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
    prompt: 'J’ai besoin de faire le point sur ce que je vis en ce moment.',
  },
]

export default function WelcomeHero({ onPrompt }: WelcomeHeroProps) {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-8 text-center md:px-6 md:py-12">
      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(88,226,194,0.18),transparent_62%)] opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_bottom,rgba(89,138,255,0.08),transparent_60%)]" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-emerald-100/80">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.8)]" />
            Hexastra
          </div>

          <h1 className="max-w-3xl text-balance text-[2rem] font-semibold tracking-[-0.045em] text-[#f4f7f5] sm:text-[2.6rem] md:text-[3.4rem]">
            Tu n&apos;as pas besoin de la question parfaite.
            <br />
            Dis-moi simplement ce que tu vis.
            <br />
            Je t&apos;aide à y voir clair.
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200/70 sm:text-base">
            Une réponse directe. Une perspective utile. Un premier pas plus clair.
          </p>

          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onPrompt(item.prompt)}
                className="group inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-left text-sm font-medium text-slate-100/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/20 hover:bg-emerald-300/[0.08] hover:text-white"
              >
                <span>{item.label}</span>
                <span className="ml-3 text-emerald-200/60 transition group-hover:text-emerald-200">-&gt;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#061017] px-4 py-12 text-[#f7f1e8] sm:px-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.04] backdrop-blur sm:mb-8 sm:h-24 sm:w-24 sm:rounded-[2rem]">
          <Image
            src="/logo/hexastra_logo_white_petals_triangles.svg"
            alt="Hexastra"
            width={52}
            height={52}
            priority
            className="h-11 w-11 sm:h-[52px] sm:w-[52px]"
          />
        </div>

        <div className="inline-flex min-h-11 max-w-full items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
          Beta privee en preparation
        </div>

        <h1 className="mx-auto mt-6 max-w-[12ch] font-sora text-[clamp(2.4rem,13vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:max-w-none">
          Hexastra arrive bientot
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
          Nous finalisons actuellement l'experience mobile et les derniers reglages pour offrir une
          experience fluide, stable et profonde.
        </p>

        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:rounded-[2rem] sm:p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/70 sm:text-sm sm:tracking-[0.2em]">
            Offre Fondateur
          </div>

          <div className="mt-4 text-[clamp(2.8rem,15vw,3.8rem)] font-semibold leading-none text-white">
            10 EUR
            <span className="text-lg text-white/60"> / mois</span>
          </div>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/68 sm:text-base">
            Tarif fondateur pendant 6 mois pour les premiers membres beta.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-300 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 sm:w-auto"
            >
              Acces testeur prive
            </Link>

            <a
              href="mailto:contact@hexastra.fr?subject=Beta privee Hexastra"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-center text-sm font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:w-auto"
            >
              Rejoindre la liste privee
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm leading-6 text-white/40">
          Ouverture progressive - Places limitees
        </p>
      </div>
    </main>
  )
}

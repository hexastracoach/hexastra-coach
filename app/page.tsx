import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061017] px-6 text-[#f7f1e8]">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur">
          <Image
            src="/logo/hexastra_logo_white_petals_triangles.svg"
            alt="Hexastra"
            width={52}
            height={52}
            priority
          />
        </div>

        <div className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
          Bêta privée en préparation
        </div>

        <h1 className="mt-6 font-sora text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
          Hexastra arrive bientôt
        </h1>

        <p className="mt-6 text-lg leading-8 text-white/68">
          Nous finalisons actuellement l’expérience mobile et les derniers réglages pour offrir une expérience fluide, stable et profonde.
        </p>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <div className="text-sm uppercase tracking-[0.2em] text-emerald-100/70">
            Offre Fondateur
          </div>

          <div className="mt-4 text-5xl font-semibold text-white">
            10€
            <span className="text-lg text-white/60"> / mois</span>
          </div>

          <p className="mt-3 text-white/68">
            Tarif fondateur pendant 6 mois pour les premiers membres bêta.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            >
              Accès testeur privé
            </Link>

            <a
              href="mailto:contact@hexastra.fr?subject=Bêta privée Hexastra"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
            >
              Rejoindre la liste privée
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm text-white/40">
          Ouverture progressive • Places limitées
        </p>
      </div>
    </main>
  )
}

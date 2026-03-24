'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Compass,
  Menu,
  MessageSquare,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { PlanKey } from '@/types/subscription'

type IconCard = {
  title: string
  body: string
  icon: LucideIcon
}

type StepCard = {
  step: string
  title: string
  body: string
}

type Testimonial = {
  quote: string
  author: string
  context: string
}

type PlanCard = {
  key: PlanKey
  title: string
  price: string
  cadence: string
  description: string
  bullets: string[]
  badge?: string
  highlighted?: boolean
}

type CopyBundle = {
  header: {
    how: string
    difference: string
    plans: string
    signIn: string
    account: string
  }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primary: string
    secondary: string
    trust: string
    previewEyebrow: string
    previewTitle: string
    previewItems: string[]
    previewNote: string
  }
  problem: {
    eyebrow: string
    title: string
    subtitle: string
    items: Omit<IconCard, 'icon'>[]
  }
  solution: {
    eyebrow: string
    title: string
    body: string
    bullets: string[]
  }
  steps: {
    eyebrow: string
    title: string
    items: StepCard[]
  }
  benefits: {
    eyebrow: string
    title: string
    items: Omit<IconCard, 'icon'>[]
  }
  differentiation: {
    eyebrow: string
    title: string
    quote: string
    cards: {
      before: string
      after: string
    }[]
  }
  testimonials: {
    eyebrow: string
    title: string
    items: Testimonial[]
  }
  plans: {
    eyebrow: string
    title: string
    subtitle: string
    note: string
    cta: string
    items: PlanCard[]
  }
  finalCta: {
    eyebrow: string
    title: string
    body: string
    cta: string
  }
  footer: {
    tagline: string
    support: string
    contact: string
    privacy: string
    terms: string
  }
}

const CTA_HREF = '/chat'

const FR_COPY: CopyBundle = {
  header: {
    how: 'Comment ça marche',
    difference: 'Pourquoi Hexastra',
    plans: 'Accès',
    signIn: 'Connexion',
    account: 'Mon espace',
  },
  hero: {
    eyebrow: 'Clarté pour les moments qui comptent',
    title: 'Hexastra est votre GPS intérieur.',
    subtitle:
      'Comprenez votre situation, voyez plus clair, et avancez avec de meilleures décisions.',
    primary: 'Explorer ma situation',
    secondary: 'Voir comment ça marche',
    trust: 'Simple, direct, et conçu pour vous aider à avancer avec clarté.',
    previewEyebrow: 'Ce que vous obtenez',
    previewTitle: 'Une lecture utile en quelques minutes.',
    previewItems: [
      'Ce qui se joue vraiment derrière la situation',
      'Ce qui mérite votre attention maintenant',
      'Une direction concrète pour la suite',
    ],
    previewNote: 'Pas de jargon. Pas de méthode à décoder. Juste une réponse claire.',
  },
  problem: {
    eyebrow: 'Quand tout se brouille',
    title: 'Le plus dur n’est pas toujours la décision. C’est le flou autour.',
    subtitle:
      'On pense trop. On ressent beaucoup. Et plus la situation compte, plus il devient difficile de voir ce qui est vraiment en train de se passer.',
    items: [
      {
        title: 'Vous tournez en rond',
        body: 'Vous repassez les mêmes options sans réussir à sentir laquelle est juste.',
      },
      {
        title: 'Vous ressentez sans pouvoir nommer',
        body: 'Quelque chose pèse, mais les mots et la logique n’arrivent pas à suivre.',
      },
      {
        title: 'Vous hésitez entre plusieurs directions',
        body: 'Rester, partir, attendre, relancer. Tout semble possible et rien ne paraît clair.',
      },
      {
        title: 'Vous voulez de la clarté, pas plus de bruit',
        body: 'Vous n’avez pas besoin d’une théorie de plus. Vous avez besoin d’y voir juste.',
      },
    ],
  },
  solution: {
    eyebrow: 'La réponse Hexastra',
    title: 'Hexastra transforme une situation floue en lecture claire.',
    body:
      'Vous décrivez ce qui se passe. Hexastra lit les dynamiques importantes. Puis vous repartez avec une réponse structurée, directe et utile.',
    bullets: [
      'Vous mettez des mots sur ce que vous vivez.',
      'Hexastra clarifie ce qui compte vraiment.',
      'Vous savez quoi regarder et quoi faire ensuite.',
    ],
  },
  steps: {
    eyebrow: 'Comment ça marche',
    title: 'Trois étapes. Une direction plus claire.',
    items: [
      {
        step: '01',
        title: 'Vous partagez votre situation',
        body: 'Un blocage, une décision, une relation, un moment de doute.',
      },
      {
        step: '02',
        title: 'Hexastra clarifie',
        body: 'Le système met en lumière la tension réelle, les enjeux et l’angle juste.',
      },
      {
        step: '03',
        title: 'Vous repartez avec un cap',
        body: 'Une lecture compréhensible. Une direction concrète. Moins de charge mentale.',
      },
    ],
  },
  benefits: {
    eyebrow: 'Ce que ça change',
    title: 'Plus de clarté dans les moments sensibles.',
    items: [
      {
        title: 'Décisions plus nettes',
        body: 'Vous avancez avec plus de discernement et moins d’hésitation.',
      },
      {
        title: 'Moins de surcharge mentale',
        body: 'Vous quittez le bruit intérieur pour revenir à ce qui compte.',
      },
      {
        title: 'Meilleure lecture émotionnelle',
        body: 'Vous comprenez mieux ce que vous ressentez et pourquoi cela vous bloque.',
      },
      {
        title: 'Plus de perspective',
        body: 'Vous voyez la situation dans un cadre plus large et plus calme.',
      },
      {
        title: 'Une réponse utile',
        body: 'Pas un conseil vague. Une lecture qui aide vraiment à passer à la suite.',
      },
    ],
  },
  differentiation: {
    eyebrow: 'Pourquoi c’est différent',
    title: 'Hexastra ne vous demande pas d’apprendre un système.',
    quote: 'Vous n’avez pas besoin de comprendre le système. Seulement votre situation.',
    cards: [
      {
        before: 'Choisir une méthode avant d’être aidé',
        after: 'Recevoir une réponse claire dès le départ',
      },
      {
        before: 'Décoder des résultats complexes',
        after: 'Comprendre immédiatement ce qui se joue',
      },
      {
        before: 'Accumuler de l’information',
        after: 'Retrouver de la direction',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Ce que les utilisateurs ressentent',
    title: 'Clair, humain, crédible.',
    items: [
      {
        quote:
          'Je cherchais surtout à comprendre ce qui me retenait dans une relation. La réponse a été simple, juste, et j’ai senti tout de suite ce qui comptait.',
        author: 'Camille, 33 ans',
        context: 'Clarté relationnelle',
      },
      {
        quote:
          'J’hésitais sur une décision pro depuis des semaines. Hexastra m’a aidé à voir que le vrai sujet n’était pas le poste, mais l’énergie que j’y laissais.',
        author: 'Nicolas, 41 ans',
        context: 'Décision de travail',
      },
      {
        quote:
          'Je me sentais confuse sans savoir pourquoi. En quelques messages, j’ai eu une lecture calme et cohérente. Ça m’a vraiment soulagée.',
        author: 'Sarah, 29 ans',
        context: 'Confusion émotionnelle',
      },
    ],
  },
  plans: {
    eyebrow: 'Accès',
    title: 'Commencez simplement. Allez plus loin quand vous en avez besoin.',
    subtitle:
      'Chaque plan garde la même expérience Hexastra: claire, directe et centrée sur la décision.',
    note: 'Premium est recommandé si vous voulez plus de profondeur et plus de précision.',
    cta: 'Aller au chat',
    items: [
      {
        key: 'free',
        title: 'Free',
        price: '0€',
        cadence: '/ accès découverte',
        description: 'Pour découvrir Hexastra sans friction.',
        bullets: ['Accès limité chaque jour', 'Parfait pour essayer', 'Commencez immédiatement'],
      },
      {
        key: 'essential',
        title: 'Essential',
        price: '9€',
        cadence: '/ mois',
        description: 'Pour utiliser Hexastra quand vous voulez, avec des réponses concises.',
        bullets: ['Usage illimité', 'Guidance claire et directe', 'Pensé pour le quotidien'],
      },
      {
        key: 'premium',
        title: 'Premium',
        price: '19€',
        cadence: '/ mois',
        description: 'Pour une lecture plus profonde, plus précise et plus utile dans les moments importants.',
        bullets: ['Plus de profondeur', 'Plus de précision', 'Meilleur soutien à la décision'],
        badge: 'Recommandé',
        highlighted: true,
      },
      {
        key: 'practitioner',
        title: 'Practitioner',
        price: '49€',
        cadence: '/ mois',
        description: 'Pour les usages avancés, les power users et les futurs cas professionnels.',
        bullets: ['Usage avancé', 'Structure plus experte', 'Positionnement premium'],
      },
    ],
  },
  finalCta: {
    eyebrow: 'Quand tout paraît flou',
    title: 'Hexastra vous aide à y voir clair de nouveau.',
    body:
      'Vous n’avez pas besoin de la question parfaite. Commencez avec ce que vous vivez. La clarté vient ensuite.',
    cta: 'Commencer maintenant',
  },
  footer: {
    tagline: 'La clarté change tout.',
    support: 'Support',
    contact: 'Contact',
    privacy: 'Confidentialité',
    terms: 'Conditions',
  },
}

const EN_COPY: CopyBundle = {
  header: {
    how: 'How it works',
    difference: 'Why Hexastra',
    plans: 'Access',
    signIn: 'Sign in',
    account: 'My space',
  },
  hero: {
    eyebrow: 'Clarity for the moments that matter',
    title: 'Hexastra is your inner GPS.',
    subtitle:
      'Understand your situation, see more clearly, and move forward with better decisions.',
    primary: 'Explore my situation',
    secondary: 'See how it works',
    trust: 'Simple, direct, and designed to help you move with clarity.',
    previewEyebrow: 'What you get',
    previewTitle: 'A useful reading in just a few minutes.',
    previewItems: [
      'What is really happening beneath the surface',
      'What deserves your attention right now',
      'One concrete direction for what comes next',
    ],
    previewNote: 'No jargon. No system to decode. Just a clear answer.',
  },
  problem: {
    eyebrow: 'When everything feels blurred',
    title: 'The hardest part is not always the decision. It is the fog around it.',
    subtitle:
      'You overthink. You feel a lot. And the more the situation matters, the harder it becomes to see what is actually going on.',
    items: [
      {
        title: 'You keep circling the same thoughts',
        body: 'You replay the same options without feeling which one is truly right.',
      },
      {
        title: 'You feel a lot without naming it clearly',
        body: 'Something weighs on you, but words and logic still feel one step behind.',
      },
      {
        title: 'You hesitate between different directions',
        body: 'Stay, leave, wait, speak. Every path is possible and none feels obvious.',
      },
      {
        title: 'You want clarity, not more noise',
        body: 'You do not need another theory. You need a clearer read of the situation.',
      },
    ],
  },
  solution: {
    eyebrow: 'The Hexastra answer',
    title: 'Hexastra turns a blurred situation into a clear reading.',
    body:
      'You describe what is happening. Hexastra reads the important dynamics. Then you leave with a structured, grounded, useful response.',
    bullets: [
      'You put words on what you are living through.',
      'Hexastra clarifies what matters most.',
      'You know what to look at and what to do next.',
    ],
  },
  steps: {
    eyebrow: 'How it works',
    title: 'Three steps. A clearer direction.',
    items: [
      {
        step: '01',
        title: 'You share what is happening',
        body: 'A block, a decision, a relationship, or a moment of doubt.',
      },
      {
        step: '02',
        title: 'Hexastra clarifies the situation',
        body: 'The system highlights the real tension, the stakes, and the right angle to see.',
      },
      {
        step: '03',
        title: 'You leave with direction',
        body: 'A clear reading. A concrete next step. Less mental overload.',
      },
    ],
  },
  benefits: {
    eyebrow: 'What changes',
    title: 'More clarity when the moment really matters.',
    items: [
      {
        title: 'Clearer decisions',
        body: 'Move forward with more discernment and less hesitation.',
      },
      {
        title: 'Less mental overload',
        body: 'Leave the inner noise and come back to what matters.',
      },
      {
        title: 'Better emotional understanding',
        body: 'Understand what you are feeling and why it blocks you.',
      },
      {
        title: 'More perspective',
        body: 'See the situation in a wider and calmer frame.',
      },
      {
        title: 'A useful answer',
        body: 'Not vague advice. A reading that genuinely helps you move forward.',
      },
    ],
  },
  differentiation: {
    eyebrow: 'Why it feels different',
    title: 'Hexastra does not ask you to learn a system first.',
    quote: 'You don’t need to understand the system. Only your situation.',
    cards: [
      {
        before: 'Choose a method before getting help',
        after: 'Get a clear answer from the start',
      },
      {
        before: 'Decode complex outputs',
        after: 'Understand immediately what is going on',
      },
      {
        before: 'Collect more information',
        after: 'Recover direction',
      },
    ],
  },
  testimonials: {
    eyebrow: 'What users feel',
    title: 'Clear, human, credible.',
    items: [
      {
        quote:
          'I wanted clarity on what was really holding me back in a relationship. The response was simple, accurate, and immediately useful.',
        author: 'Camille, 33',
        context: 'Relationship clarity',
      },
      {
        quote:
          'I had been stuck on a work decision for weeks. Hexastra helped me see that the real issue was not the job itself, but the energy it was costing me.',
        author: 'Nicolas, 41',
        context: 'Work decision',
      },
      {
        quote:
          'I felt emotionally confused without knowing why. In a few messages, I got a calm, coherent reading. It genuinely eased the pressure.',
        author: 'Sarah, 29',
        context: 'Emotional confusion',
      },
    ],
  },
  plans: {
    eyebrow: 'Access',
    title: 'Start simply. Go deeper when you need it.',
    subtitle:
      'Every plan keeps the same Hexastra experience: clear, direct, and focused on better decisions.',
    note: 'Premium is recommended when you want more depth and more precision.',
    cta: 'Open the chat',
    items: [
      {
        key: 'free',
        title: 'Free',
        price: '€0',
        cadence: '/ discovery access',
        description: 'Discover Hexastra without friction.',
        bullets: ['Limited daily access', 'Perfect to try the experience', 'Start right away'],
      },
      {
        key: 'essential',
        title: 'Essential',
        price: '€9',
        cadence: '/ month',
        description: 'Use Hexastra whenever you want with concise guidance.',
        bullets: ['Unlimited use', 'Clear and direct guidance', 'Built for everyday clarity'],
      },
      {
        key: 'premium',
        title: 'Premium',
        price: '€19',
        cadence: '/ month',
        description: 'Go deeper with more precise and more useful guidance in important moments.',
        bullets: ['More depth', 'More precision', 'Better decision support'],
        badge: 'Recommended',
        highlighted: true,
      },
      {
        key: 'practitioner',
        title: 'Practitioner',
        price: '€49',
        cadence: '/ month',
        description: 'For advanced usage, power users, and future professional needs.',
        bullets: ['Advanced usage', 'More expert structure', 'Premium positioning'],
      },
    ],
  },
  finalCta: {
    eyebrow: 'When things feel blurred',
    title: 'Hexastra helps you see clearly again.',
    body:
      'You do not need the perfect question. Start with what you are living through. The clarity comes next.',
    cta: 'Start now',
  },
  footer: {
    tagline: 'Clarity changes everything.',
    support: 'Support',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
  },
}

const PROBLEM_ICONS: LucideIcon[] = [Brain, Sparkles, Compass, ShieldCheck]
const BENEFIT_ICONS: LucideIcon[] = [Target, Brain, Sparkles, Compass, BadgeCheck]

const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071018]'

const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/88 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071018]'

export default function HomePage() {
  const supabase = createClient()
  const { lang, setLang } = useTranslation()
  const [hasUser, setHasUser] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const copy = lang === 'en' ? EN_COPY : FR_COPY
  const accountHref = hasUser ? '/chat' : '/auth'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasUser(Boolean(data.user))
    })
  }, [supabase])

  function handleChatCtaClick(location: string, plan?: PlanKey) {
    if (plan) {
      trackHexastraFunnel('chat_upgrade_clicked', { location, targetPlan: plan })
      return
    }

    trackHexastraFunnel('landing_chat_cta_clicked', { location })
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenuOpen(false)
  }

  const problemCards = copy.problem.items.map((item, index) => ({
    ...item,
    icon: PROBLEM_ICONS[index],
  }))

  const benefitCards = copy.benefits.items.map((item, index) => ({
    ...item,
    icon: BENEFIT_ICONS[index],
  }))

  return (
    <main className="min-h-screen bg-[#061017] text-[#f7f1e8]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,226,194,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(103,124,255,0.14),_transparent_28%),linear-gradient(180deg,_#061017_0%,_#08131d_55%,_#071018_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl" />

        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur">
              <Image
                src="/logo/hexastra_logo_white_petals_triangles.svg"
                alt="Hexastra Coach"
                width={28}
                height={28}
                priority
                unoptimized
              />
            </div>
            <div>
              <div className="font-sora text-sm font-semibold tracking-[0.18em] text-white/92 uppercase">
                Hexastra Coach
              </div>
              <div className="text-sm text-white/55">{copy.footer.tagline}</div>
            </div>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="text-sm text-white/66 transition hover:text-white">
              {copy.header.how}
            </button>
            <button type="button" onClick={() => scrollToSection('difference')} className="text-sm text-white/66 transition hover:text-white">
              {copy.header.difference}
            </button>
            <button type="button" onClick={() => scrollToSection('plans')} className="text-sm text-white/66 transition hover:text-white">
              {copy.header.plans}
            </button>
            <div className="flex items-center rounded-full border border-white/12 bg-white/[0.04] p-1">
              {(['fr', 'en'] as const).map((code) => {
                const active = lang === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      active ? 'bg-white text-slate-950' : 'text-white/55 hover:text-white'
                    }`}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
            <Link href={accountHref} className="text-sm font-medium text-white/80 transition hover:text-white">
              {hasUser ? copy.header.account : copy.header.signIn}
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/80 backdrop-blur lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileMenuOpen ? (
          <div className="relative z-20 mx-6 rounded-3xl border border-white/12 bg-[#0a1620]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur lg:hidden">
            <div className="flex flex-col gap-3 text-sm text-white/82">
              <button type="button" onClick={() => scrollToSection('how-it-works')} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                {copy.header.how}
              </button>
              <button type="button" onClick={() => scrollToSection('difference')} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                {copy.header.difference}
              </button>
              <button type="button" onClick={() => scrollToSection('plans')} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                {copy.header.plans}
              </button>
              <Link href={accountHref} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                {hasUser ? copy.header.account : copy.header.signIn}
              </Link>
              <div className="mt-2 flex items-center rounded-full border border-white/12 bg-white/[0.04] p-1">
                {(['fr', 'en'] as const).map((code) => {
                  const active = lang === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(code)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                        active ? 'bg-white text-slate-950' : 'text-white/55 hover:text-white'
                      }`}
                    >
                      {code}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 sm:pb-28 lg:px-8 lg:pb-32 lg:pt-16">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,440px)] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
                <Compass className="h-3.5 w-3.5" />
                {copy.hero.eyebrow}
              </div>

              <h1 className="mt-6 max-w-4xl font-sora text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
                {copy.hero.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                {copy.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={CTA_HREF}
                  className={buttonPrimary}
                  onClick={() => handleChatCtaClick('hero_primary')}
                >
                  {copy.hero.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className={buttonSecondary}
                >
                  {copy.hero.secondary}
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 text-sm text-white/62">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                <p>{copy.hero.trust}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-emerald-300/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/85">
                      {copy.hero.previewEyebrow}
                    </div>
                    <h2 className="mt-3 font-sora text-2xl font-semibold tracking-[-0.04em] text-white">
                      {copy.hero.previewTitle}
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Hexastra
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {copy.hero.previewItems.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0d1822]/80 px-4 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/12 text-sm font-semibold text-emerald-100">
                        0{index + 1}
                      </div>
                      <p className="text-sm leading-7 text-white/76">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/60">
                  {copy.hero.previewNote}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-white/6 bg-[#08121a]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.problem.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.problem.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              {copy.problem.subtitle}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-emerald-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-sora text-xl font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/64">{item.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f1e8] text-[#12202a]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              {copy.solution.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {copy.solution.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              {copy.solution.body}
            </p>

            <div className="mt-8 space-y-4">
              {copy.solution.bullets.map((item) => (
                <div key={item} className="flex items-start gap-3 text-slate-700">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#0f766e]">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-7 sm:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/8 bg-white p-6 shadow-[0_24px_80px_rgba(10,18,28,0.08)] sm:p-7">
            <div className="rounded-[1.5rem] bg-[#09121b] p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/80">
                    Hexastra
                  </p>
                  <p className="text-sm text-white/58">
                    {lang === 'en' ? 'A direct reading for the moment you are in.' : 'Une lecture directe du moment que vous traversez.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/[0.05] px-4 py-4 text-sm leading-7 text-white/72">
                  {lang === 'en'
                    ? 'You share what feels unclear.'
                    : 'Vous partagez ce qui vous semble flou.'}
                </div>
                <div className="rounded-2xl bg-emerald-300/10 px-4 py-4 text-sm leading-7 text-emerald-50">
                  {lang === 'en'
                    ? 'Hexastra helps you see the real tension, the key lever, and the next move that feels right.'
                    : 'Hexastra vous aide à voir la tension réelle, le levier important, et la prochaine action juste.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#08121a]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.steps.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.steps.title}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {copy.steps.items.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
                  {item.step}
                </div>
                <h3 className="mt-4 font-sora text-2xl font-semibold tracking-[-0.04em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/64">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/6 bg-[#09141d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.benefits.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.benefits.title}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {benefitCards.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-sora text-lg font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-white/64">{item.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="difference" className="scroll-mt-24 bg-[#f5efe6] text-[#12202a]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              {copy.differentiation.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {copy.differentiation.title}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl font-sora text-2xl font-semibold tracking-[-0.04em] text-[#0b4d47] sm:text-3xl">
              {copy.differentiation.quote}
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {copy.differentiation.cards.map((item) => (
              <article
                key={item.before}
                className="rounded-[1.75rem] border border-slate-900/8 bg-white p-6 shadow-[0_18px_60px_rgba(10,18,28,0.06)]"
              >
                <div className="text-sm font-medium text-slate-500">{item.before}</div>
                <div className="my-5 h-px bg-slate-200" />
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-[#0f766e]">
                    <MoveRight className="h-4 w-4" />
                  </div>
                  <p className="font-sora text-xl font-semibold tracking-[-0.03em] text-slate-900">
                    {item.after}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#08121a]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.testimonials.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.testimonials.title}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {copy.testimonials.items.map((item) => (
              <article
                key={item.author}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/56">
                  {item.context}
                </div>
                <p className="mt-5 text-base leading-8 text-white/74">“{item.quote}”</p>
                <div className="mt-6 text-sm font-semibold text-white">{item.author}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="scroll-mt-24 border-t border-white/6 bg-[#09141d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
                {copy.plans.eyebrow}
              </p>
              <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {copy.plans.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                {copy.plans.subtitle}
              </p>
            </div>
            <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-50">
              {copy.plans.note}
            </div>
          </div>

          <div className="mt-12 grid gap-4 xl:grid-cols-4">
            {copy.plans.items.map((plan) => (
              <article
                key={plan.key}
                className={`relative flex h-full flex-col rounded-[1.9rem] border p-6 ${
                  plan.highlighted
                    ? 'border-emerald-300/30 bg-[linear-gradient(180deg,rgba(110,231,213,0.16),rgba(255,255,255,0.06))] shadow-[0_25px_80px_rgba(16,185,129,0.20)]'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                {plan.badge ? (
                  <div className="absolute right-5 top-5 rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
                    {plan.badge}
                  </div>
                ) : null}

                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/56">
                  {plan.title}
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-sora text-4xl font-semibold tracking-[-0.04em] text-white">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-white/58">{plan.cadence}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/66">{plan.description}</p>

                <div className="mt-6 space-y-3">
                  {plan.bullets.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-white/72">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-emerald-100">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </div>
                      <span className="leading-6">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    href={CTA_HREF}
                    className={plan.highlighted ? buttonPrimary : buttonSecondary}
                    onClick={() => handleChatCtaClick('plans', plan.key)}
                  >
                    {copy.plans.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/6 bg-[#061017]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <div className="rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 py-12 shadow-[0_25px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.finalCta.eyebrow}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              {copy.finalCta.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              {copy.finalCta.body}
            </p>
            <div className="mt-8">
              <Link
                href={CTA_HREF}
                className={buttonPrimary}
                onClick={() => handleChatCtaClick('final_cta')}
              >
                {copy.finalCta.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/6 bg-[#050d14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-white/54 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="font-sora text-base font-semibold text-white">Hexastra Coach</div>
            <div className="mt-1">{copy.footer.tagline}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/support" className="transition hover:text-white">
              {copy.footer.support}
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              {copy.footer.contact}
            </Link>
            <Link href="/politique-confidentialite" className="transition hover:text-white">
              {copy.footer.privacy}
            </Link>
            <Link href="/conditions-utilisation" className="transition hover:text-white">
              {copy.footer.terms}
            </Link>
            <Link
              href={CTA_HREF}
              className="inline-flex items-center gap-2 font-medium text-white transition hover:text-emerald-100"
              onClick={() => handleChatCtaClick('footer')}
            >
              {copy.plans.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

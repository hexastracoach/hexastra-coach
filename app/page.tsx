'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getPlanCheckoutHref } from '@/lib/plans'
import type { PlanKey } from '@/types/subscription'

type InfoCard = {
  title: string
  body: string
}

type StepCard = {
  step: string
  title: string
  body: string
}

type UseCaseCard = {
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
  cta: string
  badge?: string
  highlighted?: boolean
}

type CopyBundle = {
  header: {
    how: string
    plans: string
    chat: string
  }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primary: string
    secondary: string
    trust: string
    panelEyebrow: string
    panelTitle: string
    panelRows: string[]
    panelNote: string
  }
  problem: {
    eyebrow: string
    title: string
    subtitle: string
    items: InfoCard[]
  }
  useCases: {
    title: string
    subtitle: string
    cta: string
    items: UseCaseCard[]
  }
  solution: {
    eyebrow: string
    title: string
    body: string
    bullets: string[]
    steps: StepCard[]
  }
  systems: {
    title: string
    body: string
    support: string
    list: string
  }
  benefits: {
    eyebrow: string
    title: string
    items: InfoCard[]
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
    disclaimer: string
  }
}

const CTA_HREF = '/chat'

function getLandingPlanHref(plan: PlanKey) {
  return plan === 'free' ? CTA_HREF : getPlanCheckoutHref(plan)
}

const FR_COPY: CopyBundle = {
  header: {
    how: 'Comment ça marche',
    plans: 'Premium',
    chat: 'Clarifier ma situation',
  },
  hero: {
    eyebrow: 'Coach IA pour les moments où tout devient flou',
    title: 'Quand vous ne voyez plus clair, Hexastra devient votre GPS intérieur.',
    subtitle:
      'Décrivez simplement votre situation. Hexastra vous aide à comprendre ce qui se joue, à retrouver de la clarté et à avancer avec une direction plus juste.',
    primary: 'Clarifier ma situation',
    secondary: 'Voir comment ça marche',
    trust: 'Simple, direct, sans jargon. Une guidance personnalisée en quelques minutes.',
    panelEyebrow: 'Ce que vous obtenez',
    panelTitle: 'Une lecture claire, utile et directement compréhensible.',
    panelRows: [
      'Ce qui se joue vraiment derrière votre situation',
      'Ce qui mérite votre attention maintenant',
      'Une direction concrète pour avancer',
    ],
    panelNote: 'Pas de jargon. Pas de méthode à décoder. Une lecture claire, utile et directement compréhensible.',
  },
  problem: {
    eyebrow: 'Le vrai problème',
    title: "Vous n'avez pas besoin de plus d'informations. Vous avez besoin de clarté.",
    subtitle:
      "Quand une situation compte vraiment, on mélange facilement peur, intuition, fatigue et attachement. Alors on suranalyse, on attend, et rien ne bouge.",
    items: [
      {
        title: 'Vous pensez trop',
        body: "Chaque option semble juste puis mauvaise l'instant d'après.",
      },
      {
        title: "Vous sentez qu'il se passe quelque chose",
        body: "Mais impossible de l'expliquer clairement ou de savoir quoi en faire.",
      },
      {
        title: 'Vous voulez une direction',
        body: "Pas une autre couche de théorie ou d'information de plus.",
      },
    ],
  },
  useCases: {
    title: 'Dans quelles situations Hexastra peut vous aider ?',
    subtitle:
      "Vous n'avez pas besoin de formuler une question parfaite. Commencez par ce que vous vivez.",
    cta: 'Poser ma question',
    items: [
      {
        title: 'Relation',
        body: 'Pourquoi cette relation me fatigue autant ?',
      },
      {
        title: 'Travail',
        body: 'Est-ce encore la bonne direction pour moi ?',
      },
      {
        title: 'Décision importante',
        body: 'Quel choix semble le plus juste maintenant ?',
      },
      {
        title: 'Blocage intérieur',
        body: 'Pourquoi je tourne en rond malgré mes efforts ?',
      },
      {
        title: 'Période de transition',
        body: 'Comment avancer quand tout bouge autour de moi ?',
      },
    ],
  },
  solution: {
    eyebrow: 'La réponse',
    title: 'Hexastra lit la situation, pas seulement la question.',
    body:
      'Vous racontez ce qui se passe. Hexastra clarifie la tension centrale, repère ce qui compte vraiment et vous aide à repartir avec une direction plus nette.',
    bullets: [
      'Comprendre ce qui se joue vraiment',
      'Retrouver de la perspective rapidement',
      'Avancer avec une prochaine action claire',
    ],
    steps: [
      {
        step: '01',
        title: 'Vous parlez de votre situation',
        body: 'Un doute, une relation, une décision, un moment où vous ne voyez plus clair.',
      },
      {
        step: '02',
        title: 'Hexastra clarifie',
        body: 'La lecture fait ressortir le point central et ce qui mérite vraiment votre attention.',
      },
      {
        step: '03',
        title: 'Vous repartez avec un cap',
        body: 'Une lecture nette. Une direction crédible. Plus de calme pour décider.',
      },
    ],
  },
  systems: {
    title: 'Une intelligence nourrie par plusieurs approches',
    body:
      "Hexastra s'appuie sur plusieurs systèmes d'analyse humaine pour offrir une guidance plus nuancée et personnalisée. Vous n'avez rien à apprendre ni à décoder : la lecture est déjà clarifiée pour vous.",
    support:
      'Un coach spirituel moderne pour le développement personnel, la compréhension de soi, la lecture énergétique et la clarification émotionnelle.',
    list: 'Astrologie • Human Design • Numérologie • Ennéagramme • Hexagrammes • Kua',
  },
  benefits: {
    eyebrow: 'Ce que cela change',
    title: 'Vous décidez plus calmement.',
    items: [
      {
        title: 'Décisions plus nettes',
        body: "Vous avancez avec plus de discernement et moins d'hésitation.",
      },
      {
        title: 'Moins de charge mentale',
        body: "Vous quittez le bruit intérieur pour revenir à l'essentiel.",
      },
      {
        title: 'Mieux comprendre ce que vous ressentez',
        body: 'Vous nommez enfin ce qui bloque et ce qui appelle une vraie décision.',
      },
      {
        title: 'Une direction utilisable',
        body: 'Pas un conseil vague. Une prochaine étape qui a du sens.',
      },
    ],
  },
  differentiation: {
    eyebrow: 'Pourquoi cela fonctionne',
    title: 'Pas de méthode à choisir. Pas de système à décoder.',
    quote: "Vous n'avez pas besoin de comprendre le système. Seulement votre situation.",
    cards: [
      {
        before: "Plus d'informations à trier",
        after: 'Plus de clarté',
      },
      {
        before: 'Des résultats à interpréter',
        after: 'Une direction immédiate',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Exemples de questions',
    title: 'Commencez par ce qui vous traverse vraiment.',
    items: [
      {
        quote:
          "Pourquoi je me sens bloqué alors que je fais des efforts ?",
        author: 'Blocage intérieur',
        context: 'Clarification émotionnelle',
      },
      {
        quote:
          "Comment savoir si je dois continuer dans cette direction ?",
        author: 'Décision importante',
        context: 'Clarté intérieure',
      },
      {
        quote:
          "Qu'est-ce que cette relation réveille vraiment chez moi ?",
        author: 'Relation',
        context: 'Compréhension de soi',
      },
    ],
  },
  plans: {
    eyebrow: 'Accès',
    title: 'Choisissez la profondeur qui vous convient.',
    subtitle:
      "La même expérience Hexastra. Plus ou moins de profondeur selon l'importance du moment.",
    note: "Premium est le meilleur point d'équilibre pour les décisions importantes.",
    items: [
      {
        key: 'free',
        title: 'Gratuit',
        price: '0 EUR',
        cadence: '/ accès découverte',
        description: 'Découvrez si Hexastra peut réellement vous aider.',
        bullets: ['Accès limité chaque jour', 'Parfait pour essayer', 'Commencez immédiatement'],
        cta: 'Essayer gratuitement',
      },
      {
        key: 'essential',
        title: 'Essentiel',
        price: '9,90 EUR',
        cadence: '/ mois',
        description: 'Pour poser vos questions du quotidien et obtenir une clarté rapide.',
        bullets: ['Usage illimité', 'Guidance directe', 'Pensé pour le quotidien'],
        cta: 'Choisir Essentiel',
      },
      {
        key: 'premium',
        title: 'Premium',
        price: '19,90 EUR',
        cadence: '/ mois',
        description: 'Idéal quand une décision compte vraiment.',
        bullets: ['Analyse plus profonde', 'Plus de nuance', 'Le meilleur choix pour une décision importante'],
        cta: 'Choisir Premium',
        badge: 'Recommandé',
        highlighted: true,
      },
      {
        key: 'practitioner',
        title: 'Praticien',
        price: '29,90 EUR',
        cadence: '/ mois',
        description: 'Pour un usage avancé, plus profond et plus structuré.',
        bullets: ['Usage avancé', 'Cadre plus expert', 'Positionnement premium'],
        cta: 'Choisir Praticien',
      },
    ],
  },
  finalCta: {
    eyebrow: "Quand vous n'y voyez plus clair",
    title: 'Commencez par votre situation.',
    body:
      'Pas besoin de la question parfaite. Dites simplement ce qui se passe. Hexastra vous aide à voir juste.',
    cta: 'Recevoir ma guidance',
  },
  footer: {
    tagline:
      'Hexastra Coach vous aide à mieux comprendre votre situation grâce à une guidance personnalisée, claire et actionnable.',
    support: 'Support',
    contact: 'Contact',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    disclaimer:
      'Hexastra est un outil d’éclairage personnel. Il ne remplace pas un médecin, un psychologue, un avocat ou un conseiller financier.',
  },
}

const EN_COPY: CopyBundle = {
  header: {
    how: 'How it works',
    plans: 'Premium',
    chat: 'Clarify my situation',
  },
  hero: {
    eyebrow: 'An AI coach for the moments that feel unclear',
    title: 'When you no longer see clearly, Hexastra becomes your inner GPS.',
    subtitle:
      'Simply describe your situation. Hexastra helps you understand what is happening, recover clarity, and move forward with a more accurate direction.',
    primary: 'Clarify my situation',
    secondary: 'See how it works',
    trust: 'Simple, direct, no jargon. Personalized guidance in just a few minutes.',
    panelEyebrow: 'What you get',
    panelTitle: 'A clear, useful reading you can understand immediately.',
    panelRows: [
      'What is really happening behind your situation',
      'What deserves your attention right now',
      'One concrete direction to move forward',
    ],
    panelNote: 'No jargon. No method to decode. A clear, useful and immediately understandable reading.',
  },
  problem: {
    eyebrow: 'The real problem',
    title: 'You do not need more information. You need clarity.',
    subtitle:
      'When a situation truly matters, fear, intuition, fatigue, and attachment start blending together. So you overthink, delay, and stay stuck.',
    items: [
      {
        title: 'You think too much',
        body: 'Every option feels right, then wrong, a moment later.',
      },
      {
        title: 'You feel that something is going on',
        body: 'But you cannot explain it clearly or know what to do with it.',
      },
      {
        title: 'You want direction',
        body: 'Not another layer of theory, noise, or interpretation.',
      },
    ],
  },
  useCases: {
    title: 'When can Hexastra help?',
    subtitle: 'You do not need the perfect question. Start with what you are experiencing.',
    cta: 'Ask my question',
    items: [
      {
        title: 'Relationship',
        body: 'Why does this relationship feel so draining?',
      },
      {
        title: 'Work',
        body: 'Is this still the right direction for me?',
      },
      {
        title: 'Important decision',
        body: 'Which choice feels most aligned right now?',
      },
      {
        title: 'Inner blockage',
        body: 'Why do I keep going in circles despite my efforts?',
      },
      {
        title: 'Transition period',
        body: 'How do I move forward when everything is shifting around me?',
      },
    ],
  },
  solution: {
    eyebrow: 'The response',
    title: 'Hexastra reads the situation, not just the question.',
    body:
      'You describe what is happening. Hexastra clarifies the central tension, identifies what really matters, and helps you leave with a clearer direction.',
    bullets: [
      'Understand what is really happening',
      'Recover perspective quickly',
      'Move forward with one clear next step',
    ],
    steps: [
      {
        step: '01',
        title: 'You share your situation',
        body: 'A doubt, a relationship, a decision, or a moment when you no longer see clearly.',
      },
      {
        step: '02',
        title: 'Hexastra clarifies',
        body: 'The system surfaces the core issue and what truly deserves your attention.',
      },
      {
        step: '03',
        title: 'You leave with direction',
        body: 'A sharper read. A credible direction. More calm when it is time to decide.',
      },
    ],
  },
  systems: {
    title: 'An intelligence shaped by multiple approaches',
    body:
      'Hexastra draws on several human analysis systems to offer more nuanced and personalized guidance. You do not need to learn or decode anything: the reading is already clarified for you.',
    support:
      'A modern spiritual coach for personal growth, self-understanding, energetic reading and emotional clarification.',
    list: 'Astrology • Human Design • Numerology • Enneagram • Hexagrams • Kua',
  },
  benefits: {
    eyebrow: 'What changes',
    title: 'You decide with more calm.',
    items: [
      {
        title: 'Clearer decisions',
        body: 'You move with more discernment and less hesitation.',
      },
      {
        title: 'Less mental load',
        body: 'You leave the inner noise and come back to what matters.',
      },
      {
        title: 'Better emotional understanding',
        body: 'You finally name what is blocking you and what calls for a real decision.',
      },
      {
        title: 'A usable direction',
        body: 'Not vague advice. A next step that actually makes sense.',
      },
    ],
  },
  differentiation: {
    eyebrow: 'Why it works',
    title: 'No method to choose. No system to decode.',
    quote: "You don't need to understand the system. Only your situation.",
    cards: [
      {
        before: 'More information to sort through',
        after: 'More clarity',
      },
      {
        before: 'Results to interpret',
        after: 'Immediate direction',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Question examples',
    title: 'Start with what you are actually carrying.',
    items: [
      {
        quote:
          'Why do I feel blocked even though I am making efforts?',
        author: 'Inner blockage',
        context: 'Emotional clarification',
      },
      {
        quote:
          'How do I know whether I should continue in this direction?',
        author: 'Important decision',
        context: 'Inner clarity',
      },
      {
        quote:
          'What is this relationship really awakening in me?',
        author: 'Relationship',
        context: 'Self-understanding',
      },
    ],
  },
  plans: {
    eyebrow: 'Access',
    title: 'Choose the depth that fits the moment.',
    subtitle:
      'The same Hexastra experience. More or less depth depending on how important the moment is.',
    note: 'Premium is the best balance when the decision really matters.',
    items: [
      {
        key: 'free',
        title: 'Free',
        price: 'EUR 0',
        cadence: '/ discovery access',
        description: 'Discover whether Hexastra can truly help you.',
        bullets: ['Limited daily access', 'Perfect to try', 'Start immediately'],
        cta: 'Try for free',
      },
      {
        key: 'essential',
        title: 'Essential',
        price: 'EUR 9.90',
        cadence: '/ month',
        description: 'Ask your daily questions and get quick clarity.',
        bullets: ['Unlimited use', 'Direct guidance', 'Built for everyday clarity'],
        cta: 'Choose Essential',
      },
      {
        key: 'premium',
        title: 'Premium',
        price: 'EUR 19.90',
        cadence: '/ month',
        description: 'Ideal when a decision truly matters.',
        bullets: ['Deeper analysis', 'More nuance', 'The best choice for an important decision'],
        cta: 'Choose Premium',
        badge: 'Recommended',
        highlighted: true,
      },
      {
        key: 'practitioner',
        title: 'Practitioner',
        price: 'EUR 29.90',
        cadence: '/ month',
        description: 'For advanced, deeper and more structured usage.',
        bullets: ['Advanced usage', 'More expert frame', 'Premium positioning'],
        cta: 'Choose Practitioner',
      },
    ],
  },
  finalCta: {
    eyebrow: "When you can't see clearly anymore",
    title: 'Start with your situation.',
    body:
      'You do not need the perfect question. Just say what is happening. Hexastra helps you see what is true.',
    cta: 'Receive my guidance',
  },
  footer: {
    tagline:
      'Hexastra Coach helps you better understand your situation through clear, personalized and actionable guidance.',
    support: 'Support',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    disclaimer:
      'Hexastra is a personal insight tool. It does not replace a doctor, psychologist, lawyer or financial advisor.',
  },
}

const problemIcons: LucideIcon[] = [Sparkles, Compass, ShieldCheck]
const benefitIcons: LucideIcon[] = [Target, Sparkles, MessageSquare, BadgeCheck]

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#C8A977] px-6 py-3 text-sm font-semibold text-[#2E2A26] shadow-[0_16px_36px_rgba(200,169,119,0.22)] transition hover:-translate-y-0.5 hover:bg-[#E9D7BE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F1]'

const softButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#C8A977]/25 bg-white/70 px-5 py-3 text-sm font-medium text-[#2E2A26]/80 shadow-[0_12px_28px_rgba(46,42,38,0.06)] transition hover:border-[#C8A977]/45 hover:bg-[#E9D7BE]/45 hover:text-[#2E2A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F1]'

export default function HomePage() {
  const { lang, setLang } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const copy = lang === 'en' ? EN_COPY : FR_COPY
  const heroDisplay = copy.hero
  const problemCards = copy.problem.items.map((item, index) => ({
    ...item,
    icon: problemIcons[index],
  }))
  const benefitCards = copy.benefits.items.map((item, index) => ({
    ...item,
    icon: benefitIcons[index],
  }))

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

  return (
    <main className="hx-home-warm min-h-screen bg-[#F8F6F1] text-[#2E2A26]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(233,215,190,0.58),_transparent_30%),radial-gradient(circle_at_85%_12%,_rgba(154,184,200,0.22),_transparent_32%),linear-gradient(180deg,_#F8F6F1_0%,_#EFE9DF_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/8 blur-3xl" />

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur">
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
              <div className="font-sora text-sm font-semibold uppercase tracking-[0.18em] text-white/92">
                Hexastra Coach
              </div>
              <div className="text-sm text-white/52">{copy.footer.tagline}</div>
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="text-sm text-white/60 transition hover:text-white">
              {copy.header.how}
            </button>
            <button type="button" onClick={() => scrollToSection('plans')} className="text-sm text-white/60 transition hover:text-white">
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
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                      active ? 'bg-[#C8A977] text-[#2E2A26]' : 'text-[#6F675F]/70 hover:text-[#2E2A26]'
                    }`}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
            <Link
              href={CTA_HREF}
              className={softButtonClass}
              onClick={() => handleChatCtaClick('header')}
            >
              {copy.header.chat}
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/80 backdrop-blur lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileMenuOpen ? (
          <div className="relative z-20 mx-6 rounded-3xl border border-white/12 bg-[#0b1620]/96 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur lg:hidden">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80"
              >
                {copy.header.how}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('plans')}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80"
              >
                {copy.header.plans}
              </button>
              <Link
                href={CTA_HREF}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90"
                onClick={() => handleChatCtaClick('mobile_menu')}
              >
                {copy.header.chat}
              </Link>
              <div className="mt-2 flex items-center rounded-full border border-white/12 bg-white/[0.04] p-1">
                {(['fr', 'en'] as const).map((code) => {
                  const active = lang === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(code)}
                      className={`flex-1 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                        active ? 'bg-[#C8A977] text-[#2E2A26]' : 'text-[#6F675F]/70 hover:text-[#2E2A26]'
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

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pb-28 lg:px-8 lg:pb-32 lg:pt-16">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,400px)] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
                <Compass className="h-3.5 w-3.5" />
                {heroDisplay.eyebrow}
              </div>

              <h1 className="mt-6 max-w-4xl font-sora text-4xl font-semibold leading-[0.97] tracking-[-0.05em] text-white sm:text-5xl lg:text-[4.5rem]">
                {heroDisplay.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
                {heroDisplay.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={CTA_HREF}
                  className={primaryButtonClass}
                  onClick={() => handleChatCtaClick('hero_primary')}
                >
                  {heroDisplay.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center gap-2 px-1 py-3 text-sm font-medium text-white/58 transition hover:text-white"
                >
                  {heroDisplay.secondary}
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 text-sm text-white/56">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                <p>{heroDisplay.trust}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-emerald-300/10 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/82">
                  {heroDisplay.panelEyebrow}
                </div>
                <h2 className="mt-3 max-w-xs font-sora text-2xl font-semibold tracking-[-0.04em] text-white">
                  {heroDisplay.panelTitle}
                </h2>

                <div className="mt-8 space-y-3">
                  {heroDisplay.panelRows.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0c1720]/82 px-4 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/12 text-sm font-semibold text-emerald-100">
                        0{index + 1}
                      </div>
                      <p className="text-sm leading-7 text-white/74">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/58">
                  {heroDisplay.panelNote}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.problem.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.problem.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
              {copy.problem.subtitle}
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {problemCards.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-emerald-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-sora text-xl font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">{item.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.useCases.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
              {copy.useCases.subtitle}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {copy.useCases.items.map((item) => (
              <Link
                key={item.title}
                href={CTA_HREF}
                onClick={() => handleChatCtaClick(`use_case_${item.title}`)}
                className="group flex min-h-[180px] flex-col justify-between rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#C8A977]/40 hover:shadow-[0_22px_58px_rgba(46,42,38,0.12)]"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/78">
                    {item.title}
                  </div>
                  <p className="mt-5 text-base font-semibold leading-7 text-white sm:text-lg">
                    {item.body}
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100 transition group-hover:translate-x-1">
                  {copy.useCases.cta}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={CTA_HREF}
              className={primaryButtonClass}
              onClick={() => handleChatCtaClick('use_cases')}
            >
              {copy.useCases.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#f6efe5] text-[#12202a]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              {copy.solution.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {copy.solution.title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
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

          <div className="grid gap-4">
            {copy.solution.steps.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.7rem] border border-slate-900/8 bg-white p-6 shadow-[0_18px_60px_rgba(10,18,28,0.06)]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                  {item.step}
                </div>
                <h3 className="mt-4 font-sora text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-[600px] px-6 py-24 text-center lg:px-8 lg:py-28">
          <h2 className="font-sora text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {copy.systems.title}
          </h2>
          <p className="mt-6 text-base leading-8 text-white/68 sm:text-lg">
            {copy.systems.body}
          </p>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-white/62 sm:text-lg">
            {copy.systems.support}
          </p>
          <p className="mt-8 text-sm tracking-[0.08em] text-white/65 sm:text-[0.95rem]">
            {copy.systems.list}
          </p>
        </div>
      </section>

      <section className="border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.benefits.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {copy.benefits.title}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefitCards.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-sora text-lg font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-white/62">{item.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5efe6] text-[#12202a]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              {copy.differentiation.eyebrow}
            </p>
            <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {copy.differentiation.title}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl font-sora text-2xl font-semibold tracking-[-0.04em] text-[#0b4d47] sm:text-3xl">
              {copy.differentiation.quote}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {copy.differentiation.cards.map((item) => (
              <article
                key={item.before}
                className="rounded-[1.7rem] border border-slate-900/8 bg-white p-6 shadow-[0_18px_60px_rgba(10,18,28,0.06)]"
              >
                <div className="text-sm text-slate-500">{item.before}</div>
                <div className="my-5 h-px bg-slate-200" />
                <div className="font-sora text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                  {item.after}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8F6F1]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
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
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/54">
                  {item.context}
                </div>
                <p className="mt-5 text-base leading-8 text-white/72">"{item.quote}"</p>
                <div className="mt-6 text-sm font-semibold text-white">{item.author}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="scroll-mt-24 border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
                {copy.plans.eyebrow}
              </p>
              <h2 className="mt-4 font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {copy.plans.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
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
                className={`relative flex h-full flex-col rounded-[1.85rem] border p-6 ${
                  plan.highlighted
                    ? 'border-emerald-300/28 bg-[linear-gradient(180deg,rgba(110,231,213,0.14),rgba(255,255,255,0.05))] shadow-[0_24px_80px_rgba(16,185,129,0.18)]'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                {plan.badge ? (
                  <div className="absolute right-5 top-5 rounded-full bg-emerald-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950">
                    {plan.badge}
                  </div>
                ) : null}

                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/52">
                  {plan.title}
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-sora text-4xl font-semibold tracking-[-0.04em] text-white">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-white/56">{plan.cadence}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/64">{plan.description}</p>

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
                    href={getLandingPlanHref(plan.key)}
                    className={plan.highlighted ? primaryButtonClass : softButtonClass}
                    onClick={() => handleChatCtaClick('plans', plan.key)}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#C8A977]/20 bg-[#F8F6F1]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <div className="rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 py-12 shadow-[0_25px_100px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/78">
              {copy.finalCta.eyebrow}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-sora text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              {copy.finalCta.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
              {copy.finalCta.body}
            </p>
            <div className="mt-8">
              <Link
                href={CTA_HREF}
                className={primaryButtonClass}
                onClick={() => handleChatCtaClick('final_cta')}
              >
                {copy.finalCta.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#C8A977]/20 bg-[#EFE9DF]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-white/54 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-xl">
            <div className="font-sora text-base font-semibold text-white">Hexastra Coach</div>
            <div className="mt-1">{copy.footer.tagline}</div>
            <div className="mt-3 text-xs leading-6 text-white/44">{copy.footer.disclaimer}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end">
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
              {copy.header.chat}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

import Link from 'next/link'
import HexastraLogo from '@/app/components/HexastraLogo'

export default function NotFound() {
  return (
    <div className="hx-error-page">
      <div className="hx-error-bg" />

      <div className="hx-error-card">
        <Link href="/" className="hx-error-logo" aria-label="HexAstra Coach">
          <HexastraLogo size={32} variant="navbar" />
        </Link>

        <div className="hx-error-code">404</div>
        <h1 className="hx-error-title">On ne trouve pas cette page.</h1>
        <p className="hx-error-lead">
          L&apos;adresse a peut-être changé. Reviens à l&apos;accueil — tout est là.
        </p>

        <div className="hx-error-actions">
          <Link href="/" className="hx-error-btn-primary">
            Revenir à l&apos;accueil
          </Link>
          <Link href="/chat" className="hx-error-btn-secondary">
            Ouvrir HexAstra
          </Link>
        </div>
      </div>
    </div>
  )
}

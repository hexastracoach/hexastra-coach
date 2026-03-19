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
        <h1 className="hx-error-title">Page introuvable</h1>
        <p className="hx-error-lead">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <div className="hx-error-actions">
          <Link href="/" className="hx-error-btn-primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/chat" className="hx-error-btn-secondary">
            Ouvrir le coach
          </Link>
        </div>
      </div>
    </div>
  )
}

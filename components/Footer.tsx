import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="ox-footer">
      <div className="ox-footer-top">
        <img src="/oxmad-wordmark.svg" alt="Oxmad Digital" className="ox-footer-logo ox-logo-light" />
        <img src="/oxmad-wordmark-dark.svg" alt="Oxmad Digital" className="ox-footer-logo ox-logo-dark" />

        <div className="ox-footer-bottom">
          <span>© 2026 Oxmad Digital. Tous droits réservés.</span>
          <Link href="/mentions-legales">Mentions légales</Link>
        </div>

        <div className="ox-footer-socials">
          <a href="#" aria-label="LinkedIn">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a href="#" aria-label="Facebook">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/footer.png" alt="" className="footer-bg-image" aria-hidden="true" />
        
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo-name">THADEUS</div>
            <p>Libérez votre croissance,<br />nous sécurisons vos formalités.</p>
            <div className="footer-socials">
              <a href="https://www.instagram.com/thadeus.externalia.juris?igsh=MXExdzZ4OXJ6bTNjMw==" aria-label="Instagram">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61586899691901" aria-label="Facebook">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation + Contact groupés */}
          <div className="footer-right-group">
            {/* Navigation */}
            <div className="footer-nav">
              <h4>Navigation</h4>
              <Link href="/">Accueil</Link>
              <Link href="#services">Nos services</Link>
              <Link href="/contact">Contacts</Link>
              <Link href="/mentions-legales">Mentions légales</Link>
            </div>

            {/* Contact */}
            <div className="footer-contact">
              <h4>Informations de contacts</h4>
              <div className="footer-contact-item">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>thadeus@jurisexternalia.com</span>
              </div>
              <div className="footer-contact-item">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>+261 32 17 575 66</span>
              </div>
              <div className="footer-contact-item">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Logement 149, Cité Lovasoa Ambatara<br />Antananarivo 101, Madagascar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <a href="https://oxmad-digital.mg/" rel="nofollow" target="_blank">
            Réalisé par Oxmad Digital
          </a>
          <span>©2026 THADEUS. All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
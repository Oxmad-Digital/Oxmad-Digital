import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND_IMAGES } from "@/lib/media";
import { CONTACT_EMAIL, CONTACT_PHONE, LOGIN_URL, SOCIAL_LINKS } from "@/lib/site";

type FooterLink = { href: string; label: string };

const renderLink = ({ href, label }: FooterLink) => href.startsWith("#")
  ? <a key={href} href={href}>{label}</a>
  : <Link key={href} href={href}>{label}</Link>;

// lucide-react 1.x dropped brand icons: these are the former lucide glyphs (ISC), drawn like the header's account icon.
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  Instagram: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><path d="M17.5 6.5h.01" /></>,
  LinkedIn: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>,
};

/** Logo, a short note, the contact details and links; each page styles it through `className`. */
export default function SiteFooter({ className, note, links }: { className?: string; note: ReactNode; links: FooterLink[] }) {
  return (
    <footer className={className}>
      <img className="footer-logo" src={BRAND_IMAGES.logoDark} width={225} height={76} alt="Oxmad Digital" loading="lazy" />
      <p className="footer-note">{note}</p>
      {/* Visible name, address and phone: the local SEO signal, matched by the JSON-LD of the site layout. */}
      <address className="footer-note footer-contact">
        Ampefiloha, Antananarivo 101 · <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>{CONTACT_PHONE}</a> · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </address>
      <nav className="footer-right" aria-label="Pied de page">
        {/* Plain anchors for in-page targets, so the smooth scroll handles them. */}
        {links.map(renderLink)}
        <a href={LOGIN_URL}>Connexion</a>
        <span className="footer-social">
          {SOCIAL_LINKS.map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {SOCIAL_ICONS[label]}
              </svg>
            </a>
          ))}
        </span>
      </nav>
    </footer>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "./Language/LanguageContext";
import { useBookCall } from "./BookCall/BookCallContext";
import "./Navbar.css";

const NAV_LINKS = {
  fr: [
    { label: "Accueil", href: "/" },
    { label: "Services", href: "/#services" },
    { label: "Processus", href: "/#processus" },
    { label: "À propos", href: "/#apropos" },
    { label: "Réalisations", href: "/realisations" },
  ],
  en: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/#services" },
    { label: "Process", href: "/#processus" },
    { label: "About", href: "/#apropos" },
    { label: "Work", href: "/realisations" },
  ],
};

const COPY = {
  fr: { cta: "Réserver un appel", openMenu: "Ouvrir le menu" },
  en: { cta: "Book a call", openMenu: "Open menu" },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { lang, toggleLang } = useLanguage();
  const { open: openBookCall } = useBookCall();
  const links = NAV_LINKS[lang];
  const c = COPY[lang];

  return (
    <nav className="ox-nav">
      <Link href="/" className="ox-nav-brand" onClick={() => setOpen(false)}>
        <img src="/oxmad-wordmark.svg" alt="Oxmad Digital" className="ox-nav-logo ox-logo-light" />
        <img src="/oxmad-wordmark-dark.svg" alt="Oxmad Digital" className="ox-nav-logo ox-logo-dark" />
      </Link>

      <div className="ox-nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`ox-nav-link ${pathname === link.href ? "ox-nav-link-active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="ox-nav-actions">
        <button
          type="button"
          className="ox-nav-lang-toggle"
          onClick={toggleLang}
          aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
        >
          {lang === "fr" ? "EN" : "FR"}
        </button>
        <ThemeToggle />
        <button type="button" className="ox-nav-cta" onClick={openBookCall}>
          {c.cta}
          <span className="ox-nav-cta-arrow">
            <Calendar size={16} />
          </span>
        </button>
        <button
          className="ox-nav-hamburger"
          onClick={() => setOpen(!open)}
          aria-label={c.openMenu}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="ox-nav-mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <button type="button" className="ox-nav-lang-toggle-mobile" onClick={toggleLang}>
            {lang === "fr" ? "Switch to English" : "Passer en français"}
          </button>
          <button
            type="button"
            className="ox-nav-cta ox-nav-cta-mobile"
            onClick={() => {
              setOpen(false);
              openBookCall();
            }}
          >
            {c.cta}
            <span className="ox-nav-cta-arrow">
              <Calendar size={16} />
            </span>
          </button>
        </div>
      )}
    </nav>
  );
}

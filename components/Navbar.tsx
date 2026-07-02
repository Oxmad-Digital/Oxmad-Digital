"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Processus", href: "/#processus" },
  { label: "À propos", href: "/#apropos" },
  { label: "Réalisations", href: "/realisations" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="ox-nav">
      <Link href="/" className="ox-nav-brand" onClick={() => setOpen(false)}>
        <img src="/oxmad-wordmark.svg" alt="Oxmad Digital" className="ox-nav-logo ox-logo-light" />
        <img src="/oxmad-wordmark-dark.svg" alt="Oxmad Digital" className="ox-nav-logo ox-logo-dark" />
      </Link>

      <div className="ox-nav-links">
        {NAV_LINKS.map((link) => (
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
        <ThemeToggle />
        <button type="button" className="ox-nav-cta">
          Réserver un appel
          <span className="ox-nav-cta-arrow">
            <Calendar size={16} />
          </span>
        </button>
        <button
          className="ox-nav-hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Ouvrir le menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="ox-nav-mobile">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

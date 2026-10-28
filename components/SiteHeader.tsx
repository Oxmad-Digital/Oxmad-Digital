"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import { BRAND_IMAGES } from "@/lib/media";
import { CONTACT_EMAIL, CONTACT_PHONE, LOGIN_URL, SOCIAL_LINKS } from "@/lib/site";

const LINKS = [
  { label: "Expertises", href: "/#expertise" },
  { label: "Réalisations", href: "/realisations" },
  { label: "Notre approche", href: "/#approche" },
  { label: "Méthode", href: "/#processus" },
];

/** Thin drawn arrow (the ↗ glyph renders too heavy and off-baseline); doubled for the hover slide. */
function NavArrow() {
  const path = <path d="M3 9 9 3M4.5 3H9v4.5" />;
  return (
    <span className="nav-arrow" aria-hidden="true">
      <svg viewBox="0 0 12 12">{path}</svg>
      <svg viewBox="0 0 12 12">{path}</svg>
    </span>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const headerRef = useRef<HTMLElement>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // Full-screen mobile menu: locks the page scroll and closes on Escape.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("menu-open");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A navigation that doesn't go through a menu link (back button) still closes it.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Hides while scrolling down, comes back on the way up, with a backdrop once off the top.
  useEffect(() => {
    const header = headerRef.current!;
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      if (Math.abs(y - last) > 6) {
        header.classList.toggle("is-hidden", y > last && y > 160 && !openRef.current);
        last = y;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <header ref={headerRef} className={`nav-shell${isHome ? " nav-shell--home" : ""}${open ? " is-open" : ""}`} id="haut">
      <div className="navigation container container--fluid">
        <Link
          href={isHome ? "#haut" : "/"}
          className="logo-officiel"
          aria-label={isHome ? "Oxmad Digital, retour en haut" : "Oxmad Digital — accueil"}
        >
          <img src={BRAND_IMAGES.logoDark} width={1204} height={403} alt="Oxmad Digital" fetchPriority="high" />
        </Link>
        <nav className={`nav-links${open ? " show" : ""}`} id="navLinks" aria-label="Navigation principale">
          {LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={close}
              style={{ "--i": i } as CSSProperties}
            >
              {link.label}
              {!link.href.includes("#") && <NavArrow />}
            </Link>
          ))}
          {/* Mobile panel only: the call to action and the direct contacts. */}
          <div className="nav-panel-foot" style={{ "--i": LINKS.length } as CSSProperties}>
            <Link className="nav-panel-cta" href="/#contact" onClick={close}>
              Discutons de votre projet
              <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <div className="nav-panel-meta">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>{CONTACT_PHONE}</a>
            </div>
            <div className="nav-panel-meta">
              <span className="nav-panel-social">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                ))}
              </span>
              <span>Antananarivo, Madagascar</span>
            </div>
          </div>
        </nav>
        <Link className="nav-cta" data-cursor="Parler" data-magnetic="0.25" href="/#contact" onClick={close}>
          Discutons de votre projet
        </Link>
        {/* Plain anchor: the sign-in lives under another root layout, so it's a full page load anyway. */}
        <a className="nav-account" href={LOGIN_URL} aria-label="Connexion" title="Connexion" data-cursor="Connexion">
          <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="navLinks"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-icon" aria-hidden="true"><span /><span /></span>
        </button>
      </div>
    </header>
  );
}

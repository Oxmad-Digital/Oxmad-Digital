import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "./not-found.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "Page introuvable | Oxmad Digital",
};

/** Any unmatched URL: the app has several root layouts, so this page brings its own document. */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={geist.variable}>
      <body>
        <main className="ox-404 container">
          <p className="smallcap">Erreur 404</p>
          <h1>Cette page n&apos;existe pas<span>.</span></h1>
          <p className="ox-404-text">Le lien est peut-être ancien, ou la page a changé d&apos;adresse.</p>
          <nav className="ox-404-links" aria-label="Pages principales">
            <Link href="/">Accueil</Link>
            <Link href="/realisations">Réalisations</Link>
            <Link href="/#contact">Nous contacter</Link>
          </nav>
        </main>
      </body>
    </html>
  );
}

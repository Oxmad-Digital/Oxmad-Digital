import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BRAND_IMAGES, HERO_IMAGES } from "@/lib/media";
import "./auth.css";

/** Full-screen frame of the pages outside the client area itself: sign-in, sign-up, waiting for validation. */
export default function AuthScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="adm-login client-login">
      <div className="client-login-background" aria-hidden="true">
        <Image
          src={HERO_IMAGES.clientLogin}
          alt=""
          fill
          sizes="100vw"
          quality={82}
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <Link href="/" className="adm-btn adm-btn-ghost client-login-back">
        <ChevronLeft size={16} aria-hidden="true" />
        Retour au site
      </Link>
      <Link href="/" className="client-login-symbol" aria-label="Oxmad Digital — accueil">
        {/* eslint-disable-next-line @next/next/no-img-element -- shared brand asset, as in the site header */}
        <img src={BRAND_IMAGES.symbol} width={48} height={48} alt="" />
      </Link>
      <div className="client-login-content">
        <div className="adm-login-card">
          <Link href="/" className="adm-brand">OXMAD<span>·</span>DIGITAL</Link>
          <h1>{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

/** What the area is for, in one line; how access works is folded away. */
export function AccessSteps() {
  return (
    <div className="client-login-about">
      <p>Réservé aux <strong>clients de l&apos;agence</strong> : demandes, devis, factures et fichiers.</p>
      <details className="client-login-how">
        <summary>Comment ça marche ?</summary>
        <ol className="client-login-steps">
          <li>Demandez un accès</li>
          <li>Confirmez votre email</li>
          <li>Nous validons votre accès (prévenu par email)</li>
          <li>Connectez-vous par lien, sans mot de passe</li>
        </ol>
        <p className="adm-muted">Pas encore client ? <Link href="/#contact">Parlons de votre projet</Link></p>
      </details>
    </div>
  );
}

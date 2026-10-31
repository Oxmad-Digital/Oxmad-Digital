import Link from "next/link";
import PortalAuthScreen from "@/components/portal/AuthScreen";
import { HERO_IMAGES } from "@/lib/media";

export default function AuthScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return <PortalAuthScreen title={title} image={HERO_IMAGES.clientLogin}>{children}</PortalAuthScreen>;
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

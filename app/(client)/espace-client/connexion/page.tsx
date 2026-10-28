import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getClientUser } from "@/lib/client-auth";
import LoginLinkForm from "./LoginLinkForm";
import "./connexion.css";

export default async function ClientLoginPage() {
  if (await getClientUser()) redirect("/espace-client");

  return (
    <div className="adm-login client-login">
      <div className="client-login-background" aria-hidden="true">
        <Image
          src="/oxmad_connexion_jardin_ocean.webp"
          alt=""
          fill
          sizes="100vw"
          quality={90}
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <Link href="/" className="adm-btn adm-btn-ghost client-login-back">
        <ChevronLeft size={16} aria-hidden="true" />
        Retour au site
      </Link>
      <div className="client-login-content">
        <div className="adm-login-card">
          <Link href="/" className="adm-brand">OXMAD<span>·</span>DIGITAL</Link>
          <h1>Espace client</h1>
          <LoginLinkForm />
          <p className="adm-login-alt"><Link href="/admin/login">Accès admin</Link></p>
        </div>
      </div>
    </div>
  );
}

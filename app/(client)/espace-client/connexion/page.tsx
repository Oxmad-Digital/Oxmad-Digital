import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import AuthScreen from "../AuthScreen";
import LoginPanel from "./LoginPanel";

export default async function ClientLoginPage() {
  const account = await getClientAccount();
  if (account) redirect(account.status === "approved" ? "/espace-client" : "/espace-client/en-attente");

  return (
    <AuthScreen title="Espace client">
      <p className="client-login-lead">Réservé aux <strong>clients de l&apos;agence</strong> : demandes, devis, factures et fichiers.</p>
      <LoginPanel />
      <div className="client-login-foot">
        <p>Première visite ? <Link href="/espace-client/inscription">Demander un accès</Link></p>
        <p className="client-login-admin"><Link href="/admin/login">Accès admin</Link></p>
      </div>
    </AuthScreen>
  );
}

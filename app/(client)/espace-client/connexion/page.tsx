import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import AuthScreen, { AccessSteps } from "../AuthScreen";
import LoginLinkForm from "./LoginLinkForm";

export default async function ClientLoginPage() {
  const account = await getClientAccount();
  if (account) redirect(account.status === "approved" ? "/espace-client" : "/espace-client/en-attente");

  return (
    <AuthScreen title="Espace client">
      <AccessSteps />
      <h2 className="client-login-heading">Déjà un accès ?</h2>
      <LoginLinkForm />
      <p className="client-login-switch">
        Première visite ? <Link href="/espace-client/inscription">Demander un accès</Link>
      </p>
      <p className="adm-login-alt"><Link href="/admin/login">Accès admin</Link></p>
    </AuthScreen>
  );
}

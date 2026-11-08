import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import AuthScreen, { AccessSteps } from "../AuthScreen";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import SignupForm from "./SignupForm";

export default async function ClientSignupPage() {
  const account = await getClientAccount();
  if (account) redirect(account.status === "approved" ? "/espace-client" : "/espace-client/en-attente");

  return (
    <AuthScreen title="Demander un accès">
      <AccessSteps />
      <SignupForm minLength={MIN_PASSWORD_LENGTH} />
      <p className="client-login-switch">
        Déjà un accès ? <Link href="/espace-client/connexion">Se connecter</Link>
      </p>
    </AuthScreen>
  );
}

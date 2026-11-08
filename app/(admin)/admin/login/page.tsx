import Link from "next/link";
import { redirect } from "next/navigation";
import AuthScreen from "@/components/portal/AuthScreen";
import { getAdmin } from "@/lib/admin-auth";
import { HERO_IMAGES } from "@/lib/media";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <AuthScreen title="Espace admin" image={HERO_IMAGES.adminLogin}>
      <LoginForm />
      {/* Same footer as the client sign-in, pointing back to it. */}
      <div className="client-login-foot">
        <p className="client-login-admin"><Link href="/espace-client/connexion">Accès client</Link></p>
      </div>
    </AuthScreen>
  );
}

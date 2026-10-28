import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <p className="adm-brand">OXMAD<span>·</span>DIGITAL</p>
        <h1>Espace admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}

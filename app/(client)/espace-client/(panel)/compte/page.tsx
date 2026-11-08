import { redirect } from "next/navigation";
import PasswordInput from "@/components/portal/PasswordInput";
import StateForm from "@/components/portal/StateForm";
import { getClientAccount, requireClient } from "@/lib/client-auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { changeClientPassword } from "../../actions";

export default async function ClientAccountPage() {
  const user = await requireClient();
  const account = await getClientAccount();
  if (!account) redirect("/espace-client/connexion");

  return (
    <>
      <div className="adm-title-row">
        <h1>Mon compte</h1>
      </div>
      <div className="adm-grid">
        <section className="adm-card">
          <h2>Identité</h2>
          <p className="adm-item-title">{user.name}</p>
          <p className="adm-item-meta">{user.email} · {user.clientName}</p>
        </section>
        <section className="adm-card">
          <h2>{account.hasPassword ? "Changer de mot de passe" : "Choisissez votre mot de passe"}</h2>
          {!account.hasPassword && (
            <p className="adm-muted">Vous pourrez ensuite vous connecter avec votre email et ce mot de passe, sans attendre d&apos;email.</p>
          )}
          <StateForm action={changeClientPassword} submitLabel="Enregistrer le mot de passe" reset>
            <label htmlFor="password">Nouveau mot de passe ({MIN_PASSWORD_LENGTH} caractères min.)</label>
            <PasswordInput id="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
            <label htmlFor="confirm">Confirmer</label>
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
          </StateForm>
        </section>
      </div>
    </>
  );
}

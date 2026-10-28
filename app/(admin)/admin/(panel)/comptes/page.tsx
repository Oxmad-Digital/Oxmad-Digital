import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { TIMEZONE } from "@/lib/site";
import { deleteAdmin, resetTwoFactor } from "../../actions";
import ConfirmButton from "@/components/portal/ConfirmButton";
import DeleteButton from "../DeleteButton";
import { ChangePasswordForm, CreateAdminForm } from "./AccountForms";

type Account = { id: string; email: string; name: string; created_at: Date; last_login_at: Date | null; totp_enabled: boolean };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

export default async function AccountsPage() {
  const admin = await requireAdmin();
  const accounts = (await db()!`SELECT id, email, name, created_at, last_login_at, totp_enabled FROM admin_users ORDER BY created_at`) as Account[];

  return (
    <>
      <div className="adm-title-row">
        <h1>Comptes admin</h1>
      </div>

      <ul className="adm-list">
        {accounts.map((a) => (
          <li key={a.id} className="adm-card adm-item">
            <div className="adm-item-head">
              <div>
                <p className="adm-item-title">
                  {a.name}
                  {String(a.id) === admin.id && <span className="adm-pill adm-pill-accent">Vous</span>}
                </p>
                <p className="adm-item-meta">{a.email}</p>
              </div>
              <div className="adm-item-side">
                <span className={`adm-pill ${a.totp_enabled ? "adm-pill-good" : "adm-pill-bad"}`}>{a.totp_enabled ? "2FA active" : "2FA à activer"}</span>
                {String(a.id) !== admin.id && a.totp_enabled && (
                  <ConfirmButton action={resetTwoFactor} fields={{ id: String(a.id) }} label="Réinitialiser le 2FA" className="adm-btn" message="Réinitialiser la double authentification de ce compte ? Il devra la reconfigurer à sa prochaine connexion." />
                )}
                <span className="adm-muted">
                  {a.last_login_at ? `Dernière connexion : ${dateFormat.format(new Date(a.last_login_at))}` : "Jamais connecté"}
                </span>
                {String(a.id) !== admin.id && <DeleteButton action={deleteAdmin} id={String(a.id)} />}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Ajouter un compte</h2>
          <CreateAdminForm minLength={MIN_PASSWORD_LENGTH} />
        </section>
        <section className="adm-card">
          <h2>Mon mot de passe</h2>
          <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} />
        </section>
      </div>
    </>
  );
}

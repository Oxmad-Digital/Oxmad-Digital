import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import { CONTACT_EMAIL, TIMEZONE } from "@/lib/site";
import { logoutClient } from "../actions";
import AuthScreen from "../AuthScreen";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: TIMEZONE });

/** Where a signed-in account lands until the studio has validated it, and where a refusal is shown. */
export default async function ClientWaitingPage() {
  const account = await getClientAccount();
  if (!account) redirect("/espace-client/connexion");
  if (account.status === "approved") redirect("/espace-client");
  const refused = account.status === "rejected";

  return (
    <AuthScreen title={refused ? "Demande non retenue" : "Demande en cours"}>
      <div className="client-waiting">
        {refused ? (
          <>
            <span className="adm-pill adm-pill-bad">Accès refusé</span>
            <p>Cet espace est réservé aux clients de l&apos;agence, et nous n&apos;avons pas trouvé votre dossier.</p>
            {account.reviewNote && <dl><dt>Motif</dt><dd>{account.reviewNote}</dd></dl>}
            <p className="adm-muted">
              Une erreur ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · <Link href="/#contact">Parlons de votre projet</Link>
            </p>
          </>
        ) : (
          <>
            <span className="adm-pill adm-pill-accent">En attente de validation</span>
            <p>Merci {account.name}, votre demande est transmise. <strong>Vous recevrez un email dès que votre espace sera ouvert.</strong></p>
            <details className="client-login-how">
              <summary>Votre demande</summary>
              <dl>
                <dt>Entreprise</dt><dd>{account.company ?? "—"}</dd>
                <dt>Email</dt><dd>{account.email}</dd>
                {account.signupMessage && <><dt>Message</dt><dd>{account.signupMessage}</dd></>}
                <dt>Envoyée le</dt><dd>{dateFormat.format(account.createdAt)}</dd>
              </dl>
            </details>
            <p className="adm-muted">Une question ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </>
        )}
        <div className="client-waiting-actions">
          {!refused && <Link href="/espace-client/en-attente" className="adm-btn" prefetch={false}>Actualiser</Link>}
          <form action={logoutClient}><button type="submit" className="adm-btn adm-btn-ghost">Déconnexion</button></form>
        </div>
      </div>
    </AuthScreen>
  );
}

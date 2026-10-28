import Link from "next/link";
import ConfirmButton from "@/components/portal/ConfirmButton";
import StateForm from "@/components/portal/StateForm";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/portal";
import { approveSignup, createClient, deleteClientUser, rejectSignup } from "../../client-actions";

type ClientSummary = { id: string; name: string; users: number; projects: number; open_requests: number; unpaid: number; last_login_at: Date | null };
type Signup = {
  id: string; email: string; name: string; company: string | null; signup_message: string | null; status: "pending" | "rejected";
  created_at: Date; email_verified_at: Date | null; review_note: string | null;
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** A sign-up from the client area: attach it to a client (validates it), refuse it, or delete it. */
function SignupCard({ signup, clients }: { signup: Signup; clients: ClientSummary[] }) {
  const pending = signup.status === "pending";
  return (
    <li className="adm-card">
      <div className="adm-item-head">
        <div>
          <p className="adm-item-title">{signup.name} · {signup.company ?? "—"}</p>
          <p className="adm-item-meta">{signup.email} · demandé le {dateFormat.format(new Date(signup.created_at))}</p>
        </div>
        <div className="adm-item-side">
          {!signup.email_verified_at && <span className="adm-pill">Email non confirmé</span>}
          {!pending && <span className="adm-pill adm-pill-bad">Refusée</span>}
        </div>
      </div>
      {signup.signup_message && <p className="adm-item-body">{signup.signup_message}</p>}
      {signup.review_note && <p className="adm-muted">Motif du refus : {signup.review_note}</p>}
      <div className="adm-item-actions">
        <StateForm action={approveSignup} submitLabel="Valider l'accès" pendingLabel="Validation…" className="adm-inline-form">
          <input type="hidden" name="id" value={signup.id} />
          <select name="clientId" defaultValue="new" aria-label="Client à associer">
            <option value="new">Nouveau client « {signup.company || signup.name} »</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="adm-check"><input type="checkbox" name="notify" defaultChecked /> Prévenir par email</label>
        </StateForm>
        {pending && (
          <details className="adm-details">
            <summary>Refuser</summary>
            <StateForm action={rejectSignup} submitLabel="Refuser la demande" pendingLabel="Envoi…">
              <input type="hidden" name="id" value={signup.id} />
              <label htmlFor={`note-${signup.id}`}>Motif, visible par la personne (facultatif)</label>
              <textarea id={`note-${signup.id}`} name="note" rows={2} maxLength={2000} />
              <label className="adm-check"><input type="checkbox" name="notify" defaultChecked /> Prévenir par email</label>
            </StateForm>
          </details>
        )}
        <ConfirmButton action={deleteClientUser} fields={{ id: signup.id }} message={`Supprimer la demande de ${signup.email} ? Elle pourra en refaire une.`} />
      </div>
    </li>
  );
}

export default async function ClientsPage() {
  await requireAdmin();
  const clients = (await sql()`SELECT c.id, c.name,
      (SELECT count(*)::int FROM client_users u WHERE u.client_id = c.id) AS users,
      (SELECT count(*)::int FROM client_projects p WHERE p.client_id = c.id) AS projects,
      (SELECT count(*)::int FROM client_requests r WHERE r.client_id = c.id AND r.status IN ('new', 'planned', 'in_progress')) AS open_requests,
      (SELECT count(*)::int FROM client_documents d WHERE d.client_id = c.id AND d.status = 'unpaid') AS unpaid,
      (SELECT max(u.last_login_at) FROM client_users u WHERE u.client_id = c.id) AS last_login_at
    FROM clients c ORDER BY lower(c.name)`) as ClientSummary[];
  // Confirmed emails first: an unconfirmed one may be a typo or a bot.
  const signups = (await sql()`SELECT id, email, name, company, signup_message, status, created_at, email_verified_at, review_note
    FROM client_users WHERE status <> 'approved' ORDER BY email_verified_at IS NULL, created_at DESC`) as Signup[];
  const pending = signups.filter((s) => s.status === "pending");
  const rejected = signups.filter((s) => s.status === "rejected");

  return (
    <>
      <div className="adm-title-row">
        <h1>Clients</h1>
      </div>

      {pending.length > 0 && (
        <section className="adm-section">
          <h2>Demandes d&apos;accès à valider</h2>
          <p className="adm-muted">
            Inscriptions faites depuis l&apos;espace client. Tant qu&apos;elles ne sont pas validées, ces personnes ne voient
            qu&apos;une page d&apos;attente. Valider associe l&apos;accès à un client et lui ouvre son espace.
          </p>
          <ul className="adm-list">
            {pending.map((s) => <SignupCard key={s.id} signup={s} clients={clients} />)}
          </ul>
        </section>
      )}
      {rejected.length > 0 && (
        <details className="adm-details adm-section">
          <summary>Demandes refusées ({rejected.length})</summary>
          <ul className="adm-list">
            {rejected.map((s) => <SignupCard key={s.id} signup={s} clients={clients} />)}
          </ul>
        </details>
      )}

      {clients.length === 0 && <p className="adm-card adm-empty">Aucun client pour le moment.</p>}

      <ul className="adm-list">
        {clients.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/clients/${c.id}`} className="adm-card adm-item">
              <div className="adm-item-head">
                <div>
                  <p className="adm-item-title">{c.name}</p>
                  <p className="adm-item-meta">
                    {c.users} accès · {c.projects} projet{c.projects > 1 ? "s" : ""}
                    {" · "}{c.last_login_at ? `vu le ${dateFormat.format(new Date(c.last_login_at))}` : "jamais connecté"}
                  </p>
                </div>
                <div className="adm-item-side">
                  {c.open_requests > 0 && <span className="adm-pill adm-pill-accent">{c.open_requests} demande{c.open_requests > 1 ? "s" : ""} en cours</span>}
                  {c.unpaid > 0 && <span className="adm-pill adm-pill-bad">{c.unpaid} facture{c.unpaid > 1 ? "s" : ""} à régler</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Nouveau client</h2>
          <StateForm action={createClient} submitLabel="Créer le client">
            <label htmlFor="name">Nom (entreprise ou personne)</label>
            <input id="name" name="name" required maxLength={120} />
            <label htmlFor="notes">Notes internes (facultatif)</label>
            <textarea id="notes" name="notes" rows={2} />
          </StateForm>
        </section>
      </div>
    </>
  );
}

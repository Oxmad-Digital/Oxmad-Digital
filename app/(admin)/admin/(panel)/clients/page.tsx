import Link from "next/link";
import StateForm from "@/components/portal/StateForm";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/portal";
import { createClient } from "../../client-actions";

type ClientSummary = { id: string; name: string; users: number; projects: number; open_requests: number; unpaid: number; last_login_at: Date | null };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function ClientsPage() {
  await requireAdmin();
  const clients = (await sql()`SELECT c.id, c.name,
      (SELECT count(*)::int FROM client_users u WHERE u.client_id = c.id) AS users,
      (SELECT count(*)::int FROM client_projects p WHERE p.client_id = c.id) AS projects,
      (SELECT count(*)::int FROM client_requests r WHERE r.client_id = c.id AND r.status IN ('new', 'planned', 'in_progress')) AS open_requests,
      (SELECT count(*)::int FROM client_documents d WHERE d.client_id = c.id AND d.status = 'unpaid') AS unpaid,
      (SELECT max(u.last_login_at) FROM client_users u WHERE u.client_id = c.id) AS last_login_at
    FROM clients c ORDER BY lower(c.name)`) as ClientSummary[];

  return (
    <>
      <div className="adm-title-row">
        <h1>Clients</h1>
      </div>

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

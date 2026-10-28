import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import BackLink from "@/components/portal/BackLink";
import ConfirmButton from "@/components/portal/ConfirmButton";
import DocumentList from "@/components/portal/DocumentList";
import RequestList from "@/components/portal/RequestList";
import StateForm from "@/components/portal/StateForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getDocuments, getProjects, getRequests, sql } from "@/lib/portal";
import { DOCUMENT_STATUSES } from "@/lib/portal-labels";
import { TIMEZONE } from "@/lib/site";
import {
  addClientUser, addProject, deleteClient, deleteClientUser, deleteDocument, deleteProject,
  sendClientInvite, setDocumentStatus, toggleProjectMaintenance, updateClientNotes,
} from "../../../client-actions";
import DocumentForm from "./DocumentForm";

type ClientUserRow = { id: string; email: string; name: string; last_login_at: Date | null };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [client] = await sql()`SELECT id, name, notes FROM clients WHERE id = ${id}`;
  if (!client) notFound();

  const [users, projects, documents, requests] = await Promise.all([
    sql()`SELECT id, email, name, last_login_at FROM client_users WHERE client_id = ${id} ORDER BY created_at`.then((rows) => rows as ClientUserRow[]),
    getProjects(id),
    getDocuments(id),
    getRequests(id),
  ]);

  return (
    <>
      <p className="adm-back"><BackLink href="/admin/clients">Clients</BackLink></p>
      <div className="adm-title-row">
        <h1>{client.name}</h1>
        <Link href={`/admin/clients/${id}/drive`} className="adm-btn"><FolderOpen size={14} aria-hidden="true" /> Drive</Link>
      </div>

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Accès à l&apos;espace client</h2>
          {users.length === 0 && <p className="adm-empty">Personne n&apos;a encore accès.</p>}
          <ul className="adm-rows">
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <p className="adm-item-title">{u.name}</p>
                  <p className="adm-item-meta">{u.email} · {u.last_login_at ? `vu le ${dateFormat.format(new Date(u.last_login_at))}` : "jamais connecté"}</p>
                </div>
                <div className="adm-row-actions">
                  <StateForm action={sendClientInvite} submitLabel="Envoyer un lien" pendingLabel="Envoi…" className="adm-inline-form">
                    <input type="hidden" name="id" value={u.id} />
                  </StateForm>
                  <ConfirmButton action={deleteClientUser} fields={{ id: u.id }} label="Retirer" message={`Retirer l'accès de ${u.email} ?`} />
                </div>
              </li>
            ))}
          </ul>
          <StateForm action={addClientUser} submitLabel="Ajouter l'accès" reset>
            <input type="hidden" name="clientId" value={id} />
            <label htmlFor="user-name">Nom</label>
            <input id="user-name" name="name" required maxLength={120} />
            <label htmlFor="user-email">Email</label>
            <input id="user-email" name="email" type="email" required />
            <label className="adm-check"><input type="checkbox" name="invite" defaultChecked /> Envoyer l&apos;invitation par email</label>
          </StateForm>
        </section>

        <section className="adm-card">
          <h2>Projets</h2>
          {projects.length === 0 && <p className="adm-empty">Aucun projet.</p>}
          <ul className="adm-rows">
            {projects.map((p) => (
              <li key={p.id}>
                <div>
                  <p className="adm-item-title">{p.name}</p>
                  {p.url && <p className="adm-item-meta"><a href={p.url} target="_blank" rel="noreferrer">{p.url}</a></p>}
                </div>
                <div className="adm-row-actions">
                  <form action={toggleProjectMaintenance}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className={p.maintenance ? "adm-pill adm-pill-good adm-pill-btn" : "adm-pill adm-pill-btn"} title="Basculer">
                      {p.maintenance ? "Maintenance" : "Sans maintenance"}
                    </button>
                  </form>
                  <ConfirmButton action={deleteProject} fields={{ id: p.id }} message={`Supprimer le projet « ${p.name} » ? Ses demandes sont conservées.`} />
                </div>
              </li>
            ))}
          </ul>
          <StateForm action={addProject} submitLabel="Ajouter le projet" reset>
            <input type="hidden" name="clientId" value={id} />
            <label htmlFor="project-name">Nom</label>
            <input id="project-name" name="name" required maxLength={120} placeholder="Site vitrine" />
            <label htmlFor="project-url">URL (facultatif)</label>
            <input id="project-url" name="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="exemple.com" />
            <label className="adm-check"><input type="checkbox" name="maintenance" defaultChecked /> Couvert par la maintenance</label>
          </StateForm>
        </section>
      </div>

      <section className="adm-section">
        <h2>Devis & factures</h2>
        <DocumentList
          documents={documents}
          actions={(d) => (
            <>
              <form action={setDocumentStatus} className="adm-inline-form">
                <input type="hidden" name="id" value={d.id} />
                <select name="status" defaultValue={d.status} aria-label="Statut">
                  {Object.entries(DOCUMENT_STATUSES).filter(([, s]) => s.kind === d.kind).map(([value, s]) => (
                    <option key={value} value={value}>{s.label}</option>
                  ))}
                </select>
                <button className="adm-btn">OK</button>
              </form>
              <ConfirmButton action={deleteDocument} fields={{ id: d.id }} message={`Supprimer ${d.number} et son PDF ?`} />
            </>
          )}
        />
        <details className="adm-card adm-details">
          <summary>Ajouter un devis ou une facture</summary>
          <DocumentForm clientId={id} />
        </details>
      </section>

      <section className="adm-section">
        <h2>Demandes</h2>
        <RequestList requests={requests} basePath="/admin/demandes" asAdmin />
      </section>

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Fiche</h2>
          <StateForm action={updateClientNotes} submitLabel="Enregistrer">
            <input type="hidden" name="clientId" value={id} />
            <label htmlFor="client-name">Nom</label>
            <input id="client-name" name="name" defaultValue={client.name} required maxLength={120} />
            <label htmlFor="client-notes">Notes internes (invisibles du client)</label>
            <textarea id="client-notes" name="notes" rows={4} defaultValue={client.notes ?? ""} />
          </StateForm>
        </section>
        <section className="adm-card adm-danger">
          <h2>Zone sensible</h2>
          <p className="adm-muted">Supprime le client, ses accès, demandes, documents et tous les fichiers de son drive.</p>
          <ConfirmButton action={deleteClient} fields={{ clientId: id }} label="Supprimer le client" message={`Supprimer ${client.name} et TOUTES ses données ? Cette action est irréversible.`} />
        </section>
      </div>
    </>
  );
}

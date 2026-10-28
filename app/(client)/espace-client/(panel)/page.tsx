import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import DocumentList from "@/components/portal/DocumentList";
import RequestList from "@/components/portal/RequestList";
import { requireClient } from "@/lib/client-auth";
import { getDocuments, getProjects, getRequests } from "@/lib/portal";
import { OPEN_REQUEST_STATUSES } from "@/lib/portal-labels";

export default async function ClientHomePage() {
  const user = await requireClient();
  const [requests, documents, projects] = await Promise.all([
    getRequests(user.clientId, [...OPEN_REQUEST_STATUSES, "out_of_scope"]),
    getDocuments(user.clientId),
    getProjects(user.clientId),
  ]);
  const toHandle = documents.filter((d) => d.status === "unpaid" || d.status === "pending");

  return (
    <>
      <div className="adm-title-row">
        <h1>Bonjour {user.name.split(" ")[0]}</h1>
        <Link href="/espace-client/demandes/nouvelle" className="adm-btn adm-btn-primary adm-btn-cta">Nouvelle demande <Plus size={16} strokeWidth={2.2} aria-hidden="true" /></Link>
      </div>

      {projects.length > 0 && (
        <ul className="adm-projects">
          {projects.map((p) => (
            <li key={p.id} className="adm-card">
              <p className="adm-item-title">{p.name}</p>
              <p className="adm-item-meta">
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="adm-link">{p.url.replace(/^https?:\/\//, "")} <ExternalLink size={12} aria-hidden="true" /></a>}
              </p>
              <span className={p.maintenance ? "adm-pill adm-pill-good" : "adm-pill"}>{p.maintenance ? "Maintenance active" : "Sans maintenance"}</span>
            </li>
          ))}
        </ul>
      )}

      <section className="adm-section">
        <div className="adm-section-head">
          <h2>Demandes en cours</h2>
          <Link href="/espace-client/demandes" className="adm-link">Tout voir</Link>
        </div>
        <RequestList requests={requests.slice(0, 5)} basePath="/espace-client/demandes" asAdmin={false} empty="Aucune demande en cours." />
      </section>

      {toHandle.length > 0 && (
        <section className="adm-section">
          <div className="adm-section-head">
            <h2>Documents en attente</h2>
            <Link href="/espace-client/documents" className="adm-link">Tous les documents</Link>
          </div>
          <DocumentList documents={toHandle} />
        </section>
      )}
    </>
  );
}

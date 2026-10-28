import { Download } from "lucide-react";
import type { DocumentRow } from "@/lib/portal";
import { DOCUMENT_KINDS, DOCUMENT_STATUSES, formatAmount, pillClass } from "@/lib/portal-labels";
import { TIMEZONE } from "@/lib/site";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: TIMEZONE });

export function isOverdue(d: DocumentRow) {
  return d.status === "unpaid" && d.due_on !== null && new Date(d.due_on) < new Date(new Date().toDateString());
}

/** Quotes and invoices. `actions` renders extra controls per row (admin). */
export default function DocumentList({ documents, actions, empty = "Aucun document pour le moment." }: {
  documents: DocumentRow[];
  actions?: (d: DocumentRow) => React.ReactNode;
  empty?: string;
}) {
  if (documents.length === 0) return <p className="adm-card adm-empty">{empty}</p>;

  return (
    <div className="adm-card adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th scope="col">Document</th>
            <th scope="col">Date</th>
            <th scope="col" className="is-num">Montant</th>
            <th scope="col">Statut</th>
            <th scope="col"><span className="adm-sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => {
            const status = isOverdue(d) ? { label: "En retard", tone: "bad" as const } : DOCUMENT_STATUSES[d.status];
            return (
              <tr key={d.id}>
                <td>
                  <a href={`/api/portal/documents/${d.id}`} target="_blank" rel="noreferrer" className="adm-doc-title">
                    {DOCUMENT_KINDS[d.kind]} {d.number}
                  </a>
                  <span className="adm-muted">{d.title}</span>
                </td>
                <td>
                  {dateFormat.format(new Date(d.issued_on))}
                  {d.due_on && d.status === "unpaid" && <span className="adm-muted">Échéance {dateFormat.format(new Date(d.due_on))}</span>}
                  {d.due_on && d.kind === "quote" && d.status === "pending" && <span className="adm-muted">Valable jusqu&apos;au {dateFormat.format(new Date(d.due_on))}</span>}
                </td>
                <td className="is-num">{d.amount !== null ? formatAmount(d.amount, d.currency) : "—"}</td>
                <td><span className={pillClass(status.tone)}>{status.label}</span></td>
                <td>
                  <div className="adm-row-actions">
                    <a className="adm-btn adm-btn-ghost" href={`/api/portal/documents/${d.id}?download`} aria-label={`Télécharger ${d.file_name}`}><Download size={14} aria-hidden="true" /></a>
                    {actions?.(d)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

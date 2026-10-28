import Link from "next/link";
import type { RequestRow } from "@/lib/portal";
import { pillClass, REQUEST_KINDS, REQUEST_STATUSES } from "@/lib/portal-labels";
import { TIMEZONE } from "@/lib/site";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: TIMEZONE });

/** Requests list. `basePath` + id is the detail page; the admin also sees the client name. */
export default function RequestList({ requests, basePath, asAdmin, empty = "Aucune demande ici." }: {
  requests: RequestRow[];
  basePath: string;
  asAdmin: boolean;
  empty?: string;
}) {
  if (requests.length === 0) return <p className="adm-card adm-empty">{empty}</p>;
  // Highlighted when the other side wrote last: it's this viewer's turn.
  const waiting = (r: RequestRow) => r.last_message_by === (asAdmin ? "client" : "admin") && r.status !== "done" && r.status !== "cancelled";

  return (
    <ul className="adm-list">
      {requests.map((r) => {
        const status = REQUEST_STATUSES[r.status];
        return (
          <li key={r.id}>
            <Link href={`${basePath}/${r.id}`} className={`adm-card adm-item${waiting(r) ? " is-new" : ""}${r.status === "cancelled" ? " is-muted" : ""}`}>
              <div className="adm-item-head">
                <div>
                  <p className="adm-item-title">
                    {r.urgent && <span className="adm-pill adm-pill-bad">Urgent</span>}
                    {r.title}
                  </p>
                  <p className="adm-item-meta">
                    {asAdmin && <>{r.client_name} · </>}
                    {REQUEST_KINDS[r.kind].label}
                    {r.project_name && <> · {r.project_name}</>}
                    {r.messages > 0 && <> · {r.messages} message{r.messages > 1 ? "s" : ""}</>}
                    {" · "}mise à jour le {dateFormat.format(new Date(r.updated_at))}
                  </p>
                </div>
                <span className={pillClass(status.tone)}>{status.label}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

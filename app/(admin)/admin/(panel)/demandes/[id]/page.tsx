import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/components/portal/BackLink";
import ConfirmButton from "@/components/portal/ConfirmButton";
import CopyPrompt from "@/components/portal/CopyPrompt";
import RequestThread from "@/components/portal/RequestThread";
import StateForm from "@/components/portal/StateForm";
import { requireAdmin } from "@/lib/admin-auth";
import { getRequest } from "@/lib/portal";
import { pillClass, REQUEST_STATUSES } from "@/lib/portal-labels";
import { requestPrompt } from "@/lib/request-prompt";
import { deleteRequest, setRequestStatus } from "../../../client-actions";

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const data = await getRequest((await params).id, null);
  if (!data) notFound();
  const { request } = data;
  const status = REQUEST_STATUSES[request.status];

  return (
    <>
      <p className="adm-back">
        <BackLink href="/admin/demandes">Demandes</BackLink>
        {" · "}
        <Link href={`/admin/clients/${request.client_id}`} className="adm-link">{request.client_name}</Link>
      </p>
      <div className="adm-title-row">
        <h1>{request.urgent && <span className="adm-pill adm-pill-bad">Urgent</span>} {request.title}</h1>
        <span className={pillClass(status.tone)}>{status.label}</span>
      </div>

      <div className="adm-split">
        <div>
          <RequestThread data={data} asAdmin />
          <CopyPrompt prompt={requestPrompt(data)} />
        </div>
        <aside className="adm-card adm-sticky">
          <h2>Qualifier / avancer</h2>
          <StateForm action={setRequestStatus} submitLabel="Mettre à jour" reset>
            <input type="hidden" name="requestId" value={request.id} />
            <fieldset className="adm-choices">
              <legend className="adm-sr-only">Statut</legend>
              {Object.entries(REQUEST_STATUSES).map(([value, s]) => (
                <label key={value} className="adm-choice">
                  <input type="radio" name="status" value={value} defaultChecked={value === request.status} />
                  <span><strong>{s.label}</strong><small>{s.hint}</small></span>
                </label>
              ))}
            </fieldset>
            <label htmlFor="note">Message au client (facultatif)</label>
            <textarea id="note" name="note" rows={3} placeholder="Ex. : c'est une nouvelle section, je vous envoie un devis." />
            <label className="adm-check"><input type="checkbox" name="notify" defaultChecked /> Prévenir le client par email</label>
          </StateForm>
          <div className="adm-sticky-foot">
            <ConfirmButton action={deleteRequest} fields={{ id: request.id }} label="Supprimer la demande" />
          </div>
        </aside>
      </div>
    </>
  );
}

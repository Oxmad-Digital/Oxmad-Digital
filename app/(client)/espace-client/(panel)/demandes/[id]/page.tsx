import { notFound } from "next/navigation";
import BackLink from "@/components/portal/BackLink";
import ConfirmButton from "@/components/portal/ConfirmButton";
import RequestThread from "@/components/portal/RequestThread";
import { requireClient } from "@/lib/client-auth";
import { getRequest } from "@/lib/portal";
import { pillClass, REQUEST_STATUSES } from "@/lib/portal-labels";
import { cancelRequest } from "../../../actions";

export default async function ClientRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const data = await getRequest((await params).id, user.clientId);
  if (!data) notFound();
  const status = REQUEST_STATUSES[data.request.status];

  return (
    <>
      <p className="adm-back"><BackLink href="/espace-client/demandes">Demandes</BackLink></p>
      <div className="adm-title-row">
        <h1>{data.request.title}</h1>
        <div className="adm-title-actions">
          <span className={pillClass(status.tone)}>{status.label}</span>
          {data.request.status === "new" && (
            <ConfirmButton action={cancelRequest} fields={{ id: data.request.id }} label="Annuler la demande" message="Annuler cette demande ?" className="adm-btn adm-btn-ghost" />
          )}
        </div>
      </div>
      <p className="adm-status-hint">{status.hint}</p>
      <RequestThread data={data} asAdmin={false} />
    </>
  );
}

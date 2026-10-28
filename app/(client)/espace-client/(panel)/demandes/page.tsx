import Link from "next/link";
import { Plus } from "lucide-react";
import RequestList from "@/components/portal/RequestList";
import { requireClient } from "@/lib/client-auth";
import { getRequests } from "@/lib/portal";
import { OPEN_REQUEST_STATUSES, type RequestStatus } from "@/lib/portal-labels";

const FILTERS: { value: string; label: string; statuses: RequestStatus[] | null }[] = [
  { value: "open", label: "En cours", statuses: [...OPEN_REQUEST_STATUSES, "out_of_scope"] },
  { value: "done", label: "Terminées", statuses: ["done", "cancelled"] },
  { value: "all", label: "Toutes", statuses: null },
];

export default async function ClientRequestsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireClient();
  const requested = (await searchParams).f;
  const filter = FILTERS.find((f) => f.value === requested) ?? FILTERS[0];
  const requests = await getRequests(user.clientId, filter.statuses);

  return (
    <>
      <div className="adm-title-row">
        <h1>Demandes</h1>
        <div className="adm-title-actions adm-request-actions">
          <div className="adm-segmented" role="group" aria-label="Filtre">
            {FILTERS.map((f) => (
              <Link key={f.value} href={`/espace-client/demandes?f=${f.value}`} aria-current={f.value === filter.value ? "true" : undefined}>{f.label}</Link>
            ))}
          </div>
          <Link href="/espace-client/demandes/nouvelle" className="adm-btn adm-btn-primary adm-btn-cta">Nouvelle demande <Plus size={16} strokeWidth={2.2} aria-hidden="true" /></Link>
        </div>
      </div>
      <RequestList requests={requests} basePath="/espace-client/demandes" asAdmin={false} />
    </>
  );
}

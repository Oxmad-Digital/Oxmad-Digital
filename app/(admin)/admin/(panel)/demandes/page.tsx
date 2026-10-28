import Link from "next/link";
import RequestList from "@/components/portal/RequestList";
import { requireAdmin } from "@/lib/admin-auth";
import { getRequests } from "@/lib/portal";
import { OPEN_REQUEST_STATUSES, type RequestStatus } from "@/lib/portal-labels";

const FILTERS: { value: string; label: string; statuses: RequestStatus[] | null }[] = [
  { value: "open", label: "En cours", statuses: OPEN_REQUEST_STATUSES },
  { value: "new", label: "À qualifier", statuses: ["new"] },
  { value: "out", label: "Hors maintenance", statuses: ["out_of_scope"] },
  { value: "closed", label: "Terminées", statuses: ["done", "cancelled"] },
  { value: "all", label: "Toutes", statuses: null },
];

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireAdmin();
  const requested = (await searchParams).f;
  const filter = FILTERS.find((f) => f.value === requested) ?? FILTERS[0];
  const requests = await getRequests(null, filter.statuses);

  return (
    <>
      <div className="adm-title-row">
        <h1>Demandes clients</h1>
        <div className="adm-segmented" role="group" aria-label="Filtre">
          {FILTERS.map((f) => (
            <Link key={f.value} href={`/admin/demandes?f=${f.value}`} aria-current={f.value === filter.value ? "true" : undefined}>{f.label}</Link>
          ))}
        </div>
      </div>
      <RequestList requests={requests} basePath="/admin/demandes" asAdmin />
      <p className="adm-footnote">Liseré jaune : le client a écrit en dernier, à vous de répondre.</p>
    </>
  );
}

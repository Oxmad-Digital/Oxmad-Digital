import { notFound } from "next/navigation";
import BackLink from "@/components/portal/BackLink";
import DriveBrowser from "@/components/portal/DriveBrowser";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/portal";

export default async function ClientDriveAdminPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dossier?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [client] = await sql()`SELECT id, name FROM clients WHERE id = ${id}`;
  if (!client) notFound();
  const { dossier } = await searchParams;

  return (
    <>
      <p className="adm-back"><BackLink href={`/admin/clients/${id}`}>{client.name}</BackLink></p>
      <div className="adm-title-row">
        <h1>Drive — {client.name}</h1>
      </div>
      <DriveBrowser clientId={id} folderId={dossier ?? null} basePath={`/admin/clients/${id}/drive`} asAdmin />
    </>
  );
}

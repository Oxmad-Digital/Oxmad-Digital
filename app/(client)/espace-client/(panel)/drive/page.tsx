import DriveBrowser from "@/components/portal/DriveBrowser";
import { requireClient } from "@/lib/client-auth";

export default async function ClientDrivePage({ searchParams }: { searchParams: Promise<{ dossier?: string }> }) {
  const user = await requireClient();
  const { dossier } = await searchParams;

  return (
    <>
      <div className="adm-title-row">
        <h1>Drive</h1>
      </div>
      <p className="adm-status-hint">Partagez ici vos textes, photos, logos et documents. Nous y déposons aussi maquettes et livrables.</p>
      <DriveBrowser clientId={user.clientId} folderId={dossier ?? null} basePath="/espace-client/drive" asAdmin={false} />
    </>
  );
}

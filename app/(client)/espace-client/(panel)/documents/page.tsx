import DocumentList from "@/components/portal/DocumentList";
import { requireClient } from "@/lib/client-auth";
import { getDocuments } from "@/lib/portal";

export default async function ClientDocumentsPage() {
  const user = await requireClient();
  const documents = await getDocuments(user.clientId);

  return (
    <>
      <div className="adm-title-row">
        <h1>Devis & factures</h1>
      </div>
      <section className="adm-section">
        <h2>Factures</h2>
        <DocumentList documents={documents.filter((d) => d.kind === "invoice")} empty="Aucune facture pour le moment." />
      </section>
      <section className="adm-section">
        <h2>Devis</h2>
        <DocumentList documents={documents.filter((d) => d.kind === "quote")} empty="Aucun devis pour le moment." />
      </section>
    </>
  );
}

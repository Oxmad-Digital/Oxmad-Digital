import BackLink from "@/components/portal/BackLink";
import ScopeNote from "@/components/portal/ScopeNote";
import { requireClient } from "@/lib/client-auth";
import { getProjects } from "@/lib/portal";
import NewRequestForm from "./NewRequestForm";

export default async function NewRequestPage() {
  const user = await requireClient();
  const projects = await getProjects(user.clientId);

  return (
    <>
      <p className="adm-back"><BackLink href="/espace-client/demandes">Demandes</BackLink></p>
      <div className="adm-title-row">
        <h1>Nouvelle demande</h1>
      </div>
      <div className="adm-split">
        <section className="adm-card">
          <NewRequestForm projects={projects.map(({ id, name, maintenance }) => ({ id, name, maintenance }))} />
        </section>
        <ScopeNote />
      </div>
    </>
  );
}

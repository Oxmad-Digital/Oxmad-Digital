import PortalShell from "@/components/portal/PortalShell";
import { requireClient } from "@/lib/client-auth";
import { sql } from "@/lib/portal";
import { logoutClient } from "../actions";
import ClientNav from "./ClientNav";

export default async function ClientPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  // Requests the studio answered last and that are still open: the client has something to read.
  const [counts] = await sql()`SELECT count(*)::int AS replies FROM client_requests
    WHERE client_id = ${user.clientId} AND last_message_by = 'admin' AND status IN ('new', 'planned', 'in_progress', 'out_of_scope')`;

  return (
    <PortalShell
      mode="client"
      workspace={user.clientName}
      userName={user.name}
      userEmail={user.email}
      navigation={<ClientNav replies={counts.replies} />}
      accountAction={<form action={logoutClient}><button type="submit" className="adm-btn adm-btn-ghost">Déconnexion</button></form>}
    >
      {children}
    </PortalShell>
  );
}

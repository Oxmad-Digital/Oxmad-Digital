import PortalShell from "@/components/portal/PortalShell";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logout } from "../actions";
import AdminNav from "./AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const sql = db();
  const [counts] = sql
    ? await sql`SELECT
        (SELECT count(*) FROM contact_messages WHERE status = 'new') AS unread,
        (SELECT count(*) FROM bookings WHERE status = 'pending' AND slot >= now()) AS pending,
        (SELECT count(*) FROM client_requests WHERE last_message_by = 'client' AND status NOT IN ('done', 'cancelled')) AS requests,
        (SELECT count(*) FROM client_users WHERE status = 'pending' AND email_verified_at IS NOT NULL) AS signups`
    : [{ unread: 0, pending: 0, requests: 0, signups: 0 }];

  return (
    <PortalShell
      mode="admin"
      workspace="Oxmad Digital"
      userName={admin.name}
      userEmail={admin.email}
      navigation={<AdminNav unread={Number(counts.unread)} pending={Number(counts.pending)} requests={Number(counts.requests)} signups={Number(counts.signups)} />}
      accountAction={<form action={logout}><button type="submit" className="adm-btn adm-btn-ghost">Déconnexion</button></form>}
    >
      {!sql && <p className="adm-error">DATABASE_URL n&apos;est pas configurée : aucune donnée disponible.</p>}
      {children}
    </PortalShell>
  );
}

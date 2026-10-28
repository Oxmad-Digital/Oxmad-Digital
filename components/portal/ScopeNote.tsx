import { Check, X } from "lucide-react";
import { MAINTENANCE_SCOPE } from "@/lib/portal-labels";

/** What the maintenance covers, so out-of-scope requests are expected rather than a surprise. */
export default function ScopeNote() {
  return (
    <aside className="adm-card adm-scope">
      <h2>Ce que couvre la maintenance</h2>
      <ul>
        {MAINTENANCE_SCOPE.included.map((item) => <li key={item}><Check size={15} aria-hidden="true" className="adm-ok" /> {item}</li>)}
      </ul>
      <p className="adm-muted">Fait l&apos;objet d&apos;un devis séparé :</p>
      <ul>
        {MAINTENANCE_SCOPE.excluded.map((item) => <li key={item}><X size={15} aria-hidden="true" className="adm-error" /> {item}</li>)}
      </ul>
      <p className="adm-muted">Pas sûr ? Envoyez la demande : nous la qualifions et vous prévenons avant toute facturation.</p>
    </aside>
  );
}

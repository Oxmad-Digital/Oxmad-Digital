"use client";

import { useState } from "react";
import AttachForm from "@/components/portal/AttachForm";
import { CURRENCIES, DOCUMENT_STATUSES, type DocumentKind } from "@/lib/portal-labels";
import { createDocument } from "../../../client-actions";

export default function DocumentForm({ clientId }: { clientId: string }) {
  const [kind, setKind] = useState<DocumentKind>("invoice");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AttachForm action={createDocument} clientId={clientId} submitLabel="Ajouter le document" fileLabel="PDF du document" requireFile>
      <input type="hidden" name="clientId" value={clientId} />
      <div className="adm-fields">
        <div>
          <label htmlFor="doc-kind">Type</label>
          <select id="doc-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
            <option value="invoice">Facture</option>
            <option value="quote">Devis</option>
          </select>
        </div>
        <div>
          <label htmlFor="doc-number">Numéro</label>
          <input id="doc-number" name="number" required maxLength={40} placeholder={kind === "invoice" ? "F-2026-014" : "D-2026-009"} />
        </div>
        <div>
          <label htmlFor="doc-status">Statut</label>
          <select id="doc-status" name="status" key={kind}>
            {Object.entries(DOCUMENT_STATUSES).filter(([, s]) => s.kind === kind).map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <label htmlFor="doc-title">Intitulé</label>
      <input id="doc-title" name="title" required maxLength={160} placeholder="Maintenance — octobre 2026" />
      <div className="adm-fields">
        <div>
          <label htmlFor="doc-amount">Montant TTC</label>
          <input id="doc-amount" name="amount" inputMode="decimal" placeholder="0,00" />
        </div>
        <div>
          <label htmlFor="doc-currency">Devise</label>
          <select id="doc-currency" name="currency">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div>
          <label htmlFor="doc-issued">Date</label>
          <input id="doc-issued" name="issuedOn" type="date" required defaultValue={today} />
        </div>
        <div>
          <label htmlFor="doc-due">{kind === "invoice" ? "Échéance" : "Valable jusqu'au"}</label>
          <input id="doc-due" name="dueOn" type="date" />
        </div>
      </div>
      <label className="adm-check"><input type="checkbox" name="notify" defaultChecked /> Prévenir le client par email</label>
    </AttachForm>
  );
}

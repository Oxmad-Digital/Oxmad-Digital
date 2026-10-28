"use client";

import Link from "next/link";
import { useActionState } from "react";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { enrollTwoFactor, verifyTwoFactor } from "../../actions";

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyTwoFactor, {});

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <label htmlFor="code">Code</label>
      <input id="code" name="code" inputMode="text" autoComplete="one-time-code" autoFocus required />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>{pending ? "Vérification…" : "Valider"}</button>
    </form>
  );
}

export function EnrollForm() {
  const [state, action, pending] = useActionState(enrollTwoFactor, {});

  if (state.codes) {
    return (
      <div className="adm-form">
        <p className="adm-ok" role="status">Double authentification activée.</p>
        <p className="adm-muted">
          Conservez ces codes de secours en lieu sûr : chacun ne sert qu&apos;une fois si vous perdez votre téléphone. Ils ne seront plus affichés.
        </p>
        <ul style={{ columns: 2, listStyle: "none", padding: 0, margin: "8px 0", fontFamily: "monospace" }}>
          {state.codes.map((code) => <li key={code}>{code}</li>)}
        </ul>
        <Link href="/admin" className="adm-btn adm-btn-primary">J&apos;ai noté les codes, continuer</Link>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <label htmlFor="code">Code à 6 chiffres</label>
      <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" autoFocus required />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>{pending ? "Vérification…" : "Activer"}</button>
    </form>
  );
}

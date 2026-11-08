"use client";

import { useActionState } from "react";
import { ChevronLeft } from "lucide-react";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { requestLoginLink } from "../actions";

/** Forgotten password (or account without one): a sign-in link by email, then a new password in "Mon compte". */
export default function LoginLinkForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(requestLoginLink, {});
  const back = (
    <button type="button" className="client-login-text-btn client-login-back-btn" onClick={onBack}>
      <ChevronLeft size={14} aria-hidden="true" /> Retour à la connexion
    </button>
  );

  if (state.ok) {
    return (
      <div className="adm-form">
        <p className="adm-ok" role="status">{state.ok} Pensez à vérifier vos spams.</p>
        {back}
      </div>
    );
  }

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <h2 className="client-login-heading">Mot de passe oublié</h2>
      <p className="adm-muted">Recevez un lien de connexion par email, puis choisissez un nouveau mot de passe dans « Mon compte ».</p>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir mon lien"}
      </button>
      {back}
    </form>
  );
}

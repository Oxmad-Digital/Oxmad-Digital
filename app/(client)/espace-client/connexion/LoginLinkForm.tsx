"use client";

import { useActionState } from "react";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { requestLoginLink } from "../actions";

export default function LoginLinkForm() {
  const [state, action, pending] = useActionState(requestLoginLink, {});

  if (state.ok) return <p className="adm-ok" role="status">{state.ok} Pensez à vérifier vos spams.</p>;

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <p className="adm-muted">Recevez un lien de connexion par email, puis choisissez un nouveau mot de passe dans « Mon compte ».</p>
      <label htmlFor="link-email">Email</label>
      <input id="link-email" name="email" type="email" autoComplete="email" required />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}

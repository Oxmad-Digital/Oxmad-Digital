"use client";

import { useActionState } from "react";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { requestAccess } from "../actions";

export default function SignupForm() {
  const [state, action, pending] = useActionState(requestAccess, {});

  if (state.ok) return <p className="adm-ok" role="status">{state.ok} Pensez à vérifier vos spams.</p>;

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <label htmlFor="name">Votre nom</label>
      <input id="name" name="name" autoComplete="name" required maxLength={120} autoFocus />
      <label htmlFor="company">Entreprise</label>
      <input id="company" name="company" autoComplete="organization" required maxLength={120} />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="message">Message (facultatif)</label>
      <textarea id="message" name="message" rows={3} maxLength={2000} placeholder="Site concerné, personne de l'agence avec qui vous travaillez…" />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import PasswordInput from "@/components/portal/PasswordInput";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { requestAccess } from "../actions";

export default function SignupForm({ minLength }: { minLength: number }) {
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
      <label htmlFor="password">Mot de passe ({minLength} caractères min.)</label>
      <PasswordInput id="password" name="password" autoComplete="new-password" minLength={minLength} required />
      <label htmlFor="confirm">Confirmer le mot de passe</label>
      <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={minLength} required />
      <label htmlFor="message">Message (facultatif)</label>
      <textarea id="message" name="message" rows={3} maxLength={2000} placeholder="Site concerné, personne de l'agence avec qui vous travaillez…" />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
      <p className="adm-muted">
        Ces informations servent uniquement à créer et gérer votre accès. Une demande non confirmée est supprimée
        après 30 jours, une demande refusée après 6 mois.{" "}
        <a href="/mentions-legales#confidentialite" target="_blank" rel="noopener">Politique de confidentialité</a>
      </p>
    </form>
  );
}

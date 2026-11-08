"use client";

import { useActionState } from "react";
import PasswordInput from "@/components/portal/PasswordInput";
import { keepValuesOnSubmit } from "@/components/portal/submit";
import { loginClient } from "../actions";

export default function PasswordLoginForm() {
  const [state, action, pending] = useActionState(loginClient, {});

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-form">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      <label htmlFor="password">Mot de passe</label>
      <PasswordInput id="password" name="password" autoComplete="current-password" required />
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

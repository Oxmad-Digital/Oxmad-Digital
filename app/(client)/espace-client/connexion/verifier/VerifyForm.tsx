"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyLogin } from "../../actions";

export default function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyLogin, {});

  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="adm-error" role="alert">{state.error} <Link href="/espace-client/connexion">Nouveau lien</Link></p>
      ) : (
        <button type="submit" className="adm-btn adm-btn-primary" disabled={pending} autoFocus>
          {pending ? "Connexion…" : "Me connecter"}
        </button>
      )}
    </form>
  );
}

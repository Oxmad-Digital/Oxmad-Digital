"use client";

import { useActionState, useEffect, useRef } from "react";
import { FolderPlus } from "lucide-react";
import { createFolder } from "@/lib/portal-actions";
import { keepValuesOnSubmit } from "./submit";

export default function NewFolderForm({ clientId, parentId }: { clientId: string | null; parentId: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createFolder, {});

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} onSubmit={keepValuesOnSubmit(action)} className="adm-inline-form">
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input name="name" placeholder="Nouveau dossier" aria-label="Nom du nouveau dossier" maxLength={80} required />
      <button className="adm-btn" disabled={pending}><FolderPlus size={14} aria-hidden="true" /> Créer</button>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
    </form>
  );
}

"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { uploadFiles } from "./uploads";

type FormState = { error?: string; ok?: string };

/**
 * A server-action form with attachments: files are uploaded to the bucket first, then the action
 * receives them as JSON in `uploads`. Resets itself after a successful submit.
 */
export default function AttachForm({ action, clientId = null, submitLabel, fileLabel = "Joindre des fichiers", requireFile = false, children }: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  clientId?: string | null;
  submitLabel: string;
  fileLabel?: string;
  requireFile?: boolean;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, {});
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    formData.delete("files");
    setUploadError(null);
    try {
      if (files.length) setProgress(0);
      formData.set("uploads", JSON.stringify(await uploadFiles(files, clientId, setProgress)));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Échec de l'envoi des fichiers.");
      return;
    } finally {
      setProgress(null);
    }
    setNames([]);
    startTransition(() => formAction(formData));
  }

  const busy = pending || progress !== null;
  const error = uploadError ?? state.error;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="adm-form">
      {children}
      <label className="adm-file">
        <Paperclip size={15} aria-hidden="true" />
        <span>{names.length ? names.join(", ") : fileLabel}</span>
        <input
          type="file"
          name="files"
          multiple={!requireFile}
          required={requireFile}
          accept={requireFile ? "application/pdf" : undefined}
          onChange={(e) => setNames(Array.from(e.currentTarget.files ?? [], (f) => f.name))}
        />
      </label>
      {progress !== null && <progress className="adm-progress" value={progress} max={1} aria-label="Envoi des fichiers" />}
      {error && <p className="adm-error" role="alert">{error}</p>}
      {state.ok && !busy && <p className="adm-ok" role="status">{state.ok}</p>}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
        {progress !== null ? `Envoi… ${Math.round(progress * 100)} %` : pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}

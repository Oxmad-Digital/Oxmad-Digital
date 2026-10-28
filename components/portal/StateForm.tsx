"use client";

import { useActionState, useEffect, useRef } from "react";
import { keepValuesOnSubmit } from "./submit";

type FormState = { error?: string; ok?: string };

/** A server-action form showing the action's error / success message. `reset` clears it after success. */
export default function StateForm({ action, submitLabel, pendingLabel = "Enregistrement…", className = "adm-form", reset = false, children }: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  reset?: boolean;
  children?: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (reset && state.ok) formRef.current?.reset();
  }, [state, reset]);

  return (
    <form ref={formRef} action={formAction} onSubmit={keepValuesOnSubmit(formAction)} className={className}>
      {children}
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>{pending ? pendingLabel : submitLabel}</button>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && <p className="adm-ok" role="status">{state.ok}</p>}
    </form>
  );
}

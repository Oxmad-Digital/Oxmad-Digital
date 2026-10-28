"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useBookCall } from "@/components/BookCall/BookCallContext";
import { EMAIL_RE } from "@/lib/site";
import "./ContactDialog.css";

type Status = "idle" | "submitting" | "success" | "error";

const PROJECT_TYPES = ["Site vitrine", "Site e-commerce", "Refonte d'un site", "Développement sur mesure", "Autre projet"];
const GENERIC_ERROR = "Une erreur est survenue. Veuillez réessayer.";

export type ContactDialogHandle = { open: () => void };

const ContactDialog = forwardRef<ContactDialogHandle>(function ContactDialog(_, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { open: openBookCall, preload: preloadBookCall } = useBookCall();

  useImperativeHandle(ref, () => ({
    open() {
      preloadBookCall();
      setStatus("idle");
      setErrorMessage("");
      dialogRef.current?.showModal();
    },
  }), [preloadBookCall]);

  const close = () => dialogRef.current?.close();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const project = String(data.get("project") || "");
    const details = String(data.get("message") || "").trim();

    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      setErrorMessage("Merci de renseigner une adresse e-mail valide.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          email,
          message: `Projet : ${project}${details ? `\n\n${details}` : ""}`,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || GENERIC_ERROR);
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : GENERIC_ERROR);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="contact-dialog"
      aria-labelledby="contactDialogTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-body">
        <button className="dialog-close" type="button" aria-label="Fermer" onClick={close}>✕</button>
        <div className="section-marker smallcap"><span>Parlons de votre projet</span></div>
        {status === "success" ? (
          <>
            <h2 id="contactDialogTitle">Message envoyé.</h2>
            <p>Merci ! Nous revenons vers vous très rapidement.</p>
            <button type="button" className="dialog-submit" onClick={close}>Fermer</button>
          </>
        ) : (
          <>
            <h2 id="contactDialogTitle">Tout commence ici.</h2>
            <p>Quelques mots sur vous et votre idée : nous vous répondons rapidement.</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="clientName">Votre nom</label>
                <input id="clientName" name="name" required autoComplete="name" placeholder="Comment vous appelez-vous ?" />
              </div>
              <div className="field">
                <label htmlFor="clientEmail">Votre e-mail</label>
                <input id="clientEmail" name="email" type="email" required autoComplete="email" placeholder="Où pouvons-nous vous répondre ?" />
              </div>
              <div className="field">
                <label htmlFor="clientProject">Quel est votre projet ?</label>
                <select id="clientProject" name="project">
                  {PROJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="clientMessage">Quelques mots</label>
                <textarea id="clientMessage" name="message" rows={3} placeholder="Parlez-nous de votre idée…" />
              </div>
              {status === "error" && <p className="dialog-error" role="alert">{errorMessage}</p>}
              <button type="submit" className="dialog-submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Envoi en cours…" : "Envoyer mon message"}
              </button>
            </form>
            <small>
              Vous préférez en parler de vive voix ?{" "}
              <button
                type="button"
                className="dialog-link"
                onPointerEnter={preloadBookCall}
                onFocus={preloadBookCall}
                onClick={() => {
                  close();
                  openBookCall();
                }}
              >
                Réserver un appel{" "}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-2px" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
            </small>
          </>
        )}
      </div>
    </dialog>
  );
});

export default ContactDialog;

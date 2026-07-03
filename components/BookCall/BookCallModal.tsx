"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import "./BookCallModal.css";

type Status = "idle" | "submitting" | "success" | "error";

export default function BookCallModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Une erreur est survenue. Veuillez réessayer.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  };

  return (
    <div
      className="ox-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ox-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ox-modal-title"
        ref={dialogRef}
      >
        <button
          type="button"
          className="ox-modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {status === "success" ? (
          <div className="ox-modal-success">
            <CheckCircle2 size={40} className="ox-modal-success-icon" />
            <h3 id="ox-modal-title">Demande envoyée !</h3>
            <p>Merci, nous revenons vers vous sous 24h pour caler votre appel.</p>
            <button type="button" className="ox-btn ox-btn-primary ox-btn-md" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h3 id="ox-modal-title" className="ox-modal-title">
              Formulaire de contact
            </h3>
            <p className="ox-modal-subtitle">
              Parlez-nous de votre projet, nous vous recontactons sous 24h.
            </p>

            <form className="ox-modal-form" onSubmit={handleSubmit}>
              <div className="ox-modal-field">
                <label htmlFor="ox-modal-name">Nom</label>
                <input id="ox-modal-name" name="name" type="text" required autoComplete="name" />
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-email">Email</label>
                <input id="ox-modal-email" name="email" type="email" required autoComplete="email" />
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-phone">Téléphone (optionnel)</label>
                <input id="ox-modal-phone" name="phone" type="tel" autoComplete="tel" />
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-message">Votre projet</label>
                <textarea id="ox-modal-message" name="message" rows={4} />
              </div>

              {status === "error" && <p className="ox-modal-error">{errorMessage}</p>}

              <button
                type="submit"
                className="ox-btn ox-btn-primary ox-btn-lg ox-modal-submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 size={16} className="ox-modal-spinner" />
                    Envoi en cours…
                  </>
                ) : (
                  "Envoyer"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

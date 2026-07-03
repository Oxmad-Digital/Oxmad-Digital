"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./BookCallModal.css";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY = {
  fr: {
    close: "Fermer",
    invalidEmail: "Merci de renseigner une adresse email valide.",
    invalidEmailFormat: "Format d'email invalide.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    successTitle: "Demande envoyée !",
    successBody: "Merci, nous revenons vers vous sous 24h pour caler votre appel.",
    formTitle: "Formulaire de contact",
    formSubtitle: "Parlez-nous de votre projet, nous vous recontactons sous 24h.",
    name: "Nom",
    email: "Email",
    phone: "Téléphone (optionnel)",
    project: "Votre projet",
    sending: "Envoi en cours…",
    send: "Envoyer",
  },
  en: {
    close: "Close",
    invalidEmail: "Please enter a valid email address.",
    invalidEmailFormat: "Invalid email format.",
    genericError: "Something went wrong. Please try again.",
    successTitle: "Request sent!",
    successBody: "Thanks, we'll get back to you within 24h to set up your call.",
    formTitle: "Contact form",
    formSubtitle: "Tell us about your project, we'll get back to you within 24h.",
    name: "Name",
    email: "Email",
    phone: "Phone (optional)",
    project: "Your project",
    sending: "Sending…",
    send: "Send",
  },
};

export default function BookCallModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const c = COPY[lang];

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
      setEmailError("");
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

    if (!EMAIL_RE.test(payload.email)) {
      setEmailError(c.invalidEmail);
      return;
    }

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
        throw new Error(body?.error || c.genericError);
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : c.genericError);
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
          aria-label={c.close}
        >
          <X size={18} />
        </button>

        {status === "success" ? (
          <div className="ox-modal-success">
            <CheckCircle2 size={40} className="ox-modal-success-icon" />
            <h3 id="ox-modal-title">{c.successTitle}</h3>
            <p>{c.successBody}</p>
            <button type="button" className="ox-btn ox-btn-primary ox-btn-md" onClick={onClose}>
              {c.close}
            </button>
          </div>
        ) : (
          <>
            <h3 id="ox-modal-title" className="ox-modal-title">
              {c.formTitle}
            </h3>
            <p className="ox-modal-subtitle">{c.formSubtitle}</p>

            <form className="ox-modal-form" onSubmit={handleSubmit}>
              <div className="ox-modal-field">
                <label htmlFor="ox-modal-name">{c.name}</label>
                <input id="ox-modal-name" name="name" type="text" required autoComplete="name" />
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-email">{c.email}</label>
                <input
                  id="ox-modal-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-invalid={emailError ? true : undefined}
                  onChange={() => emailError && setEmailError("")}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    setEmailError(value && !EMAIL_RE.test(value) ? c.invalidEmailFormat : "");
                  }}
                />
                {emailError && <p className="ox-modal-error">{emailError}</p>}
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-phone">{c.phone}</label>
                <input id="ox-modal-phone" name="phone" type="tel" autoComplete="tel" />
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-message">{c.project}</label>
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
                    {c.sending}
                  </>
                ) : (
                  c.send
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

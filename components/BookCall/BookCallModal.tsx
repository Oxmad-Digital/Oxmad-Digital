"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./BookCallModal.css";

type Status = "idle" | "submitting" | "success" | "error";
type Slot = { iso: string; label: string };
type SlotsState = "idle" | "loading" | "loaded" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOOKING_WINDOW_DAYS = 21;

const COPY = {
  fr: {
    close: "Fermer",
    invalidEmail: "Merci de renseigner une adresse email valide.",
    invalidEmailFormat: "Format d'email invalide.",
    invalidSlot: "Merci de choisir un créneau pour l'appel.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    successTitle: "Rendez-vous confirmé !",
    successBody: (slot: string) => `C'est noté pour le ${slot}. Vous recevrez une invitation Google Calendar par email.`,
    formTitle: "Réserver un appel",
    formSubtitle: "Choisissez un créneau et parlez-nous de votre projet.",
    name: "Nom",
    email: "Email",
    phone: "Téléphone (optionnel)",
    project: "Votre projet",
    date: "Date",
    time: "Heure",
    pickDateFirst: "Choisissez d'abord une date.",
    loadingSlots: "Chargement des créneaux…",
    noSlots: "Aucun créneau disponible ce jour-là, essayez une autre date.",
    slotsErrorText: "Impossible de charger les créneaux.",
    sending: "Envoi en cours…",
    send: "Confirmer le rendez-vous",
  },
  en: {
    close: "Close",
    invalidEmail: "Please enter a valid email address.",
    invalidEmailFormat: "Invalid email format.",
    invalidSlot: "Please choose a time slot for the call.",
    genericError: "Something went wrong. Please try again.",
    successTitle: "Appointment confirmed!",
    successBody: (slot: string) => `You're booked for ${slot}. You'll receive a Google Calendar invite by email.`,
    formTitle: "Book a call",
    formSubtitle: "Pick a time slot and tell us about your project.",
    name: "Name",
    email: "Email",
    phone: "Phone (optional)",
    project: "Your project",
    date: "Date",
    time: "Time",
    pickDateFirst: "Pick a date first.",
    loadingSlots: "Loading time slots…",
    noSlots: "No slots available that day, try another date.",
    slotsErrorText: "Couldn't load time slots.",
    sending: "Sending…",
    send: "Confirm appointment",
  },
};

function antananarivoDateString(offsetDays = 0) {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

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
  const [slotError, setSlotError] = useState("");
  const [confirmedSlotLabel, setConfirmedSlotLabel] = useState("");

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsState, setSlotsState] = useState<SlotsState>("idle");
  const [selectedSlot, setSelectedSlot] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const c = COPY[lang];

  const minDate = antananarivoDateString();
  const maxDate = antananarivoDateString(BOOKING_WINDOW_DAYS);

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
      setSlotError("");
      setDate("");
      setSlots([]);
      setSlotsState("idle");
      setSelectedSlot("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSlotsState("idle");
      return;
    }

    let cancelled = false;
    setSlotsState("loading");
    setSelectedSlot("");
    setSlotError("");

    fetch(`/api/book-call/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.slots)) throw new Error(data.error || "invalid response");
        setSlots(data.slots);
        setSlotsState("loaded");
      })
      .catch(() => {
        if (!cancelled) setSlotsState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

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
      slot: selectedSlot,
    };

    if (!EMAIL_RE.test(payload.email)) {
      setEmailError(c.invalidEmail);
      return;
    }

    if (!payload.slot) {
      setSlotError(c.invalidSlot);
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

      const resBody = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resBody?.error || c.genericError);
      }

      setConfirmedSlotLabel(resBody?.slotLocal || "");
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
            <p>{c.successBody(confirmedSlotLabel)}</p>
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
                <label htmlFor="ox-modal-date">{c.date}</label>
                <input
                  id="ox-modal-date"
                  type="date"
                  required
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="ox-modal-field">
                <label>{c.time}</label>
                {!date && <p className="ox-modal-hint">{c.pickDateFirst}</p>}
                {date && slotsState === "loading" && <p className="ox-modal-hint">{c.loadingSlots}</p>}
                {date && slotsState === "error" && <p className="ox-modal-error">{c.slotsErrorText}</p>}
                {date && slotsState === "loaded" && slots.length === 0 && (
                  <p className="ox-modal-hint">{c.noSlots}</p>
                )}
                {date && slotsState === "loaded" && slots.length > 0 && (
                  <div className="ox-modal-slots">
                    {slots.map((slot) => (
                      <button
                        key={slot.iso}
                        type="button"
                        className={`ox-modal-slot ${selectedSlot === slot.iso ? "ox-modal-slot-active" : ""}`}
                        onClick={() => {
                          setSelectedSlot(slot.iso);
                          setSlotError("");
                        }}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
                {slotError && <p className="ox-modal-error">{slotError}</p>}
              </div>

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

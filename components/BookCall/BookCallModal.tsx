"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { generateDaySlots, slotLabel } from "@/lib/booking";
import { motionWindow } from "@/lib/motion";
import { EMAIL_RE, TIMEZONE } from "@/lib/site";
import "./BookCallModal.css";

type Status = "idle" | "submitting" | "success" | "error";
type CallChannel = "phone" | "whatsapp";

const BOOKING_WINDOW_DAYS = 21;

const COPY = {
  close: "Fermer",
  invalidEmail: "Merci de renseigner une adresse email valide.",
  invalidEmailFormat: "Format d'email invalide.",
  invalidSlot: "Merci de choisir un créneau pour l'appel.",
  genericError: "Une erreur est survenue. Veuillez réessayer.",
  successTitle: "Rendez-vous confirmé !",
  successBody: (slot: string) => `C'est noté pour le ${slot}. Nous vous recontactons pour confirmer le rendez-vous.`,
  formTitle: "Réserver un appel",
  formSubtitle: "Choisissez un créneau et parlez-nous de votre projet.",
  name: "Nom",
  email: "Email",
  phone: "Téléphone",
  channel: "Comment préférez-vous être appelé ?",
  channels: { phone: "Appel téléphonique", whatsapp: "WhatsApp" } as Record<CallChannel, string>,
  project: "Votre projet",
  date: "Date",
  time: "Heure",
  pickDateFirst: "Choisissez d'abord une date.",
  noSlots: "Aucun créneau ce jour-là : les rendez-vous ont lieu du lundi au vendredi, de 9h à 19h.",
  sending: "Envoi en cours…",
  send: "Confirmer le rendez-vous",
};

/** YYYY-MM-DD in Antananarivo, `offsetDays` from today ("en-CA" formats dates that way). */
function antananarivoDateString(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: TIMEZONE });
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
  const [selectedSlot, setSelectedSlot] = useState("");
  const [channel, setChannel] = useState<CallChannel>("phone");

  const dialogRef = useRef<HTMLDivElement>(null);
  const c = COPY;

  const minDate = antananarivoDateString();
  const maxDate = antananarivoDateString(BOOKING_WINDOW_DAYS);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    // Lenis drives the page scroll: pause it so the wheel only scrolls the modal.
    const lenis = motionWindow().__oxLenis;
    lenis?.stop();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
      setEmailError("");
      setSlotError("");
      setDate("");
      setSelectedSlot("");
      setChannel("phone");
    }
  }, [isOpen]);

  const slots = useMemo(() => (date ? generateDaySlots(date) : []), [date]);

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
      channel,
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
      data-lenis-prevent
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
            <button type="button" className="ox-modal-submit" onClick={onClose}>
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
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlot("");
                    setSlotError("");
                  }}
                />
              </div>

              <div className="ox-modal-field">
                <label>{c.time}</label>
                {!date && <p className="ox-modal-hint">{c.pickDateFirst}</p>}
                {date && slots.length === 0 && <p className="ox-modal-hint">{c.noSlots}</p>}
                {slots.length > 0 && (
                  <div className="ox-modal-slots">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`ox-modal-slot ${selectedSlot === slot ? "ox-modal-slot-active" : ""}`}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSlotError("");
                        }}
                      >
                        {slotLabel(slot)}
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
                <input id="ox-modal-phone" name="phone" type="tel" required autoComplete="tel" />
              </div>

              <div className="ox-modal-field">
                <label>{c.channel}</label>
                <div className="ox-modal-slots ox-modal-channels" role="radiogroup" aria-label={c.channel}>
                  {(Object.keys(c.channels) as CallChannel[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={channel === value}
                      className={`ox-modal-slot ${channel === value ? "ox-modal-slot-active" : ""}`}
                      onClick={() => setChannel(value)}
                    >
                      {c.channels[value]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ox-modal-field">
                <label htmlFor="ox-modal-message">{c.project}</label>
                <textarea id="ox-modal-message" name="message" rows={4} />
              </div>

              {status === "error" && <p className="ox-modal-error">{errorMessage}</p>}

              <button
                type="submit"
                className="ox-modal-submit"
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

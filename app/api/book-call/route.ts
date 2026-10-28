import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/email";
import { saveBooking } from "@/lib/db";
import { generateDaySlots } from "@/lib/booking";
import { EMAIL_RE, TIMEZONE } from "@/lib/site";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";

const SLOT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/;

export async function POST(request: Request) {
  if (!(await rateLimit(`book:${clientIp(request.headers)}`, 5, 600))) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();
  const slot = String(body.slot || "").trim();
  const channel = body.channel === "whatsapp" ? "WhatsApp" : "Appel téléphonique";

  if (!name || !email || !EMAIL_RE.test(email) || !phone) {
    return NextResponse.json({ error: "Nom, email et téléphone valides requis." }, { status: 400 });
  }

  if (!slot || !SLOT_RE.test(slot) || !generateDaySlots(slot.slice(0, 10)).includes(slot)) {
    return NextResponse.json({ error: "Merci de choisir un créneau valide." }, { status: 400 });
  }

  const start = new Date(slot);
  const slotLocal = start.toLocaleString("fr-FR", {
    timeZone: TIMEZONE,
    dateStyle: "long",
    timeStyle: "short",
  });

  const saved = await saveBooking({ slot: start, name, email, phone, channel, message });
  const sent = await sendNotification({
    subject: `Nouveau rendez-vous — ${name} (${slotLocal})`,
    title: "Nouveau rendez-vous réservé",
    note: "à confirmer par un rappel",
    replyTo: { name, email },
    fields: [
      { label: "Rendez-vous", value: slotLocal },
      { label: "Nom", value: name },
      { label: "Email", value: email, href: `mailto:${encodeURIComponent(email)}` },
      { label: "Téléphone", value: phone, href: `tel:${encodeURIComponent(phone)}` },
      { label: "Préférence", value: channel },
      { label: "Message", value: message, multiline: true },
    ],
  });

  // Stored in the admin or emailed: either way the booking is not lost.
  if (sent !== "sent" && !saved) {
    return NextResponse.json({ error: "Échec de l'envoi de la demande. Merci de réessayer." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, slot: start.toISOString(), slotLocal });
}

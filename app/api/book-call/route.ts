import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CALENDAR_ID, SLOT_MINUTES, TIMEZONE, getCalendarClient } from "@/lib/googleCalendar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLOT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/;
const MIN_NOTICE_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();
  const slot = String(body.slot || "").trim();

  if (!name || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Nom et email valides requis." }, { status: 400 });
  }

  if (!slot || !SLOT_RE.test(slot) || new Date(slot).getTime() < Date.now() + MIN_NOTICE_MS) {
    return NextResponse.json({ error: "Merci de choisir un créneau valide." }, { status: 400 });
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    console.error("Google Calendar n'est pas configuré (variables d'environnement manquantes)");
    return NextResponse.json(
      { error: "La prise de rendez-vous n'est pas configurée. Merci de nous contacter directement." },
      { status: 500 }
    );
  }

  const start = new Date(slot);
  const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

  try {
    const freebusy = await calendar.freebusy.query({
      requestBody: { timeMin: start.toISOString(), timeMax: end.toISOString(), items: [{ id: CALENDAR_ID }] },
    });
    const busy = freebusy.data.calendars?.[CALENDAR_ID]?.busy || [];
    if (busy.length > 0) {
      return NextResponse.json({ error: "Ce créneau vient d'être réservé. Merci d'en choisir un autre." }, { status: 409 });
    }

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      sendUpdates: "all",
      requestBody: {
        summary: `Appel découverte — ${name}`,
        description: message || undefined,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        attendees: [{ email, displayName: name }],
      },
    });
  } catch (err) {
    console.error("Google Calendar error:", err);
    return NextResponse.json({ error: "Échec de la création du rendez-vous. Merci de réessayer." }, { status: 502 });
  }

  const slotLocal = start.toLocaleString("fr-FR", {
    timeZone: TIMEZONE,
    dateStyle: "long",
    timeStyle: "short",
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const to = process.env.CONTACT_EMAIL_TO || "contact@oxmad-digital.mg";
  const from = process.env.CONTACT_EMAIL_FROM || "Oxmad Digital — Site Web <onboarding@resend.dev>";

  const receivedAt = new Date().toLocaleString("fr-FR", {
    timeZone: "Indian/Antananarivo",
    dateStyle: "long",
    timeStyle: "short",
  });

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Nouveau rendez-vous — ${name} (${slotLocal})`,
    html: buildEmailHtml({ name, email, phone, message, receivedAt, slotLocal }),
    text: buildEmailText({ name, email, phone, message, receivedAt, slotLocal }),
  });

  if (error) {
    console.error("Resend error:", error);
  }

  return NextResponse.json({ ok: true, slot: start.toISOString(), slotLocal });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailData = {
  name: string;
  email: string;
  phone: string;
  message: string;
  receivedAt: string;
  slotLocal: string;
};

function buildEmailHtml({ name, email, phone, message, receivedAt, slotLocal }: EmailData) {
  const field = (label: string, value: string) => `
          <tr>
            <td style="padding:14px 26px;border-bottom:1px solid rgba(27,25,22,.12);">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#828e0e;font-weight:700;">${label}</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#1b1916;">${value}</p>
            </td>
          </tr>`;

  const rows = [
    field("Rendez-vous", escapeHtml(slotLocal)),
    field("Nom", escapeHtml(name)),
    field("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color:#1b1916;text-decoration:underline;">${escapeHtml(email)}</a>`),
    phone ? field("Téléphone", `<a href="tel:${encodeURIComponent(phone)}" style="color:#1b1916;text-decoration:underline;">${escapeHtml(phone)}</a>`) : "",
    message
      ? field("Message", `<span style="white-space:pre-wrap;">${escapeHtml(message).replace(/\n/g, "<br/>")}</span>`)
      : "",
  ].join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f2;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid rgba(27,25,22,.12);border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#1b1916;padding:22px 26px;border-bottom:3px solid #d9cc01;">
            <span style="font-family:'Space Grotesk',Arial,sans-serif;color:#ffffff;font-size:15px;font-weight:700;letter-spacing:.01em;">OXMAD<span style="color:#d9cc01;">·</span>DIGITAL</span>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 26px 4px;">
            <h2 style="margin:0;font-family:'Space Grotesk',Arial,sans-serif;font-size:19px;letter-spacing:-0.01em;color:#1b1916;">Nouveau rendez-vous réservé</h2>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(27,25,22,.45);">Reçue le ${escapeHtml(receivedAt)} via le formulaire du site — déjà ajouté au Google Calendar</p>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
              ${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 26px 24px;">
            <a href="mailto:${encodeURIComponent(email)}" style="display:inline-block;background:#d9cc01;color:#1b1916;font-weight:700;font-size:13.5px;padding:11px 20px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;">Répondre à ${escapeHtml(name)} →</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 26px 22px;font-size:11.5px;color:rgba(27,25,22,.45);border-top:1px solid rgba(27,25,22,.12);font-family:Arial,sans-serif;">
            Ce message a été envoyé automatiquement depuis le formulaire de contact d'oxmad-digital.mg.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function buildEmailText({ name, email, phone, message, receivedAt, slotLocal }: EmailData) {
  return [
    "Nouveau rendez-vous réservé",
    `Reçue le ${receivedAt} via le formulaire du site — déjà ajouté au Google Calendar`,
    "",
    `Rendez-vous : ${slotLocal}`,
    `Nom : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : "",
    message ? `Message :\n${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

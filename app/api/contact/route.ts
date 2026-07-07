import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "Nom, email valide et message requis." }, { status: 400 });
  }

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
    subject: `Nouveau message de contact — ${name}`,
    html: buildEmailHtml({ name, email, phone, message, receivedAt }),
    text: buildEmailText({ name, email, phone, message, receivedAt }),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Échec de l'envoi du message. Merci de réessayer." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
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
};

function buildEmailHtml({ name, email, phone, message, receivedAt }: EmailData) {
  const field = (label: string, value: string) => `
          <tr>
            <td style="padding:14px 26px;border-bottom:1px solid rgba(27,25,22,.12);">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#828e0e;font-weight:700;">${label}</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#1b1916;">${value}</p>
            </td>
          </tr>`;

  const rows = [
    field("Nom", escapeHtml(name)),
    field("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color:#1b1916;text-decoration:underline;">${escapeHtml(email)}</a>`),
    phone ? field("Téléphone", `<a href="tel:${encodeURIComponent(phone)}" style="color:#1b1916;text-decoration:underline;">${escapeHtml(phone)}</a>`) : "",
    field("Message", `<span style="white-space:pre-wrap;">${escapeHtml(message).replace(/\n/g, "<br/>")}</span>`),
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
            <h2 style="margin:0;font-family:'Space Grotesk',Arial,sans-serif;font-size:19px;letter-spacing:-0.01em;color:#1b1916;">Nouveau message de contact</h2>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(27,25,22,.45);">Reçu le ${escapeHtml(receivedAt)} via le formulaire du site</p>
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

function buildEmailText({ name, email, phone, message, receivedAt }: EmailData) {
  return [
    "Nouveau message de contact",
    `Reçu le ${receivedAt} via le formulaire du site`,
    "",
    `Nom : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : "",
    `Message :\n${message}`,
  ]
    .filter(Boolean)
    .join("\n");
}

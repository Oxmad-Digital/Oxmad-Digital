import { Resend } from "resend";
import { CONTACT_EMAIL, TIMEZONE } from "./site";

export type EmailField = { label: string; value: string; href?: string; multiline?: boolean };

type Notification = {
  subject: string;
  title: string;
  /** Appended to "Reçu le … via le formulaire du site". */
  note?: string;
  replyTo: { name: string; email: string };
  fields: EmailField[];
};

/** Sends a form notification to the studio inbox. Empty fields are left out. */
export async function sendNotification({ subject, title, note, replyTo, fields }: Notification) {
  const receivedAt = new Date().toLocaleString("fr-FR", { timeZone: TIMEZONE, dateStyle: "long", timeStyle: "short" });
  return sendEmail({
    to: process.env.CONTACT_EMAIL_TO || CONTACT_EMAIL,
    replyTo: replyTo.email,
    subject,
    title,
    intro: `Reçu le ${receivedAt} via le formulaire du site${note ? ` — ${note}` : ""}`,
    fields,
    cta: { label: `Répondre à ${replyTo.name} →`, href: `mailto:${encodeURIComponent(replyTo.email)}` },
    footer: "Ce message a été envoyé automatiquement depuis le formulaire de contact d'oxmad-digital.mg.",
  });
}

type Email = {
  to: string | string[];
  replyTo?: string;
  subject: string;
  title: string;
  intro: string;
  fields?: EmailField[];
  cta?: { label: string; href: string };
  footer: string;
};

/** Sends a branded email (form notifications, client area). Empty fields are left out. */
export async function sendEmail({ to, replyTo, subject, title, intro, fields = [], cta, footer }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return "unconfigured" as const;
  }

  const filled = fields.filter((f) => f.value);
  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.CONTACT_EMAIL_FROM || "Oxmad Digital — Site Web <onboarding@resend.dev>",
    to,
    replyTo,
    subject,
    html: buildHtml({ title, intro, fields: filled, cta, footer }),
    text: [
      title,
      intro,
      "",
      ...filled.map((f) => `${f.label} :${f.multiline ? "\n" : " "}${f.value}`),
      ...(cta && !cta.href.startsWith("mailto:") ? ["", `${cta.label} ${cta.href}`] : []),
    ].join("\n"),
  });

  if (error) {
    console.error("Resend error:", error);
    return "failed" as const;
  }
  return "sent" as const;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fieldValue({ value, href, multiline }: EmailField) {
  if (href) return `<a href="${href}" style="color:#1b1916;text-decoration:underline;">${escapeHtml(value)}</a>`;
  if (multiline) return `<span style="white-space:pre-wrap;">${escapeHtml(value).replace(/\n/g, "<br/>")}</span>`;
  return escapeHtml(value);
}

function buildHtml({ title, intro, fields, cta, footer }: Pick<Email, "title" | "intro" | "cta" | "footer"> & { fields: EmailField[] }) {
  const rows = fields.map((field) => `
          <tr>
            <td style="padding:14px 26px;border-bottom:1px solid rgba(27,25,22,.12);">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#828e0e;font-weight:700;">${field.label}</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#1b1916;">${fieldValue(field)}</p>
            </td>
          </tr>`).join("");

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
            <h2 style="margin:0;font-family:'Space Grotesk',Arial,sans-serif;font-size:19px;letter-spacing:-0.01em;color:#1b1916;">${escapeHtml(title)}</h2>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(27,25,22,.45);">${escapeHtml(intro)}</p>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
              ${rows}
            </table>
          </td>
        </tr>
        ${cta ? `<tr>
          <td style="padding:20px 26px 24px;">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#d9cc01;color:#1b1916;font-weight:700;font-size:13.5px;padding:11px 20px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:16px 26px 22px;font-size:11.5px;color:rgba(27,25,22,.45);border-top:1px solid rgba(27,25,22,.12);font-family:Arial,sans-serif;">
            ${escapeHtml(footer)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

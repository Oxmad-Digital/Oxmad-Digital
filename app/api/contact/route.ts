import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/email";
import { saveContactMessage } from "@/lib/db";
import { EMAIL_RE } from "@/lib/site";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!(await rateLimit(`contact:${clientIp(request.headers)}`, 5, 600))) {
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

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "Nom, email valide et message requis." }, { status: 400 });
  }

  const saved = await saveContactMessage({ name, email, phone, message });
  const result = await sendNotification({
    subject: `Nouveau message de contact — ${name}`,
    title: "Nouveau message de contact",
    replyTo: { name, email },
    fields: [
      { label: "Nom", value: name },
      { label: "Email", value: email, href: `mailto:${encodeURIComponent(email)}` },
      { label: "Téléphone", value: phone, href: `tel:${encodeURIComponent(phone)}` },
      { label: "Message", value: message, multiline: true },
    ],
  });

  // Stored in the admin or emailed: either way the message is not lost.
  if (result === "failed" && !saved) {
    return NextResponse.json({ error: "Échec de l'envoi du message. Merci de réessayer." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumeLoginToken, createLoginToken, endClientSession, requireClient, sendLoginLink, startClientSession } from "@/lib/client-auth";
import { getProjects, insertFiles, notifyStudio, rejectUploads, sql, verifyUploads } from "@/lib/portal";
import { REQUEST_KINDS, type RequestKind } from "@/lib/portal-labels";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { EMAIL_RE } from "@/lib/site";

type FormState = { error?: string; ok?: string };

/** Emails a sign-in link. Same answer whether the account exists or not, so emails can't be probed. */
export async function requestLoginLink(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };

  if (!(await rateLimit(`link:${clientIp(await headers())}`, 5, 900))) return { error: TOO_MANY };

  const created = await createLoginToken(email);
  if (created) {
    await sendLoginLink(created);
  } else {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return { ok: "Si cette adresse a accès à un espace client, un lien de connexion vient de lui être envoyé." };
}

/** The emailed link opens a page with a button: mail scanners that follow links don't use up the token. */
export async function verifyLogin(_state: FormState, formData: FormData): Promise<FormState> {
  // Tokens are 256-bit, but this also caps abusive hammering of the endpoint.
  if (!(await rateLimit(`verify:${clientIp(await headers())}`, 20, 900))) return { error: TOO_MANY };
  const user = await consumeLoginToken(String(formData.get("token") || ""));
  if (!user) return { error: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau." };
  await startClientSession(user);
  redirect("/espace-client");
}

export async function logoutClient() {
  await endClientSession();
  redirect("/espace-client/connexion");
}

export async function createRequest(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireClient();
  const kind = String(formData.get("kind")) as RequestKind;
  const title = String(formData.get("title") || "").trim().slice(0, 160);
  const body = String(formData.get("body") || "").trim().slice(0, 10_000);
  const expected = String(formData.get("expected") || "").trim().slice(0, 10_000) || null;
  const rawUrl = String(formData.get("pageUrl") || "").trim().slice(0, 500);
  // Same leniency as project URLs: "exemple.com/contact" gets https:// added.
  const pageUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl.replace(/^\/+/, "")}` : rawUrl || null;
  const urgent = formData.get("urgent") === "on";
  const projects = await getProjects(user.clientId);
  const project = projects.find((p) => p.id === String(formData.get("projectId")));
  const reject = (error: string) => rejectUploads(user.clientId, formData, error);

  if (!(kind in REQUEST_KINDS)) return reject("Choisissez un type de demande.");
  if (projects.length > 0 && !project) return reject("Choisissez le site concerné.");
  if (!title || !body) return reject("Titre et constat requis.");
  if (pageUrl && !/^https?:\/\/[^\s/.]+\.\S+$/i.test(pageUrl)) return reject("Lien de la page invalide (ex. : exemple.com/contact).");

  let uploads;
  try {
    uploads = await verifyUploads(user.clientId, formData.get("uploads"));
  } catch (error) {
    console.error("createRequest uploads failed:", error);
    return reject("Les pièces jointes n'ont pas pu être enregistrées. Merci de réessayer.");
  }

  const [request] = await sql()`INSERT INTO client_requests (client_id, project_id, author_id, kind, title, body, page_url, expected, urgent)
    VALUES (${user.clientId}, ${project?.id ?? null}, ${user.id}, ${kind}, ${title}, ${body}, ${pageUrl}, ${expected}, ${urgent}) RETURNING id`;
  const id = String(request.id);
  await insertFiles({ kind: "client", name: user.name, clientId: user.clientId, userId: user.id }, uploads, { requestId: id });

  await notifyStudio({
    subject: `${urgent ? "[Urgent] " : ""}Nouvelle demande — ${user.clientName} — ${title}`,
    title: "Nouvelle demande de modification",
    intro: `${user.name} (${user.clientName}) a créé une demande depuis l'espace client.`,
    fields: [
      { label: "Type", value: REQUEST_KINDS[kind].label + (urgent ? " — urgent" : "") },
      { label: "Site", value: project?.name ?? "" },
      { label: "Titre", value: title },
      { label: "Page", value: pageUrl ?? "" },
      { label: "Constat", value: body, multiline: true },
      { label: "Souhaité", value: expected ?? "", multiline: true },
      { label: "Pièces jointes", value: uploads.map((u) => u.name).join(", ") },
    ],
    path: `/admin/demandes/${id}`,
    cta: "Qualifier la demande →",
  }, user.email);

  revalidatePath("/espace-client", "layout");
  revalidatePath("/admin", "layout");
  redirect(`/espace-client/demandes/${id}`);
}

/** A request can be withdrawn until the studio has looked at it. */
export async function cancelRequest(formData: FormData) {
  const user = await requireClient();
  const id = String(formData.get("id"));
  if (!/^\d+$/.test(id)) return;
  const [cancelled] = await sql()`UPDATE client_requests SET status = 'cancelled', updated_at = now(), last_message_by = 'client'
    WHERE id = ${id} AND client_id = ${user.clientId} AND status = 'new' RETURNING id`;
  if (cancelled) {
    await sql()`INSERT INTO client_request_messages (request_id, author_kind, author_name, body)
      VALUES (${id}, 'system', ${user.name}, ${`Demande annulée par ${user.name}`})`;
  }
  revalidatePath("/espace-client", "layout");
  revalidatePath("/admin", "layout");
}

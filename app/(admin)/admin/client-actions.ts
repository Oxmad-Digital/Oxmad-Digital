"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeEmail, requireAdmin } from "@/lib/admin-auth";
import { createLoginToken, sendLoginLink } from "@/lib/client-auth";
import { sendEmail } from "@/lib/email";
import { getRequest, notifyClient, purgeClient, rejectUploads, sql, verifyUploads } from "@/lib/portal";
import { CURRENCIES, DOCUMENT_KINDS, DOCUMENT_STATUSES, formatAmount, REQUEST_STATUSES, type DocumentKind, type DocumentStatus, type RequestStatus } from "@/lib/portal-labels";
import { deleteObjects } from "@/lib/r2";
import { appUrl, CONTACT_EMAIL, EMAIL_RE } from "@/lib/site";
import { createClientWithDrive } from "@/lib/drive-folders";

// Admin side of the client area: clients, their access, projects, documents and request follow-up.

type FormState = { error?: string; ok?: string };

const id = (formData: FormData, name = "id") => {
  const value = String(formData.get(name) || "");
  if (!/^\d+$/.test(value)) throw new Error(`Invalid ${name}`);
  return value;
};

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/espace-client", "layout");
}

export async function createClient(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  if (!name) return { error: "Nom du client requis." };
  const clientId = await createClientWithDrive(sql(), name, String(formData.get("notes") || "").trim() || null);
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${clientId}`);
}

export async function updateClientNotes(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  if (!name) return { error: "Nom du client requis." };
  await sql()`UPDATE clients SET name = ${name}, notes = ${String(formData.get("notes") || "").trim() || null} WHERE id = ${id(formData, "clientId")}`;
  refresh();
  return { ok: "Enregistré." };
}

/** Deletes the client and everything it owns: accounts, requests, documents and stored files. */
export async function deleteClient(formData: FormData) {
  await requireAdmin();
  await purgeClient(id(formData, "clientId"));
  refresh();
  redirect("/admin/clients");
}

/**
 * Validates a sign-up: attaches it to a new client (named after the declared company) or an existing one,
 * which opens its access. Goes to the client's page, where the new access is listed.
 */
export async function approveSignup(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = id(formData);
  const target = String(formData.get("clientId") || "");
  const [user] = await sql()`SELECT name, company FROM client_users WHERE id = ${userId} AND status <> 'approved'`;
  if (!user) return { error: "Demande introuvable ou déjà validée." };
  if (target !== "new" && !/^\d+$/.test(target)) return { error: "Choisissez un client." };

  const clientId = target === "new"
    ? await createClientWithDrive(sql(), (user.company || user.name).slice(0, 120), "Créé à la validation d'une demande d'accès")
    : target;
  const [approved] = await sql()`UPDATE client_users SET client_id = ${clientId}, status = 'approved', reviewed_at = now(), review_note = NULL
    WHERE id = ${userId} AND status <> 'approved' AND EXISTS (SELECT 1 FROM clients WHERE id = ${clientId}) RETURNING email`;
  if (!approved) return { error: "Client introuvable." };

  if (formData.get("notify") === "on") {
    const token = await createLoginToken(approved.email);
    if (token) await sendLoginLink(token, "invite");
  }
  refresh();
  redirect(`/admin/clients/${clientId}`);
}

/** Refuses a sign-up: the account stays, so its owner sees the refusal (and the note) on the waiting page. */
export async function rejectSignup(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const note = String(formData.get("note") || "").trim().slice(0, 2_000) || null;
  const [user] = await sql()`UPDATE client_users SET status = 'rejected', reviewed_at = now(), review_note = ${note}
    WHERE id = ${id(formData)} AND status = 'pending' RETURNING email, name`;
  if (!user) return { error: "Demande introuvable ou déjà traitée." };
  refresh();

  if (formData.get("notify") !== "on") return { ok: "Demande refusée." };
  const sent = await sendEmail({
    to: user.email,
    replyTo: process.env.CONTACT_EMAIL_TO || CONTACT_EMAIL,
    subject: "Votre demande d'accès — Oxmad Digital",
    title: "Demande d'accès non retenue",
    intro: `Bonjour ${user.name}, nous n'avons pas pu associer votre demande à un dossier client de l'agence : l'espace client est réservé aux clients d'Oxmad Digital.`,
    fields: [{ label: "Motif", value: note ?? "", multiline: true }],
    cta: { label: "Voir ma demande →", href: appUrl("/espace-client/connexion") },
    footer: "Une erreur ? Répondez simplement à cet email.",
  });
  return sent === "sent" ? { ok: "Demande refusée, email envoyé." } : { error: "Demande refusée, mais l'email n'a pas pu être envoyé." };
}

export async function addClientUser(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const clientId = id(formData, "clientId");
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const email = normalizeEmail(String(formData.get("email") || ""));
  if (!name || !EMAIL_RE.test(email)) return { error: "Nom et email valides requis." };

  // An email waiting for validation (or refused) is attached here, which validates it.
  const created = await sql()`INSERT INTO client_users (client_id, email, name) VALUES (${clientId}, ${email}, ${name})
    ON CONFLICT (email) DO UPDATE SET client_id = EXCLUDED.client_id, name = EXCLUDED.name, status = 'approved', reviewed_at = now(), review_note = NULL
    WHERE client_users.status <> 'approved' RETURNING id`;
  if (created.length === 0) return { error: "Cet email a déjà accès à un espace client." };
  refresh();

  if (formData.get("invite") !== "on") return { ok: `Accès ajouté pour ${email}.` };
  const token = await createLoginToken(email);
  const sent = token ? await sendLoginLink(token, "invite") : "failed";
  return sent === "sent" ? { ok: `Invitation envoyée à ${email}.` } : { error: `Accès ajouté, mais l'invitation n'a pas pu être envoyée.` };
}

export async function sendClientInvite(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const [user] = await sql()`SELECT email FROM client_users WHERE id = ${id(formData)}`;
  if (!user) return { error: "Compte introuvable." };
  const token = await createLoginToken(user.email);
  if (!token) return { error: "Un lien vient déjà d'être envoyé. Réessayez dans une minute." };
  return (await sendLoginLink(token, "invite")) === "sent" ? { ok: "Lien envoyé." } : { error: "Échec de l'envoi." };
}

export async function deleteClientUser(formData: FormData) {
  await requireAdmin();
  await sql()`DELETE FROM client_users WHERE id = ${id(formData)}`;
  refresh();
}

export async function addProject(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const raw = String(formData.get("url") || "").trim();
  // "exemple.com" is accepted as is: https:// is added when no scheme is typed.
  const url = raw && !/^https?:\/\//i.test(raw) ? `https://${raw.replace(/^\/+/, "")}` : raw;
  if (!name) return { error: "Nom du projet requis." };
  if (url && !/^https?:\/\/[^\s/.]+\.\S+$/i.test(url)) return { error: "Adresse invalide (ex. : exemple.com)." };
  await sql()`INSERT INTO client_projects (client_id, name, url, maintenance)
    VALUES (${id(formData, "clientId")}, ${name}, ${url || null}, ${formData.get("maintenance") === "on"})`;
  refresh();
  return { ok: `Projet « ${name} » ajouté.` };
}

export async function toggleProjectMaintenance(formData: FormData) {
  await requireAdmin();
  await sql()`UPDATE client_projects SET maintenance = NOT maintenance WHERE id = ${id(formData)}`;
  refresh();
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  await sql()`DELETE FROM client_projects WHERE id = ${id(formData)}`;
  refresh();
}

export async function createDocument(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const clientId = id(formData, "clientId");
  const kind = String(formData.get("kind")) as DocumentKind;
  const status = String(formData.get("status")) as DocumentStatus;
  const number = String(formData.get("number") || "").trim().slice(0, 40);
  const title = String(formData.get("title") || "").trim().slice(0, 160);
  const amountRaw = String(formData.get("amount") || "").replace(/\s/g, "").replace(",", ".");
  const amount = amountRaw ? Number(amountRaw) : null;
  const currency = String(formData.get("currency"));
  const issuedOn = String(formData.get("issuedOn") || "");
  const dueOn = String(formData.get("dueOn") || "") || null;
  const reject = (error: string) => rejectUploads(clientId, formData, error);

  if (!(kind in DOCUMENT_KINDS) || DOCUMENT_STATUSES[status]?.kind !== kind) return reject("Type ou statut invalide.");
  if (!number || !title || !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) return reject("Numéro, intitulé et date requis.");
  if (amount !== null && !Number.isFinite(amount)) return reject("Montant invalide.");
  if (!(CURRENCIES as readonly string[]).includes(currency)) return reject("Devise invalide.");

  let file;
  try {
    [file] = await verifyUploads(clientId, formData.get("uploads"));
  } catch (error) {
    console.error("createDocument upload failed:", error);
    return reject("Le fichier n'a pas pu être enregistré. Merci de réessayer.");
  }
  if (!file) return { error: "Joignez le PDF du document." };

  await sql()`INSERT INTO client_documents (client_id, kind, number, title, amount, currency, issued_on, due_on, status, file_key, file_name, file_size)
    VALUES (${clientId}, ${kind}, ${number}, ${title}, ${amount}, ${currency}, ${issuedOn}, ${dueOn}, ${status}, ${file.key}, ${file.name}, ${file.size})`;

  if (formData.get("notify") === "on") {
    const label = `${DOCUMENT_KINDS[kind]} ${number}`;
    await notifyClient(clientId, {
      subject: `${kind === "quote" ? "Nouveau devis" : "Nouvelle facture"} — ${label}`,
      title: kind === "quote" ? "Un nouveau devis vous attend" : "Une nouvelle facture est disponible",
      intro: "Le document est disponible dans votre espace client.",
      fields: [
        { label: "Document", value: label },
        { label: "Intitulé", value: title },
        { label: "Montant", value: amount !== null ? formatAmount(amount, currency) : "" },
      ],
      path: "/espace-client/documents",
      cta: "Voir le document →",
    });
  }
  refresh();
  return { ok: `${DOCUMENT_KINDS[kind]} ${number} ajouté${kind === "invoice" ? "e" : ""}.` };
}

export async function setDocumentStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as DocumentStatus;
  if (!(status in DOCUMENT_STATUSES)) return;
  await sql()`UPDATE client_documents SET status = ${status} WHERE id = ${id(formData)} AND kind = ${DOCUMENT_STATUSES[status].kind}`;
  refresh();
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const [doc] = await sql()`DELETE FROM client_documents WHERE id = ${id(formData)} RETURNING file_key`;
  if (doc) await deleteObjects([doc.file_key]);
  refresh();
}

/** Qualifies / advances a request. Logged in its thread and emailed to the client, with an optional note. */
export async function setRequestStatus(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const requestId = id(formData, "requestId");
  const status = String(formData.get("status")) as RequestStatus;
  const note = String(formData.get("note") || "").trim().slice(0, 10_000);
  const found = await getRequest(requestId, null);
  if (!found) return { error: "Demande introuvable." };
  if (!(status in REQUEST_STATUSES)) return { error: "Statut invalide." };
  if (status === found.request.status && !note) return { error: "Le statut est déjà celui-ci." };

  if (status !== found.request.status) {
    await sql()`INSERT INTO client_request_messages (request_id, author_kind, author_name, body)
      VALUES (${requestId}, 'system', ${admin.name}, ${`Statut : ${REQUEST_STATUSES[status].label}`})`;
  }
  if (note) {
    await sql()`INSERT INTO client_request_messages (request_id, author_kind, author_name, body)
      VALUES (${requestId}, 'admin', ${admin.name}, ${note})`;
  }
  await sql()`UPDATE client_requests SET status = ${status}, updated_at = now(), last_message_by = 'admin' WHERE id = ${requestId}`;

  if (formData.get("notify") === "on") {
    await notifyClient(found.request.client_id, {
      subject: `${REQUEST_STATUSES[status].label} — ${found.request.title}`,
      title: `Votre demande : ${REQUEST_STATUSES[status].label.toLowerCase()}`,
      intro: REQUEST_STATUSES[status].hint,
      fields: [
        { label: "Demande", value: found.request.title },
        { label: "Message", value: note, multiline: true },
      ],
      path: `/espace-client/demandes/${requestId}`,
      cta: "Voir la demande →",
    });
  }
  refresh();
  return { ok: "Demande mise à jour." };
}

export async function deleteRequest(formData: FormData) {
  await requireAdmin();
  const requestId = id(formData);
  const files = await sql()`DELETE FROM client_files WHERE request_id = ${requestId} RETURNING key`;
  await deleteObjects(files.map((f) => f.key as string));
  await sql()`DELETE FROM client_requests WHERE id = ${requestId}`;
  refresh();
  redirect("/admin/demandes");
}

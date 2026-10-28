"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { requireClient } from "./client-auth";
import { cleanFileName, discardUploads, fileKey, getRequest, insertFiles, notifyClient, notifyStudio, purgeFolder, rejectUploads, sql, verifyUploads, type Actor } from "./portal";
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, formatSize, isAllowedFileName } from "./portal-labels";
import { deleteObjects, storageConfigured, uploadUrl } from "./r2";

// Actions used both by the client area and the admin. Admin forms send the `clientId` they act on,
// which requires an admin session; without it, the signed-in client's own account is the scope.

type FormState = { error?: string; ok?: string };

async function actor(clientId: unknown): Promise<Actor> {
  if (clientId) {
    const admin = await requireAdmin();
    if (!/^\d+$/.test(String(clientId))) throw new Error("Invalid client");
    return { kind: "admin", name: admin.name, clientId: String(clientId) };
  }
  const user = await requireClient();
  return { kind: "client", name: user.name, clientId: user.clientId, userId: user.id };
}

function refresh() {
  revalidatePath("/espace-client", "layout");
  revalidatePath("/admin", "layout");
}

/** Presigned upload URLs; the browser then sends each file straight to the bucket. */
export async function prepareUploads(clientId: string | null, files: { name: string; size: number }[]) {
  const { clientId: scope } = await actor(clientId);
  if (!storageConfigured()) return { error: "Le stockage de fichiers n'est pas configuré." };
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES_PER_UPLOAD) {
    return { error: `${MAX_FILES_PER_UPLOAD} fichiers maximum par envoi.` };
  }
  const tooBig = files.find((f) => !(Number(f.size) >= 0 && Number(f.size) <= MAX_FILE_SIZE));
  if (tooBig) return { error: `« ${tooBig.name} » dépasse ${formatSize(MAX_FILE_SIZE)}.` };

  const blocked = files.find((f) => !isAllowedFileName(String(f.name)));
  if (blocked) return { error: `« ${blocked.name} » : ce type de fichier n'est pas accepté (compressez-le en .zip).` };

  return {
    uploads: files.map((f) => {
      const key = fileKey(scope, cleanFileName(String(f.name)));
      return { key, url: uploadUrl(key, Number(f.size)) };
    }),
  };
}

/** Called by the browser when an upload batch fails halfway: removes the files that did arrive. */
export async function cancelUploads(clientId: string | null, keys: string[]) {
  const { clientId: scope } = await actor(clientId);
  if (!Array.isArray(keys)) return;
  await discardUploads(scope, JSON.stringify(keys.map((key) => ({ key }))));
}

const isId = (value: string) => /^\d+$/.test(value);

async function ownedFolder(clientId: string, folderId: FormDataEntryValue | null) {
  if (!folderId) return null;
  if (!isId(String(folderId))) throw new Error("Unknown folder");
  const [folder] = await sql()`SELECT id FROM drive_folders WHERE id = ${String(folderId)} AND client_id = ${clientId}`;
  if (!folder) throw new Error("Unknown folder");
  return String(folder.id);
}

export async function addDriveFiles(formData: FormData): Promise<FormState> {
  const who = await actor(formData.get("clientId"));
  try {
    const folderId = await ownedFolder(who.clientId, formData.get("folderId"));
    const uploads = await verifyUploads(who.clientId, formData.get("uploads"));
    await insertFiles(who, uploads, { folderId });
  } catch (error) {
    console.error("addDriveFiles failed:", error);
    return rejectUploads(who.clientId, formData, "L'envoi n'a pas pu être enregistré. Merci de réessayer.");
  }
  refresh();
  return { ok: "Fichiers ajoutés." };
}

export async function createFolder(_state: FormState, formData: FormData): Promise<FormState> {
  const who = await actor(formData.get("clientId"));
  const name = cleanFileName(String(formData.get("name") || "")).slice(0, 80);
  if (!formData.get("name") || !name) return { error: "Nom de dossier requis." };
  const parentId = await ownedFolder(who.clientId, formData.get("parentId"));
  const [exists] = await sql()`SELECT 1 FROM drive_folders WHERE client_id = ${who.clientId}
    AND parent_id IS NOT DISTINCT FROM ${parentId}::bigint AND lower(name) = lower(${name})`;
  if (exists) return { error: "Un dossier porte déjà ce nom ici." };
  await sql()`INSERT INTO drive_folders (client_id, parent_id, name) VALUES (${who.clientId}, ${parentId}, ${name})`;
  refresh();
  return { ok: `Dossier « ${name} » créé.` };
}

/** Clients may only delete files that a client uploaded; the studio's deliverables stay. */
export async function deleteDriveFile(formData: FormData) {
  const who = await actor(formData.get("clientId"));
  const id = String(formData.get("id"));
  if (!isId(id)) return;
  const [file] = await sql()`DELETE FROM client_files WHERE id = ${id} AND client_id = ${who.clientId}
    AND request_id IS NULL AND (${who.kind}::text = 'admin' OR uploaded_by_kind = 'client') RETURNING key`;
  if (file) await deleteObjects([file.key]);
  refresh();
}

/** The admin deletes a folder with its content; a client only an empty folder. */
export async function deleteDriveFolder(formData: FormData) {
  const who = await actor(formData.get("clientId"));
  const id = String(formData.get("id"));
  if (!isId(id)) return;
  if (who.kind === "client") {
    await sql()`DELETE FROM drive_folders f WHERE f.id = ${id} AND f.client_id = ${who.clientId}
      AND NOT EXISTS (SELECT 1 FROM drive_folders s WHERE s.parent_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM client_files x WHERE x.folder_id = f.id)`;
  } else {
    await purgeFolder(who.clientId, id);
  }
  refresh();
}

/** Adds a message (and attachments) to a request, then notifies the other side. */
export async function postRequestMessage(_state: FormState, formData: FormData): Promise<FormState> {
  const who = await actor(formData.get("clientId"));
  const requestId = String(formData.get("requestId"));
  const body = String(formData.get("body") || "").trim().slice(0, 10_000);
  const found = await getRequest(requestId, who.clientId);
  if (!found) return rejectUploads(who.clientId, formData, "Demande introuvable.");

  let uploads;
  try {
    uploads = await verifyUploads(who.clientId, formData.get("uploads"));
  } catch (error) {
    console.error("postRequestMessage uploads failed:", error);
    return rejectUploads(who.clientId, formData, "Les pièces jointes n'ont pas pu être enregistrées. Merci de réessayer.");
  }
  if (!body && uploads.length === 0) return { error: "Écrivez un message ou joignez un fichier." };

  const [message] = await sql()`INSERT INTO client_request_messages (request_id, author_kind, author_name, body)
    VALUES (${requestId}, ${who.kind}, ${who.name}, ${body}) RETURNING id`;
  await insertFiles(who, uploads, { requestId, messageId: String(message.id) });
  await sql()`UPDATE client_requests SET updated_at = now(), last_message_by = ${who.kind} WHERE id = ${requestId}`;

  const { request } = found;
  const fields = [
    { label: "Demande", value: request.title },
    { label: "Message", value: body, multiline: true },
    { label: "Pièces jointes", value: uploads.map((u) => u.name).join(", ") },
  ];
  if (who.kind === "client") {
    await notifyStudio({
      subject: `Nouveau message — ${request.client_name} — ${request.title}`,
      title: `${who.name} (${request.client_name}) a répondu`,
      intro: "Nouveau message sur une demande de l'espace client.",
      fields,
      path: `/admin/demandes/${requestId}`,
      cta: "Ouvrir la demande →",
    });
  } else {
    await notifyClient(who.clientId, {
      subject: `Réponse à votre demande — ${request.title}`,
      title: "Vous avez une réponse",
      intro: `${who.name} a répondu à votre demande.`,
      fields,
      path: `/espace-client/demandes/${requestId}`,
      cta: "Voir la demande →",
    });
  }
  refresh();
  return { ok: "Message envoyé." };
}

import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { sendEmail, type EmailField } from "./email";
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, isAllowedFileName, type DocumentKind, type DocumentStatus, type RequestKind, type RequestStatus } from "./portal-labels";
import { deleteObjects, objectSize } from "./r2";
import { appUrl, CONTACT_EMAIL } from "./site";

// Client area data, shared by the client pages (scoped to the signed-in client) and the admin.

export type Actor =
  | { kind: "admin"; name: string; clientId: string }
  | { kind: "client"; name: string; clientId: string; userId: string };

export type Project = { id: string; name: string; url: string | null; maintenance: boolean };

export type RequestRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  client_id: string;
  client_name: string;
  project_id: string | null;
  project_name: string | null;
  project_url: string | null;
  author_name: string | null;
  kind: RequestKind;
  title: string;
  body: string;
  page_url: string | null;
  expected: string | null;
  urgent: boolean;
  status: RequestStatus;
  last_message_by: "client" | "admin";
  messages: number;
};

export type MessageRow = { id: string; created_at: Date; author_kind: "client" | "admin" | "system"; author_name: string; body: string };

export type FileRow = {
  id: string;
  created_at: Date;
  name: string;
  size: number;
  content_type: string | null;
  uploaded_by_kind: "client" | "admin";
  uploaded_by: string;
  message_id: string | null;
};

export type DocumentRow = {
  id: string;
  created_at: Date;
  kind: DocumentKind;
  number: string;
  title: string;
  amount: string | null;
  currency: string;
  issued_on: Date;
  due_on: Date | null;
  status: DocumentStatus;
  file_name: string;
  file_size: number;
};

export type FolderRow = { id: string; name: string; parent_id: string | null; items?: number };

/** A file the browser has put in the bucket, waiting to be recorded. */
export type Upload = { key: string; name: string; size: number; type: string };

export function sql() {
  const client = db();
  if (!client) throw new Error("DATABASE_URL is not configured");
  return client;
}

export async function getProjects(clientId: string) {
  return (await sql()`SELECT id, name, url, maintenance FROM client_projects WHERE client_id = ${clientId} ORDER BY name`) as Project[];
}

/** Requests of one client, or of every client when `clientId` is null (admin). */
export async function getRequests(clientId: string | null, statuses: RequestStatus[] | null = null) {
  return (await sql()`SELECT r.id, r.created_at, r.updated_at, r.client_id, c.name AS client_name, r.project_id,
      p.name AS project_name, p.url AS project_url, u.name AS author_name, r.kind, r.title, r.body, r.page_url, r.expected,
      r.urgent, r.status, r.last_message_by,
      (SELECT count(*)::int FROM client_request_messages m WHERE m.request_id = r.id AND m.author_kind <> 'system') AS messages
    FROM client_requests r
    JOIN clients c ON c.id = r.client_id
    LEFT JOIN client_projects p ON p.id = r.project_id
    LEFT JOIN client_users u ON u.id = r.author_id
    WHERE (${clientId}::bigint IS NULL OR r.client_id = ${clientId})
      AND (${statuses}::text[] IS NULL OR r.status = ANY(${statuses}))
    ORDER BY r.updated_at DESC
    LIMIT 200`) as RequestRow[];
}

/** One request; null when it doesn't exist or belongs to another client. */
export async function getRequest(id: string, clientId: string | null) {
  if (!/^\d+$/.test(id)) return null;
  const [request] = (await sql()`SELECT r.id, r.created_at, r.updated_at, r.client_id, c.name AS client_name, r.project_id,
      p.name AS project_name, p.url AS project_url, u.name AS author_name, r.kind, r.title, r.body, r.page_url, r.expected,
      r.urgent, r.status, r.last_message_by, 0 AS messages
    FROM client_requests r
    JOIN clients c ON c.id = r.client_id
    LEFT JOIN client_projects p ON p.id = r.project_id
    LEFT JOIN client_users u ON u.id = r.author_id
    WHERE r.id = ${id} AND (${clientId}::bigint IS NULL OR r.client_id = ${clientId})`) as RequestRow[];
  if (!request) return null;

  const [messages, files] = await Promise.all([
    sql()`SELECT id, created_at, author_kind, author_name, body FROM client_request_messages
      WHERE request_id = ${id} ORDER BY created_at, id`.then((rows) => rows as MessageRow[]),
    sql()`SELECT id, created_at, name, size, content_type, uploaded_by_kind, uploaded_by, message_id FROM client_files
      WHERE request_id = ${id} ORDER BY created_at, id`.then((rows) => rows as FileRow[]),
  ]);
  return { request, messages, files };
}

export async function getDocuments(clientId: string) {
  return (await sql()`SELECT id, created_at, kind, number, title, amount, currency, issued_on, due_on, status, file_name, file_size
    FROM client_documents WHERE client_id = ${clientId} ORDER BY issued_on DESC, id DESC`) as DocumentRow[];
}

/** A drive folder (root when `folderId` is null) with its breadcrumb; null when the folder isn't the client's. */
export async function getDrive(clientId: string, folderId: string | null) {
  if (folderId !== null && !/^\d+$/.test(folderId)) return null;
  const trail = folderId
    ? ((await sql()`WITH RECURSIVE up AS (
          SELECT id, name, parent_id, 0 AS depth FROM drive_folders WHERE id = ${folderId} AND client_id = ${clientId}
          UNION ALL
          SELECT f.id, f.name, f.parent_id, up.depth + 1 FROM drive_folders f JOIN up ON f.id = up.parent_id
        ) SELECT id, name, parent_id FROM up ORDER BY depth DESC`) as FolderRow[])
    : [];
  if (folderId && trail.length === 0) return null;

  const [folders, files] = await Promise.all([
    sql()`SELECT f.id, f.name, f.parent_id,
        (SELECT count(*)::int FROM drive_folders s WHERE s.parent_id = f.id)
          + (SELECT count(*)::int FROM client_files x WHERE x.folder_id = f.id) AS items
      FROM drive_folders f WHERE f.client_id = ${clientId} AND f.parent_id IS NOT DISTINCT FROM ${folderId}::bigint
      ORDER BY lower(f.name)`.then((rows) => rows as FolderRow[]),
    sql()`SELECT id, created_at, name, size, content_type, uploaded_by_kind, uploaded_by, message_id FROM client_files
      WHERE client_id = ${clientId} AND request_id IS NULL AND folder_id IS NOT DISTINCT FROM ${folderId}::bigint
      ORDER BY lower(name)`.then((rows) => rows as FileRow[]),
  ]);
  return { trail, folders, files };
}

/** Object key of a new file. The client prefix is what upload verification checks. */
export function fileKey(clientId: string, name: string) {
  const safe = name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "fichier";
  return `clients/${clientId}/${randomUUID()}/${safe}`;
}

export function cleanFileName(name: string) {
  return name.replace(/[\u0000-\u001f/\\]/g, "").trim().slice(0, 200) || "fichier";
}

/**
 * Parses the uploads announced by a form and checks each one really is in the bucket, under this
 * client's prefix, with the announced size. Throws on any mismatch: the form shows an error.
 */
export async function verifyUploads(clientId: string, raw: FormDataEntryValue | null): Promise<Upload[]> {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(String(raw));
  if (!Array.isArray(parsed) || parsed.length > MAX_FILES_PER_UPLOAD) throw new Error("Invalid uploads");
  const uploads = parsed.map((u) => ({
    key: String(u?.key ?? ""),
    name: cleanFileName(String(u?.name ?? "")),
    size: Number(u?.size),
    type: String(u?.type ?? "").slice(0, 120),
  }));
  for (const u of uploads) {
    if (!u.key.startsWith(`clients/${clientId}/`) || u.key.includes("..")) throw new Error("Invalid upload key");
    if (!(u.size >= 0 && u.size <= MAX_FILE_SIZE)) throw new Error("Invalid upload size");
    if (!isAllowedFileName(u.name) || !isAllowedFileName(u.key)) throw new Error("Blocked file type");
  }
  // A key the bucket already serves to a file or document is not a new upload: recording it twice
  // would let deleting one copy remove the object the other still points to.
  const keys = uploads.map((u) => u.key);
  if (new Set(keys).size !== keys.length || (await usedKeys(keys)).size > 0) throw new Error("Upload already recorded");
  const sizes = await Promise.all(uploads.map((u) => objectSize(u.key)));
  if (sizes.some((size, i) => size !== uploads[i].size)) throw new Error("Upload missing from storage");
  return uploads;
}

async function usedKeys(keys: string[]) {
  if (keys.length === 0) return new Set<string>();
  const rows = await sql()`SELECT key FROM client_files WHERE key = ANY(${keys})
    UNION SELECT file_key FROM client_documents WHERE file_key = ANY(${keys})`;
  return new Set(rows.map((r) => r.key as string));
}

/**
 * Removes from the bucket the files a rejected form had uploaded, so they don't linger unrecorded.
 * Only keys under the client's prefix that no file or document uses are deleted. Never throws.
 */
export async function discardUploads(clientId: string, raw: FormDataEntryValue | null) {
  try {
    const parsed: unknown = raw ? JSON.parse(String(raw)) : [];
    const keys = (Array.isArray(parsed) ? parsed.slice(0, MAX_FILES_PER_UPLOAD) : [])
      .map((u) => String(u?.key ?? ""))
      .filter((key) => key.startsWith(`clients/${clientId}/`) && !key.includes(".."));
    const used = await usedKeys(keys);
    await deleteObjects(keys.filter((key) => !used.has(key)));
  } catch (error) {
    console.error("discardUploads failed:", error);
  }
}

/** Form error of an action that received uploads: the files are discarded with it. */
export async function rejectUploads(clientId: string, formData: FormData, error: string) {
  await discardUploads(clientId, formData.get("uploads"));
  return { error };
}

export async function insertFiles(actor: Actor, uploads: Upload[], target: { folderId?: string | null; requestId?: string; messageId?: string }) {
  for (const u of uploads) {
    await sql()`INSERT INTO client_files (client_id, folder_id, request_id, message_id, name, key, size, content_type, uploaded_by_kind, uploaded_by)
      VALUES (${actor.clientId}, ${target.folderId ?? null}, ${target.requestId ?? null}, ${target.messageId ?? null},
        ${u.name}, ${u.key}, ${u.size}, ${u.type || null}, ${actor.kind}, ${actor.name})`;
  }
}

/** Deletes a drive folder, its subfolders and every file they hold, in the bucket too. */
export async function purgeFolder(clientId: string, folderId: string) {
  const files = await sql()`WITH RECURSIVE tree AS (
      SELECT id FROM drive_folders WHERE id = ${folderId} AND client_id = ${clientId}
      UNION ALL
      SELECT f.id FROM drive_folders f JOIN tree ON f.parent_id = tree.id
    ) SELECT key FROM client_files WHERE folder_id IN (SELECT id FROM tree)`;
  await deleteObjects(files.map((f) => f.key as string));
  await sql()`DELETE FROM drive_folders WHERE id = ${folderId} AND client_id = ${clientId}`;
}

/** Deletes a client with everything it owns, stored files and documents included. */
export async function purgeClient(clientId: string) {
  const keys = await sql()`SELECT key FROM client_files WHERE client_id = ${clientId}
    UNION ALL SELECT file_key FROM client_documents WHERE client_id = ${clientId}`;
  await deleteObjects(keys.map((k) => k.key as string));
  await sql()`DELETE FROM clients WHERE id = ${clientId}`;
}

// ─── Notifications ──────────────────────────────────────────────────────────────────────────────

type Notice = { subject: string; title: string; intro: string; fields?: EmailField[]; path: string; cta: string };

/** Emails the studio inbox, with a link into the admin. */
export async function notifyStudio({ subject, title, intro, fields, path, cta }: Notice, replyTo?: string) {
  return sendEmail({
    to: process.env.CONTACT_EMAIL_TO || CONTACT_EMAIL,
    replyTo,
    subject,
    title,
    intro,
    fields,
    cta: { label: cta, href: appUrl(path) },
    footer: "Notification automatique de l'espace client Oxmad Digital.",
  });
}

/** Emails every user of a client, with a link into the client area. */
export async function notifyClient(clientId: string, { subject, title, intro, fields, path, cta }: Notice) {
  const users = await sql()`SELECT email FROM client_users WHERE client_id = ${clientId}`;
  if (users.length === 0) return "unconfigured" as const;
  return sendEmail({
    to: users.map((u) => u.email as string),
    replyTo: process.env.CONTACT_EMAIL_TO || CONTACT_EMAIL,
    subject,
    title,
    intro,
    fields,
    cta: { label: cta, href: appUrl(path) },
    footer: "Vous recevez cet email car vous avez accès à l'espace client Oxmad Digital.",
  });
}

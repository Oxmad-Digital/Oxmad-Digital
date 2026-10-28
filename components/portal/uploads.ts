import { cancelUploads, prepareUploads } from "@/lib/portal-actions";
import type { Upload } from "@/lib/portal";

/**
 * Sends files straight from the browser to the private bucket (presigned PUT), so their size isn't
 * limited by the hosting's request body limit. Resolves with what the form must then record.
 * `clientId` is set by admin pages only. Requires the bucket's CORS rules (see README).
 */
export async function uploadFiles(files: File[], clientId: string | null, onProgress?: (ratio: number) => void): Promise<Upload[]> {
  if (files.length === 0) return [];
  const prepared = await prepareUploads(clientId, files.map((f) => ({ name: f.name, size: f.size })));
  if ("error" in prepared) throw new Error(prepared.error);

  const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const sent = files.map(() => 0);
  const sending = files.map((file, i) => new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", prepared.uploads[i].url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      sent[i] = e.loaded;
      onProgress?.(sent.reduce((a, b) => a + b, 0) / total);
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`« ${file.name} » n'a pas pu être envoyé.`)));
    xhr.onerror = () => reject(new Error(`« ${file.name} » n'a pas pu être envoyé (connexion interrompue).`));
    xhr.send(file);
  }));
  try {
    await Promise.all(sending);
  } catch (error) {
    // The batch is abandoned: once the other files have settled, remove those that did reach the bucket.
    await Promise.allSettled(sending);
    await cancelUploads(clientId, prepared.uploads.map((u) => u.key)).catch(() => {});
    throw error;
  }

  return files.map((file, i) => ({ key: prepared.uploads[i].key, name: file.name, size: file.size, type: file.type }));
}

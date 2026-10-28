import "server-only";
import { createHash, createHmac } from "node:crypto";

// Private R2 bucket of the client area (invoices, quotes, drive). Never public: every access goes
// through a short-lived presigned URL (S3 SigV4, query-string auth), signed here without an SDK.

type Method = "GET" | "PUT" | "HEAD" | "DELETE";

// Own credentials (a token scoped to this bucket), distinct from the media upload ones (R2_ACCESS_KEY_ID…).
const ENV = ["R2_ENDPOINT", "R2_PRIVATE_BUCKET", "R2_PRIVATE_ACCESS_KEY_ID", "R2_PRIVATE_SECRET_ACCESS_KEY"] as const;

export function storageConfigured() {
  return ENV.every((name) => process.env[name]);
}

function config() {
  if (!storageConfigured()) throw new Error(`Set ${ENV.join(", ")}`);
  const env = process.env as unknown as Record<(typeof ENV)[number], string>;
  return {
    host: new URL(env.R2_ENDPOINT).host,
    bucket: env.R2_PRIVATE_BUCKET,
    keyId: env.R2_PRIVATE_ACCESS_KEY_ID,
    secret: env.R2_PRIVATE_SECRET_ACCESS_KEY,
  };
}

/** RFC 3986 encoding, as SigV4 expects. */
const encode = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();

/** `headers` are part of the signature: the request must send them with these exact values. */
function presign(method: Method, key: string, { expires = 300, query = {}, headers = {} }: {
  expires?: number;
  query?: Record<string, string>;
  headers?: Record<string, string>;
} = {}) {
  const { host, bucket, keyId, secret } = config();
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;
  const path = `/${encode(bucket)}/${key.split("/").map(encode).join("/")}`;

  const signed: Record<string, string> = { host, ...headers };
  const headerNames = Object.keys(signed).sort();
  const params: Record<string, string> = {
    ...query,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${keyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": headerNames.join(";"),
  };
  const queryString = Object.keys(params).sort().map((k) => `${encode(k)}=${encode(params[k])}`).join("&");
  const canonical = [
    method,
    path,
    queryString,
    headerNames.map((name) => `${name}:${signed[name].trim()}\n`).join(""),
    headerNames.join(";"),
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, createHash("sha256").update(canonical).digest("hex")].join("\n");
  const signingKey = ["auto", "s3", "aws4_request"].reduce<Buffer>((k, part) => hmac(k, part), hmac(`AWS4${secret}`, day));

  return `https://${host}${path}?${queryString}&X-Amz-Signature=${hmac(signingKey, toSign).toString("hex")}`;
}

/** Browser upload URL. Content-Length is signed, so the uploaded file must have the announced size. */
export function uploadUrl(key: string, size: number) {
  return presign("PUT", key, { expires: 900, headers: { "content-length": String(size) } });
}

/** Types a browser may display in place; the type is forced by extension, never the one the uploader declared. */
const INLINE_TYPES: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", txt: "text/plain; charset=utf-8",
};

/** Download URL valid 5 minutes. `inline` displays PDFs and images in the browser; anything else is saved. */
export function downloadUrl(key: string, fileName: string, wantInline = false) {
  const type = INLINE_TYPES[fileName.split(".").pop()?.toLowerCase() ?? ""];
  const inline = wantInline && Boolean(type);
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const disposition = `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encode(fileName)}`;
  const query: Record<string, string> = { "response-content-disposition": disposition };
  if (inline) query["response-content-type"] = type;
  return presign("GET", key, { query });
}

/** Size of a stored object, or null when it doesn't exist. */
export async function objectSize(key: string) {
  const response = await fetch(presign("HEAD", key), { method: "HEAD", cache: "no-store" });
  if (!response.ok) return null;
  return Number(response.headers.get("content-length"));
}

/** Deletes objects, 10 requests at a time. Missing objects are not an error. */
export async function deleteObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 10) {
    await Promise.all(keys.slice(i, i + 10).map(async (key) => {
      const response = await fetch(presign("DELETE", key), { method: "DELETE", cache: "no-store" });
      if (!response.ok && response.status !== 404) console.error(`R2 delete failed for ${key}: ${response.status}`);
    }));
  }
}

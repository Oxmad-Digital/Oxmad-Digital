import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
if (![R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY].every(Boolean)) {
  throw new Error("Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in an ignored environment file.");
}
const endpoint = new URL(R2_ENDPOINT);
if (endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".r2.cloudflarestorage.com")) {
  throw new Error("R2_ENDPOINT must be the HTTPS S3 endpoint for the Cloudflare R2 account.");
}
const manifest = JSON.parse(await readFile("lib/media-manifest.json", "utf8"));
const auth = `user = ${JSON.stringify(`${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`)}\n`;
const curl = (args) => {
  // Pass credentials through stdin, never through command arguments or log output.
  const result = spawnSync("curl", ["--silent", "--show-error", "--fail-with-body",
    "--retry", "3", "--max-time", "90", "--aws-sigv4", "aws:amz:auto:s3",
    "--config", "-", ...args], { input: auth, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`R2 request failed: ${result.stderr} ${result.stdout}`);
  return result.stdout;
};
for (const { key, bytes } of Object.values(manifest)) {
  const file = path.join(".r2-media", path.basename(key));
  const buffer = await readFile(file);
  const hash = createHash("sha256").update(buffer).digest("hex");
  if (buffer.length !== bytes || bytes >= 200_000 ||
      !/^images\/oxmad-digital-[a-z0-9-]+\.webp$/.test(key) ||
      !key.endsWith(`-${hash.slice(0, 12)}.webp`)) {
    throw new Error(`Invalid prepared image: ${key}`);
  }
  const url = `${endpoint.origin}/${encodeURIComponent(R2_BUCKET)}/${key}`;
  curl(["--upload-file", file, "--header", "Content-Type: image/webp", "--header",
    "Cache-Control: public, max-age=31536000, immutable", "--header",
    `x-amz-content-sha256: ${hash}`, url]);
  const headers = curl(["--head", url]);
  const length = Number(headers.match(/^content-length:\s*(\d+)/im)?.[1]);
  if (length !== bytes || !/^content-type:\s*image\/webp/im.test(headers)) {
    throw new Error(`Upload verification failed for ${key}`);
  }
  console.log(`Verified ${key} (${bytes} bytes)`);
}
console.log(`Uploaded and verified ${Object.keys(manifest).length} WebP images.`);

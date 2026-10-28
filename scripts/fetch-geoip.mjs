import { mkdir, rename, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

// DB-IP "IP to Country Lite" (CC BY 4.0), published monthly: the IP fallback of app/api/track when the
// browser gives no usable time zone. Fetched at build time and never committed; a failed download only
// warns, the tracker then falls back to Vercel's country header.
const file = path.join(process.cwd(), "data/dbip-country-lite.mmdb");

function month(offset) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - offset);
  return date.toISOString().slice(0, 7);
}

// The new month's file appears a few days in: fall back to the previous one.
for (const offset of [0, 1]) {
  const url = `https://download.db-ip.com/free/dbip-country-lite-${month(offset)}.mmdb.gz`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) continue;
    const data = gunzipSync(Buffer.from(await response.arrayBuffer()));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, data);
    await rename(`${file}.tmp`, file);
    console.log(`DB-IP ${month(offset)} → ${file}`);
    process.exit(0);
  } catch (error) {
    console.warn(`DB-IP ${url}: ${error.message}`);
  }
}
console.warn("DB-IP download failed: country falls back to Vercel's header.");

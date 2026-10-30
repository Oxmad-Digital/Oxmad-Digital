import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Keep originals in public: this command never deletes or overwrites source artwork.
const root = process.cwd();
const output = path.join(root, ".r2-media");
await mkdir(output, { recursive: true });
const maxBytes = 200_000;

async function encodeWithinBudget(image, vector) {
  let width;
  for (;;) {
    const candidate = width ? image.clone().resize({ width, withoutEnlargement: true }) : image.clone();
    const encode = (quality) => candidate.clone().webp(vector
      ? { lossless: true, effort: 6 }
      : { quality, effort: 6, smartSubsample: true }).toBuffer();
    let buffer = await encode(82);
    if (buffer.length < maxBytes) return { buffer, quality: vector ? "lossless" : 82 };
    if (!vector) {
      buffer = await encode(60);
      if (buffer.length < maxBytes) {
        // Keep the highest quality that fits, without reducing dimensions first.
        let quality = 60;
        let low = 61;
        let high = 81;
        while (low <= high) {
          const next = Math.floor((low + high) / 2);
          const encoded = await encode(next);
          if (encoded.length < maxBytes) {
            buffer = encoded;
            quality = next;
            low = next + 1;
          } else high = next - 1;
        }
        return { buffer, quality };
      }
    }
    const metadata = await sharp(buffer).metadata();
    width = Math.floor(metadata.width * 0.9);
    if (width < 128) throw new Error("Image cannot fit the 200 KB budget.");
  }
}

const names = {
  "oxmad_chevrons_jardin_cotier_desktop.webp": "hero-accueil-jardin-cotier-desktop",
  "oxmad_chevrons_jardin_cotier_mobile.webp": "hero-accueil-jardin-cotier-mobile",
  "oxmad_galerie_cotiere_desktop.webp": "hero-realisations-galerie-cotiere-desktop",
  "oxmad_galerie_cotiere_mobile-7b8799b09d81.avif": "hero-realisations-galerie-cotiere-mobile",
  "oxmad_connexion_jardin_ocean.webp": "connexion-jardin-ocean",
  "og-image.jpg": "partage-social",
  "oxmad-symbole-transparent.svg": "symbole-transparent",
  "oxmad-wordmark-sur-fond-sombre.svg": "logo-fond-sombre",
};
const serviceImages = new Set([
  "oxmad_arches_perspective.png", "oxmad_pixels_suspendus.png",
  "oxmad_horizon_solaire.png", "oxmad_faille_lumineuse_lisse.png",
]);
const files = {};
for (const source of (await readdir(path.join(root, "public"), { recursive: true })).sort()) {
  if (!/\.(png|jpe?g|webp|avif|svg)$/i.test(source)) continue;
  const original = path.join(root, "public", source);
  const hero = names[source]?.startsWith("hero-") ?? false;
  const vector = source.endsWith(".svg");
  // Re-encode the desktop hero from its lossless original, rather than a compressed WebP.
  const input = source === "oxmad_chevrons_jardin_cotier_desktop.webp"
    ? path.join(root, "assets-src/oxmad_chevrons_jardin_cotier.png") : original;
  let image = sharp(input, vector ? { density: 192 } : {}).rotate();
  if (vector) {
    image = image.resize({ width: source === "favicon.svg" ? 128 : 1600, withoutEnlargement: true });
  } else if (serviceImages.has(source)) {
    image = image.resize({ width: 960, withoutEnlargement: true });
  } else {
    image = image.resize({ width: hero ? 2560 : 1920, withoutEnlargement: true });
  }
  let { buffer, quality } = await encodeWithinBudget(image, vector);
  // Existing project captures and heroes may already be optimally compressed.
  if (source.endsWith(".webp") && input === original) {
    const existing = await readFile(original);
    if (existing.length <= buffer.length && existing.length < maxBytes) buffer = existing;
  }
  const slug = names[source] ?? source.replace(/^projects\//, "projet-")
    .replace(/\.[^.]+$/, "").replace(/^oxmad[_-](digital[_-])?/, "").replaceAll("_", "-");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const key = `images/oxmad-digital-${slug}-${hash}.webp`;
  await writeFile(path.join(output, path.basename(key)), buffer);
  const metadata = await sharp(buffer).metadata();
  files[`/${source}`] = {
    key, width: metadata.width, height: metadata.height,
    bytes: buffer.length, originalBytes: (await stat(original)).size,
    quality,
  };
  console.log(`${source} → ${path.basename(key)} (${Math.round(buffer.length / 1024)} KiB)`);
}
await writeFile(path.join(root, "lib/media-manifest.json"), JSON.stringify(files, null, 2) + "\n");
const totals = Object.values(files).reduce((sum, file) => ({
  original: sum.original + file.originalBytes, optimized: sum.optimized + file.bytes,
}), { original: 0, optimized: 0 });
console.log(`${Object.keys(files).length} images; ${(totals.original / 1e6).toFixed(2)} MB → ${(totals.optimized / 1e6).toFixed(2)} MB; ${Math.round((1 - totals.optimized / totals.original) * 100)}% saved`);

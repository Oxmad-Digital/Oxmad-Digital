import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Keep originals in public: this command never deletes or overwrites source artwork.
const root = process.cwd();
const output = path.join(root, ".r2-media");
await mkdir(output, { recursive: true });

const names = {
  "oxmad_chevrons_jardin_cotier_desktop.webp": "hero-accueil-jardin-cotier-desktop",
  "oxmad_chevrons_jardin_cotier_mobile.webp": "hero-accueil-jardin-cotier-mobile",
  "oxmad_galerie_cotiere_desktop.webp": "hero-realisations-galerie-cotiere-desktop",
  "oxmad-symbole-transparent.svg": "symbole-transparent",
  "oxmad-wordmark-sur-fond-sombre.svg": "logo-fond-sombre",
};
const serviceImages = new Set([
  "oxmad_arches_perspective.png", "oxmad_pixels_suspendus.png",
  "oxmad_horizon_solaire.png", "oxmad_faille_lumineuse_lisse.png",
]);
const files = {};
for (const source of (await readdir(path.join(root, "public"), { recursive: true })).sort()) {
  if (!/\.(png|jpe?g|webp|svg)$/i.test(source)) continue;
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
  let buffer = await image.webp(vector
    ? { lossless: true, effort: 6 }
    : { quality: hero ? 92 : 82, effort: 6, smartSubsample: true }).toBuffer();
  // Existing project captures and heroes may already be optimally compressed.
  if (source.endsWith(".webp") && input === original) {
    const existing = await readFile(original);
    if (existing.length <= buffer.length) buffer = existing;
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
    quality: vector ? "lossless" : hero ? 92 : 82,
  };
  console.log(`${source} → ${path.basename(key)} (${Math.round(buffer.length / 1024)} KiB)`);
}
await writeFile(path.join(root, "lib/media-manifest.json"), JSON.stringify(files, null, 2) + "\n");
const totals = Object.values(files).reduce((sum, file) => ({
  original: sum.original + file.originalBytes, optimized: sum.optimized + file.bytes,
}), { original: 0, optimized: 0 });
console.log(`${Object.keys(files).length} images; ${(totals.original / 1e6).toFixed(2)} MB → ${(totals.optimized / 1e6).toFixed(2)} MB; ${Math.round((1 - totals.optimized / totals.original) * 100)}% saved`);

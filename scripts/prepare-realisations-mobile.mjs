import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// The mobile CSS shows the right-aligned 4:3 crop of the 1672 × 941 desktop art.
// Generate exactly the DPR 3 payload for a 390px viewport. AVIF 4:4:4 at this
// resolution retains more displayed detail than the previous 900 × 675 effective crop.
const root = process.cwd();
const source = path.join(root, "public/oxmad_galerie_cotiere_desktop.webp");
const filename = "oxmad_galerie_cotiere_mobile-7b8799b09d81.avif";
const output = path.join(root, "public", filename);

const buffer = await sharp(source)
  .extract({ left: 417, top: 0, width: 1255, height: 941 })
  .resize(1170, 878, { fit: "fill" })
  .avif({ quality: 70, effort: 4, chromaSubsampling: "4:4:4" })
  .toBuffer();

const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
if (!filename.includes(hash)) {
  throw new Error(`The generated image hash changed (${hash}); review its visual comparison before updating the filename.`);
}

await writeFile(output, buffer);
console.log(`${filename} (${buffer.length} bytes, 1170 × 878)`);

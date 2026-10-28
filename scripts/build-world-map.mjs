import { writeFile } from "node:fs/promises";
import path from "node:path";
import world from "@svg-maps/world";

// The source map weighs 1.2 MB. Its paths only use relative moves ("m … z"), so we
// rebuild them from absolute points rounded to half a unit (under a pixel at dashboard
// size): no drift, and about 6× lighter.
const SCALE = 2;
const round = (n) => Math.round(n * SCALE);

function simplify(d, box) {
  const tokens = d.match(/[mz]|-?[\d.]+(?:e-?\d+)?/gi);
  const out = [];
  let x = 0, y = 0, startX = 0, startY = 0, prevX = 0, prevY = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "z" || t === "Z") {
      out.push("z");
      x = startX; y = startY; prevX = round(x); prevY = round(y);
      continue;
    }
    if (t === "m") {
      out.push("m");
      let first = true;
      while (i + 2 < tokens.length && !/^[mz]$/i.test(tokens[i + 1])) {
        x += Number(tokens[++i]);
        y += Number(tokens[++i]);
        box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x);
        box.minY = Math.min(box.minY, y); box.maxY = Math.max(box.maxY, y);
        const rx = round(x), ry = round(y);
        if (first) { startX = x; startY = y; }
        if (first || rx !== prevX || ry !== prevY) {
          out.push(`${(rx - prevX) / SCALE} ${(ry - prevY) / SCALE}`.replace(/ -/g, "-"));
        }
        prevX = rx; prevY = ry; first = false;
      }
    }
  }
  return out.join(" ").replace(/m /g, "m").replace(/ z/g, "z");
}

// Some islands come as subdivisions ("um-dq"…): merge them under their country code,
// the only level the visitor's geolocation gives us.
const countries = new Map();
for (const l of world.locations) {
  const id = l.id.slice(0, 2).toUpperCase();
  const country = countries.get(id) ?? { id, d: "", box: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity } };
  country.d = [country.d, simplify(l.path, country.box)].filter(Boolean).join(" ");
  countries.set(id, country);
}

// Territories a few units wide (Réunion, Maurice, Malte…) are invisible as shapes:
// they get a marker at the centre of their bounds instead.
const MARKER_BELOW = 8;

const map = {
  viewBox: world.viewBox,
  countries: [...countries.values()].map(({ id, d, box }) => {
    const small = Math.max(box.maxX - box.minX, box.maxY - box.minY) < MARKER_BELOW;
    return small
      ? { id, d, marker: [Math.round(box.minX + box.maxX) / 2, Math.round(box.minY + box.maxY) / 2] }
      : { id, d };
  }),
};

const file = path.join(process.cwd(), "lib/world-map.json");
await writeFile(file, JSON.stringify(map));
console.log(`${map.countries.length} pays → ${file}`);

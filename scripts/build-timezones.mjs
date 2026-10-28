import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// IANA time zone → ISO country, from the system tz database: zone.tab lists one country per zone
// (Indian/Reunion → RE, Indian/Mauritius → MU), and the links in tzdata.zi add the legacy names some
// browsers still report (Asia/Calcutta → IN). Zones shared by no single country (UTC, Etc/*) stay out.
const ZONEINFO = process.env.ZONEINFO || "/usr/share/zoneinfo";

const countries = {};
for (const line of (await readFile(path.join(ZONEINFO, "zone.tab"), "utf8")).split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const [code, , zone] = line.split("\t");
  countries[zone] = code;
}
for (const line of (await readFile(path.join(ZONEINFO, "tzdata.zi"), "utf8")).split("\n")) {
  const [kind, target, name] = line.split(" ");
  if (kind === "L" && !countries[name] && countries[target]) countries[name] = countries[target];
}

const sorted = Object.fromEntries(Object.entries(countries).sort(([a], [b]) => a.localeCompare(b)));
const file = path.join(process.cwd(), "lib/timezone-countries.json");
await writeFile(file, JSON.stringify(sorted));
console.log(`${Object.keys(sorted).length} zones → ${file}`);

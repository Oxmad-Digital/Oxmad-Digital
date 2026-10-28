import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Reader, type CountryResponse } from "mmdb-lib";
import timezones from "./timezone-countries.json";

const ZONES: Record<string, string> = timezones;
let reader: Reader<CountryResponse> | null | undefined;

/** DB-IP country database (scripts/fetch-geoip.mjs), loaded once per instance; null when the build couldn't fetch it. */
function ipReader() {
  if (reader === undefined) {
    try {
      reader = new Reader<CountryResponse>(readFileSync(path.join(process.cwd(), "data/dbip-country-lite.mmdb")));
    } catch {
      reader = null;
    }
  }
  return reader;
}

/**
 * Visitor country, from the most reliable source available: the browser's time zone (right even behind
 * a VPN, and tells Réunion from Mauritius), then the IP in DB-IP, then Vercel's header. The IP is never stored.
 */
export function visitorCountry(timeZone: unknown, ip: string, fallback: string | null) {
  const fromZone = typeof timeZone === "string" ? ZONES[timeZone] : undefined;
  if (fromZone) return fromZone;
  try {
    return ipReader()?.get(ip)?.country?.iso_code ?? fallback;
  } catch {
    return fallback;
  }
}

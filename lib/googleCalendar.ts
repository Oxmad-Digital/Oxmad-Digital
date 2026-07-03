import { google } from "googleapis";

export const TIMEZONE = "Indian/Antananarivo";
export const TZ_OFFSET = "+03:00";
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "contact@oxmad-digital.mg";
export const SLOT_MINUTES = 30;
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 18;

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    return null;
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function getCalendarClient() {
  const auth = getOAuthClient();
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

export function isWeekday(dateStr: string) {
  const day = new Date(`${dateStr}T12:00:00${TZ_OFFSET}`).getUTCDay();
  return day >= 1 && day <= 5;
}

export function generateDaySlots(dateStr: string) {
  const slots: string[] = [];
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_MINUTES) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(min).padStart(2, "0");
      slots.push(`${dateStr}T${hh}:${mm}:00${TZ_OFFSET}`);
    }
  }
  return slots;
}

export function slotLabel(slotIso: string) {
  return slotIso.slice(11, 16);
}

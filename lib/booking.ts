import { TZ_OFFSET } from "./site";

export const SLOT_MINUTES = 30;
/** A slot can only be booked this far ahead of now. */
export const MIN_NOTICE_MS = 60 * 60 * 1000;
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 19;

export function isWeekday(dateStr: string) {
  const day = new Date(`${dateStr}T12:00:00${TZ_OFFSET}`).getUTCDay();
  return day >= 1 && day <= 5;
}

/** Bookable slots of a day (ISO strings in Antananarivo time): weekdays only, business hours, past the minimum notice. */
export function generateDaySlots(dateStr: string, now = Date.now()) {
  if (!isWeekday(dateStr)) return [];
  const slots: string[] = [];
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_MINUTES) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(min).padStart(2, "0");
      slots.push(`${dateStr}T${hh}:${mm}:00${TZ_OFFSET}`);
    }
  }
  return slots.filter((iso) => new Date(iso).getTime() >= now + MIN_NOTICE_MS);
}

export function slotLabel(slotIso: string) {
  return slotIso.slice(11, 16);
}

import { NextResponse } from "next/server";
import {
  CALENDAR_ID,
  SLOT_MINUTES,
  TZ_OFFSET,
  generateDaySlots,
  getCalendarClient,
  isWeekday,
  slotLabel,
} from "@/lib/googleCalendar";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_NOTICE_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "";

  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Paramètre date invalide." }, { status: 400 });
  }

  if (!isWeekday(date)) {
    return NextResponse.json({ slots: [] });
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    console.error("Google Calendar n'est pas configuré (variables d'environnement manquantes)");
    return NextResponse.json({ error: "La prise de rendez-vous n'est pas configurée." }, { status: 500 });
  }

  try {
    const timeMin = `${date}T00:00:00${TZ_OFFSET}`;
    const timeMax = `${date}T23:59:59${TZ_OFFSET}`;

    const freebusy = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: CALENDAR_ID }] },
    });

    const busy = freebusy.data.calendars?.[CALENDAR_ID]?.busy || [];
    const now = Date.now();

    const available = generateDaySlots(date).filter((slotIso) => {
      const start = new Date(slotIso).getTime();
      if (start < now + MIN_NOTICE_MS) return false;

      const end = start + SLOT_MINUTES * 60 * 1000;
      return !busy.some((b) => {
        const busyStart = new Date(b.start!).getTime();
        const busyEnd = new Date(b.end!).getTime();
        return start < busyEnd && end > busyStart;
      });
    });

    return NextResponse.json({
      slots: available.map((iso) => ({ iso, label: slotLabel(iso) })),
    });
  } catch (err) {
    console.error("Google freebusy error:", err);
    return NextResponse.json({ error: "Impossible de récupérer les disponibilités." }, { status: 502 });
  }
}

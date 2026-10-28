import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** Neon SQL client (HTTP, one query per call). Null when DATABASE_URL is missing, so forms keep working by email alone. */
export function db() {
  if (!process.env.DATABASE_URL) return null;
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

export type ContactMessage = {
  id: string;
  created_at: Date;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "read" | "archived";
};

export type Booking = {
  id: string;
  created_at: Date;
  slot: Date;
  name: string;
  email: string;
  phone: string;
  channel: string;
  message: string | null;
  status: "pending" | "confirmed" | "done" | "cancelled";
};

/** Stores a form submission; never throws, so a database outage doesn't block the email. */
export async function saveContactMessage(m: Pick<ContactMessage, "name" | "email" | "phone" | "message">) {
  const sql = db();
  if (!sql) return false;
  try {
    await sql`INSERT INTO contact_messages (name, email, phone, message) VALUES (${m.name}, ${m.email}, ${m.phone || null}, ${m.message})`;
    return true;
  } catch (error) {
    console.error("saveContactMessage failed:", error);
    return false;
  }
}

export async function saveBooking(b: Pick<Booking, "slot" | "name" | "email" | "phone" | "channel" | "message">) {
  const sql = db();
  if (!sql) return false;
  try {
    await sql`INSERT INTO bookings (slot, name, email, phone, channel, message)
      VALUES (${b.slot.toISOString()}, ${b.name}, ${b.email}, ${b.phone}, ${b.channel}, ${b.message || null})`;
    return true;
  } catch (error) {
    console.error("saveBooking failed:", error);
    return false;
  }
}

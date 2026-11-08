import "server-only";
import { db } from "./db";

/**
 * Retention periods stated in the privacy policy (app/(site)/mentions-legales). Changing one here
 * means updating the policy too.
 */
export const RETENTION = {
  /** Contact messages and call bookings: 3 years after the message or the booked slot (prospects). */
  prospectYears: 3,
  /** Sign-ups whose email was never confirmed. */
  unverifiedSignupDays: 30,
  /** Refused sign-ups, counted from the refusal. */
  rejectedSignupMonths: 6,
} as const;

/**
 * Deletes the personal data whose retention period is over. Idempotent and cheap (indexed or small
 * tables), so it can run often: from the dashboard and now and then after a page-view beacon.
 * Never throws: a failed purge simply runs again next time.
 */
export async function purgeExpiredData() {
  const sql = db();
  if (!sql) return;
  try {
    const years = RETENTION.prospectYears;
    await sql`DELETE FROM contact_messages WHERE created_at < now() - make_interval(years => ${years})`;
    await sql`DELETE FROM bookings WHERE slot < now() - make_interval(years => ${years})`;
    await sql`DELETE FROM client_users WHERE status = 'pending' AND email_verified_at IS NULL
      AND created_at < now() - make_interval(days => ${RETENTION.unverifiedSignupDays})`;
    await sql`DELETE FROM client_users WHERE status = 'rejected'
      AND coalesce(reviewed_at, created_at) < now() - make_interval(months => ${RETENTION.rejectedSignupMonths})`;
  } catch (error) {
    console.error("purgeExpiredData failed:", error);
  }
}

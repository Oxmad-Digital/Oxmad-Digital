import { neon } from "@neondatabase/serverless";

// Turns off the two-factor authentication of an admin (lost phone and backup codes).
// The account enrolls a new authenticator at its next sign-in.
// Usage: npm run admin:reset-2fa -- <email>
const [email] = process.argv.slice(2);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
if (!email) {
  console.error("Usage: npm run admin:reset-2fa -- <email>");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`UPDATE admin_users SET totp_enabled = false, totp_secret = NULL, totp_last_step = NULL
  WHERE email = ${email.trim().toLowerCase()} RETURNING id`;
if (rows.length === 0) {
  console.error(`Aucun compte : ${email}`);
  process.exit(1);
}
await sql`DELETE FROM admin_backup_codes WHERE user_id = ${rows[0].id}`;
console.log(`2FA réinitialisée : ${email}`);

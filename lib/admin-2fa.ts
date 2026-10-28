import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import type { AdminRow } from "./admin-auth";
import { db } from "./db";
import {
  base32, decrypt, deriveKey, encrypt, hashBackupCode, newBackupCodes, newSecret, normalizeBackupCode, otpauthUri, verifyCode,
} from "./totp";

// Second step of the admin sign-in. The password alone only opens a short "pending" cookie, valid
// for this step; the session starts once a code (or, to enroll, the first code) has been verified.
const COOKIE = "ox_admin_2fa";
const PENDING_MINUTES = 5;

export type Pending = AdminRow & { totp_secret: string | null; totp_enabled: boolean; totp_last_step: string | null };

function appSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (32+ characters)");
  return value;
}

const sql = () => {
  const client = db();
  if (!client) throw new Error("DATABASE_URL is not configured");
  return client;
};

function sign(user: Pick<AdminRow, "id" | "password_hash">, expires: number) {
  return createHmac("sha256", deriveKey("admin-2fa-pending", appSecret()))
    .update(`${user.id}:${expires}:${user.password_hash}`)
    .digest("base64url");
}

/** After a correct password: opens the pending cookie and, for an account without 2FA, prepares its secret. */
export async function beginTwoFactor(user: AdminRow) {
  const [row] = await sql()`SELECT totp_enabled FROM admin_users WHERE id = ${user.id}`;
  if (!row.totp_enabled) {
    const secret = encrypt(newSecret(), deriveKey("admin-totp-secret", appSecret()));
    await sql()`UPDATE admin_users SET totp_secret = ${secret} WHERE id = ${user.id} AND NOT totp_enabled`;
  }
  const expires = Date.now() + PENDING_MINUTES * 60_000;
  (await cookies()).set(COOKIE, `${user.id}.${expires}.${sign(user, expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    expires: new Date(expires),
  });
}

export async function clearPending() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

/** The account that passed the password step less than 5 minutes ago, or null. */
export async function getPending(): Promise<Pending | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !db()) return null;
  const [id, expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!/^\d+$/.test(id ?? "") || !signature || !(expires > Date.now())) return null;

  const [user] = (await sql()`SELECT id, email, name, password_hash, session_key, totp_secret, totp_enabled, totp_last_step
    FROM admin_users WHERE id = ${id}`) as Pending[];
  if (!user) return null;
  const expected = Buffer.from(sign(user, expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? { ...user, id: String(user.id) } : null;
}

const secretOf = (user: Pending) => decrypt(user.totp_secret!, deriveKey("admin-totp-secret", appSecret()));

/** What the enrollment page shows: a QR code and the same secret as text. */
export async function enrollmentDetails(user: Pending) {
  const secret = secretOf(user);
  return {
    qr: await QRCode.toDataURL(otpauthUri(secret, user.email), { margin: 1, width: 220 }),
    key: base32(secret).match(/.{1,4}/g)!.join(" "),
  };
}

/** Accepts an authenticator code, else a backup code (used up). */
export async function verifySecondFactor(user: Pending, input: string) {
  if (!user.totp_enabled || !user.totp_secret) return false;
  const step = verifyCode(secretOf(user), input, user.totp_last_step === null ? null : Number(user.totp_last_step));
  if (step !== null) {
    const updated = await sql()`UPDATE admin_users SET totp_last_step = ${step}
      WHERE id = ${user.id} AND (totp_last_step IS NULL OR totp_last_step < ${step}) RETURNING id`;
    return updated.length > 0;
  }
  const code = normalizeBackupCode(input);
  if (!/^[a-z2-7]{5}-[a-z2-7]{5}$/.test(code)) return false;
  const used = await sql()`UPDATE admin_backup_codes SET used_at = now()
    WHERE user_id = ${user.id} AND code_hash = ${hashBackupCode(code)} AND used_at IS NULL RETURNING id`;
  return used.length > 0;
}

/** Checks the first code of a new authenticator, turns 2FA on and returns the backup codes (shown once). */
export async function completeEnrollment(user: Pending, input: string) {
  if (user.totp_enabled || !user.totp_secret) return null;
  const step = verifyCode(secretOf(user), input, null);
  if (step === null) return null;

  const enabled = await sql()`UPDATE admin_users SET totp_enabled = true, totp_last_step = ${step}
    WHERE id = ${user.id} AND NOT totp_enabled RETURNING id`;
  if (enabled.length === 0) return null;

  const codes = newBackupCodes();
  await sql()`DELETE FROM admin_backup_codes WHERE user_id = ${user.id}`;
  await sql()`INSERT INTO admin_backup_codes (user_id, code_hash)
    SELECT ${user.id}, unnest(${codes.map(hashBackupCode)}::text[])`;
  return codes;
}

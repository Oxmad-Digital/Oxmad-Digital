"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beginTwoFactor, clearPending, completeEnrollment, getPending, verifySecondFactor, type Pending } from "@/lib/admin-2fa";
import { authenticate, endSession, normalizeEmail, requireAdmin, startSession, type AdminRow } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { EMAIL_RE } from "@/lib/site";

const MESSAGE_STATUSES = ["new", "read", "archived"];
const BOOKING_STATUSES = ["pending", "confirmed", "done", "cancelled"];

type FormState = { error?: string; ok?: string };

/** The `id` of a form, or null when it isn't a row id (forged form). */
function rowId(formData: FormData) {
  const id = String(formData.get("id"));
  return /^\d+$/.test(id) ? id : null;
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(String(formData.get("email") || ""));
  // Per address and per account: guessing one password from many addresses is capped too.
  const allowed = (await rateLimit(`login:ip:${clientIp(await headers())}`, 10, 900))
    && (await rateLimit(`login:email:${email}`, 10, 900));
  if (!allowed) return { error: TOO_MANY };

  const user = await authenticate(email, String(formData.get("password") || ""));
  if (!user) {
    // Slows down password guessing without any state to keep.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Email ou mot de passe incorrect." };
  }
  // The password alone doesn't open a session: the code (or the enrollment of an authenticator) comes next.
  await beginTwoFactor(user);
  redirect("/admin/login/verification");
}

type CodesState = FormState & { codes?: string[] };

/** Second step of the sign-in: a code from the authenticator, or a backup code. */
export async function verifyTwoFactor(_state: FormState, formData: FormData): Promise<FormState> {
  const pending = await getPending();
  if (!pending) redirect("/admin/login");
  const allowed = (await rateLimit(`2fa:ip:${clientIp(await headers())}`, 10, 600)) && (await rateLimit(`2fa:user:${pending.id}`, 5, 600));
  if (!allowed) return { error: TOO_MANY };

  if (!(await verifySecondFactor(pending, String(formData.get("code") || "")))) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Code incorrect." };
  }
  await clearPending();
  await startSession(pending);
  redirect("/admin");
}

/** First sign-in without 2FA: confirms the new authenticator, signs in and hands over the backup codes. */
export async function enrollTwoFactor(_state: CodesState, formData: FormData): Promise<CodesState> {
  const pending = await getPending();
  if (!pending) redirect("/admin/login");
  const allowed = (await rateLimit(`2fa:ip:${clientIp(await headers())}`, 10, 600)) && (await rateLimit(`2fa:user:${pending.id}`, 5, 600));
  if (!allowed) return { error: TOO_MANY };

  const codes = await completeEnrollment(pending, String(formData.get("code") || ""));
  if (!codes) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez." };
  }
  await clearPending();
  await startSession(pending);
  return { codes };
}

/** Another admin lost their device: they enroll again at their next sign-in. */
export async function resetTwoFactor(formData: FormData) {
  const admin = await requireAdmin();
  const id = rowId(formData);
  if (!id || id === admin.id) return;
  await sql()`UPDATE admin_users SET totp_enabled = false, totp_secret = NULL, totp_last_step = NULL WHERE id = ${id}`;
  await sql()`DELETE FROM admin_backup_codes WHERE user_id = ${id}`;
  revalidatePath("/admin/comptes");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

function sql() {
  const client = db();
  if (!client) throw new Error("DATABASE_URL is not configured");
  return client;
}

export async function setMessageStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  const id = rowId(formData);
  if (!MESSAGE_STATUSES.includes(status) || !id) return;
  await sql()`UPDATE contact_messages SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (!id) return;
  await sql()`DELETE FROM contact_messages WHERE id = ${id}`;
  revalidatePath("/admin", "layout");
}

/** Takes a player off the 0x-Run leaderboard: their runs lose the name but still count in the stats. */
export async function hideGamePlayer(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (!id) return;
  await sql()`UPDATE game_runs SET name = NULL
    WHERE lower(name) = (SELECT lower(name) FROM game_runs WHERE id = ${id})`;
  revalidatePath("/admin/jeu");
}

export async function setBookingStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  const id = rowId(formData);
  if (!BOOKING_STATUSES.includes(status) || !id) return;
  await sql()`UPDATE bookings SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = rowId(formData);
  if (!id) return;
  await sql()`DELETE FROM bookings WHERE id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function createAdmin(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  if (!name || !EMAIL_RE.test(email)) return { error: "Nom et email valides requis." };
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Mot de passe : ${MIN_PASSWORD_LENGTH} caractères minimum.` };

  const created = await sql()`INSERT INTO admin_users (email, name, password_hash)
    VALUES (${email}, ${name}, ${await hashPassword(password)}) ON CONFLICT (email) DO NOTHING RETURNING id`;
  if (created.length === 0) return { error: "Un compte existe déjà avec cet email." };
  revalidatePath("/admin/comptes");
  return { ok: `Compte créé pour ${email}.` };
}

export async function deleteAdmin(formData: FormData) {
  const admin = await requireAdmin();
  const id = rowId(formData);
  if (!id || id === admin.id) return;
  await sql()`DELETE FROM admin_users WHERE id = ${id}`;
  revalidatePath("/admin/comptes");
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  if (next.length < MIN_PASSWORD_LENGTH) return { error: `Nouveau mot de passe : ${MIN_PASSWORD_LENGTH} caractères minimum.` };
  if (next !== String(formData.get("confirm") || "")) return { error: "Les deux mots de passe ne correspondent pas." };

  if (!(await rateLimit(`password:${admin.id}`, 5, 600))) return { error: TOO_MANY };

  const [row] = await sql()`SELECT id, email, name, password_hash, session_key, totp_secret, totp_enabled, totp_last_step
    FROM admin_users WHERE id = ${admin.id}`;
  if (!row || !(await verifyPassword(current, row.password_hash))) return { error: "Mot de passe actuel incorrect." };
  // A stolen session alone can't lock the owner out: the authenticator is required too.
  if (!(await verifySecondFactor(row as Pending, String(formData.get("code") || "")))) return { error: "Code de double authentification incorrect." };

  const [updated] = await sql()`UPDATE admin_users SET password_hash = ${await hashPassword(next)}
    WHERE id = ${admin.id} RETURNING id, email, name, password_hash, session_key`;
  // Other sessions of this account are now invalid; keep this one signed in.
  await startSession(updated as AdminRow);
  return { ok: "Mot de passe modifié." };
}

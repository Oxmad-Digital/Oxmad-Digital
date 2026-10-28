import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeEmail } from "./admin-auth";
import { db } from "./db";
import { sendEmail } from "./email";
import { deriveKey } from "./totp";
import { appUrl } from "./site";

// Client area sign-in by magic link: no password, a single-use emailed token opens a session.
const COOKIE = "ox_client";
const SESSION_DAYS = 30;
export const LINK_MINUTES = 20;

export type ClientUser = { id: string; email: string; name: string; clientId: string; clientName: string };
type ClientUserRow = { id: string; email: string; name: string; client_id: string; client_name: string; session_key: string };

/** Same app secret as the admin, but its own derived key: the two kinds of cookies are not interchangeable. */
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (32+ characters)");
  return deriveKey("client-session", value);
}

function sign(user: ClientUserRow, expires: number) {
  return createHmac("sha256", secret())
    .update(`client-session:${user.id}:${expires}:${user.session_key}`)
    .digest("base64url");
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function sql() {
  const client = db();
  if (!client) throw new Error("DATABASE_URL is not configured");
  return client;
}

/**
 * Creates a sign-in token for an existing account. Null when the email is unknown, or when a link
 * was already sent less than a minute ago (limits email flooding).
 */
export async function createLoginToken(email: string) {
  const [user] = (await sql()`SELECT u.id, u.email, u.name, c.name AS client_name
    FROM client_users u JOIN clients c ON c.id = u.client_id
    WHERE u.email = ${normalizeEmail(email)}
      AND NOT EXISTS (SELECT 1 FROM client_login_tokens t WHERE t.user_id = u.id AND t.created_at > now() - interval '1 minute')`) as
    Pick<ClientUserRow, "id" | "email" | "name" | "client_name">[];
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  await sql()`DELETE FROM client_login_tokens WHERE expires_at < now()`;
  await sql()`INSERT INTO client_login_tokens (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${user.id}, now() + make_interval(mins => ${LINK_MINUTES}))`;
  return { user, token };
}

/** Emails the link of a token from createLoginToken. `invite`: first access, worded as a welcome. */
export async function sendLoginLink({ user, token }: NonNullable<Awaited<ReturnType<typeof createLoginToken>>>, invite = false) {
  return sendEmail({
    to: user.email,
    subject: invite ? `Votre espace client ${user.client_name} — Oxmad Digital` : "Votre lien de connexion — Oxmad Digital",
    title: invite ? "Votre espace client est prêt" : "Connexion à votre espace client",
    intro: invite
      ? `Bonjour ${user.name}, retrouvez-y vos devis et factures, vos demandes de modification et vos fichiers partagés. Ce lien est valable ${LINK_MINUTES} minutes ; ensuite, demandez-en un nouveau depuis la page de connexion avec votre email.`
      : `Bonjour ${user.name}, voici votre lien de connexion. Il est valable ${LINK_MINUTES} minutes et ne sert qu'une fois.`,
    cta: { label: "Accéder à mon espace →", href: appUrl(`/espace-client/connexion/verifier?token=${token}`) },
    footer: invite
      ? `Accès suivant : ${appUrl("/espace-client/connexion")}`
      : "Vous n'avez pas demandé ce lien ? Ignorez simplement cet email : personne ne peut se connecter sans lui.",
  });
}

/** Uses up a token and returns its account, or null when the token is unknown, used or expired. */
export async function consumeLoginToken(token: string) {
  const [row] = await sql()`DELETE FROM client_login_tokens WHERE token_hash = ${hashToken(token)} RETURNING user_id, expires_at`;
  if (!row || new Date(row.expires_at) < new Date()) return null;
  const [user] = (await sql()`UPDATE client_users u SET last_login_at = now() FROM clients c
    WHERE u.id = ${row.user_id} AND c.id = u.client_id
    RETURNING u.id, u.email, u.name, u.client_id, c.name AS client_name, u.session_key`) as ClientUserRow[];
  return user ?? null;
}

/** Session cookie = "<user id>.<expiry ms>.<hmac>". Lax, so links in notification emails open signed in. */
export async function startClientSession(user: ClientUserRow) {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  (await cookies()).set(COOKIE, `${user.id}.${expires}.${sign(user, expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

/** Signs out for good: the session key changes, so a copied cookie stops working too. */
export async function endClientSession() {
  const user = await getClientUser();
  if (user) await sql()`UPDATE client_users SET session_key = gen_random_uuid()::text WHERE id = ${user.id}`;
  (await cookies()).delete(COOKIE);
}

/** The signed-in client user, or null. Deduplicated per request. */
export const getClientUser = cache(async (): Promise<ClientUser | null> => {
  const value = (await cookies()).get(COOKIE)?.value;
  const client = db();
  if (!value || !client) return null;
  const [id, expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!/^\d+$/.test(id ?? "") || !signature || !(expires > Date.now())) return null;

  const [user] = (await client`SELECT u.id, u.email, u.name, u.client_id, c.name AS client_name, u.session_key
    FROM client_users u JOIN clients c ON c.id = u.client_id WHERE u.id = ${id}`) as ClientUserRow[];
  if (!user || !safeEqual(signature, sign(user, expires))) return null;
  return { id: String(user.id), email: user.email, name: user.name, clientId: String(user.client_id), clientName: user.client_name };
});

/** Call at the top of every client page and server action. */
export async function requireClient() {
  const user = await getClientUser();
  if (!user) redirect("/espace-client/connexion");
  return user;
}

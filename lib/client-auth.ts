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
// Anyone can sign up, but the account stays `pending` (no client, nothing visible) until the studio
// validates it from the admin by attaching it to a client, or refuses it.
const COOKIE = "ox_client";
const SESSION_DAYS = 30;
export const LINK_MINUTES = 20;

export type ClientStatus = "pending" | "approved" | "rejected";
export type ClientUser = { id: string; email: string; name: string; clientId: string; clientName: string };
/** Any signed-in account, validated or not. Only for the waiting page: the rest of the area uses ClientUser. */
export type ClientAccount = {
  id: string; email: string; name: string; status: ClientStatus; clientId: string | null; clientName: string | null;
  company: string | null; signupMessage: string | null; reviewNote: string | null; createdAt: Date;
};
type ClientUserRow = { id: string; email: string; name: string; client_id: string | null; client_name: string | null; session_key: string; status: ClientStatus };

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
    FROM client_users u LEFT JOIN clients c ON c.id = u.client_id
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

type LinkEmail = { subject: string; title: string; intro: string; cta: string; footer: string };

const LINK_EMAILS: Record<"login" | "invite" | "signup", (name: string, clientName: string | null) => LinkEmail> = {
  login: (name) => ({
    subject: "Votre lien de connexion — Oxmad Digital",
    title: "Connexion à votre espace client",
    intro: `Bonjour ${name}, voici votre lien de connexion. Il est valable ${LINK_MINUTES} minutes et ne sert qu'une fois.`,
    cta: "Accéder à mon espace →",
    footer: "Vous n'avez pas demandé ce lien ? Ignorez simplement cet email : personne ne peut se connecter sans lui.",
  }),
  invite: (name, clientName) => ({
    subject: clientName ? `Votre espace client ${clientName} — Oxmad Digital` : "Votre espace client — Oxmad Digital",
    title: "Votre espace client est prêt",
    intro: `Bonjour ${name}, retrouvez-y vos devis et factures, vos demandes de modification et vos fichiers partagés. Ce lien est valable ${LINK_MINUTES} minutes ; ensuite, demandez-en un nouveau depuis la page de connexion avec votre email.`,
    cta: "Accéder à mon espace →",
    footer: `Accès suivant : ${appUrl("/espace-client/connexion")}`,
  }),
  signup: (name) => ({
    subject: "Confirmez votre demande d'accès — Oxmad Digital",
    title: "Confirmez votre adresse email",
    intro: `Bonjour ${name}, merci pour votre demande d'accès à l'espace client Oxmad Digital. Confirmez votre adresse avec le bouton ci-dessous (lien valable ${LINK_MINUTES} minutes) : votre demande sera alors transmise à l'équipe, qui vérifiera que vous êtes bien client de l'agence avant d'ouvrir votre espace.`,
    cta: "Confirmer mon adresse →",
    footer: "Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email : aucun accès ne sera ouvert.",
  }),
};

/** Emails the link of a token from createLoginToken: a sign-in, a welcome (`invite`) or a sign-up confirmation. */
export async function sendLoginLink({ user, token }: NonNullable<Awaited<ReturnType<typeof createLoginToken>>>, kind: keyof typeof LINK_EMAILS = "login") {
  const { cta, ...email } = LINK_EMAILS[kind](user.name, user.client_name);
  return sendEmail({
    to: user.email,
    ...email,
    cta: { label: cta, href: appUrl(`/espace-client/connexion/verifier?token=${token}`) },
  });
}

/** Free sign-up. False when the email already has an account (validated, pending or refused). */
export async function createSignup({ email, name, company, message }: { email: string; name: string; company: string; message: string | null }) {
  const created = await sql()`INSERT INTO client_users (email, name, company, signup_message, status)
    VALUES (${normalizeEmail(email)}, ${name}, ${company}, ${message}, 'pending') ON CONFLICT (email) DO NOTHING RETURNING id`;
  return created.length > 0;
}

/**
 * Uses up a token and returns its account, or null when the token is unknown, used or expired.
 * `first_verification`: this link is the first one used, i.e. the email address has just been confirmed
 * (now() is fixed for the statement, so it only equals email_verified_at when the coalesce just set it).
 */
export async function consumeLoginToken(token: string) {
  const [row] = await sql()`DELETE FROM client_login_tokens WHERE token_hash = ${hashToken(token)} RETURNING user_id, expires_at`;
  if (!row || new Date(row.expires_at) < new Date()) return null;
  const [user] = (await sql()`UPDATE client_users u SET last_login_at = now(), email_verified_at = coalesce(u.email_verified_at, now())
    WHERE u.id = ${row.user_id}
    RETURNING u.id, u.email, u.name, u.client_id, (SELECT c.name FROM clients c WHERE c.id = u.client_id) AS client_name,
      u.session_key, u.status, u.company, u.signup_message, u.email_verified_at = now() AS first_verification`) as
    (ClientUserRow & { company: string | null; signup_message: string | null; first_verification: boolean })[];
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
  const user = await getClientAccount();
  if (user) await sql()`UPDATE client_users SET session_key = gen_random_uuid()::text WHERE id = ${user.id}`;
  (await cookies()).delete(COOKIE);
}

/** The signed-in account whatever its status, or null. Deduplicated per request. */
export const getClientAccount = cache(async (): Promise<ClientAccount | null> => {
  const value = (await cookies()).get(COOKIE)?.value;
  const client = db();
  if (!value || !client) return null;
  const [id, expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!/^\d+$/.test(id ?? "") || !signature || !(expires > Date.now())) return null;

  const [user] = (await client`SELECT u.id, u.email, u.name, u.client_id, c.name AS client_name, u.session_key, u.status,
      u.company, u.signup_message, u.review_note, u.created_at
    FROM client_users u LEFT JOIN clients c ON c.id = u.client_id WHERE u.id = ${id}`) as
    (ClientUserRow & { company: string | null; signup_message: string | null; review_note: string | null; created_at: Date })[];
  if (!user || !safeEqual(signature, sign(user, expires))) return null;
  return {
    id: String(user.id), email: user.email, name: user.name, status: user.status,
    clientId: user.client_id ? String(user.client_id) : null, clientName: user.client_name,
    company: user.company, signupMessage: user.signup_message, reviewNote: user.review_note, createdAt: new Date(user.created_at),
  };
});

const toClientUser = (account: ClientAccount | null): ClientUser | null =>
  account?.status === "approved" && account.clientId
    ? { id: account.id, email: account.email, name: account.name, clientId: account.clientId, clientName: account.clientName ?? "" }
    : null;

/** The signed-in, validated client user, or null (signed out, or account pending / refused). */
export const getClientUser = cache(async () => toClientUser(await getClientAccount()));

/** Call at the top of every client page and server action. Accounts not validated go to the waiting page. */
export async function requireClient() {
  const account = await getClientAccount();
  if (!account) redirect("/espace-client/connexion");
  const user = toClientUser(account);
  if (!user) redirect("/espace-client/en-attente");
  return user;
}

import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createClientWithDrive } from "../lib/drive-folders.ts";

// Prints a sign-in link to the client area without sending an email (tests, support).
// The account is created, with its client and a demo project, when the email is unknown.
// Usage: npm run client:link -- <email> ["<Nom du client>"] ["<Nom de l'utilisateur>"] [url de base]
const [rawEmail, clientName = "Client test", userName = "Utilisateur test", base = "http://localhost:3000"] = process.argv.slice(2);
const LINK_MINUTES = 20;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
if (!rawEmail) {
  console.error('Usage: npm run client:link -- <email> ["<Nom du client>"] ["<Nom de l\'utilisateur>"] [url de base]');
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const sql = neon(process.env.DATABASE_URL);
let [user] = await sql`SELECT id FROM client_users WHERE email = ${email}`;

if (!user) {
  const clientId = await createClientWithDrive(sql, clientName, "Compte de test");
  await sql`INSERT INTO client_projects (client_id, name, url, maintenance) VALUES (${clientId}, 'Site de démo', 'https://exemple.com', true)`;
  [user] = await sql`INSERT INTO client_users (client_id, email, name) VALUES (${clientId}, ${email}, ${userName}) RETURNING id`;
  console.log(`Client « ${clientName} » créé (id ${clientId}) avec l'accès ${email}.`);
}

const token = randomBytes(32).toString("base64url");
await sql`INSERT INTO client_login_tokens (token_hash, user_id, expires_at)
  VALUES (${createHash("sha256").update(token).digest("base64url")}, ${user.id}, now() + make_interval(mins => ${LINK_MINUTES}))`;
console.log(`Lien de connexion (${LINK_MINUTES} min, usage unique) :\n${base}/espace-client/connexion/verifier?token=${token}`);

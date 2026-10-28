import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";

// TOTP (RFC 6238: HMAC-SHA1, 30 s steps, 6 digits), as read by Google Authenticator, Authy, 1Password…
// No Next.js imports: also used by scripts.

const STEP_SECONDS = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Key for one purpose, derived from the app secret: the session key and the 2FA keys never coincide. */
export function deriveKey(purpose: string, appSecret: string) {
  return Buffer.from(hkdfSync("sha256", appSecret, "oxmad-admin", purpose, 32));
}

export function newSecret() {
  return randomBytes(20);
}

export function base32(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function codeAt(secret: Buffer, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * The time step a code is valid for (current step ±1, for clock drift), or null. Steps up to
 * `lastStep` are refused: a code can't be used twice.
 */
export function verifyCode(secret: Buffer, input: string, lastStep: number | null, now = Date.now()) {
  const code = input.replace(/\s/g, "");
  if (!new RegExp(`^\\d{${DIGITS}}$`).test(code)) return null;
  const current = Math.floor(now / 1000 / STEP_SECONDS);
  for (const step of [current, current - 1, current + 1]) {
    if (lastStep !== null && step <= lastStep) continue;
    const expected = Buffer.from(codeAt(secret, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

export function otpauthUri(secret: Buffer, account: string) {
  const issuer = "Oxmad Digital";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${base32(secret)}&issuer=${encodeURIComponent(issuer)}&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

/** AES-256-GCM, stored as "<iv>.<tag>.<ciphertext>" (base64url): a leaked database alone doesn't reveal the secrets. */
export function encrypt(plain: Buffer, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64url")).join(".");
}

export function decrypt(stored: string, key: Buffer) {
  const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export const BACKUP_CODE_COUNT = 8;

/** "xxxxx-xxxxx" codes (50 bits each), shown once; only their hash is stored. */
export function newBackupCodes() {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const raw = base32(randomBytes(7)).slice(0, 10).toLowerCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export const normalizeBackupCode = (input: string) => input.trim().toLowerCase().replace(/\s/g, "");
export const hashBackupCode = (code: string) => createHash("sha256").update(normalizeBackupCode(code)).digest("base64url");

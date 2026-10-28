import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { deriveKey } from "@/lib/totp";
import { createGame, score, step, TICK_RATE } from "@/components/game/engine";

/** A run token is valid this long after it was issued. */
const TOKEN_TTL = 24 * 3600 * 1000;
/** Longest run accepted (30 min), which also bounds the replay cost. */
export const MAX_TICKS = 30 * 60 * TICK_RATE;
export const MAX_INPUTS = 60000;
const NAME_RE = /^[\p{L}\p{N} _.'-]{2,16}$/u;

export type ScoreEntry = { name: string; score: number };
export type GameStats = { plays: number; seconds: number };

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (32+ characters)");
  return deriveKey("xrun-token", value);
}

const sign = (seed: number, issuedAt: number) =>
  createHmac("sha256", secret()).update(`xrun:${seed}:${issuedAt}`).digest("base64url");

/** Server-chosen seed, signed with its issue time: a run cannot be prepared on a seed of the player's choosing. */
export function issueToken() {
  const seed = randomBytes(4).readUInt32LE();
  const issuedAt = Date.now();
  return `${seed}.${issuedAt}.${sign(seed, issuedAt)}`;
}

export function verifyToken(token: unknown) {
  const [seedText, issuedText, sig] = String(token).split(".");
  const seed = Number(seedText);
  const issuedAt = Number(issuedText);
  if (!Number.isInteger(seed) || !Number.isInteger(issuedAt) || !sig) return null;
  const expected = Buffer.from(sign(seed, issuedAt));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Date.now() - issuedAt > TOKEN_TTL) return null;
  return { seed, issuedAt, sig };
}

/**
 * Replays a run from its input log: flat [tick, flags, tick, flags…] pairs, recorded each
 * time the input changes (flags: 1 = new press, 2 = button held). Returns null unless the
 * log is well formed and the run actually ends in a crash.
 */
export function replay(seed: number, log: unknown) {
  if (!Array.isArray(log) || log.length % 2 !== 0 || log.length > MAX_INPUTS) return null;
  const g = createGame(seed);
  let flags = 0;
  let i = 0;
  while (!g.over && g.tick < MAX_TICKS) {
    if (i < log.length && log[i] === g.tick) {
      flags = log[i + 1];
      if (!Number.isInteger(flags) || flags < 0 || flags > 3) return null;
      i += 2;
    }
    step(g, (flags & 1) !== 0, (flags & 2) !== 0);
  }
  // Every input must have been consumed, in order: anything left is out of sequence or after the crash.
  if (!g.over || i !== log.length) return null;
  return { score: score(g), ticks: g.tick };
}

export function cleanName(value: unknown) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  return NAME_RE.test(name) ? name : null;
}

/** Best score of each player (names compared without case), highest first. */
export async function topScores(sql: NeonQueryFunction<false, false>, limit = 10) {
  const rows = await sql`SELECT name, score FROM (
      SELECT DISTINCT ON (lower(name)) name, score, created_at FROM game_runs
      WHERE name IS NOT NULL ORDER BY lower(name), score DESC, created_at
    ) best ORDER BY score DESC, created_at LIMIT ${limit}`;
  return rows as ScoreEntry[];
}

/** Position a score would take among the players' best scores. */
export async function rankOf(sql: NeonQueryFunction<false, false>, value: number) {
  const [row] = await sql`SELECT count(*)::int AS ahead FROM (
      SELECT max(score) AS best FROM game_runs WHERE name IS NOT NULL GROUP BY lower(name)
    ) players WHERE best > ${value}`;
  return (row.ahead as number) + 1;
}

/** Every finished run, ranked or not: how many, and how long people played in total. */
export async function gameStats(sql: NeonQueryFunction<false, false>): Promise<GameStats> {
  const [row] = await sql`SELECT count(*)::int AS plays, coalesce(sum(ticks), 0)::float8 AS ticks FROM game_runs`;
  return { plays: row.plays, seconds: Math.round(row.ticks / TICK_RATE) };
}

export type Player = { id: string; name: string; best: number; runs: number; last_at: Date };

/** Admin view: every ranked player, with the id of their best run (the handle used to moderate them). */
export async function listPlayers(sql: NeonQueryFunction<false, false>) {
  const rows = await sql`SELECT DISTINCT ON (lower(name)) id, name, score AS best,
      count(*) OVER (PARTITION BY lower(name))::int AS runs,
      max(created_at) OVER (PARTITION BY lower(name)) AS last_at
    FROM game_runs WHERE name IS NOT NULL
    ORDER BY lower(name), score DESC, created_at`;
  return (rows as Player[]).sort((a, b) => b.best - a.best);
}

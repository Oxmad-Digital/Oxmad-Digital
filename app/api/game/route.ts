import { NextResponse } from "next/server";
import { TICK_RATE } from "@/components/game/engine";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { cleanName, gameStats, issueToken, rankOf, replay, topScores, verifyToken } from "@/lib/xrun";

const NO_STORE = { "Cache-Control": "no-store" };
const EMPTY = { top: [], stats: null, token: null };

/** 0x-Run leaderboard and play stats, plus a fresh signed seed for the next run (null when unavailable). */
export async function GET() {
  const sql = db();
  if (!sql) return NextResponse.json(EMPTY, { headers: NO_STORE });
  try {
    const [top, stats] = await Promise.all([topScores(sql), gameStats(sql)]);
    return NextResponse.json({ top, stats, token: issueToken() }, { headers: NO_STORE });
  } catch (error) {
    console.error("game leaderboard failed:", error);
    return NextResponse.json(EMPTY, { headers: NO_STORE });
  }
}

/**
 * Records a finished run. Sent once without a name when the run ends (it counts in the stats),
 * then again with a name to enter the leaderboard. The score is never taken from the client:
 * it comes from replaying the inputs.
 */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) return NextResponse.json({ error: "Classement indisponible." }, { status: 503 });

  // The replay is CPU-heavy: bound how many runs one address can submit.
  if (!(await rateLimit(`game:${clientIp(request.headers)}`, 30, 600))) {
    return NextResponse.json({ error: "Trop de parties envoyées, réessayez plus tard." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const named = body?.name !== undefined;
  const name = named ? cleanName(body.name) : null;
  if (named && !name) {
    return NextResponse.json({ error: "Pseudo de 2 à 16 caractères (lettres, chiffres, espace, _ . ' -)." }, { status: 400 });
  }

  const run = verifyToken(body?.token);
  if (!run) return NextResponse.json({ error: "Partie expirée, rejouez pour entrer au classement." }, { status: 400 });

  const result = replay(run.seed, body?.inputs);
  // A run cannot have lasted longer than the time since its seed was issued (5 % slack for timers).
  const minDuration = (result?.ticks ?? 0) * (1000 / TICK_RATE) * 0.95;
  if (!result || (named && result.score <= 0) || Date.now() - run.issuedAt < minDuration) {
    return NextResponse.json({ error: "Partie invalide." }, { status: 400 });
  }

  try {
    // The run may already be stored unnamed: naming it is allowed once.
    const saved = await sql`INSERT INTO game_runs (name, score, ticks, run)
      VALUES (${name}, ${result.score}, ${result.ticks}, ${run.sig})
      ON CONFLICT (run) DO UPDATE SET name = EXCLUDED.name
        WHERE game_runs.name IS NULL AND EXCLUDED.name IS NOT NULL
      RETURNING id`;
    if (named && !saved.length) return NextResponse.json({ error: "Cette partie est déjà classée." }, { status: 409 });
    const [rank, top, stats] = await Promise.all([named ? rankOf(sql, result.score) : null, topScores(sql), gameStats(sql)]);
    return NextResponse.json({ score: result.score, rank, top, stats });
  } catch (error) {
    console.error("game run failed:", error);
    return NextResponse.json({ error: "Échec de l'enregistrement. Merci de réessayer." }, { status: 502 });
  }
}

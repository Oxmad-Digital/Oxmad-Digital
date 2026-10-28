/**
 * 0x-Run game simulation: pure and deterministic. Given the same seed and the same
 * inputs tick after tick, it always produces the same run, so a score can later be
 * replayed and checked on the server. Units are logical pixels of the 320×180 screen,
 * one step = one tick at 60 Hz whatever the refresh rate of the screen.
 */

export const VIEW_W = 320;
export const VIEW_H = 180;
export const GROUND_Y = 148;
export const PLAYER_X = 64;
export const PLAYER_SIZE = 16;
export const TICK_RATE = 60;

const GRAVITY = 0.6;
const JUMP_VELOCITY = -7.6;
const MAX_FALL = 10;
const SPEED_START = 2.8;
const SPEED_MAX = 5.2;
const SPEED_GAIN = 0.00045;
/** Ticks a press is remembered before landing, and ticks a jump is still allowed after leaving an edge. */
const JUMP_BUFFER = 8;
const COYOTE = 5;
/** Hazards forgive a couple of pixels so near misses feel fair. */
const HAZARD_MARGIN = 2;
const PIXEL_POINTS = 25;
const FIRST_CHUNK_X = 420;
const CHUNK_GAP = 48;

export type Bug = { kind: "bug"; x: number; base: number; w: number; h: number };
export type Spinner = { kind: "spinner"; x: number; y: number; r: number };
export type Block = { kind: "block"; x: number; w: number; h: number };
export type Hole = { kind: "hole"; x: number; w: number };
export type Pickup = { kind: "pixel"; x: number; y: number; taken: boolean };
export type Entity = Bug | Spinner | Block | Hole | Pickup;

export type GameEvent = "jump" | "land" | "pickup" | "crash";

export type Game = {
  seed: number;
  rng: () => number;
  tick: number;
  /** Distance travelled by the world, in px. */
  dist: number;
  speed: number;
  /** Player bottom edge (screen y) and vertical speed. */
  y: number;
  vy: number;
  grounded: boolean;
  coyote: number;
  buffer: number;
  /** Cube rotation in quarter turns (fractional while airborne). */
  turn: number;
  airTicks: number;
  pixels: number;
  entities: Entity[];
  nextChunkX: number;
  over: boolean;
};

/** Small seeded PRNG (mulberry32). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Hand-made obstacle sequences ───
// x is relative to the start of the chunk; `len` is where the next one may begin.

type Spec =
  | { kind: "bug"; x: number; base?: number; w?: number }
  | { kind: "spinner"; x: number; air?: boolean; y?: number }
  | { kind: "block"; x: number; w: number; h: number }
  | { kind: "hole"; x: number; w: number }
  | { kind: "pixel"; x: number; y: number };

type Chunk = { level: number; len: number; items: Spec[] };

const CHUNKS: Chunk[] = [
  // Level 0: one idea at a time.
  { level: 0, len: 220, items: [{ kind: "bug", x: 110 }] },
  { level: 0, len: 220, items: [{ kind: "bug", x: 100 }, { kind: "pixel", x: 104, y: 44 }] },
  { level: 0, len: 230, items: [{ kind: "block", x: 90, w: 40, h: 16 }, { kind: "pixel", x: 108, y: 30 }] },
  { level: 0, len: 240, items: [{ kind: "hole", x: 100, w: 40 }] },
  { level: 0, len: 230, items: [{ kind: "spinner", x: 110 }] },
  // Level 1: pairs and first "don't jump" moments.
  { level: 1, len: 300, items: [{ kind: "bug", x: 70 }, { kind: "bug", x: 200 }] },
  { level: 1, len: 300, items: [{ kind: "block", x: 60, w: 48, h: 16 }, { kind: "block", x: 108, w: 56, h: 32 }, { kind: "pixel", x: 132, y: 50 }] },
  { level: 1, len: 330, items: [{ kind: "spinner", x: 100, air: true }, { kind: "pixel", x: 100, y: 8 }, { kind: "bug", x: 230 }] },
  { level: 1, len: 250, items: [{ kind: "hole", x: 80, w: 52 }, { kind: "pixel", x: 102, y: 46 }] },
  { level: 1, len: 240, items: [{ kind: "bug", x: 100, w: 30 }] },
  { level: 1, len: 300, items: [{ kind: "block", x: 60, w: 110, h: 16 }, { kind: "bug", x: 120, base: 16 }] },
  // Level 2: rhythm.
  { level: 2, len: 320, items: [{ kind: "bug", x: 60 }, { kind: "bug", x: 140 }, { kind: "bug", x: 220 }] },
  { level: 2, len: 330, items: [{ kind: "spinner", x: 70, air: true }, { kind: "spinner", x: 110, air: true }, { kind: "spinner", x: 150, air: true }, { kind: "bug", x: 260 }] },
  { level: 2, len: 300, items: [{ kind: "hole", x: 50, w: 44 }, { kind: "block", x: 94, w: 28, h: 16 }, { kind: "hole", x: 122, w: 48 }, { kind: "pixel", x: 108, y: 40 }] },
  { level: 2, len: 300, items: [{ kind: "block", x: 60, w: 40, h: 32 }, { kind: "spinner", x: 150 }, { kind: "pixel", x: 80, y: 56 }] },
  // Level 3: combos.
  { level: 3, len: 320, items: [{ kind: "block", x: 40, w: 40, h: 16 }, { kind: "block", x: 80, w: 40, h: 32 }, { kind: "block", x: 120, w: 40, h: 46 }, { kind: "hole", x: 160, w: 64 }, { kind: "pixel", x: 190, y: 74 }] },
  { level: 3, len: 360, items: [{ kind: "bug", x: 50 }, { kind: "spinner", x: 150, air: true }, { kind: "bug", x: 230 }, { kind: "hole", x: 300, w: 44 }] },
  { level: 3, len: 300, items: [{ kind: "bug", x: 60, w: 28 }, { kind: "spinner", x: 170 }, { kind: "bug", x: 250 }] },
];

/** Difficulty unlocked by distance: harder sequences join the pool, easy ones stay possible. */
function levelAt(dist: number) {
  if (dist < 1400) return 0;
  if (dist < 4000) return 1;
  if (dist < 8000) return 2;
  return 3;
}

function spawnChunk(g: Game) {
  const level = levelAt(g.nextChunkX);
  // Favour the current level, keep a share of easier chunks as breathing room.
  const sameLevel = g.rng() < 0.65;
  const pool = CHUNKS.filter((c) => (sameLevel ? c.level === level : c.level <= level));
  const chunk = pool[Math.floor(g.rng() * pool.length)] ?? CHUNKS[0];
  const x0 = g.nextChunkX;
  // Sequences are designed at the starting speed. Faster, they are stretched by the same
  // ratio as the jump, so the timing stays human; only the reaction time gets shorter.
  const k = g.speed / SPEED_START;
  for (const s of chunk.items) {
    const x = x0 + s.x * k;
    if (s.kind === "bug") g.entities.push({ kind: "bug", x, base: s.base ?? 0, w: s.w ?? 14, h: 9 });
    else if (s.kind === "spinner") g.entities.push({ kind: "spinner", x, y: GROUND_Y - (s.y ?? (s.air ? 34 : 9)), r: 9 });
    else if (s.kind === "block") g.entities.push({ kind: "block", x, w: s.w * k, h: s.h });
    else if (s.kind === "hole") g.entities.push({ kind: "hole", x, w: s.w * k });
    else g.entities.push({ kind: "pixel", x, y: GROUND_Y - s.y, taken: false });
  }
  g.nextChunkX = x0 + (chunk.len + CHUNK_GAP) * k;
}

export function createGame(seed: number): Game {
  const g: Game = {
    seed, rng: mulberry32(seed), tick: 0, dist: 0, speed: SPEED_START,
    y: GROUND_Y, vy: 0, grounded: true, coyote: 0, buffer: 0, turn: 0, airTicks: 0,
    pixels: 0, entities: [], nextChunkX: FIRST_CHUNK_X, over: false,
  };
  while (g.nextChunkX < VIEW_W * 2) spawnChunk(g);
  return g;
}

export function score(g: Game) {
  return Math.floor(g.dist / 10) + g.pixels * PIXEL_POINTS;
}

/** Screen x of an entity. */
export const screenX = (g: Game, x: number) => x - g.dist + PLAYER_X;

function overHole(g: Game, left: number, right: number) {
  return g.entities.some((e) => e.kind === "hole" && left >= e.x && right <= e.x + e.w);
}

function circleHitsRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

/**
 * Advances the run by one tick. `pressed` is a new press this tick, `held` whether the
 * button is still down (holding keeps jumping on every landing).
 */
export function step(g: Game, pressed: boolean, held: boolean): GameEvent[] {
  const events: GameEvent[] = [];
  if (g.over) return events;
  g.tick++;
  g.speed = Math.min(SPEED_MAX, g.speed + SPEED_GAIN);
  const prevBottom = g.y;
  g.dist += g.speed;

  // World position of the player box (x) and its screen box (y).
  const left = g.dist;
  const right = g.dist + PLAYER_SIZE;

  if (pressed) g.buffer = JUMP_BUFFER;
  else if (g.buffer > 0) g.buffer--;

  if ((g.grounded || g.coyote > 0) && (g.buffer > 0 || held)) {
    g.vy = JUMP_VELOCITY;
    g.grounded = false;
    g.coyote = 0;
    g.buffer = 0;
    g.airTicks = 0;
    events.push("jump");
  }

  g.vy = Math.min(MAX_FALL, g.vy + GRAVITY);
  g.y += g.vy;

  // Surface under the player: ground (unless a hole) or the top of a block.
  // Once below the ground line the player is inside a hole: no way back up, and
  // reaching its far side means hitting the wall.
  const inPit = prevBottom > GROUND_Y;
  const holeUnder = overHole(g, left, right);
  if (inPit && !holeUnder) g.over = true;
  let floor = inPit || holeUnder ? Infinity : GROUND_Y;
  for (const e of g.entities) {
    if (e.kind !== "block" || right <= e.x || left >= e.x + e.w) continue;
    const top = GROUND_Y - e.h;
    // A block is landed on only from above; hitting its side ends the run.
    if (prevBottom <= top + 0.01) floor = Math.min(floor, top);
    else if (g.y > top + 2) g.over = true;
  }

  const wasGrounded = g.grounded;
  if (g.vy >= 0 && g.y >= floor) {
    g.y = floor;
    g.vy = 0;
    g.grounded = true;
    g.coyote = 0;
    if (!wasGrounded) {
      g.turn = Math.round(g.turn);
      events.push("land");
    }
  } else {
    if (wasGrounded) g.coyote = COYOTE;
    else if (g.coyote > 0) g.coyote--;
    g.grounded = false;
    g.airTicks++;
    // One quarter turn per jump, like a cube rolling through the air.
    g.turn += 1 / 26;
  }

  // Hazards, with a slightly smaller hitbox than the drawn cube.
  const hx = PLAYER_X + HAZARD_MARGIN;
  const hy = g.y - PLAYER_SIZE + HAZARD_MARGIN;
  const hs = PLAYER_SIZE - HAZARD_MARGIN * 2;
  for (const e of g.entities) {
    const sx = screenX(g, e.x);
    if (e.kind === "bug") {
      const top = GROUND_Y - e.base - e.h;
      if (sx < hx + hs && sx + e.w > hx && top < hy + hs && top + e.h > hy) g.over = true;
    } else if (e.kind === "spinner") {
      if (circleHitsRect(sx, e.y, e.r - 1, hx, hy, hs, hs)) g.over = true;
    } else if (e.kind === "pixel" && !e.taken) {
      if (sx + 3 > PLAYER_X && sx - 3 < PLAYER_X + PLAYER_SIZE && e.y + 3 > g.y - PLAYER_SIZE && e.y - 3 < g.y) {
        e.taken = true;
        g.pixels++;
        events.push("pickup");
      }
    }
  }

  if (g.y > VIEW_H + PLAYER_SIZE) g.over = true;
  if (g.over) events.push("crash");

  // Stream the level: forget what is far behind, build what is coming.
  g.entities = g.entities.filter((e) => e.x + ("w" in e ? e.w : 16) > g.dist - PLAYER_X - 40);
  while (g.nextChunkX < g.dist + VIEW_W * 2) spawnChunk(g);

  return events;
}

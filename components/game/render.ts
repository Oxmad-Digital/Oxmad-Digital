import { GROUND_Y, PLAYER_SIZE, PLAYER_X, VIEW_H, VIEW_W, type Game } from "./engine";

const C = {
  bg: "#11120e",
  dots: "#2c2d25",
  chevron: "#1d1e18",
  horizon: "#26271f",
  ground: "#1a1b15",
  groundTop: "#5a5b50",
  groundTick: "#2a2b23",
  void: "#0a0a08",
  hazard: "#f2f0e9",
  hazardDim: "#a6a69c",
  block: "#22231c",
  blockEdge: "#7d7e72",
  cube: "#161711",
  accent: "#c6b703",
};

/** The Oxmad X, rasterised from the brand symbol at 12 px. */
const LOGO = [
  "............",
  "........###.",
  ".###...###..",
  "..##...##...",
  "..###.###...",
  "...#####....",
  "....#####...",
  "...###.###..",
  "...###..###.",
  "..###....##.",
  ".###........",
  "............",
];

/** Opaque pixels of the cube sprite, reused for the crash burst. */
export const CUBE_PIXELS: { x: number; y: number; color: string }[] = [];
for (let y = 0; y < PLAYER_SIZE; y++) {
  for (let x = 0; x < PLAYER_SIZE; x++) {
    const edge = x === 0 || y === 0 || x === PLAYER_SIZE - 1 || y === PLAYER_SIZE - 1;
    const logo = LOGO[y - 2]?.[x - 2] === "#";
    CUBE_PIXELS.push({ x, y, color: edge || logo ? C.accent : C.cube });
  }
}

export function createCubeSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = PLAYER_SIZE;
  const ctx = sprite.getContext("2d")!;
  for (const p of CUBE_PIXELS) {
    ctx.fillStyle = p.color;
    rect(ctx, p.x, p.y, 1, 1);
  }
  return sprite;
}

// 3×5 digits for the "404" painted in the holes.
const DIGITS: Record<string, string> = { "4": "101101111001001", "0": "111101101101111" };
function digits(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  for (let i = 0; i < text.length; i++) {
    const glyph = DIGITS[text[i]];
    for (let p = 0; p < 15; p++) if (glyph[p] === "1") rect(ctx, x + i * 4 + (p % 3), y + Math.floor(p / 3), 1, 1);
  }
}

/**
 * Screen pixels per game pixel, set on every frame. Positions are kept fractional and
 * only snapped to real screen pixels, so motion stays smooth while edges stay crisp.
 */
let K = 1;
const snap = (v: number) => Math.round(v * K) / K;
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const x0 = snap(x);
  const y0 = snap(y);
  ctx.fillRect(x0, y0, snap(x + w) - x0, snap(y + h) - y0);
}

/** Positive modulo, for wrapping parallax layers. */
const wrap = (v: number, m: number) => ((v % m) + m) % m;

function background(ctx: CanvasRenderingContext2D, dist: number) {
  ctx.fillStyle = C.bg;
  rect(ctx, 0, 0, VIEW_W, VIEW_H);

  // Far layer: a sparse pixel field.
  ctx.fillStyle = C.dots;
  const farShift = dist * 0.08;
  for (let i = 0; i < 40; i++) {
    const x = wrap((i * 97) % VIEW_W - farShift, VIEW_W);
    const y = 8 + ((i * 53) % 96);
    rect(ctx, x, y, 1, 1);
  }

  // Middle layer: the brand chevrons drifting by.
  ctx.fillStyle = C.chevron;
  const span = 120;
  const midShift = wrap(dist * 0.3, span);
  for (let k = -1; k < VIEW_W / span + 1; k++) {
    const cx = k * span - midShift + 40;
    for (let t = 0; t < 34; t++) {
      rect(ctx, cx + Math.floor(t * 0.7), 70 + t, 3, 1);
      rect(ctx, cx + Math.floor(t * 0.7), 138 - t, 3, 1);
    }
  }

  ctx.fillStyle = C.horizon;
  rect(ctx, 0, 118, VIEW_W, 1);
}

function ground(ctx: CanvasRenderingContext2D, g: Game, dist: number) {
  ctx.fillStyle = C.ground;
  rect(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = C.groundTop;
  rect(ctx, 0, GROUND_Y, VIEW_W, 1);
  ctx.fillStyle = C.groundTick;
  const shift = wrap(dist, 16);
  for (let x = -shift; x < VIEW_W; x += 16) rect(ctx, x, GROUND_Y + 4, 1, 3);

  for (const e of g.entities) {
    if (e.kind !== "hole") continue;
    const x = e.x - dist + PLAYER_X;
    if (x > VIEW_W || x + e.w < 0) continue;
    ctx.fillStyle = C.void;
    rect(ctx, x, GROUND_Y, e.w, VIEW_H - GROUND_Y);
    ctx.fillStyle = C.groundTick;
    digits(ctx, "404", x + Math.floor(e.w / 2) - 6, GROUND_Y + 14);
  }
}

function entities(ctx: CanvasRenderingContext2D, g: Game, dist: number, time: number) {
  for (const e of g.entities) {
    const x = e.x - dist + PLAYER_X;
    if (x > VIEW_W + 20 || x < -60) continue;

    if (e.kind === "block") {
      const top = GROUND_Y - e.h;
      ctx.fillStyle = C.block;
      rect(ctx, x, top, e.w, e.h);
      ctx.fillStyle = C.blockEdge;
      rect(ctx, x, top, e.w, 1);
      rect(ctx, x, top, 1, e.h);
      rect(ctx, x + e.w - 1, top, 1, e.h);
      // Dashed inner frame, like a layout outline.
      ctx.fillStyle = C.groundTick;
      for (let i = x + 3; i < x + e.w - 3; i += 3) rect(ctx, i, top + 3, 1, 1);
    } else if (e.kind === "bug") {
      const top = GROUND_Y - e.base - e.h;
      const legs = Math.floor(time * 10) % 2;
      ctx.fillStyle = C.hazard;
      rect(ctx, x + 1, top + 1, e.w - 2, e.h - 3);
      rect(ctx, x + 3, top, e.w - 6, 1);
      ctx.fillStyle = C.hazardDim;
      for (let lx = x + 2; lx < x + e.w - 1; lx += 4) rect(ctx, lx + legs, top + e.h - 2, 1, 2);
      ctx.fillStyle = C.bg;
      rect(ctx, x + 2, top + 2, 2, 2);
      rect(ctx, x + 6, top + 2, 2, 2);
    } else if (e.kind === "spinner") {
      // Loading spinner: eight dots, one bright head turning.
      const head = Math.floor(time * 12) % 8;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const lag = (head - i + 8) % 8;
        ctx.fillStyle = lag === 0 ? C.hazard : lag < 3 ? C.hazardDim : C.groundTop;
        rect(ctx, x + Math.round(Math.cos(a) * (e.r - 2)) - 1, e.y + Math.round(Math.sin(a) * (e.r - 2)) - 1, 3, 3);
      }
    } else if (e.kind === "pixel" && !e.taken) {
      const bob = Math.round(Math.sin(time * 5 + e.x) * 1.5);
      ctx.fillStyle = C.accent;
      rect(ctx, x - 2, e.y - 2 + bob, 4, 4);
      ctx.fillStyle = "#f5eb7a";
      rect(ctx, x - 2, e.y - 2 + bob, 1, 1);
    }
  }
}

export type Particle = { x: number; y: number; vx: number; vy: number; color: string; life: number };

export type View = { dist: number; y: number; turn: number; crashed: boolean; time: number; trail: { y: number; age: number }[] };

/** Draws one frame; `scale` is the number of screen pixels per game pixel. */
export function draw(ctx: CanvasRenderingContext2D, scale: number, g: Game, sprite: HTMLCanvasElement, view: View, particles: Particle[]) {
  K = scale;
  const { dist, y, turn, time } = view;
  background(ctx, dist);
  ground(ctx, g, dist);
  entities(ctx, g, dist, time);

  if (!view.crashed) {
    // Golden trail left behind the cube.
    ctx.fillStyle = C.accent;
    for (const t of view.trail) {
      ctx.globalAlpha = Math.max(0, 0.5 - t.age * 0.06);
      rect(ctx, PLAYER_X - 3 - t.age * 3, t.y - 9, 2, 2);
    }
    ctx.globalAlpha = 1;

    const cx = PLAYER_X + PLAYER_SIZE / 2;
    const cy = snap(y - PLAYER_SIZE / 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((turn % 4) * (Math.PI / 2));
    ctx.drawImage(sprite, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
    ctx.restore();
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    rect(ctx, p.x, p.y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

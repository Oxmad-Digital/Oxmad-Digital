/** Deterministic 0..1 noise for a grid cell, shared by the pixel wipes. */
export const cellNoise = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/** Sizes a canvas to `w`×`h` CSS px at a capped DPR; drawing stays in CSS px. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

/** Fills each `cell` px square of a `w`×`h` grid for which `filled` is true. */
export function fillCells(
  ctx: CanvasRenderingContext2D, w: number, h: number, cell: number,
  filled: (x: number, y: number, cols: number, rows: number) => boolean,
) {
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (filled(x, y, cols, rows)) ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }
  return { cols, rows };
}

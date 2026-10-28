"use client";

import { useEffect, useRef, useState } from "react";
import { cellNoise, fillCells, fitCanvas } from "@/lib/canvas";
import { gsap } from "@/lib/motion";
import { BRAND_IMAGES } from "@/lib/media";

const CELL = 34;
const STEPS = [5, 8, 12, 18, 28, 44, 72, 0]; // logo sampling resolutions, 0 = full
const MIN_TIME = 0.9; // seconds the loader stays even when everything is cached

/**
 * First-visit loader (home only, once per session). The Oxmad chevron resolves from a
 * coarse pixel grid while the hero image loads, then the black curtain dissolves cell by
 * cell from the bottom to reveal the page. Visibility is driven by the `intro` class set
 * on <html> by the inline script in the layout, so nothing flashes before hydration.
 */
export default function Intro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    // Without the intro class the overlay is display: none, nothing to run.
    if (!root.classList.contains("intro")) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const counter = counterRef.current!;
    let dpr = 1;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = fitCanvas(canvas, ctx, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const logo = new Image();
    // The header already requests this exact asset. Reusing it avoids a second, larger
    // Next.js re-encode; drawImage does not read pixels and therefore needs no R2 CORS.
    logo.src = BRAND_IMAGES.symbol;
    const sample = document.createElement("canvas");
    sample.width = 0;
    const sctx = sample.getContext("2d")!;

    const state = { resolve: 0, exit: 0, logo: 1 };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Curtain: every cell has its own threshold, biased so the bottom clears first.
      ctx.fillStyle = "#11120e";
      fillCells(ctx, w, h, CELL, (x, y, _, rows) => cellNoise(x, y) * 0.45 + 0.55 * (1 - y / rows) > state.exit);
      // Chevron sampled at a growing resolution, upscaled without smoothing.
      if (logo.complete && state.logo > 0) {
        const size = Math.min(w, h) * 0.22;
        const step = STEPS[Math.min(STEPS.length - 1, Math.floor(state.resolve * STEPS.length))];
        const res = step || Math.ceil(size * dpr);
        // Resample only when the resolution step changes (resizing a canvas reallocates it).
        if (sample.width !== res) {
          sample.width = sample.height = res;
          sctx.drawImage(logo, 0, 0, res, res);
        }
        ctx.save();
        ctx.globalAlpha = state.logo;
        ctx.imageSmoothingEnabled = !step;
        ctx.drawImage(sample, (w - size) / 2, (h - size) / 2, size, size);
        ctx.restore();
      }
    };

    const progress = { value: 0 };
    const writeCount = () => { counter.textContent = String(Math.round(progress.value)).padStart(3, "0"); };
    const intro = gsap.timeline({ onUpdate: draw });
    const tl = gsap.timeline({ paused: true, onUpdate: draw });
    intro.to(state, { resolve: 0.86, duration: MIN_TIME, ease: "steps(6)" }, 0)
      .to(progress, {
        value: 86, duration: MIN_TIME, ease: "power2.out", onUpdate: writeCount,
      }, 0);

    let cancelled = false;
    // The choreography itself is the loading experience. Its fixed 0.9 s resolve phase
    // already gives the eager hero time to arrive; fonts or network latency must not add
    // a variable pause before the unchanged 1.55 s reveal sequence.
    intro.then(() => {
      if (cancelled) return;
      tl.to(state, { resolve: 1, duration: 0.25, ease: "steps(1)" })
        .to(progress, {
          value: 100, duration: 0.25, onUpdate: writeCount,
        }, "<")
        .to(counter.parentElement, { autoAlpha: 0, duration: 0.3 }, "+=0.15")
        .add(() => {
          window.dispatchEvent(new Event("ox:intro-reveal"));
          root.classList.add("intro-leaving");
        })
        .to(state, { logo: 0, duration: 0.35, ease: "steps(4)" }, "<")
        .to(state, { exit: 1.05, duration: 0.85, ease: "power2.inOut" }, "<")
        .add(() => {
          try { sessionStorage.setItem("ox-intro", "1"); } catch {}
          root.classList.remove("intro", "intro-leaving");
          setDone(true);
        });
      tl.play();
    });

    logo.onload = draw;
    draw();
    // The CSS background covers the page until the canvas has painted its first frame.
    canvas.parentElement!.classList.add("is-live");
    return () => {
      cancelled = true;
      intro.kill();
      tl.kill();
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (done) return null;
  return (
    <div className="ox-intro" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="ox-intro__meta smallcap">
        <span>Oxmad Digital / Studio web</span>
        <span><span ref={counterRef}>000</span> %</span>
      </div>
    </div>
  );
}

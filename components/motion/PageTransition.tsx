"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cellNoise, fillCells, fitCanvas } from "@/lib/canvas";
import { gsap, linkFromClick, reducedMotion } from "@/lib/motion";

const CELL = 40;

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> };
};

const waitFor = <T,>(get: () => T | null, timeout = 2500) =>
  new Promise<T | null>((resolve) => {
    const startedAt = performance.now();
    // Rendering, and so requestAnimationFrame, is paused during a view transition update.
    const check = () => {
      const value = get();
      if (value || performance.now() - startedAt > timeout) return resolve(value);
      window.setTimeout(check, 16);
    };
    check();
  });

/**
 * Route changes go through a pixel curtain: cells fill the screen in noise order, the
 * route changes underneath, then the cells clear from the top. Links marked
 * data-transition="project" instead morph their screenshot into the project sheet
 * with the View Transitions API.
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ p: 0, phase: "idle" as "idle" | "cover" | "covered" | "reveal" });
  const drawRef = useRef<() => void>(() => {});
  const revealRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let stuckTimer = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      fitCanvas(canvas, ctx, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // p: 0 = nothing, 1 = fully covered. Cells appear from the bottom while covering and
    // also leave from the bottom while revealing, so the curtain keeps travelling upward.
    drawRef.current = () => {
      const { p, phase } = state.current;
      ctx.clearRect(0, 0, w, h);
      if (p <= 0) return;
      ctx.fillStyle = "#11120e";
      const threshold = (x: number, y: number, rows: number) =>
        cellNoise(x, y) * 0.5 + (1 - (phase === "reveal" ? 1 - y / rows : y / rows)) * 0.5;
      const { cols, rows } = fillCells(ctx, w, h, CELL, (x, y, _, r) => threshold(x, y, r) < p);
      ctx.fillStyle = "#c6b703";
      // A few yellow pixels lead the front of the wipe.
      for (let i = 0; i < cols; i += 3) {
        const y = Math.floor(cellNoise(i, 99) * rows);
        if (Math.abs(threshold(i, y, rows) - p) < 0.04) ctx.fillRect(i * CELL + CELL / 4, y * CELL + CELL / 4, CELL / 2, CELL / 2);
      }
    };

    const reduce = reducedMotion();

    const onClick = (e: MouseEvent) => {
      const link = linkFromClick(e);
      if (!link || link.url.pathname === location.pathname) return;
      const { a, url } = link;
      if (reduce || state.current.phase !== "idle") return;
      const href = url.pathname + url.search + url.hash;

      const doc = document as ViewTransitionDocument;
      const shot = a.dataset.transition === "project" ? a.querySelector<HTMLElement>(".project-image") : null;
      if (shot && doc.startViewTransition) {
        e.preventDefault();
        shot.style.viewTransitionName = "ox-project";
        document.documentElement.classList.add("vt-project");
        const vt = doc.startViewTransition(async () => {
          router.push(href);
          const visual = await waitFor(() => document.querySelector<HTMLImageElement>("dialog[open] .dialog-visual"));
          await visual?.decode().catch(() => {});
        });
        vt.finished.finally(() => document.documentElement.classList.remove("vt-project"));
        return;
      }

      e.preventDefault();
      state.current.phase = "cover";
      gsap.to(state.current, {
        p: 1, duration: 0.55, ease: "power2.in", onUpdate: drawRef.current,
        onComplete: () => {
          state.current.phase = "covered";
          router.push(href);
        },
      });
      // Never stay stuck behind the curtain if the route does not change.
      window.clearTimeout(stuckTimer);
      stuckTimer = window.setTimeout(() => { if (state.current.phase === "covered") reveal(); }, 4000);
    };

    const reveal = () => {
      state.current.phase = "reveal";
      gsap.to(state.current, {
        p: 0, duration: 0.7, ease: "power2.out", delay: 0.05, onUpdate: drawRef.current,
        onComplete: () => { state.current.phase = "idle"; },
      });
    };
    revealRef.current = reveal;

    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", resize);
      window.clearTimeout(stuckTimer);
    };
  }, [router]);

  // The new route has committed: clear the curtain.
  useEffect(() => {
    if (state.current.phase === "covered" || state.current.phase === "cover") {
      requestAnimationFrame(() => {
        if (state.current.phase === "cover") gsap.killTweensOf(state.current);
        revealRef.current();
      });
    }
  }, [pathname]);

  return <canvas ref={canvasRef} className="ox-wipe" aria-hidden="true" />;
}

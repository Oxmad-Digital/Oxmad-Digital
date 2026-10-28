"use client";

import { useEffect, useRef } from "react";
import { fitCanvas } from "@/lib/canvas";
import { useMediaQuery } from "@/lib/useMediaQuery";
import "./CustomCursor.css";

// Interactive elements framed by the cursor; text fields keep the native caret.
const INTERACTIVE = "a, button, [role='button'], label, select, summary, [data-cursor]";
const TEXT_FIELD = "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";
const FRAME_PADDING = 6;
const PIXEL = 8;

type Pixel = { x: number; y: number; life: number; vx: number; vy: number };

// Only mouse/trackpad users get the custom cursor (never touch screens).
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function labelFor(el: Element | null) {
  if (!el) return "";
  const explicit = el.getAttribute("data-cursor");
  if (explicit !== null) return explicit;
  if (el instanceof HTMLAnchorElement && el.target === "_blank") return "Visiter ↗";
  return "";
}

export default function CustomCursor() {
  const enabled = useMediaQuery(FINE_POINTER);
  const reticleRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const reticle = reticleRef.current!;
    const coords = coordsRef.current!;
    const frame = frameRef.current!;
    const label = labelRef.current!;
    const canvas = trailRef.current!;
    const ctx = canvas.getContext("2d")!;
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#c6b703";

    root.classList.add("has-custom-cursor");

    const mouse = { x: -100, y: -100, px: -100, py: -100 };
    const box = { x: 0, y: 0, w: 0, h: 0 };
    let target: Element | null = null;
    let grab: HTMLElement | null = null;
    let inTrailZone = false;
    let pixels: Pixel[] = [];
    let raf = 0;
    let running = false;
    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      fitCanvas(canvas, ctx, window.innerWidth, window.innerHeight);
      wake();
    };

    const spawnPixels = () => {
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      const count = Math.min(Math.floor(Math.hypot(dx, dy) / 6), 6);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        pixels.push({
          x: Math.round((mouse.px + dx * t) / PIXEL) * PIXEL + (Math.random() - 0.5) * PIXEL * 3,
          y: Math.round((mouse.py + dy * t) / PIXEL) * PIXEL + (Math.random() - 0.5) * PIXEL * 3,
          life: 1,
          vx: (Math.random() - 0.5) * 0.6,
          vy: Math.random() * 0.6 + 0.2,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      root.classList.add("cursor-visible");
      wake();
    };

    const onOver = (e: PointerEvent) => {
      const el = e.target as Element;
      const textField = el.closest(TEXT_FIELD);
      root.classList.toggle("cursor-over-text", !!textField);
      target = textField ? null : el.closest(INTERACTIVE);
      inTrailZone = !reduceMotion && !!el.closest("[data-cursor-trail]");
      // Draggable elements keep the small frame on the pointer instead of being framed whole.
      grab = target || textField ? null : el.closest<HTMLElement>("[data-cursor-grab]");
      root.classList.toggle("cursor-grab", !!grab);

      const text = grab ? grab.dataset.cursorGrab ?? "" : labelFor(target);
      label.textContent = text;
      root.classList.toggle("cursor-has-label", !!text);
      root.classList.toggle("cursor-hover", !!target);
      wake();
    };

    const onLeave = () => root.classList.remove("cursor-visible");
    const onDown = () => {
      root.classList.add("cursor-down");
      if (grab?.dataset.cursorGrabActive) label.textContent = grab.dataset.cursorGrabActive;
    };
    const onUp = () => {
      root.classList.remove("cursor-down");
      if (grab) label.textContent = grab.dataset.cursorGrab ?? "";
    };

    // Only touches the DOM when something changed, and the loop sleeps once everything has
    // settled (it keeps running over a hovered element, which can move while scrolling).
    let lastCoords = "";
    let trailDrawn = false;
    function tick() {
      const moved = mouse.x !== mouse.px || mouse.y !== mouse.py;

      // Read before any write, so the browser never has to lay out mid-frame.
      const rect = target?.isConnected ? target.getBoundingClientRect() : null;

      if (moved) {
        reticle.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
        label.style.transform = `translate3d(${mouse.x + 18}px, ${mouse.y + 18}px, 0)`;
        const text = `X ${String(Math.round(mouse.x)).padStart(4, "0")} · Y ${String(Math.round(mouse.y)).padStart(4, "0")}`;
        if (text !== lastCoords) {
          coords.textContent = text;
          lastCoords = text;
        }
      }

      // Frame snaps around the hovered element, or collapses onto the pointer.
      const goal = rect
        ? { x: rect.left - FRAME_PADDING, y: rect.top - FRAME_PADDING, w: rect.width + FRAME_PADDING * 2, h: rect.height + FRAME_PADDING * 2 }
        : { x: mouse.x - 12, y: mouse.y - 12, w: 24, h: 24 };
      const settled = Math.abs(goal.x - box.x) < 0.1 && Math.abs(goal.y - box.y) < 0.1
        && Math.abs(goal.w - box.w) < 0.1 && Math.abs(goal.h - box.h) < 0.1;
      if (!settled) {
        const ease = reduceMotion ? 1 : 0.22;
        box.x += (goal.x - box.x) * ease;
        box.y += (goal.y - box.y) * ease;
        box.w += (goal.w - box.w) * ease;
        box.h += (goal.h - box.h) * ease;
        frame.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
        frame.style.width = `${box.w}px`;
        frame.style.height = `${box.h}px`;
      }

      if (inTrailZone && moved) spawnPixels();
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      if (pixels.length || trailDrawn) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = accent;
        pixels = pixels.filter((p) => (p.life -= 0.025) > 0);
        for (const p of pixels) {
          p.x += p.vx;
          p.y += p.vy;
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, PIXEL * p.life, PIXEL * p.life);
        }
        ctx.globalAlpha = 1;
        trailDrawn = pixels.length > 0;
      }

      running = moved || !settled || trailDrawn || !!target;
      if (running) raf = requestAnimationFrame(tick);
    }
    resize();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
      root.classList.remove("has-custom-cursor", "cursor-visible", "cursor-hover", "cursor-has-label", "cursor-over-text", "cursor-down", "cursor-grab");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div className="ox-cursor" aria-hidden="true">
        <canvas className="ox-cursor__trail" ref={trailRef} />
        <div className="ox-cursor__frame" ref={frameRef}>
          <i /><i /><i /><i />
        </div>
        <div className="ox-cursor__label" ref={labelRef} />
      </div>
      {/* Own layer: blending only reaches the page if no parent isolates it. */}
      <div className="ox-cursor ox-cursor--blend" aria-hidden="true">
        <div className="ox-cursor__reticle" ref={reticleRef}>
          <i className="ox-cursor__branch ox-cursor__branch--t" />
          <i className="ox-cursor__branch ox-cursor__branch--r" />
          <i className="ox-cursor__branch ox-cursor__branch--b" />
          <i className="ox-cursor__branch ox-cursor__branch--l" />
          <i className="ox-cursor__dot" />
          <span className="ox-cursor__coords" ref={coordsRef} />
        </div>
      </div>
    </>
  );
}

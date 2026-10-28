"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/**
 * Motion tokens shared by every animation of the site.
 * The CSS mirrors live in app/globals.css (--ease-out, --ease-in-out, --dur-*).
 */
export const EASE = {
  out: "expo.out", // ≈ cubic-bezier(.16, 1, .3, 1)
  inOut: "power4.inOut", // ≈ cubic-bezier(.7, 0, .2, 1)
  soft: "power2.out",
} as const;

export const DUR = { fast: 0.25, base: 0.6, slow: 1.1 } as const;

/** Glyphs used by every "code → text" scramble. */
export const SCRAMBLE_CHARS = "01<>/{}[]#_";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 791px)").matches;

/** Live values shared between the scroll timelines and the hero WebGL scene. */
export const heroState = { pixel: 0, dark: 0 };

type MotionWindow = Window & { __oxLenis?: Lenis; __oxMotion?: boolean };
export const motionWindow = () => window as MotionWindow;

/** True while the first-visit intro still covers the page. */
export const introPending = () => document.documentElement.classList.contains("intro");

/** Runs `cb` when the intro starts revealing the page, or on the next frame without intro. */
export function onIntroReveal(cb: () => void) {
  if (!introPending()) {
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
  }
  window.addEventListener("ox:intro-reveal", cb, { once: true });
  return () => window.removeEventListener("ox:intro-reveal", cb);
}

/**
 * Runs each task in idle slices (a few ms each) instead of one block, so setting up
 * many reveals never produces a long task. Returns a cancel function.
 * Safari has no requestIdleCallback: a short timer is a fair stand-in.
 */
export function idleEach(tasks: (() => void)[], timeout = 800) {
  let i = 0;
  let cancel = () => {};
  const run = (deadline?: IdleDeadline) => {
    const started = performance.now();
    const hasTime = () => (deadline && !deadline.didTimeout ? deadline.timeRemaining() > 2 : performance.now() - started < 8);
    do { tasks[i++]?.(); } while (i < tasks.length && hasTime());
    if (i < tasks.length) schedule();
  };
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => run(), 16);
      cancel = () => window.clearTimeout(id);
    }
  };
  if (tasks.length) schedule();
  return () => cancel();
}

/** The same-origin link a plain left click opens in this tab, or null. */
export function linkFromClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  return url.origin === location.origin ? { a, url } : null;
}

export { gsap, ScrollTrigger, SplitText };

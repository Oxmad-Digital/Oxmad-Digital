"use client";

import { useEffect } from "react";
import { cellNoise, fillCells, fitCanvas } from "@/lib/canvas";
import {
  DUR, EASE, ScrollTrigger, SplitText, finePointer, gsap, heroState, onIntroReveal, reducedMotion, idleEach,
} from "@/lib/motion";

const WIPE_CELL = 24;

/** Pixel curtain over a project screenshot, cleared in noise order the first time it enters. */
function pixelReveal(frame: HTMLElement, color: string) {
  const canvas = document.createElement("canvas");
  canvas.className = "pixel-curtain";
  canvas.setAttribute("aria-hidden", "true");
  frame.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const state = { p: 0 };
  let w = 0;
  let h = 0;
  const size = () => {
    w = frame.clientWidth;
    h = frame.clientHeight;
    fitCanvas(canvas, ctx, w, h);
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    // Clears diagonally from the top-left, with grain.
    fillCells(ctx, w, h, WIPE_CELL, (x, y, cols, rows) =>
      cellNoise(x + 3, y + 7) * 0.5 + ((x / cols) * 0.6 + (y / rows) * 0.4) * 0.5 >= state.p);
  };
  size();
  draw();
  ScrollTrigger.create({
    trigger: frame,
    start: "top 82%",
    once: true,
    onEnter: () => {
      size();
      gsap.to(state, {
        p: 1.02, duration: 1.15, ease: "power2.inOut", onUpdate: draw, onComplete: () => canvas.remove(),
      });
    },
  });
  return () => canvas.remove();
}

/** Contact headline: variable-weight letters swell around the pointer. */
function variableWeight(title: HTMLElement, chars: HTMLElement[]) {
  const base = 640;
  const peak = 860;
  const radius = 260;
  let centers: { x: number; y: number }[] = [];
  const measure = () => {
    const r = title.getBoundingClientRect();
    centers = chars.map((c) => {
      const b = c.getBoundingClientRect();
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
    });
  };
  const weights = chars.map(() => base);
  const pointer = { x: -9999, y: -9999, active: false };
  const onMove = (e: PointerEvent) => {
    const r = title.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
    wake();
  };
  const onLeave = () => { pointer.active = false; wake(); };
  const section = title.closest("section")!;
  section.addEventListener("pointermove", onMove, { passive: true });
  section.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", measure);
  measure();

  let settled = true;
  let raf = 0;
  let running = false;
  const wake = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };
  const tick = () => {
    settled = true;
    chars.forEach((c, i) => {
      const goal = pointer.active
        ? base + (peak - base) * Math.max(0, 1 - Math.hypot(centers[i].x - pointer.x, centers[i].y - pointer.y) / radius) ** 2
        : base;
      weights[i] += (goal - weights[i]) * 0.14;
      if (Math.abs(goal - weights[i]) > 0.5) settled = false;
      c.style.fontWeight = String(Math.round(weights[i]));
    });
    running = !settled;
    if (running) raf = requestAnimationFrame(tick);
  };
  return () => {
    cancelAnimationFrame(raf);
    section.removeEventListener("pointermove", onMove);
    section.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("resize", measure);
  };
}

/** Scroll choreography specific to the home page. */
export default function HomeMotion() {
  useEffect(() => {
    if (reducedMotion()) return;
    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      const hero = document.querySelector<HTMLElement>(".hero")!;

      // Without WebGL (mobile, no GPU) the picture develops from a blur instead.
      cleanups.push(onIntroReveal(() => {
        if (!hero.classList.contains("has-gl")) hero.classList.add("is-developing");
      }));

      // 01 — The hero dissolves into the black of the next section.
      gsap.timeline({
        scrollTrigger: {
          trigger: hero, start: "top top", end: "bottom top", scrub: true,
          onUpdate: (self) => {
            heroState.dark = Math.min(1, self.progress * 1.25);
            heroState.pixel = self.progress * 0.55;
          },
        },
      })
        .to(".hero > .container", { yPercent: -8, autoAlpha: 0, ease: "power1.in", duration: 0.55 }, 0)
        .to(".hero-background", { autoAlpha: 0, scale: 1.06, ease: "none", duration: 1 }, 0);
    });

    // The typing overlay runs CSS animations: pause them while the hero is off screen.
    ctx.add(() => {
      ScrollTrigger.create({
        trigger: ".hero", start: "top bottom", end: "bottom top",
        onToggle: (self) => document.querySelector(".hero")?.classList.toggle("is-offscreen", !self.isActive),
      });
    });

    // Everything below the fold is wired in idle slices, one section at a time.
    const later = (fn: () => void) => () => { ctx.add(fn); };
    cleanups.push(idleEach([later(() => {

      // 02 — Selected work: pixel curtain. No inner parallax: it would have to zoom
      // the screenshots, which already match the frame ratio, and crop their edges.
      document.querySelectorAll<HTMLElement>(".work .project-image").forEach((frame) => {
        cleanups.push(pixelReveal(frame, "#191a16"));
      });

    }), later(() => {
      // 03 — Manifesto: the yellow underline draws itself.
      const underline = document.querySelector<HTMLElement>(".philosophy h2 .underline");
      if (underline) {
        gsap.fromTo(underline, { "--u": 0 }, {
          "--u": 1, ease: "none",
          scrollTrigger: { trigger: underline, start: "top 80%", end: "top 45%", scrub: 0.6 },
        });
      }

    }), later(() => {
      // 04 — Process: each segment fills while it is read, nodes light up when reached.
      document.querySelectorAll<HTMLElement>(".process .step").forEach((step, i, all) => {
        ScrollTrigger.create({ trigger: step, start: "top 62%", toggleClass: "is-active" });
        if (i < all.length - 1) {
          gsap.fromTo(step, { "--fill": 0 }, {
            "--fill": 1, ease: "none",
            scrollTrigger: { trigger: step, start: "top 62%", end: "bottom 62%", scrub: true },
          });
        }
      });

    }), later(() => {
      // 05 — Contact: letters rise, then react to the pointer; the chevron turns with the scroll.
      const contactTitle = document.querySelector<HTMLElement>(".contact-section h2");
      if (contactTitle) {
        let stopWeight: (() => void) | undefined;
        cleanups.push(() => stopWeight?.());
        SplitText.create(contactTitle, {
          type: "lines,chars",
          mask: "lines",
          linesClass: "ox-line",
          charsClass: "ox-char",
          autoSplit: true,
          onSplit(self) {
            gsap.set(contactTitle, { autoAlpha: 1 });
            stopWeight?.();
            if (finePointer()) stopWeight = variableWeight(contactTitle, self.chars as HTMLElement[]);
            return gsap.from(self.chars, {
              yPercent: 115, duration: DUR.slow, ease: EASE.out, stagger: 0.025,
              scrollTrigger: { trigger: contactTitle, start: "top 85%", once: true },
            });
          },
        });
      }
      const contact = document.querySelector<HTMLElement>(".contact-section");
      if (contact) {
        gsap.fromTo(contact, { "--sym-rot": "-14deg" }, {
          "--sym-rot": "10deg", ease: "none",
          scrollTrigger: { trigger: contact, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    })]));

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
      heroState.dark = 0;
      heroState.pixel = 0;
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  DUR, EASE, SCRAMBLE_CHARS, ScrollTrigger, SplitText, finePointer, gsap, motionWindow, onIntroReveal, reducedMotion, idleEach,
} from "@/lib/motion";

/**
 * Declarative motion for every page, driven by data attributes:
 * - data-reveal="lines"   masked line-by-line rise (titles)
 * - data-reveal="fade"    soft rise
 * - data-reveal="stagger" children rise one after the other
 * - data-reveal="rise"    moves up without ever being hidden (LCP text)
 * - data-reveal-now       plays after the intro instead of on scroll (above the fold)
 * - data-reveal-delay="s" extra delay
 * - data-scramble         code glyphs settle into the text when it enters
 * - data-magnetic         element leans toward the pointer
 */
export default function MotionScanner() {
  const pathname = usePathname();

  useEffect(() => {
    motionWindow().__oxMotion = true;
    if (reducedMotion()) {
      document.documentElement.classList.remove("motion");
      return;
    }

    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {});
    // Above-the-fold elements are set up now, everything else when the thread is idle.
    const setupReveals = (els: HTMLElement[]) => ctx.add(() => {
      els.forEach((el) => {
        const kind = el.dataset.reveal;
        const delay = Number(el.dataset.revealDelay ?? 0);
        const now = el.hasAttribute("data-reveal-now");
        const trigger = now ? undefined : { trigger: el, start: "top 88%", once: true };

        const play = (build: () => gsap.core.Animation) => {
          if (!now) return build();
          const anim = build().pause();
          cleanups.push(onIntroReveal(() => anim.play()));
          return anim;
        };

        if (kind === "lines") {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "ox-line",
            autoSplit: true,
            onSplit(self) {
              gsap.set(el, { autoAlpha: 1 });
              return play(() => gsap.from(self.lines, {
                yPercent: 112, duration: DUR.slow, ease: EASE.out, stagger: 0.09, delay, scrollTrigger: trigger,
              }));
            },
          });
        } else if (kind === "stagger") {
          gsap.set(el, { autoAlpha: 1 });
          play(() => gsap.from(el.children, {
            y: 34, autoAlpha: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.12, delay, scrollTrigger: trigger,
          }));
        } else if (kind === "rise") {
          play(() => gsap.from(el, { y: 24, duration: DUR.slow, ease: EASE.out, delay, scrollTrigger: trigger }));
        } else {
          play(() => gsap.fromTo(el, { y: 30, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: DUR.slow, ease: EASE.out, delay, scrollTrigger: trigger,
          }));
        }
      });
    });
    const all = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    setupReveals(all.filter((el) => el.hasAttribute("data-reveal-now")));
    cleanups.push(idleEach(all.filter((el) => !el.hasAttribute("data-reveal-now")).map((el) => () => setupReveals([el]))));

    ctx.add(() => {
      document.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el) => {
        const text = el.textContent ?? "";
        const scramble = () => gsap.to(el, {
          duration: Math.min(1.4, 0.5 + text.length * 0.025),
          scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.15 },
          delay: Number(el.dataset.revealDelay ?? 0),
        });
        if (el.closest("[data-reveal-now], .hero")) cleanups.push(onIntroReveal(scramble));
        else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: scramble });
      });
    });

    if (finePointer()) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const strength = Number(el.dataset.magnetic || 0.35);
        const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - (r.left + r.width / 2)) * strength);
          y((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const leave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .4)", overwrite: true });
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          gsap.set(el, { clearProps: "transform" });
        });
      });
    }

    // ScrollTrigger refreshes itself on load and resize; only a late web font needs a nudge.
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [pathname]);

  return null;
}

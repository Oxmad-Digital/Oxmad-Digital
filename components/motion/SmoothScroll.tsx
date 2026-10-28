"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, linkFromClick, motionWindow, reducedMotion } from "@/lib/motion";

/** Lenis inertia scroll, driven by the GSAP ticker so ScrollTrigger stays in sync. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      // Dialogs and the mobile menu keep their own native scroll.
      prevent: (node) => !!node.closest("dialog, .nav-links, [data-lenis-prevent]"),
    });
    motionWindow().__oxLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    let attached = false;
    const detach = () => {
      if (!attached) return;
      attached = false;
      gsap.ticker.remove(raf);
    };
    const raf = (time: number) => {
      lenis.raf(time * 1000);
      // Once interpolation reaches its target, no frame work is required. A new
      // wheel/touch gesture wakes the same Lenis instance before its next frame.
      if (!lenis.isScrolling) detach();
    };
    const attach = () => {
      if (attached || document.hidden) return;
      attached = true;
      lenis.time = gsap.ticker.time * 1000;
      gsap.ticker.add(raf);
    };
    const stopVirtualWake = lenis.on("virtual-scroll", attach);
    attach();
    gsap.ticker.lagSmoothing(0);
    // No visual state can advance in a hidden tab. Detach the callback entirely and
    // restore it on return, keeping the same Lenis instance and scroll position.
    const onVisibility = () => {
      if (document.hidden) detach();
      else if (lenis.isScrolling) attach();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // The first-visit intro locks the scroll until it is gone.
    if (document.documentElement.classList.contains("intro")) {
      lenis.stop();
      window.addEventListener("ox:intro-reveal", () => lenis.start(), { once: true });
    }

    // Same-page anchors ("#contact", "/#expertise" on the home) glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      const url = linkFromClick(e)?.url;
      if (!url || url.pathname !== location.pathname || !url.hash) return;
      let target: HTMLElement | number | null = 0;
      try { target = url.hash === "#haut" ? 0 : document.querySelector<HTMLElement>(`#${CSS.escape(decodeURIComponent(url.hash.slice(1)))}`); } catch { return; }
      if (target === null) return;
      e.preventDefault();
      attach();
      lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      history.replaceState(history.state, "", url.hash);
    };
    window.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      stopVirtualWake();
      detach();
      lenis.destroy();
      delete motionWindow().__oxLenis;
    };
  }, []);

  useEffect(() => {
    motionWindow().__oxLenis?.resize();
  }, [pathname]);

  return null;
}

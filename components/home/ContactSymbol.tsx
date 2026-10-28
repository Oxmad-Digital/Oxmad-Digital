"use client";

import { useEffect, useRef } from "react";

const FRICTION = 0.95;

/** The big background X of the contact section: grab it and drag around its center to spin it. */
export default function ContactSymbol() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let spin = 0;
    let velocity = 0;
    let lastAngle = 0;
    let dragging = false;
    let raf = 0;

    const apply = () => el.style.setProperty("--sym-spin", `${spin}deg`);
    const angleAt = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };

    // Lets the X keep turning after release and slow down on its own.
    const coast = () => {
      velocity *= FRICTION;
      spin += velocity;
      apply();
      if (Math.abs(velocity) > 0.02) raf = requestAnimationFrame(coast);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      e.preventDefault();
      cancelAnimationFrame(raf);
      el.setPointerCapture(e.pointerId);
      dragging = true;
      velocity = 0;
      lastAngle = angleAt(e);
      el.classList.add("is-dragging");
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const angle = angleAt(e);
      // Shortest way round, so crossing ±180° does not flip the X.
      const delta = ((angle - lastAngle + 540) % 360) - 180;
      lastAngle = angle;
      spin += delta;
      velocity = delta;
      apply();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
      if (!reduceMotion) raf = requestAnimationFrame(coast);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return <div className="contact-symbol" ref={ref} data-cursor-grab="Attraper" data-cursor-grab-active="Tourner ↻" aria-hidden="true" />;
}

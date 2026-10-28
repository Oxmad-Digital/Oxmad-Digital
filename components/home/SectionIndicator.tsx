"use client";

import { useEffect, useRef } from "react";
import { SCRAMBLE_CHARS, ScrollTrigger, gsap, reducedMotion } from "@/lib/motion";

const SECTIONS: { id: string; label: string; light?: boolean }[] = [
  { id: "expertise", label: "Expertises" },
  { id: "experiences", label: "Playground" },
  { id: "realisations", label: "Projets" },
  { id: "approche", label: "Différence", light: true },
  { id: "processus", label: "Méthode", light: true },
  { id: "contact", label: "Contact" },
];

/** Fixed "0X / 06 · Section" counter with the page progress, shown once past the hero. */
export default function SectionIndicator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    // Kept here: React clears the refs before this effect's cleanup kills the triggers.
    const bar = barRef.current!;
    const reduce = reducedMotion();
    let current = -1;

    const show = (i: number) => {
      if (i === current) return;
      current = i;
      root.classList.toggle("is-visible", i >= 0);
      if (i < 0) return;
      root.classList.toggle("is-light", !!SECTIONS[i].light);
      const index = `0${i + 1}`;
      const label = SECTIONS[i].label;
      if (reduce) {
        indexRef.current!.textContent = index;
        labelRef.current!.textContent = label;
        return;
      }
      gsap.to(indexRef.current, { duration: 0.5, scrambleText: { text: index, chars: "0123456789" }, overwrite: true });
      gsap.to(labelRef.current, { duration: 0.7, scrambleText: { text: label, chars: SCRAMBLE_CHARS, speed: 0.6 }, overwrite: true });
    };

    const triggers = SECTIONS.map(({ id }, i) => {
      const el = document.getElementById(id);
      return el && ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          if (self.isActive) show(i);
          else if (i === 0 && self.direction < 0) show(-1);
        },
      });
    });
    const progress = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => { bar.style.transform = `scaleY(${self.progress})`; },
    });

    return () => {
      triggers.forEach((t) => t?.kill());
      progress.kill();
    };
  }, []);

  return (
    <div className="section-indicator smallcap" ref={rootRef} aria-hidden="true">
      <span className="section-indicator__count"><span ref={indexRef}>01</span> / 06</span>
      <span className="section-indicator__bar"><span ref={barRef} /></span>
      <span ref={labelRef}>{SECTIONS[0].label}</span>
    </div>
  );
}

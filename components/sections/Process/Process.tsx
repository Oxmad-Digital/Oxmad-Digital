"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./Process.css";

const PROCESS = {
  fr: [
    { label: "Analyse", desc: "Audit de votre présence actuelle, étude de vos concurrents et définition des objectifs mesurables.", icon: "ti-zoom-scan" },
    { label: "Design", desc: "Maquettes haute fidélité validées avec vous avant tout développement — zéro surprise.", icon: "ti-pencil" },
    { label: "Développement", desc: "Code propre, rapide et scalable. Tests sur tous les appareils avant livraison.", icon: "ti-code" },
    { label: "Optimisation\nSEO & performances", desc: "Référencement, vitesse de chargement et Core Web Vitals optimisés pour un site visible et rapide.", icon: "ti-brand-speedtest", wide: true },
    { label: "Lancement", desc: "Mise en ligne, formation, et suivi post-lancement pour s'assurer que tout fonctionne parfaitement.", icon: "ti-rocket" },
  ],
  en: [
    { label: "Analysis", desc: "Audit of your current presence, review of your competitors and definition of measurable goals.", icon: "ti-zoom-scan" },
    { label: "Design", desc: "High-fidelity mockups validated with you before any development — zero surprises.", icon: "ti-pencil" },
    { label: "Development", desc: "Clean, fast and scalable code. Tested on every device before delivery.", icon: "ti-code" },
    { label: "SEO & performance\noptimization", desc: "Search ranking, load speed and Core Web Vitals optimized for a fast, visible site.", icon: "ti-brand-speedtest", wide: true },
    { label: "Launch", desc: "Go-live, training, and post-launch follow-up to make sure everything runs perfectly.", icon: "ti-rocket" },
  ],
};

const COPY = {
  fr: {
    badge: "Processus",
    title: "Comment nous",
    highlight: "travaillons",
    subtitle: "Une méthode claire en cinq étapes, de la première analyse jusqu'au lancement — pour avancer ensemble, sans surprise.",
    swipe: "Faites glisser pour tout voir",
  },
  en: {
    badge: "Process",
    title: "How we",
    highlight: "work",
    subtitle: "A clear five-step method, from the first analysis through to launch — so we move forward together, with no surprises.",
    swipe: "Swipe to see more",
  },
};

export default function Process() {
  const { lang } = useLanguage();
  const process = PROCESS[lang];
  const c = COPY[lang];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const cards = Array.from(
        el.querySelectorAll<HTMLElement>(".ox-process-node-wrap")
      );
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActive(closest);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [lang]);

  return (
    <section className="ox-process" id="processus">
      <div className="ox-process-glow" />
      <div className="ox-process-header">
        <SectionHeader
          badge={c.badge}
          title={c.title}
          highlight={c.highlight}
          subtitle={c.subtitle}
          align="center"
          className="ox-process-section-header"
        />
      </div>

      <div className="ox-process-swipe-hint">
        <i className="ti ti-arrow-left" />
        {c.swipe}
        <i className="ti ti-arrow-right" />
      </div>

      <div className="ox-process-timeline" ref={trackRef}>
        <div className="ox-process-line" />
        {process.map((s, i) => {
          const dir = i % 2 === 0 ? "up" : "down";
          return (
            <div className="ox-process-node-wrap" key={i}>
              <div className={`ox-process-bubble ox-process-bubble-${dir}${s.wide ? " ox-process-bubble-wide" : ""}`}>
                <div className="ox-process-bubble-title">
                  {s.label.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {idx > 0 && <br className="ox-process-bubble-title-break" />}
                      {idx > 0 && " "}
                      {line}
                    </span>
                  ))}
                </div>
                <p>{s.desc}</p>
                <span className="ox-process-bubble-tail" />
              </div>
              <div className="ox-process-node">
                <i className={`ti ${s.icon}`} />
                <span className="ox-process-node-index">{i + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ox-process-dots">
        {process.map((_, i) => (
          <span
            key={i}
            className={`ox-process-dot ${i === active ? "is-active" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}

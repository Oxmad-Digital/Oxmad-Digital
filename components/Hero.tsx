"use client";

import LogosBand from "./LogosBand";
import { useLanguage } from "./Language/LanguageContext";
import "./hero.css";

const COPY = {
  fr: {
    titleLine1: "Votre présence",
    titleLine2: "digitale,",
    titleAccent: "enfin au niveau.",
    subtitle:
      "Sites vitrines, e-commerce et SEO conçus pour évoluer avec votre business. Modernes, performants et durables.",
    bubble: "Hey, bienvenue sur notre site",
    mascotAlt: "Mascotte Oxmad Digital",
  },
  en: {
    titleLine1: "Your digital",
    titleLine2: "presence,",
    titleAccent: "finally up to par.",
    subtitle:
      "Showcase sites, e-commerce and SEO built to grow with your business. Modern, high-performing and built to last.",
    bubble: "Hey, welcome to our site",
    mascotAlt: "Oxmad Digital mascot",
  },
};

export default function Hero() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="ox-hero">
      <div className="ox-hero-inner">
        <div className="ox-hero-x">
          <svg viewBox="0 0 374 313" preserveAspectRatio="xMidYMid meet">
            <polygon
              fill="var(--r)"
              points="271,5 340,5 236,133 351,265 282,265 201,175 87,312 18,312 131,173 22,48 90,48 166,130"
            />
          </svg>
        </div>
        <div className="ox-hero-blob ox-hero-blob-a" />
        <div className="ox-hero-blob ox-hero-blob-b" />
        <div className="ox-hero-grid" />

        <div className="ox-hero-left">
          <h1 className="ox-hero-title">
            {c.titleLine1}
            <br />
            {c.titleLine2}
            <br />
            <span className="ox-hero-title-accent">{c.titleAccent}</span>
          </h1>
          <p className="ox-hero-subtitle">{c.subtitle}</p>
        </div>

        <div className="ox-hero-right">
          <div className="ox-hero-glow" />
          <div className="ox-hero-orbit">
            <span className="ox-hero-orbit-dot" />
          </div>
          <div className="ox-hero-robot">
            <div className="ox-hero-bubble">{c.bubble}</div>
            <img src="/robot-oxmad.svg" alt={c.mascotAlt} />
          </div>
        </div>
      </div>

      <LogosBand />
    </section>
  );
}

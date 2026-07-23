"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./About.css";

const STACKS = {
  fr: [
    {
      key: "vitrine",
      tag: "Stack — Sites vitrines",
      hub: "Site vitrine",
      hubIcon: "ti-world",
      tools: [
        { key: "nextjs", icon: "ti-brand-nextjs", label: "Next.js" },
        { key: "vercel", icon: "ti-triangle-filled", label: "Vercel" },
        { key: "github", icon: "ti-brand-github", label: "GitHub" },
        { key: "resend", icon: "ti-send", label: "Resend" },
        { key: "cloudinary", icon: "ti-cloud", label: "Cloudinary" },
      ],
    },
    {
      key: "ecommerce",
      tag: "Stack — Sites e-commerce",
      hub: "E-commerce",
      hubIcon: "ti-shopping-bag",
      tools: [
        { key: "database", icon: "ti-database", label: "MongoDB / Supabase" },
        { key: "vercel", icon: "ti-triangle-filled", label: "Vercel" },
        { key: "github", icon: "ti-brand-github", label: "GitHub" },
        { key: "nextjs", icon: "ti-brand-nextjs", label: "Next.js" },
        { key: "resend", icon: "ti-send", label: "Resend" },
        { key: "cloudinary", icon: "ti-cloud", label: "Cloudinary" },
        { key: "payment", icon: "ti-credit-card", label: "API paiement" },
        { key: "shipping", icon: "ti-truck-delivery", label: "API transporteur" },
      ],
    },
  ],
  en: [
    {
      key: "vitrine",
      tag: "Stack — Showcase sites",
      hub: "Showcase site",
      hubIcon: "ti-world",
      tools: [
        { key: "nextjs", icon: "ti-brand-nextjs", label: "Next.js" },
        { key: "vercel", icon: "ti-triangle-filled", label: "Vercel" },
        { key: "github", icon: "ti-brand-github", label: "GitHub" },
        { key: "resend", icon: "ti-send", label: "Resend" },
        { key: "cloudinary", icon: "ti-cloud", label: "Cloudinary" },
      ],
    },
    {
      key: "ecommerce",
      tag: "Stack — E-commerce sites",
      hub: "E-commerce",
      hubIcon: "ti-shopping-bag",
      tools: [
        { key: "database", icon: "ti-database", label: "MongoDB / Supabase" },
        { key: "vercel", icon: "ti-triangle-filled", label: "Vercel" },
        { key: "github", icon: "ti-brand-github", label: "GitHub" },
        { key: "nextjs", icon: "ti-brand-nextjs", label: "Next.js" },
        { key: "resend", icon: "ti-send", label: "Resend" },
        { key: "cloudinary", icon: "ti-cloud", label: "Cloudinary" },
        { key: "payment", icon: "ti-credit-card", label: "Payment API" },
        { key: "shipping", icon: "ti-truck-delivery", label: "Shipping API" },
      ],
    },
  ],
};

const RADIUS = 40;

function nodePosition(index: number, total: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: 50 + RADIUS * Math.cos(angle),
    y: 50 + RADIUS * Math.sin(angle),
  };
}

const FEATURES = {
  fr: [
    {
      icon: "ti-stack-2",
      title: "Une stack moderne (Next.js)",
      desc: "Nous avons fait le choix de technologies de pointe pour que vous ne soyez jamais limité en termes de design ou de fonctionnalités.",
    },
    {
      icon: "ti-key",
      title: "Un actif que vous possédez",
      desc: "Nous vous livrons le site avec sa base de code (codebase) et créons l'ensemble des comptes de services tiers à votre nom. Vous êtes ainsi le véritable propriétaire de votre site.",
    },
  ],
  en: [
    {
      icon: "ti-stack-2",
      title: "A modern stack (Next.js)",
      desc: "We chose cutting-edge technologies so you're never limited in terms of design or features.",
    },
    {
      icon: "ti-key",
      title: "An asset you truly own",
      desc: "We deliver the site along with its codebase and create all third-party service accounts in your name. You are the real owner of your site.",
    },
  ],
};

const COPY = {
  fr: {
    badge: "À propos",
    title: "Des solutions digitales performantes et",
    highlight: "durables",
    subtitle:
      "Chez Oxmad Digital, nous sommes spécialisés dans la création de solutions digitales sur mesure, adaptées à vos besoins. Nous concevons des sites web à votre image et des outils performants, conçus pour durer.",
    featuresTitle: "Notre approche technique & engagement",
  },
  en: {
    badge: "About",
    title: "High-performing digital solutions,",
    highlight: "built to last",
    subtitle:
      "At Oxmad Digital, we specialize in building custom digital solutions tailored to your needs. We design websites that reflect your brand and tools built for performance and longevity.",
    featuresTitle: "Our technical approach & commitment",
  },
};

export default function About() {
  const [activeStack, setActiveStack] = useState(0);
  const { lang } = useLanguage();
  const stacks = STACKS[lang];
  const features = FEATURES[lang];
  const c = COPY[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStack((i) => (i + 1) % stacks.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [stacks.length]);

  const stack = stacks[activeStack];

  return (
    <section className="ox-about" id="apropos">
      <div className="ox-about-glow" />
      <div className="ox-about-grid">
        <div className="ox-about-image ox-about-stack">
          <span className="ox-about-image-label ox-about-stack-tag">
            <i className="ti ti-stack-2" />
            {stack.tag}
          </span>

          <div className="ox-about-stack-dots">
            {stacks.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={s.tag}
                className={`ox-about-stack-dot ${i === activeStack ? "ox-about-stack-dot-active" : ""}`}
                onClick={() => setActiveStack(i)}
              />
            ))}
          </div>

          <div className="ox-about-stack-scene" key={stack.key}>
            <svg className="ox-about-stack-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              {stack.tools.map((n, i) => {
                const { x, y } = nodePosition(i, stack.tools.length);
                return <line key={n.key} x1="50" y1="50" x2={x} y2={y} />;
              })}
            </svg>

            <div className="ox-about-stack-hub" aria-label={stack.hub}>
              <i className={`ti ${stack.hubIcon}`} />
            </div>

            {stack.tools.map((n, i) => {
              const { x, y } = nodePosition(i, stack.tools.length);
              return (
                <div
                  key={n.key}
                  className="ox-about-stack-node"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="ox-about-stack-node-icon">
                    <i className={`ti ${n.icon}`} />
                  </span>
                  <span>{n.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ox-about-copy">
          <SectionHeader
            badge={c.badge}
            title={c.title}
            highlight={c.highlight}
            subtitle={c.subtitle}
            className="ox-about-header"
          />
          <div className="ox-about-features">
            <h3 className="ox-about-features-title">{c.featuresTitle}</h3>
            {features.map((f, i) => (
              <div className="ox-about-feature" key={i}>
                <div className="ox-about-feature-head">
                  <span className="ox-about-feature-icon">
                    <i className={`ti ${f.icon}`} />
                  </span>
                  <h4>{f.title}</h4>
                </div>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

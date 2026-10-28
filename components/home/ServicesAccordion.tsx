"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/motion";
import { SERVICE_IMAGES } from "@/lib/media";
import { useMediaQuery } from "@/lib/useMediaQuery";

const SERVICES = [
  {
    title: "Sites vitrines",
    text: "Une présence en ligne qui exprime vraiment qui vous êtes.",
    details: "Architecture de contenu, direction artistique, design responsive et développement web : nous construisons un site sur mesure qui valorise votre marque et facilite la prise de contact.",
    visual: SERVICE_IMAGES.websites,
  },
  {
    title: "E-commerce",
    text: "Des parcours d'achat simples et efficaces.",
    details: "De la découverte du produit au paiement, chaque étape est pensée pour rendre l'achat naturel. Catalogue, panier, gestion des commandes et expérience mobile travaillent ensemble.",
    visual: SERVICE_IMAGES.ecommerce,
  },
  {
    title: "SEO & performance",
    text: "Être visible. Être rapide. Le rester.",
    details: "Une structure technique propre, des pages légères, un contenu lisible et une expérience mobile soignée. Nous travaillons les fondations de votre référencement naturel dès la conception.",
    visual: SERVICE_IMAGES.seo,
  },
  {
    title: "Développement sur mesure",
    text: "Quand votre idée dépasse les limites d'un site classique.",
    details: "Espaces clients, tableaux de bord, outils métier et intégrations. Nous créons les fonctionnalités utiles à votre organisation, avec une architecture capable d'évoluer dans le temps.",
    visual: SERVICE_IMAGES.custom,
  },
];

// Mouse users without reduced motion get the floating preview.
const PREVIEW_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export default function ServicesAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewEnabled = useMediaQuery(PREVIEW_QUERY);
  // The visuals are fetched on the first hover only: no cost for visitors who never hover,
  // and no lazy image that could later be reported as the LCP.
  const [armed, setArmed] = useState(false);

  // Floating visual that trails the pointer over the list (mouse users only).
  useEffect(() => {
    if (!previewEnabled) return;
    const list = listRef.current!;
    const preview = previewRef.current;
    if (!preview) return;
    const x = gsap.quickTo(preview, "x", { duration: 0.7, ease: "power3.out" });
    const y = gsap.quickTo(preview, "y", { duration: 0.7, ease: "power3.out" });
    const rot = gsap.quickTo(preview, "rotation", { duration: 0.9, ease: "power3.out" });
    let lastX = 0;
    const onMove = (e: PointerEvent) => {
      x(e.clientX + 36);
      y(e.clientY - 110);
      rot(Math.max(-8, Math.min(8, (e.clientX - lastX) * 0.6)));
      lastX = e.clientX;
    };
    const onEnter = (e: PointerEvent) => {
      setArmed(true);
      gsap.set(preview, { x: e.clientX + 36, y: e.clientY - 110 });
      lastX = e.clientX;
      preview.classList.add("is-visible");
    };
    const onLeave = () => {
      preview.classList.remove("is-visible");
      setHoverIndex(null);
    };
    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerenter", onEnter);
    list.addEventListener("pointerleave", onLeave);
    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerenter", onEnter);
      list.removeEventListener("pointerleave", onLeave);
    };
  }, [previewEnabled]);

  return (
    <div className="services" id="services" ref={listRef}>
      {SERVICES.map((service, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={service.title} className={`service-item${isOpen ? " open" : ""}`} onPointerEnter={() => setHoverIndex(i)}>
            <button
              className="service-button"
              type="button"
              aria-expanded={isOpen}
              data-cursor={isOpen ? "Fermer" : "Ouvrir"}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span className="service-number" data-scramble>{String(i + 1).padStart(2, "0")} /</span>
              <span className="service-title">{service.title}</span>
              <span className="service-text">{service.text}</span>
              <span className="service-arrow">+</span>
            </button>
            <div className="service-expanded"><div><p>{service.details}</p></div></div>
          </div>
        );
      })}
      {previewEnabled && (
        <div className="service-preview" ref={previewRef} aria-hidden="true">
          {SERVICES.map((service, i) => (
            <div key={service.title} className={`service-preview__frame${hoverIndex === i ? " is-active" : ""}`}>
              {armed && <Image src={service.visual} alt="" fill sizes="320px" loading="eager" />}
            </div>
          ))}
          <span className="service-preview__tag smallcap">{hoverIndex !== null ? `0${hoverIndex + 1} / ${SERVICES[hoverIndex].title}` : ""}</span>
        </div>
      )}
    </div>
  );
}

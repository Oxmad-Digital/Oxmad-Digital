"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ContactModal from "@/components/Contact/ContactModal";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./Cta.css";

const COPY = {
  fr: {
    badge: "Contact",
    titleLead: "Prêt à lancer votre ",
    titleAccent: "projet ?",
    desc: "Réservez un appel gratuit et sans engagement pour discuter de votre vision et obtenir un devis en 24h.",
    contact: "Nous contacter",
    seeWork: "Voir nos réalisations",
  },
  en: {
    badge: "Contact",
    titleLead: "Ready to launch your ",
    titleAccent: "project?",
    desc: "Book a free, no-commitment call to discuss your vision and get a quote within 24 hours.",
    contact: "Contact us",
    seeWork: "See our work",
  },
};

export default function Cta() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="ox-cta" id="contact">
      <div className="ox-cta-glow" />
      <div className="ox-cta-inner">
        <Badge className="ox-cta-badge">{c.badge}</Badge>
        <h2 className="ox-cta-title">
          {c.titleLead}
          <span className="ox-cta-title-accent">{c.titleAccent}</span>
        </h2>
        <p className="ox-cta-desc">{c.desc}</p>
        <div className="ox-cta-actions">
          <Button variant="primary" size="lg" onClick={() => setIsContactOpen(true)}>
            {c.contact}
          </Button>
          <Button variant="outline" size="lg" href="/realisations">
            {c.seeWork}
          </Button>
        </div>
      </div>
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </section>
  );
}

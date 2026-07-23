"use client";

import SectionHeader from "@/components/ui/SectionHeader";
import ServiceCard from "@/components/cards/ServiceCard";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./Services.css";

const SERVICES = {
  fr: [
    { number: "01", icon: "ti-layout-2", title: "Site vitrine", desc: "Un site professionnel qui reflète votre image et convertit vos visiteurs en clients qualifiés." },
    { number: "02", icon: "ti-shopping-cart", title: "E-commerce", desc: "Boutique en ligne performante avec paiement sécurisé, gestion des stocks et tunnel de vente optimisé." },
    { number: "03", icon: "ti-search", title: "SEO & Performance", desc: "Positionnement durable sur Google Madagascar et optimisation de la vitesse, du Core Web Vitals et de l'expérience mobile pour maximiser les conversions." },
    { number: "04", icon: "ti-refresh", title: "Refonte & Migration", desc: "Modernisation de votre ancien site sans perdre votre référencement ni vos données clients." },
    { number: "05", icon: "ti-tool", title: "Maintenance", desc: "Suivi mensuel, mises à jour de sécurité, sauvegardes automatiques et rapports de performance." },
    { number: "06", icon: "ti-code", title: "Développement à la demande", desc: "Fonctionnalités sur mesure, intégrations et outils internes développés selon vos besoins spécifiques." },
  ],
  en: [
    { number: "01", icon: "ti-layout-2", title: "Showcase website", desc: "A professional site that reflects your brand and converts visitors into qualified customers." },
    { number: "02", icon: "ti-shopping-cart", title: "E-commerce", desc: "High-performing online store with secure payment, stock management and an optimized sales funnel." },
    { number: "03", icon: "ti-search", title: "SEO & Performance", desc: "Long-term ranking on Google Madagascar and optimization of speed, Core Web Vitals and mobile experience to maximize conversions." },
    { number: "04", icon: "ti-refresh", title: "Redesign & Migration", desc: "Modernize your old site without losing your rankings or customer data." },
    { number: "05", icon: "ti-tool", title: "Maintenance", desc: "Monthly monitoring, security updates, automatic backups and performance reports." },
    { number: "06", icon: "ti-code", title: "Custom development", desc: "Tailor-made features, integrations and internal tools built around your specific needs." },
  ],
};

const COPY = {
  fr: {
    badge: "Services",
    title: "Ce que nous proposons",
    subtitle: "De la création de sites vitrines au développement e-commerce, nous couvrons tous vos besoins en développement web.",
  },
  en: {
    badge: "Services",
    title: "What we offer",
    subtitle: "From showcase websites to e-commerce development, we cover all your web development needs.",
  },
};

export default function Services() {
  const { lang } = useLanguage();
  const services = SERVICES[lang];
  const c = COPY[lang];

  return (
    <section className="ox-services" id="services">
      <SectionHeader
        badge={c.badge}
        title={c.title}
        subtitle={c.subtitle}
        className="ox-services-header"
      />
      <div className="ox-services-grid">
        {services.map((s) => (
          <ServiceCard
            key={s.number}
            number={s.number}
            icon={<i className={`ti ${s.icon}`} />}
            title={s.title}
            description={s.desc}
          />
        ))}
      </div>
    </section>
  );
}

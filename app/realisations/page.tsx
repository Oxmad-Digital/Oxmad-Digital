"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ProjectCard from "@/components/cards/ProjectCard";
import "./realisations.css";

const PROJECTS = [
  { id: 1, url: "ocibel.mg", category: "Site vitrine", name: "Ocibel Madagascar", desc: "Refonte complète du site institutionnel avec mise en avant des offres et génération de leads qualifiés.", tags: ["WordPress", "SEO", "UI Design"], kpis: [{ value: "+240%", label: "Trafic" }, { value: "98%", label: "Satisfaction" }] },
  { id: 2, url: "bitumad.mg", category: "Site catalogue", name: "Bitumad", desc: "Site catalogue pour un fournisseur de bitume 60/70 & 35/50, avec fiches techniques produits et demande de devis en ligne sous 24h.", tags: ["Next.js", "SEO", "Devis en ligne"], kpis: [{ value: "24h", label: "Devis" }, { value: "ASTM", label: "Certifié" }] },
  { id: 3, url: "boutique.agrimada.mg", category: "E-commerce", name: "AgriMada Boutique", desc: "Plateforme e-commerce avec 500+ produits agricoles et intégration paiement MVola.", tags: ["WooCommerce", "MVola", "SEO"], kpis: [{ value: "+180%", label: "Ventes" }, { value: "4.8★", label: "Avis" }] },
  { id: 4, url: "techstart.mg", category: "Site vitrine", name: "TechStart MG", desc: "Landing page moderne pour une startup tech locale cherchant à lever des fonds.", tags: ["WordPress", "Elementor", "SEO"], kpis: [{ value: "+310%", label: "Visites" }, { value: "18%", label: "Conversion" }] },
];

const FILTERS = ["Tous", "Site vitrine", "Site catalogue", "E-commerce"];

export default function RealisationsPage() {
  const [active, setActive] = useState("Tous");
  const visible = active === "Tous" ? PROJECTS : PROJECTS.filter((p) => p.category === active);

  return (
    <div>
      <section className="ox-real-page-hero">
        <div className="ox-real-page-hero-x">
          <svg viewBox="0 0 374 313" preserveAspectRatio="xMidYMid meet">
            <polygon
              fill="var(--r)"
              points="271,5 340,5 236,133 351,265 282,265 201,175 87,312 18,312 131,173 22,48 90,48 166,130"
            />
          </svg>
        </div>
        <div className="ox-real-page-hero-grid" />
        <div className="ox-real-page-hero-inner">
          <div className="ox-real-page-hero-copy">
            <div className="ox-real-page-hero-kicker">
              <span />
              Nos réalisations
            </div>
            <h1>
              Des projets qui
              <br />
              génèrent des <span className="ox-real-page-hero-accent">résultats.</span>
            </h1>
            <p>
              Chaque réalisation est le fruit d&apos;une collaboration étroite avec nos clients et
              d&apos;une recherche constante de performance mesurable.
            </p>
          </div>
          <div className="ox-real-page-hero-stats">
            {[["5+", "Projets livrés"], ["98%", "Clients satisfaits"], ["×3", "Trafic moyen"]].map(
              ([v, l]) => (
                <div key={l} className="ox-real-page-hero-stat">
                  <div className="ox-real-page-hero-stat-value">{v}</div>
                  <div className="ox-real-page-hero-stat-label">{l}</div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <div className="ox-real-page-filters">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={active === f ? "filter-active" : "filter"}
            size="sm"
            onClick={() => setActive(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="ox-real-page-grid">
        {visible.map((p) => (
          <ProjectCard
            key={p.id}
            url={p.url}
            category={p.category}
            name={p.name}
            description={p.desc}
            tags={p.tags}
            kpis={p.kpis}
          />
        ))}
        <div className="ox-real-page-promo">
          <div className="ox-real-page-promo-ring" />
          <div>
            <h3>
              Votre projet,
              <br />
              notre prochain défi.
            </h3>
            <p>Parlons de votre vision et construisons quelque chose d&apos;exceptionnel ensemble.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="ox-real-page-promo-btn"
            onClick={() => alert("Réservez un appel")}
          >
            Démarrer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";
import ProjectCard from "@/components/cards/ProjectCard";
import "./realisations.css";

const PROJECTS = [
  { id: 1, url: "ocibel.mg", category: "Site vitrine", name: "Ocibel Madagascar", desc: "Refonte complète du site institutionnel avec mise en avant des offres et génération de leads qualifiés.", kpis: [{ icon: "ti-photo", label: "Galerie photo" }, { icon: "ti-mail", label: "Formulaire de contact" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782994208/oxmad-digital_preview_site_web_ocibel_fpwyxu.webp" },
  { id: 2, url: "bitumad.mg", category: "Site catalogue", name: "Bitumad", desc: "Site catalogue pour un fournisseur de bitume 60/70 & 35/50, avec fiches techniques produits et demande de devis en ligne sous 24h.", kpis: [{ icon: "ti-file-invoice", label: "Formulaire de devis" }, { icon: "ti-download", label: "Fiches techniques" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782993283/oxmad-digital_preview_site_web_bitumad_kgx2sb.webp" },
  { id: 3, url: "ultramaille.com", category: "Site vitrine", name: "Ultramaille", desc: "Boutique en ligne dédiée à la maille, avec fiches produits détaillées, galerie photo et parcours d'achat optimisé.", kpis: [{ icon: "ti-file-download", label: "PDF téléchargeable" }, { icon: "ti-mail", label: "Formulaire de contact" }, { icon: "ti-language", label: "Multilingue" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1783000456/oxmad-digital_preview_site_web_Ultramaille_s0uofc.webp" },
  { id: 4, url: "mandscare.com", category: "Site catalogue", name: "M&S Care", desc: "Site catalogue pour un laboratoire pharmaceutique malgache dédié à la santé du quotidien, présentant sa gamme de médicaments fiables et accessibles adaptés au marché local.", kpis: [{ value: "29", label: "Produits" }, { value: "3", label: "Gammes" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782995539/oxmad-digital_preview_site_web_m_s-care_hyrxcy.webp" },
  { id: 5, url: "jurisexternalia.com", category: "Site vitrine", name: "Thadeus Externalia Juris", desc: "Site vitrine pour un cabinet d'externalisation juridique, sociale et fiscale, présentant ses services aux experts-comptables et dirigeants.", kpis: [{ icon: "ti-help", label: "FAQ" }, { icon: "ti-mail", label: "Formulaire de contact" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782998505/oxmad-digital_preview_site_web_thadeus_cbkfpw.webp" },
  { id: 6, url: "wybob.shop", category: "E-commerce", name: "WYBOB", desc: "Boutique en ligne de bobs et accessoires, avec fiches produits détaillées, galerie photo et formulaire de contact.", kpis: [{ icon: "ti-photo", label: "Galerie photo" }, { icon: "ti-layout-dashboard", label: "Dashboard de gestion" }, { icon: "ti-users-group", label: "Système de parrainage" }, { icon: "ti-language", label: "Multilingue" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782996784/oxmad-digital_preview_site_web_wybob_rjappl.webp", inProgress: true },
];

const FILTERS = ["Tous", "Site vitrine", "Site catalogue", "E-commerce"];

const COLLAPSED_COUNT = 3;

export default function RealisationsPage() {
  const [active, setActive] = useState("Tous");
  const [expanded, setExpanded] = useState(false);
  const visible = active === "Tous" ? PROJECTS : PROJECTS.filter((p) => p.category === active);
  const hasMore = visible.length > COLLAPSED_COUNT;
  const shown = expanded ? visible : visible.slice(0, COLLAPSED_COUNT);

  return (
    <div>
      <Navbar />
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
            onClick={() => {
              setActive(f);
              setExpanded(false);
            }}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="ox-real-page-grid">
        {shown.map((p) => (
          <ProjectCard
            key={p.id}
            url={p.url}
            category={p.category}
            name={p.name}
            description={p.desc}
            kpis={p.kpis}
            image={p.image}
            inProgress={p.inProgress}
          />
        ))}

        <div className="ox-real-page-promo">
          <div className="ox-real-page-promo-x">
            <svg viewBox="0 0 374 313" preserveAspectRatio="xMidYMid meet">
              <polygon
                fill="#fff"
                points="271,5 340,5 236,133 351,265 282,265 201,175 87,312 18,312 131,173 22,48 90,48 166,130"
              />
            </svg>
          </div>
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

      {!expanded && hasMore && (
        <div className="ox-real-page-more-wrap">
          <button className="ox-real-page-more" onClick={() => setExpanded(true)}>
            Voir plus
            <i className="ti ti-chevron-down" />
          </button>
        </div>
      )}
    </div>
  );
}

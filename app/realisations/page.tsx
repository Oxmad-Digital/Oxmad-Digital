"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ProjectCard from "@/components/cards/ProjectCard";
import { useBookCall } from "@/components/BookCall/BookCallContext";
import { useLanguage } from "@/components/Language/LanguageContext";
import "./realisations.css";

const PROJECTS = {
  fr: [
    { id: 1, url: "ocibel.mg", category: "Site vitrine", name: "Ocibel Madagascar", desc: "Refonte complète du site institutionnel avec mise en avant des offres et génération de leads qualifiés.", kpis: [{ icon: "ti-photo", label: "Galerie photo" }, { icon: "ti-mail", label: "Formulaire de contact" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782994208/oxmad-digital_preview_site_web_ocibel_fpwyxu.webp", inRefonte: true },
    { id: 2, url: "bitumad.mg", category: "Site catalogue", name: "Bitumad", desc: "Site catalogue pour un fournisseur de bitume 60/70 & 35/50, avec fiches techniques produits et demande de devis en ligne sous 24h.", kpis: [{ icon: "ti-file-invoice", label: "Formulaire de devis" }, { icon: "ti-download", label: "Fiches techniques" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782993283/oxmad-digital_preview_site_web_bitumad_kgx2sb.webp" },
    { id: 3, url: "ultramaille.com", category: "Site vitrine", name: "Ultramaille", desc: "Site vitrine institutionnel pour une usine textile spécialisée dans la maille haut de gamme à Madagascar (tricotage, crochet, broderie) à destination des maisons de mode.", kpis: [{ icon: "ti-file-download", label: "PDF téléchargeable" }, { icon: "ti-mail", label: "Formulaire de contact" }, { icon: "ti-language", label: "Multilingue" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499699/oxmad-digital_preview_site_web_Ultramaille_xna8uw.webp", inRefonte: true },
    { id: 4, url: "mandscare.com", category: "Site catalogue", name: "M&S Care", desc: "Site catalogue pour un laboratoire pharmaceutique malgache dédié à la santé du quotidien, présentant sa gamme de médicaments fiables et accessibles adaptés au marché local.", kpis: [{ value: "29", label: "Produits" }, { value: "3", label: "Gammes" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782995539/oxmad-digital_preview_site_web_m_s-care_hyrxcy.webp" },
    { id: 6, url: "wybob.shop", category: "E-commerce", name: "WYBOB", desc: "Boutique en ligne pour Wybob, une marque engagée proposant des bobs d'exception façonnés à la main à Madagascar à partir de coton bio.", kpis: [{ icon: "ti-photo", label: "Galerie photo" }, { icon: "ti-layout-dashboard", label: "Dashboard de gestion" }, { icon: "ti-users-group", label: "Système de parrainage" }, { icon: "ti-language", label: "Multilingue" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499211/oxmad-digital_preview_site_web_Wybob_xj6uy1.webp", inProgress: true },
    { id: 7, url: "maison-funeraire-tsaralevenana.com", category: "Site vitrine", name: "Tsaralevenana", desc: "Site vitrine pour une maison funéraire à Antananarivo, présentant les services d'obsèques, une galerie photo des installations et un formulaire de contact pour un accompagnement disponible 24h/24.", kpis: [{ icon: "ti-photo", label: "Galerie photo" }, { icon: "ti-mail", label: "Formulaire de contact" }, { icon: "ti-clock", label: "Disponible 24/7" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499030/oxmad-digital_preview_site_web_Tsaralevenana_pkoobz.webp" },
  ],
  en: [
    { id: 1, url: "ocibel.mg", category: "Showcase site", name: "Ocibel Madagascar", desc: "Complete redesign of the institutional website, highlighting offers and generating qualified leads.", kpis: [{ icon: "ti-photo", label: "Photo gallery" }, { icon: "ti-mail", label: "Contact form" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782994208/oxmad-digital_preview_site_web_ocibel_fpwyxu.webp", inRefonte: true },
    { id: 2, url: "bitumad.mg", category: "Catalog site", name: "Bitumad", desc: "Catalog site for a 60/70 & 35/50 bitumen supplier, with product data sheets and a 24h online quote request.", kpis: [{ icon: "ti-file-invoice", label: "Quote form" }, { icon: "ti-download", label: "Data sheets" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782993283/oxmad-digital_preview_site_web_bitumad_kgx2sb.webp" },
    { id: 3, url: "ultramaille.com", category: "Showcase site", name: "Ultramaille", desc: "Institutional showcase site for a knitwear factory in Madagascar specializing in high-end knitwear (knitting, crochet, embroidery) for fashion houses.", kpis: [{ icon: "ti-file-download", label: "Downloadable PDF" }, { icon: "ti-mail", label: "Contact form" }, { icon: "ti-language", label: "Multilingual" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499699/oxmad-digital_preview_site_web_Ultramaille_xna8uw.webp", inRefonte: true },
    { id: 4, url: "mandscare.com", category: "Catalog site", name: "M&S Care", desc: "Catalog site for a Malagasy pharmaceutical lab focused on everyday health, showcasing its range of reliable, accessible medicines tailored to the local market.", kpis: [{ value: "29", label: "Products" }, { value: "3", label: "Ranges" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782995539/oxmad-digital_preview_site_web_m_s-care_hyrxcy.webp" },
    { id: 6, url: "wybob.shop", category: "E-commerce", name: "WYBOB", desc: "Online store for Wybob, a purpose-driven brand offering exceptional bucket hats handcrafted in Madagascar from organic cotton.", kpis: [{ icon: "ti-photo", label: "Photo gallery" }, { icon: "ti-layout-dashboard", label: "Management dashboard" }, { icon: "ti-users-group", label: "Referral system" }, { icon: "ti-language", label: "Multilingual" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499211/oxmad-digital_preview_site_web_Wybob_xj6uy1.webp", inProgress: true },
    { id: 7, url: "maison-funeraire-tsaralevenana.com", category: "Showcase site", name: "Tsaralevenana", desc: "Showcase site for a funeral home in Antananarivo, presenting its funeral services, a photo gallery of the facilities and a contact form for round-the-clock support.", kpis: [{ icon: "ti-photo", label: "Photo gallery" }, { icon: "ti-mail", label: "Contact form" }, { icon: "ti-clock", label: "Available 24/7" }], image: "https://res.cloudinary.com/eee2cbey/image/upload/v1789499030/oxmad-digital_preview_site_web_Tsaralevenana_pkoobz.webp" },
  ],
};

const FILTERS = {
  fr: ["Tous", "Site vitrine", "Site catalogue", "E-commerce"],
  en: ["All", "Showcase site", "Catalog site", "E-commerce"],
};

const COPY = {
  fr: {
    titleLine1: "Des projets qui",
    titleLine2: "génèrent des ",
    titleAccent: "résultats",
    desc: "Chaque réalisation est le fruit d'une collaboration étroite avec nos clients et d'une recherche constante de performance mesurable.",
    statsCountLabel: "Projets réalisés",
    otherStats: [["98%", "Clients satisfaits"]] as [string, string][],
    promoTitleLine1: "Votre projet,",
    promoTitleLine2: "notre prochain défi.",
    promoDesc: "Parlons de votre vision et construisons quelque chose d'exceptionnel ensemble.",
    promoBtn: "Démarrer maintenant",
    seeMore: "Voir plus",
  },
  en: {
    titleLine1: "Projects that",
    titleLine2: "deliver ",
    titleAccent: "results",
    desc: "Every project is the result of close collaboration with our clients and a constant focus on measurable performance.",
    statsCountLabel: "Projects completed",
    otherStats: [["98%", "Satisfied clients"], ["×3", "Average traffic"]] as [string, string][],
    promoTitleLine1: "Your project,",
    promoTitleLine2: "our next challenge.",
    promoDesc: "Let's talk about your vision and build something exceptional together.",
    promoBtn: "Get started now",
    seeMore: "See more",
  },
};

const COLLAPSED_COUNT = 3;

export default function RealisationsPage() {
  const { lang } = useLanguage();
  const { open } = useBookCall();
  const projects = PROJECTS[lang];
  const filters = FILTERS[lang];
  const c = COPY[lang];
  const [active, setActive] = useState(filters[0]);
  const [expanded, setExpanded] = useState(false);
  const visible = active === filters[0] ? projects : projects.filter((p) => p.category === active);
  const hasMore = visible.length > COLLAPSED_COUNT;
  const shown = expanded ? visible : visible.slice(0, COLLAPSED_COUNT);
  const stats: [string, string][] = [
    [`${projects.length}+`, c.statsCountLabel],
    ...c.otherStats,
  ];

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
            <h1>
              {c.titleLine1}
              <br />
              {c.titleLine2}<span className="ox-real-page-hero-accent">{c.titleAccent}</span>
            </h1>
            <p>{c.desc}</p>
          </div>
          <div className="ox-real-page-hero-stats">
            {stats.map(([v, l]) => (
              <div key={l} className="ox-real-page-hero-stat">
                <div className="ox-real-page-hero-stat-value">{v}</div>
                <div className="ox-real-page-hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ox-real-page-filters">
        {filters.map((f) => (
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
            inRefonte={p.inRefonte}
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
              {c.promoTitleLine1}
              <br />
              {c.promoTitleLine2}
            </h3>
            <p>{c.promoDesc}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="ox-real-page-promo-btn"
            onClick={open}
          >
            {c.promoBtn}
          </Button>
        </div>
      </div>

      {!expanded && hasMore && (
        <div className="ox-real-page-more-wrap">
          <button className="ox-real-page-more" onClick={() => setExpanded(true)}>
            {c.seeMore}
            <i className="ti ti-chevron-down" />
          </button>
        </div>
      )}
    </div>
  );
}

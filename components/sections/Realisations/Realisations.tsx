"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useLanguage, type Lang } from "@/components/Language/LanguageContext";
import "./Realisations.css";

const REALISATIONS = {
  fr: [
    {
      num: "01",
      name: "BITUMAD",
      category: "Fourniture de bitume industriel",
      highlight: ["Un site catalogue qui génère des ", "devis qualifiés", "."],
      features: [
        { i: "ti-droplet", t: "Bitume 60/70 & 35/50" },
        { i: "ti-file-invoice", t: "Demande de devis" },
        { i: "ti-download", t: "Fiches techniques" },
        { i: "ti-truck-delivery", t: "Livraison sous 24h" },
        { i: "ti-device-mobile", t: "Responsive" },
        { i: "ti-search", t: "SEO" },
      ],
      shot: "Site catalogue",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782993283/oxmad-digital_preview_site_web_bitumad_kgx2sb.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_bitumad_preview_mobile_qvuyef.webp",
      tabletImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783608687/oxmad-digital_bitumad_tablet_preview_ci5ylx.webp",
    },
    {
      num: "02",
      name: "LAKE VIEW HOTEL",
      category: "Hôtellerie & tourisme",
      highlight: ["Des réservations en ligne, ", "simples et rapides", "."],
      features: [
        { i: "ti-calendar-event", t: "Réservation en ligne" },
        { i: "ti-bed", t: "Chambres avec vue lac" },
        { i: "ti-tools-kitchen-2", t: "Restaurant" },
        { i: "ti-photo", t: "Galerie photo" },
        { i: "ti-map-pin", t: "Activités & excursions" },
        { i: "ti-mail", t: "Formulaire de contact" },
      ],
      shot: "Site vitrine",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_lake-view-hotel_preview_zmnh5o.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099391/oxmad-digital_lake-view-hotel_preview_mobile_ovq6cu.webp",
      tabletImage: undefined as string | undefined,
    },
    {
      num: "03",
      name: "WYBOB",
      category: "Mode & accessoires",
      highlight: ["Une boutique en ligne fluide, des achats ", "simplifiés", "."],
      features: [
        { i: "ti-shopping-cart", t: "E-commerce" },
        { i: "ti-photo", t: "Galerie photo" },
        { i: "ti-layout-dashboard", t: "Dashboard de gestion" },
        { i: "ti-users-group", t: "Système de parrainage" },
        { i: "ti-language", t: "Multilingue" },
        { i: "ti-mail", t: "Formulaire de contact" },
      ],
      shot: "Boutique e-commerce",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782996784/oxmad-digital_preview_site_web_wybob_rjappl.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_wybob_preview_mobile_kqbxco.webp",
      tabletImage: undefined as string | undefined,
    },
  ],
  en: [
    {
      num: "01",
      name: "BITUMAD",
      category: "Industrial bitumen supply",
      highlight: ["A catalog site that generates ", "qualified quotes", "."],
      features: [
        { i: "ti-droplet", t: "60/70 & 35/50 bitumen" },
        { i: "ti-file-invoice", t: "Quote request" },
        { i: "ti-download", t: "Data sheets" },
        { i: "ti-truck-delivery", t: "24h delivery" },
        { i: "ti-device-mobile", t: "Responsive" },
        { i: "ti-search", t: "SEO" },
      ],
      shot: "Catalog site",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782993283/oxmad-digital_preview_site_web_bitumad_kgx2sb.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_bitumad_preview_mobile_qvuyef.webp",
      tabletImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783608687/oxmad-digital_bitumad_tablet_preview_ci5ylx.webp",
    },
    {
      num: "02",
      name: "LAKE VIEW HOTEL",
      category: "Hospitality & tourism",
      highlight: ["Online bookings, ", "simple and fast", "."],
      features: [
        { i: "ti-calendar-event", t: "Online booking" },
        { i: "ti-bed", t: "Lake-view rooms" },
        { i: "ti-tools-kitchen-2", t: "Restaurant" },
        { i: "ti-photo", t: "Photo gallery" },
        { i: "ti-map-pin", t: "Activities & excursions" },
        { i: "ti-mail", t: "Contact form" },
      ],
      shot: "Showcase site",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_lake-view-hotel_preview_zmnh5o.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099391/oxmad-digital_lake-view-hotel_preview_mobile_ovq6cu.webp",
      tabletImage: undefined as string | undefined,
    },
    {
      num: "03",
      name: "WYBOB",
      category: "Fashion & accessories",
      highlight: ["A smooth online store, ", "simplified", " shopping."],
      features: [
        { i: "ti-shopping-cart", t: "E-commerce" },
        { i: "ti-photo", t: "Photo gallery" },
        { i: "ti-layout-dashboard", t: "Management dashboard" },
        { i: "ti-users-group", t: "Referral system" },
        { i: "ti-language", t: "Multilingual" },
        { i: "ti-mail", t: "Contact form" },
      ],
      shot: "E-commerce store",
      image: "https://res.cloudinary.com/eee2cbey/image/upload/v1782996784/oxmad-digital_preview_site_web_wybob_rjappl.webp",
      mobileImage: "https://res.cloudinary.com/eee2cbey/image/upload/v1783099390/oxmad-digital_wybob_preview_mobile_kqbxco.webp",
      tabletImage: undefined as string | undefined,
    },
  ],
};

const COPY = {
  fr: {
    kicker: "Portfolio",
    title: "Nos réalisations",
    subtitleLine1: "Des projets différents.",
    subtitleLine2: "Des objectifs communs :",
    subtitleAccent: "créer les bonnes connexions.",
    note: "Voici quelques projets que nous avons réalisés",
    mascotAlt: "Mascotte Oxmad Digital",
    viewProject: "Voir le projet",
    seeAll: "Voir toutes les réalisations",
    deviceDesktop: "Vue bureau",
    deviceTablet: "Vue tablette",
    deviceMobile: "Vue mobile",
    closePreview: "Fermer l'aperçu",
  },
  en: {
    kicker: "Portfolio",
    title: "Our work",
    subtitleLine1: "Different projects.",
    subtitleLine2: "A shared goal:",
    subtitleAccent: "creating the right connections.",
    note: "Here are a few projects we've built",
    mascotAlt: "Oxmad Digital mascot",
    viewProject: "View project",
    seeAll: "See all our work",
    deviceDesktop: "Desktop view",
    deviceTablet: "Tablet view",
    deviceMobile: "Mobile view",
    closePreview: "Close preview",
  },
};

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_ICON: Record<Device, string> = {
  desktop: "ti-device-laptop",
  tablet: "ti-device-tablet",
  mobile: "ti-device-mobile",
};

type Realisation = (typeof REALISATIONS)["fr"][number];

type Preview = {
  device: Device;
  name: string;
  label: string;
  image?: string;
};

const ProjectMockup = ({ label, image }: { label: string; image?: string }) => (
  <div className="ox-real-mockup">
    <div className="ox-real-mockup-laptop">
      <div className="ox-real-mockup-bar">
        <span style={{ background: "#ff5f57" }} />
        <span style={{ background: "#ffbd2e" }} />
        <span style={{ background: "#28c840" }} />
      </div>
      <div className="ox-real-mockup-screen">
        {image ? <img src={image} alt={label} /> : <span>{label}</span>}
      </div>
    </div>
  </div>
);

const RealCard = ({
  p,
  perched,
  lang,
  c,
  onPreview,
}: {
  p: Realisation;
  perched?: boolean;
  lang: Lang;
  c: (typeof COPY)["fr"];
  onPreview: (device: Device, p: Realisation) => void;
}) => (
  <div className="ox-real-card">
    {perched && (
      <img
        src="/robot-perched.svg"
        alt={c.mascotAlt}
        className="ox-real-card-robot"
      />
    )}
    {perched && (
      <div className="ox-real-card-note">
        <p>{c.note}</p>
        <i className="ti ti-arrow-down-right" />
      </div>
    )}

    <div className="ox-real-card-head">
      <span className="ox-real-card-num">{p.num}</span>
      <div>
        <div className="ox-real-card-name">{p.name}</div>
        <div className="ox-real-card-category">{p.category}</div>
      </div>
    </div>

    <div className="ox-real-card-highlight">
      {p.highlight[0]}
      <span className="ox-real-card-highlight-accent">{p.highlight[1]}</span>
      {p.highlight[2]}
    </div>

    <ul className="ox-real-card-features">
      {p.features.map((f, i) => (
        <li key={i}>
          <span className="ox-real-card-feature-icon">
            <i className={`ti ${f.i}`} />
          </span>
          {f.t}
        </li>
      ))}
    </ul>

    <ProjectMockup label={p.shot} image={p.image} />

    <div className="ox-real-card-actions">
      <div className="ox-real-card-devices">
        <button
          type="button"
          className="ox-real-card-device-btn"
          aria-label={c.deviceDesktop}
          title={c.deviceDesktop}
          onClick={() => onPreview("desktop", p)}
        >
          <i className={`ti ${DEVICE_ICON.desktop}`} />
        </button>
        <button
          type="button"
          className="ox-real-card-device-btn"
          aria-label={c.deviceTablet}
          title={c.deviceTablet}
          onClick={() => onPreview("tablet", p)}
        >
          <i className={`ti ${DEVICE_ICON.tablet}`} />
        </button>
        <button
          type="button"
          className="ox-real-card-device-btn"
          aria-label={c.deviceMobile}
          title={c.deviceMobile}
          onClick={() => onPreview("mobile", p)}
        >
          <i className={`ti ${DEVICE_ICON.mobile}`} />
        </button>
      </div>

      <a href="/realisations" className="ox-real-card-link" aria-label={c.viewProject} title={c.viewProject}>
        <i className="ti ti-world" />
      </a>
    </div>
  </div>
);

export default function Realisations() {
  const { lang } = useLanguage();
  const realisations = REALISATIONS[lang];
  const c = COPY[lang];
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [preview]);

  const openPreview = (device: Device, p: Realisation) => {
    const image =
      device === "desktop" ? p.image : device === "mobile" ? p.mobileImage : p.tabletImage;
    setPreview({ device, name: p.name, label: p.shot, image });
  };

  const deviceLabel = {
    desktop: c.deviceDesktop,
    tablet: c.deviceTablet,
    mobile: c.deviceMobile,
  };

  return (
    <section id="realisations" className="ox-realisations">
      <div className="ox-realisations-header">
        <div className="ox-realisations-kicker">
          {c.kicker}
        </div>
        <h2 className="ox-realisations-title">
          {c.title}<span className="ox-realisations-title-dot">.</span>
        </h2>
        <p className="ox-realisations-subtitle">
          {c.subtitleLine1}
          <br />
          {c.subtitleLine2}
          <br />
          <span className="ox-realisations-subtitle-accent">{c.subtitleAccent}</span>
        </p>
      </div>

      <div className="ox-realisations-grid">
        {realisations.map((p, i) => (
          <RealCard key={p.num} p={p} perched={i === realisations.length - 1} lang={lang} c={c} onPreview={openPreview} />
        ))}
      </div>

      <div className="ox-realisations-footer">
        <Button href="/realisations" variant="primary" size="md">
          {c.seeAll}
        </Button>
      </div>

      {preview && (
        <div
          className="ox-lightbox-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
        >
          <button
            type="button"
            className="ox-lightbox-close"
            onClick={() => setPreview(null)}
            aria-label={c.closePreview}
            title={c.closePreview}
          >
            <i className="ti ti-x" />
          </button>
          <div className="ox-lightbox-content">
            <span className="ox-lightbox-tag">
              <i className={`ti ${DEVICE_ICON[preview.device]}`} />
              {deviceLabel[preview.device]} — {preview.name}
            </span>
            <div className={`ox-lightbox-frame ox-lightbox-frame-${preview.device}`}>
              <div className="ox-lightbox-frame-screen">
                {preview.image ? <img src={preview.image} alt={preview.name} /> : <span>{preview.label}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

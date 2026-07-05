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
    },
    {
      num: "02",
      name: "HÔTEL DU MOULIN",
      category: "Hôtellerie & séminaires",
      highlight: ["Des réservations en ligne, ", "simples et rapides", "."],
      features: [
        { i: "ti-calendar-event", t: "Réservation en ligne" },
        { i: "ti-credit-card", t: "Paiement en ligne" },
        { i: "ti-calendar", t: "Agenda" },
        { i: "ti-circle-check", t: "Confirmation auto." },
        { i: "ti-mail", t: "E-mails" },
        { i: "ti-calendar-stats", t: "Gestion des dispo." },
      ],
      shot: "Plateforme de réservation",
    },
    {
      num: "03",
      name: "IHLE",
      category: "Distribution de pneus",
      highlight: ["Un espace pro pensé pour aller ", "à l'essentiel", "."],
      features: [
        { i: "ti-briefcase", t: "Espace professionnel" },
        { i: "ti-book", t: "Catalogue interactif" },
        { i: "ti-file-invoice", t: "Demande de devis" },
        { i: "ti-package", t: "Suivi des commandes" },
        { i: "ti-download", t: "Documents téléchargeables" },
        { i: "ti-users", t: "Multi-accès" },
      ],
      shot: "Portail B2B",
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
    },
    {
      num: "02",
      name: "HÔTEL DU MOULIN",
      category: "Hospitality & events",
      highlight: ["Online bookings, ", "simple and fast", "."],
      features: [
        { i: "ti-calendar-event", t: "Online booking" },
        { i: "ti-credit-card", t: "Online payment" },
        { i: "ti-calendar", t: "Calendar" },
        { i: "ti-circle-check", t: "Auto confirmation" },
        { i: "ti-mail", t: "Emails" },
        { i: "ti-calendar-stats", t: "Availability management" },
      ],
      shot: "Booking platform",
    },
    {
      num: "03",
      name: "IHLE",
      category: "Tire distribution",
      highlight: ["A pro space built to go ", "straight to the point", "."],
      features: [
        { i: "ti-briefcase", t: "Professional space" },
        { i: "ti-book", t: "Interactive catalog" },
        { i: "ti-file-invoice", t: "Quote request" },
        { i: "ti-package", t: "Order tracking" },
        { i: "ti-download", t: "Downloadable documents" },
        { i: "ti-users", t: "Multi-access" },
      ],
      shot: "B2B portal",
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
    const image = device === "desktop" ? p.image : device === "mobile" ? p.mobileImage : undefined;
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
          <span />
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

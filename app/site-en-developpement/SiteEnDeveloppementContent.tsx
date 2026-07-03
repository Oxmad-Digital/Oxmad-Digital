"use client";

import Button from "@/components/ui/Button";
import { useLanguage } from "@/components/Language/LanguageContext";

const COPY = {
  fr: {
    kicker: "Chantier en cours",
    titleLine1: "Ce projet est encore",
    titleLine2: "en ",
    titleAccent: "développement.",
    desc: "Notre équipe travaille actuellement sur ce site. Il sera bientôt disponible — en attendant, découvrez nos autres réalisations ou parlons de votre propre projet.",
    seeWork: "Voir nos réalisations",
    startProject: "Démarrer un projet",
  },
  en: {
    kicker: "Work in progress",
    titleLine1: "This project is still",
    titleLine2: "in ",
    titleAccent: "development.",
    desc: "Our team is currently working on this site. It will be available soon — in the meantime, check out our other work or let's talk about your own project.",
    seeWork: "See our work",
    startProject: "Start a project",
  },
};

export default function SiteEnDeveloppementContent() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <div className="ox-wip-viewport">
      <section className="ox-wip-page">
        <div className="ox-wip-page-x">
          <svg viewBox="0 0 374 313" preserveAspectRatio="xMidYMid meet">
            <polygon
              fill="var(--r)"
              points="271,5 340,5 236,133 351,265 282,265 201,175 87,312 18,312 131,173 22,48 90,48 166,130"
            />
          </svg>
        </div>
        <div className="ox-wip-page-kicker">
          <span />
          {c.kicker}
        </div>
        <h1>
          {c.titleLine1}
          <br />
          {c.titleLine2}<span className="ox-wip-page-accent">{c.titleAccent}</span>
        </h1>
        <p>{c.desc}</p>
        <div className="ox-wip-page-actions">
          <Button href="/realisations" variant="outline" size="md">
            {c.seeWork}
          </Button>
          <Button href="/#contact" variant="primary" size="md">
            {c.startProject}
          </Button>
        </div>
      </section>
    </div>
  );
}

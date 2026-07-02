import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";
import "./site-en-developpement.css";

export const metadata: Metadata = {
  title: "Site en cours de développement – Oxmad Digital",
  description: "Ce projet est actuellement en cours de développement par Oxmad Digital.",
};

export default function SiteEnDeveloppementPage() {
  return (
    <>
    <Navbar />
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
        Chantier en cours
      </div>
      <h1>
        Ce projet est encore
        <br />
        en <span className="ox-wip-page-accent">développement.</span>
      </h1>
      <p>
        Notre équipe travaille actuellement sur ce site. Il sera bientôt disponible — en attendant,
        découvrez nos autres réalisations ou parlons de votre propre projet.
      </p>
      <div className="ox-wip-page-actions">
        <Button href="/realisations" variant="outline" size="md">
          Voir nos réalisations
        </Button>
        <Button href="/#contact" variant="primary" size="md">
          Démarrer un projet
        </Button>
      </div>
    </section>
    </>
  );
}

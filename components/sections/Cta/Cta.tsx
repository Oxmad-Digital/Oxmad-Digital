"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import "./Cta.css";

export default function Cta() {
  return (
    <section className="ox-cta" id="contact">
      <div className="ox-cta-glow" />
      <div className="ox-cta-inner">
        <Badge className="ox-cta-badge">Contact</Badge>
        <h2 className="ox-cta-title">
          Prêt à lancer votre <span className="ox-cta-title-accent">projet ?</span>
        </h2>
        <p className="ox-cta-desc">
          Réservez un appel gratuit et sans engagement pour discuter de votre vision et obtenir un
          devis en 24h.
        </p>
        <div className="ox-cta-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => alert("Réserver un appel — formulaire à intégrer")}
          >
            Réserver un appel
          </Button>
          <Button variant="outline" size="lg" href="/realisations">
            Voir nos réalisations
          </Button>
        </div>
      </div>
    </section>
  );
}

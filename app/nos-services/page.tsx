"use client";

import { useState } from "react";
import Image from "next/image";
import Hero from "@/components/Hero";
import "./nos-services.css";

const slides = [
  {
    icon: "/icone_contrat.png",
    name: "Création\n& Formalités",
    tagline: "Le socle de votre projet entrepreneurial",
    desc: "Nous transformons la complexité du lancement en une formalité fluide. De la première esquisse des statuts à la réception du Kbis, nous gérons chaque étape avec une précision chirurgicale.",
    bullets: [
      "Rédaction sur-mesure : Statuts, actes de nomination et listes des souscripteurs adaptés à votre projet.",
      "Guichet Unique (INPI/EDBM) : Saisie complète, signature électronique et suivi rigoureux jusqu'à l'immatriculation.",
      "Interlocuteur dédié : Une \"Chargée de création\" unique pour un suivi personnalisé et une réactivité maximale.",
    ],
  },
  {
    icon: "/call-center_2068857.png",
    name: "Secrétariat juridique",
    tagline: "La conformité continue, sans effort",
    desc: "Libérez-vous de la gestion administrative récurrente. Nous assurons la pérennité juridique de vos structures, même lors des pics d'activité saisonniers.",
    bullets: [
      "Juridique Annuel : Gestion intégrale de l'approbation des comptes et du dépôt légal.",
      "Juridique Exceptionnel : Transferts de siège, changements d'objet social, cessions de parts et modifications de gérance.",
      "Haute Capacité : Un pôle dimensionné pour absorber des flux massifs (jusqu'à 48 dépôts/jour par collaborateur) pour nos cabinets partenaires.",
    ],
  },
  {
    icon: "/icone_paie.png",
    name: "Gestion Sociale\n& Paie",
    tagline: "L'expertise RH au service de l'humain",
    desc: "Déchargez-vous de la complexité sociale française. Nous sécurisons la relation entre l'entreprise et ses salariés, de l'embauche au solde de tout compte.",
    bullets: [
      "Paie & DSN : Établissement des bulletins de paie et télétransmissions sociales (URSSAF, Mutuelles).",
      "Secrétariat RH : Rédaction des contrats de travail, avenants, DPAE et gestion des procédures de départ.",
      "Accompagnement Expert : Simulation des coûts d'embauche, aide aux dispositifs spécifiques (ZRR) et assistance en cas de contrôle.",
    ],
  },
  {
    icon: "/icone_ingénierie.png",
    name: "Ingénierie fiscale",
    tagline: "La haute technicité pour vos décisions stratégiques",
    desc: "Nous intervenons sur les dossiers à forte valeur ajoutée, en parfaite synergie avec les experts-comptables et commissaires aux comptes.",
    bullets: [
      "Restructurations : Création de holdings, apports de titres, fusions simples et pactes d'associés.",
      "Flux Intra-groupe : Rédaction et sécurisation des conventions de trésorerie et de management fees.",
      "Livrables Pédagogiques : Nous centralisons l'opération et fournissons des plaquettes de synthèse claires pour le client final.",
    ],
  },
  {
    icon: "/accounting_5278345.png",
    name: "Externalisation des\ntraitements comptables",
    tagline: "La haute technicité pour vos opérations courantes",
    desc: "Nous intervenons en soutien de votre fonction comptable, en parfaite synergie avec vos processus internes ou vos conseils habituels (experts-comptables).",
    bullets: [
      "Saisie et Tenue : Prise en charge de la saisie comptable, lettrage des comptes tiers et rapprochements bancaires pour une visibilité en temps réel.",
      "Support Pré-bilanciel : Préparation des dossiers de révision et justification des soldes pour faciliter l'intervention de l'expert-comptable.",
      "Reporting de Gestion : Établissement de tableaux de bord personnalisés et suivi des indicateurs clés pour un pilotage précis de votre activité.",
    ],
  },
];

export default function NosServicesPage() {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrent((i) => (i + 1) % slides.length);
  const slide = slides[current];

  return (
    <>
      <Hero small={true} />

      <section className="ns-section">
        <div className="ns-wrapper">
          <div className="ns-card">

            <div className="ns-left">
              <div className="ns-title-container">
                <div className="ns-icon-circle">
                  <Image
                    src={slide.icon}
                    alt={slide.name}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <h2 className="ns-service-name">
                  {slide.name.split("\n").map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </h2>
              </div>
              <div className="ns-nav">
                <button className="ns-nav-btn" onClick={prev}>&#8249;</button>
                <button className="ns-nav-btn" onClick={next}>&#8250;</button>
              </div>
            </div>

            <div className="ns-right">
              <h3 className="ns-tagline">{slide.tagline}</h3>
              <p className="ns-desc">{slide.desc}</p>
              <ul className="ns-bullets">
                {slide.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
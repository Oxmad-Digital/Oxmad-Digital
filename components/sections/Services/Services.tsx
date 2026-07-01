"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./Services.css";

const SERVICES = [
  {
    icon: "/accounting_5278345.png",
    title: "Externalisation des traitements comptables",
    desc: "Sous-traitement de la préparation et du traitement des dossiers comptables, sans effectuer directement les déclarations qui doivent obligatoirement être certifiées par un expert-comptable.",
  },
  {
    icon: "/icone_contrat.png",
    title: "Création & Formalités",
    desc: "Prise en charge de A à Z : rédaction des statuts, gestion des annonces légales et immatriculation (INPI/EDBM). Un interlocuteur unique pour un Kbis sans délai.",
  },
  {
    icon: "/call-center_2068857.png",
    title: "Secrétariat juridique",
    desc: "Gestion du juridique annuel (approbation des comptes) et exceptionnel (transferts, cessions, modifications). Une haute capacité d'absorption pour vos flux massifs.",
  },
  {
    icon: "/icone_paie.png",
    title: "Gestion Sociale & Paie",
    desc: "Établissement des bulletins de paie, DSN, rédaction des contrats de travail et gestion des organismes (URSSAF, mutuelles). Sécurisez votre gestion RH au quotidien.",
  },
  {
    icon: "/icone_ingénierie.png",
    title: "Ingénierie fiscale",
    desc: "Accompagnement sur les holdings, restructurations, pactes d'associés et flux intra-groupe. Une expertise technique en coordination avec vos conseils habituels.",
  },
];

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="services-container">
        <div className="services-inner">
          <div className="services-header">
            <span className="section-label">Nos services</span>
            <h2>Un accompagnement 360°<br />pour vos formalités</h2>
            <p>Une structure organisée en 4 pôles métiers pour répondre avec précision à l&apos;ensemble des besoins de vos clients.</p>
          </div>

          {/* Carousel mobile */}
          <div className="mobile-only-carousel">
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              navigation={{ nextEl: ".next-service", prevEl: ".prev-service" }}
            >
              {SERVICES.map((service, i) => (
                <SwiperSlide key={i}>
                  <div className="service-card">
                    <div className="service-icon">
                      <Image src={service.icon} alt={service.title} width={40} height={40} />
                    </div>
                    <h3>{service.title}</h3>
                    <div className="service-content-wrapper">
                      <p>{service.desc}</p>
                      <div className="carousel-nav-inline">
                        <button className="nav-btn prev-service" aria-label="Précédent">
                          <svg width="24" height="24" fill="none" stroke="#C5A059" strokeWidth="2">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </button>
                        <button className="nav-btn next-service" aria-label="Suivant">
                          <svg width="24" height="24" fill="none" stroke="#C5A059" strokeWidth="2">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Grille desktop */}
          <div className="services-grid desktop-only-grid">
            {SERVICES.map((service, i) => (
              <div className="service-card" key={i}>
                <div className="service-icon">
                  <Image src={service.icon} alt={service.title} width={40} height={40} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>

          <div className="services-cta">
            <a href="#nos-services" className="btn-gold">En savoir plus</a>
          </div>
        </div>
      </div>
    </section>
  );
}

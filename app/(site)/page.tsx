import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { Globe } from "lucide-react";
import ServicesAccordion from "@/components/home/ServicesAccordion";
import ContactButton from "@/components/home/ContactButton";
import ContactSymbol from "@/components/home/ContactSymbol";
import HeroGL from "@/components/home/HeroGL";
import HomeMotion from "@/components/home/HomeMotion";
import SectionIndicator from "@/components/home/SectionIndicator";
import Intro from "@/components/motion/Intro";
import HeroCodeOverlay from "@/components/home/HeroCodeOverlay";
import XRun from "@/components/game/XRun";
import SiteFooter from "@/components/SiteFooter";
import { HOME_FEATURED_IDS, PROJECTS } from "@/lib/projects";
import { BRAND_IMAGES, HERO_IMAGES } from "@/lib/media";
import type { CSSProperties } from "react";
import "./home.css";

const featuredProjects = HOME_FEATURED_IDS.flatMap((id) => PROJECTS.filter((p) => p.id === id));

export default function HomePage() {
  const imageOptions = { alt: "", fill: true, quality: 92, sizes: "100vw", loading: "eager" as const, fetchPriority: "high" as const };
  const { props: desktopImage } = getImageProps({ ...imageOptions, src: HERO_IMAGES.homeDesktop });

  return (
    <div className="ox-home" style={{ "--contact-symbol": `url("${BRAND_IMAGES.symbol}")` } as CSSProperties}>
      <Intro />
      <HomeMotion />
      <SectionIndicator />
      <section className="hero" data-cursor-trail aria-labelledby="main-heading">
        <picture className="hero-background">
          {/* The mobile artwork is already a 760px WebP. Serving it verbatim avoids an
              upscaled 1200px re-encode while preserving every source pixel. */}
          <source media="(max-width: 790px)" srcSet={HERO_IMAGES.homeMobile} />
          {/* getImageProps supplies responsive image optimization for the desktop artwork. */}
          <img {...desktopImage} alt="" />
        </picture>
        <HeroGL />
        <div className="container container--fluid">
          <div className="stage-top smallcap">
            <span data-scramble>DESIGN / DEVELOPMENT / DIGITAL EXPERIENCE</span>
          </div>
          <div className="stage">
            <HeroCodeOverlay />
            <div className="stage-note smallcap">A NEW DIGITAL<br />HORIZON — 001</div>
          </div>
          <div className="hero-bottom">
            <div className="hero-heading">
              {/* The h1 carries the trade and the city; the slogan below is the visual headline. */}
              <h1 id="main-heading" className="stage-index smallcap" data-reveal="fade" data-reveal-now><span className="status-led" />Studio web indépendant · Antananarivo, Madagascar</h1>
              <p className="hero-title" data-reveal="lines" data-reveal-now data-reveal-delay="0.1"><span>Moins de déjà-vu.</span><span className="accent-line">Plus d&apos;impact.</span></p>
            </div>
            <div className="hero-desc" data-reveal="rise" data-reveal-now data-reveal-delay="0.45">
              <p>Votre site ne devrait pas ressembler à tous les autres. Nous imaginons des expériences digitales originales et immersives qui captent l&apos;attention de vos visiteurs.</p>
            </div>
          </div>
          <div className="hero-tail" data-reveal="fade" data-reveal-now data-reveal-delay="0.65">
            <span>01 / 06&nbsp; <b>DES EXPÉRIENCES WEB QUI ONT DU SENS.</b></span>
            <span>DESIGN SOIGNÉ. CODE SOLIDE. LIBERTÉ TOTALE.</span>
            <span>↓ SCROLL POUR EXPLORER</span>
          </div>
        </div>
      </section>

      <section className="expertise" id="expertise">
        <div className="container">
          <div className="section-intro">
            <div>
              <div className="section-marker smallcap"><span data-scramble>01</span><span className="dash" /><span data-scramble>Nos expertises</span></div>
              <h2 data-reveal="lines">Chaque pixel <br />compte.</h2>
            </div>
            <p className="description" data-reveal="fade" data-reveal-delay="0.2">Un site beau, c&apos;est bien. Un site qui se charge vite, inspire confiance et transforme vos visiteurs en clients, c&apos;est mieux. Avec nous, vous n&apos;avez plus à choisir.</p>
          </div>
          <ServicesAccordion />
          <div className="expertise-note">
            <span>Également : refonte, migration, accompagnement et maintenance.</span>
            <a href="#contact" className="text-link">Un besoin particulier ?</a>
          </div>
        </div>
      </section>

      <section className="play" id="experiences">
        <div className="container">
          <div className="section-intro">
            <div>
              <div className="section-marker smallcap"><span data-scramble>02</span><span className="dash" /><span data-scramble>Playground</span></div>
              <h2 data-reveal="lines">Des expériences numériques interactives et ludiques.</h2>
            </div>
            <p className="description" data-reveal="fade" data-reveal-delay="0.2">Animations avancées, micro-interactions, gamification : nous transformons la visite en expérience. Un jeu bien pensé retient l&apos;attention, marque les esprits et donne envie d&apos;aller plus loin.</p>
          </div>
          <div className="play-stage" id="jeu">
            <div className="play-caption smallcap">
              <span><span className="status-led" />Jouez à 0x-Run, notre mini-jeu, et tentez d&apos;entrer au classement.</span>
              <span>
                <span className="xrun-on-mouse">Espace ou clic pour sauter</span>
                <span className="xrun-on-touch">Touchez pour sauter</span>
              </span>
            </div>
            <XRun />
          </div>
          <ul className="play-points" data-reveal="stagger">
            <li><b>Engagement</b><span>Plus de temps passé sur votre site, et des visiteurs qui reviennent.</span></li>
            <li><b>Mémorisation</b><span>On retient mieux une marque avec laquelle on a joué.</span></li>
            <li><b>Conversion</b><span>Récompenses, défis et classements qui mènent jusqu&apos;au contact.</span></li>
          </ul>
        </div>
      </section>

      <section className="work" id="realisations">
        <div className="container">
          <div className="work-head">
            <div>
              <div className="section-marker smallcap"><span data-scramble>03</span><span className="dash" /><span data-scramble>Projets sélectionnés</span></div>
              <h2 data-reveal="lines">Chaque projet,<br />une identité propre.</h2>
            </div>
            <p className="small-comment" data-reveal="fade" data-reveal-delay="0.2">Santé, mode, industrie. Des univers différents, une même obsession : créer les bonnes connexions.</p>
          </div>
          <div className="project-grid">
            {featuredProjects.map((project, i) => (
              <article className={`project project--${["lead", "offset", "wide"][i]}`} key={project.id}>
                <Link className="project-link" data-cursor="Voir" data-transition="project" href={`/realisations?projet=${project.id}`}>
                  <div className="project-image">
                    {project.image && <Image src={project.image.src} alt={`Capture de la page d'accueil du site ${project.name}`} fill sizes="(max-width: 790px) 100vw, 60vw" />}
                  </div>
                  <div className="project-meta" data-reveal="fade" data-reveal-delay="0.3">
                    <div className="project-kicker">{String(i + 1).padStart(2, "0")} — {project.tag}</div>
                    <h3>{project.name}</h3>
                    <p>{project.desc}</p>
                  </div>
                </Link>
                <div className="project-foot">
                  <ul className="project-tags">{project.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  {project.url && <a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">{project.domain.replace(/^www\./, "")} <Globe size={14} aria-hidden="true" /></a>}
                </div>
              </article>
            ))}
          </div>
          <div className="work-footer">
            <span>Sites vitrines, catalogues, e-commerce et applications conçus à Madagascar.</span>
            <Link className="text-link" href="/realisations">Toutes les réalisations</Link>
          </div>
        </div>
      </section>

      <section className="philosophy paper" id="approche">
        <div className="container manifesto">
          <div>
            <div className="section-marker smallcap"><span data-scramble>04</span><span className="dash" /><span data-scramble>Notre différence</span></div>
            <h2 data-reveal="lines">Votre site.<br />Votre code.<br /><span className="underline">Votre liberté.</span></h2>
            <p className="manifesto-intro" data-reveal="fade" data-reveal-delay="0.2">On ne construit pas une jolie boîte noire. On conçoit des solutions durables, évolutives et personnalisées, qui vous appartiennent vraiment.</p>
          </div>
          <div className="manifesto-points" data-reveal="stagger">
            <div className="manifesto-point"><span className="tick">↗</span><div><h3>Le code vous appartient</h3><p>Le code source complet de votre projet vous est livré. Pas de dépendance cachée à une plateforme ni d&apos;abonnement propriétaire.</p></div></div>
            <div className="manifesto-point"><span className="tick">↗</span><div><h3>Vous gardez la main</h3><p>La première année, notre maintenance accompagne le lancement de votre projet. Ensuite, vous choisissez : continuer avec nous, ou récupérer l&apos;hébergement et les services associés sur des comptes à votre nom.</p></div></div>
            <div className="manifesto-point"><span className="tick">↗</span><div><h3>Durable, évolutif, sur mesure</h3><p>Site, application mobile ou outil de gestion : chaque projet est pensé pour votre activité, sans modèle tout fait. Une base technique solide, conçue pour durer et grandir avec vos besoins.</p></div></div>
          </div>
        </div>
      </section>

      <section className="process" id="processus">
        <div className="container process-layout">
          <div className="process-head">
            <div className="section-marker smallcap"><span data-scramble>05</span><span className="dash" /><span data-scramble>Notre façon de faire</span></div>
            <h2 data-reveal="lines">Du premier échange<br />au dernier détail.</h2>
            <p>Pas de jargon inutile. Un projet bien cadré, des décisions partagées et une exécution soignée.</p>
          </div>
          <ol className="timeline">
            <li className="step"><span className="step-node">01</span><div><span className="step-no smallcap">Comprendre</span><h3>On commence par vous.</h3><p>Avant de parler design ou technique, on prend le temps de comprendre votre audience et vos besoins métiers pour créer des solutions qui vous ressemblent.</p></div></li>
            <li className="step"><span className="step-node">02</span><div><span className="step-no smallcap">Concevoir</span><h3>On pose le décor.</h3><p>Direction artistique, maquettes haute fidélité et structure du contenu : vous voyez ce que nous allons créer avant le développement.</p></div></li>
            <li className="step"><span className="step-node">03</span><div><span className="step-no smallcap">Construire</span><h3>On livre du solide.</h3><p>Développement, tests, référencement et mise en ligne. Puis une transmission claire pour que vous restiez maître de votre projet.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <ContactSymbol />
        <div className="container contact-content">
          <div className="section-marker smallcap"><span data-scramble>06</span><span className="dash" /><span data-scramble>La suite ?</span></div>
          <h2>On crée quoi<br /><span>ensemble ?</span></h2>
          <div className="contact-details" data-reveal="fade" data-reveal-delay="0.3">
            <p>Un site à créer, une application à imaginer ou un outil métier à repenser ? Racontez-nous. Tout commence par une conversation.</p>
            <div className="contact-spin-hint smallcap" aria-hidden="true">
              Fais-moi tourner !
              <svg viewBox="0 0 120 56"><path d="M3 50C35 56 78 38 116 22M103 20l13 2-7 11" /></svg>
            </div>
            <ContactButton />
          </div>
          <SiteFooter
            note={<>Studio digital indépendant — Antananarivo, Madagascar<br />© {new Date().getFullYear()} Oxmad Digital. Tous droits réservés.</>}
            links={[
              { href: "/mentions-legales", label: "Mentions légales" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

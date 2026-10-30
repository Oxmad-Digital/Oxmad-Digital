"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import { projectOpening } from "@/lib/motion";
import { PROJECTS } from "@/lib/projects";
import { HERO_IMAGES, PROJECT_IMAGES } from "@/lib/media";
import ProjectIndex from "./ProjectIndex";
import { fitNames, hideOnError } from "./utils";

// The three art-directed sections below, in page order.
const FEATURED = ["tsaralevenana", "ocibel", "wybob"].map((id) => PROJECTS.find((p) => p.id === id)!);

// The screenshot column is about 60% of the container on desktop, full width on mobile.
const SHOT_SIZES = "(max-width: 790px) 100vw, 60vw";

export default function RealisationsContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fromDeepLink = useRef(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const project = PROJECTS.find((p) => p.id === openId);

  const openProject = (id: string) => {
    setOpenId(id);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  };
  const closeProject = () => dialogRef.current?.close();

  // Deep link from the home page: /realisations?projet=<id> opens that project.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("projet");
    if (!id || !PROJECTS.some((p) => p.id === id)) return;
    // A timer, not rAF: frames are paused while the home → project view transition runs.
    fromDeepLink.current = true;
    const timer = window.setTimeout(() => openProject(id), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const onResize = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; fitNames(root); });
    };
    fitNames(root);
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="ox-works" ref={rootRef}>
      <section aria-labelledby="intro-title" className="works-hero">
        <div className="works-hero-stage">
          <picture className="works-hero-art">
            <source media="(max-width: 790px)" type="image/avif" srcSet={HERO_IMAGES.realisationsMobile} />
            <Image
              src={HERO_IMAGES.realisations}
              quality={92}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
          <div className="container works-hero-inner">
            <div className="works-hero-rail micro">
              <span>Réalisations / Sélection</span>
              <span>DES UNIVERS À EXPLORER — 002</span>
            </div>
            <div className="works-hero-copy">
              <h1 id="intro-title" data-reveal="lines" data-reveal-now>
                <span>Chaque projet,</span>
                <span className="accent">un monde à part.</span>
              </h1>
              <p data-reveal="fade" data-reveal-now data-reveal-delay="0.35">Des marques, des histoires, des enjeux différents. Pour chacune, une expérience digitale pensée sur mesure.</p>
            </div>
            <div className="works-hero-note micro" aria-hidden="true">OX / GALERIE À CIEL OUVERT</div>
          </div>
        </div>
        <div className="works-hero-footer">
          <div className="container works-hero-index">
            <span className="works-hero-index-label micro">03 projets à la une <span aria-hidden="true">↘</span></span>
            <nav aria-label="Parcourir les projets" className="works-hero-links">
              {FEATURED.map(({ id, name }, i) => (
                <a key={id} href={`#${id}`}><span>{String(i + 1).padStart(2, "0")}</span>{name}</a>
              ))}
              <a className="works-hero-all" href="#tous-les-projets">Tous les projets</a>
            </nav>
          </div>
        </div>
      </section>

      <section aria-labelledby="tsaralevenana-title" className="project featured" id="tsaralevenana">
        <div className="container">
          <div className="featured-grid">
            <div className="featured-copy" data-reveal="stagger">
              <div className="project-stamp">OX / ARCHIVE N°001   —   MADE IN MADAGASCAR</div>
              <div className="proj-kicker" style={{ color: "#8a7444" }}>Site vitrine · Services funéraires</div>
              <h2 className="project-title brand-name fit-name" id="tsaralevenana-title">Tsaralevenana<span style={{ color: "#a0843f" }}>.</span></h2>
              <p className="lead">Trouver le ton juste quand chaque mot compte.</p>
              <p className="bodycopy">Pour cette maison funéraire d&apos;Antananarivo, il fallait un site sobre et apaisant : présenter les services simplement, rassurer les familles et rendre l&apos;équipe joignable à toute heure.</p>
              <ul aria-label="Fonctionnalités" className="feature-list"><li>Direction artistique</li><li>Prestations</li><li>Galerie</li><li>Contact 24h/24</li></ul>
              <button className="arrow-link" type="button" data-cursor="Voir" onClick={() => openProject("tsaralevenana")}>Découvrir le projet <Globe size={15} aria-hidden="true" /></button>
            </div>
            <div className="featured-image-wrap">
              <div aria-label="Aperçu du site Tsaralevenana" className="project-image">
                <div className="window-top"><span className="dots"><i /><i /><i /></span><span className="address">tsaralevenana.vercel.app</span><span>↗</span></div>
                <div className="preview-back tsaralevenana-back"><div className="preview-type">Tsaralevenana<br /><em>Présent à vos côtés</em></div></div>
                <Image {...PROJECT_IMAGES.tsaralevenana} alt="Capture du site Tsaralevenana — maison funéraire à Antananarivo" className="remote-shot" sizes={SHOT_SIZES} loading="eager" onError={hideOnError} />
                <button aria-label="Découvrir le projet Tsaralevenana" className="frame-corner" type="button" data-cursor="Voir" onClick={() => openProject("tsaralevenana")}>↗</button>
              </div>
              <span className="featured-tag">Vitrine / Services / Accompagnement</span>
            </div>
          </div>
          <div className="featured-ruler"><span>DE LA DOUCEUR DANS CHAQUE DÉTAIL.</span><span>01 / 03   ↗</span></div>
        </div>
      </section>

      <section aria-labelledby="ocibel-title" className="project ocibel" id="ocibel">
        <div className="container">
          <div className="ocibel-grid">
            <div className="ocibel-copy" data-reveal="stagger">
              <div className="proj-kicker" style={{ color: "#a8afa2" }}>Site vitrine · Beauté &amp; bien-être</div>
              <h2 className="project-title brand-name fit-name" id="ocibel-title">Ocibel<span className="accent">.</span></h2>
              <p className="lead">Une présence digitale à l&apos;image du soin qu&apos;on apporte aux autres.</p>
              <p className="bodycopy">Un site doux et élégant pour un salon de beauté et spa à Tanjombato. Les prestations sont lisibles au premier regard et la prise de contact trouve naturellement sa place.</p>
              <ul className="feature-list"><li>Direction artistique</li><li>Galerie</li><li>Prestations</li><li>Contact</li></ul>
              <button className="arrow-link" type="button" data-cursor="Voir" onClick={() => openProject("ocibel")}>Découvrir le projet <Globe size={15} aria-hidden="true" /></button>
            </div>
            <div className="ocibel-visual">
              <div aria-label="Aperçu du site Ocibel" className="project-image">
                <div className="window-top"><span className="dots"><i /><i /><i /></span><span className="address">ocibel.mg</span><span>↗</span></div>
                <div className="preview-back"><div className="preview-type">Révélez<br />votre beauté<br /><em>naturelle</em></div></div>
                <Image {...PROJECT_IMAGES.ocibel} alt="Capture du site Ocibel — salon de beauté et spa" className="remote-shot" sizes={SHOT_SIZES} onError={hideOnError} />
                <button aria-label="Découvrir le projet Ocibel" className="frame-corner" type="button" data-cursor="Voir" onClick={() => openProject("ocibel")}>↗</button>
              </div>
              <span className="ocibel-side">O  /  02   —   GOOD DESIGN IS PERSONAL</span>
            </div>
          </div>
          <div className="project-break"><span>DES ÉMOTIONS AVANT DES INTERFACES.</span><span>02 / 03</span></div>
        </div>
      </section>

      <section className="interlude">
        <div className="container interlude-inner">
          <p data-reveal="lines">Chaque marque a sa propre voix. <strong>Notre travail, c&apos;est de lui donner la bonne forme.</strong></p>
          <span aria-hidden="true" className="asterisk">✳</span>
        </div>
      </section>

      <section aria-labelledby="wybob-title" className="project wybob" id="wybob">
        <div className="container">
          <div className="wybob-grid">
            <div className="wybob-copy" data-reveal="stagger">
              <div className="proj-kicker" style={{ color: "#617f74" }}>E-commerce · Mode &amp; accessoires</div>
              <h2 className="project-title brand-name fit-name" id="wybob-title">Wybob<span style={{ color: "#399389" }}>.</span></h2>
              <p className="lead">Un objet singulier. Une boutique qui lui laisse toute la place.</p>
              <p className="bodycopy">Pour cette marque de bobs, nous avons imaginé un parcours d&apos;achat centré sur le produit : découverte immersive, informations essentielles et commande simplifiée.</p>
              <ul className="feature-list"><li>Boutique en ligne</li><li>Fiche produit</li><li>Parrainage</li><li>Multilingue</li></ul>
              <button className="arrow-link" type="button" data-cursor="Voir" onClick={() => openProject("wybob")}>Découvrir le projet <Globe size={15} aria-hidden="true" /></button>
            </div>
            <div className="wybob-panel">
              <div aria-label="Aperçu du projet Wybob" className="project-image">
                <div className="window-top"><span className="dots"><i /><i /><i /></span><span className="address">WYBOB — Boutique en ligne</span><span>↗</span></div>
                <div className="preview-back"><div className="preview-type">WYBOB.<br /><small style={{ fontSize: ".2em", letterSpacing: ".06em" }}>ESSENTIALS / EDITION</small></div></div>
                <Image {...PROJECT_IMAGES.wybob} alt="Capture du site Wybob, boutique en ligne de mode et accessoires" className="remote-shot" sizes={SHOT_SIZES} onError={hideOnError} />
                <button aria-label="Découvrir le projet Wybob" className="frame-corner" type="button" data-cursor="Voir" onClick={() => openProject("wybob")}>↗</button>
              </div>
              <div className="wybob-sticker">Digital<br /> meets<br /> craft ↗</div>
            </div>
          </div>
          <div className="wybob-bottom"><span>UNE EXPÉRIENCE PRODUIT — PAS JUSTE UN CATALOGUE.</span><span>03 / 03</span></div>
        </div>
      </section>

      <ProjectIndex onOpen={openProject} />

      <section className="next" id="contact">
        <div className="container next-content">
          <div className="eyebrow micro">Et maintenant ? / À VOUS</div>
          <h2 data-reveal="lines">La prochaine<br /><span>histoire, c&apos;est</span><span>la vôtre<span style={{ color: "#f6f2d8" }}>.</span></span></h2>
          <div className="cta-row">
            <p>Votre marque mérite mieux qu&apos;un site de plus. Parlons-en.</p>
            <Link className="cta" data-cursor="Parler" data-magnetic href="/#contact">Parler de mon projet</Link>
          </div>
          <SiteFooter
            className="footer"
            note={<>Studio web indépendant · Madagascar © {new Date().getFullYear()}</>}
            links={[
              { href: "/", label: "Accueil ↗" },
              { href: "/mentions-legales", label: "Mentions légales" },
            ]}
          />
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="dialogTitle"
        // Opened from a home page card: closing goes back there, at the same scroll position.
        // A shared link has no such history, so it lands on the top of the home page instead.
        onClose={() => {
          if (!fromDeepLink.current) return;
          if (projectOpening.homeScroll !== null) router.back();
          else router.push("/");
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeProject();
        }}
      >
        <div className="dialog-head">
          <span className="micro">OXMAD DIGITAL / PROJET SÉLECTIONNÉ</span>
          <button aria-label="Fermer" className="dialog-close" type="button" onClick={closeProject}>×</button>
        </div>
        {project && (
          <div className="dialog-content">
            <div className="eyebrow micro">{project.tag}</div>
            <h2 id="dialogTitle">{project.name}</h2>
            <p>{project.desc}</p>
            {project.notice && (
              <div className="dialog-notice">
                <strong>{project.notice.label}</strong>
                <p>{project.notice.text}</p>
              </div>
            )}
            {project.image
              ? <Image key={project.id} {...project.image} alt={project.notice ? `Illustration du projet ${project.name}` : `Capture du site ${project.name}`} className="dialog-visual" sizes="(max-width: 876px) 100vw, 840px" loading="eager" onError={hideOnError} />
              : <div aria-hidden="true" className="dialog-visual dialog-placeholder" style={{ background: project.palette[0], color: project.palette[1] }}>{project.name}</div>}
            <div className="dialog-features">{project.features.map((f) => <span key={f}>{f}</span>)}</div>
            {project.url && (
              <div className="dialog-actions">
                <a href={project.url} rel="noopener noreferrer" target="_blank">Visiter le site <Globe size={14} aria-hidden="true" /></a>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

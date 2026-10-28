"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motionWindow } from "@/lib/motion";
import { PROJECTS, type Project, type ProjectFilter } from "@/lib/projects";
import { fitNames, hideOnError } from "./utils";

const PAGE_SIZE = 6;
const CATEGORIES: ("Tous" | ProjectFilter)[] = ["Tous", "Sites vitrines", "E-commerce", "Applications"];

const pad = (n: number, size = 2) => String(n).padStart(size, "0");
const indexOf = (p: Project) => PROJECTS.indexOf(p) + 1;

function MiniVisual({ project }: { project: Project }) {
  const [bg, fg] = project.palette;
  return (
    <div className="index-row-mini" style={{ background: bg, color: fg }}>
      <span className="mini-word">{project.name}</span>
      {/* Mobile only: the tile is display: none on wider screens, so it is never fetched there. */}
      {project.image && <Image src={project.image.src} alt={`Aperçu du projet ${project.name}`} fill sizes="100vw" onError={hideOnError} />}
    </div>
  );
}

function Scene({ project }: { project: Project }) {
  return (
    <div className="scene" data-theme={project.id}>
      <div className="scene-back-word">{project.name}</div>
      <div className="scene-inner">
        <div className="site-window">
          <div className="window-chrome"><span className="dots">● ● ●</span><span>{project.domain}</span></div>
          <div className="site-content">
            <strong className="scene-word">{project.name}</strong>
            <span className="scene-ui">OX / WEB EXPERIENCE</span>
            {project.image && <Image src={project.image.src} alt={`Aperçu du site ${project.name}`} fill sizes="(max-width: 1460px) 45vw, 650px" onError={hideOnError} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectIndex({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("Tous");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const matching = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return PROJECTS.filter(
      (p) =>
        (filter === "Tous" || p.filter === filter) &&
        (!q || `${p.name} ${p.tag}`.toLocaleLowerCase("fr").includes(q)),
    );
  }, [filter, query]);

  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = matching.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  // Keep the previewed project when it survives filtering, otherwise fall back to the first match.
  const active = matching.find((p) => p.id === activeId) ?? matching[0];

  useEffect(() => {
    if (rowsRef.current) fitNames(rowsRef.current);
  }, [visible.length, filter, query, current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const resetPaging = () => setPage(0);

  // Brings the top of the list back into view, under the sticky header.
  const goTo = (next: number) => {
    setPage(next);
    const list = listRef.current;
    if (!list) return;
    const lenis = motionWindow().__oxLenis;
    if (lenis) lenis.scrollTo(list, { offset: -110, duration: 0.9 });
    else window.scrollTo({ top: list.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" });
  };

  return (
    <section className="archive" id="tous-les-projets" aria-labelledby="archive-title">
      <div className="container">
        <div className="archive-kicker-row"><span className="eyebrow micro">Les réalisations / Index</span><span className="micro archive-serial">OX — COLLECTION / {new Date().getFullYear()}</span></div>
        <div className="index-head">
          <div>
            <div className="index-overline">AU-DELÀ DES PROJETS PHARES</div>
            <h2 id="archive-title">L&apos;index<span className="accent">.</span></h2>
          </div>
          <p>Une collection vivante de sites, boutiques et applications. Des besoins très différents, une même attention portée au détail.</p>
        </div>
        <div className="index-toolbar">
          <div className="index-filters" role="group" aria-label="Filtrer les réalisations">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={cat === filter}
                onClick={() => {
                  setFilter(cat);
                  resetPaging();
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <label className="index-search">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              type="search"
              autoComplete="off"
              placeholder="Chercher un projet"
              aria-label="Chercher un projet"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPaging();
              }}
            />
            <kbd>/</kbd>
          </label>
        </div>
        <div className="index-main">
          <div className="index-left" ref={listRef}>
            <div className="index-columns micro"><span>PROJETS / INDEX</span><span>{pad(matching.length)} PROJET{matching.length === 1 ? "" : "S"}</span></div>
            <div className="index-rows" ref={rowsRef} aria-live="polite">
              {visible.map((p) => {
                const n = indexOf(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`index-row${active?.id === p.id ? " is-active" : ""}`}
                    aria-label={`Ouvrir la fiche du projet ${p.name}`}
                    onMouseEnter={() => setActiveId(p.id)}
                    onFocus={() => setActiveId(p.id)}
                    onClick={() => onOpen(p.id)}
                  >
                    <span className="index-row-num">{pad(n)}</span>
                    <span className="index-row-main">
                      <span className="index-row-title fit-name">{p.name}</span>
                      <span className="index-row-sub"><span>{p.tag}</span><span className="row-count">OX / {pad(n, 3)}</span></span>
                      <MiniVisual project={p} />
                    </span>
                    <span className="index-row-arrow" aria-hidden="true">↗</span>
                  </button>
                );
              })}
              {!matching.length && <p className="index-empty">Aucun projet trouvé. Essayez un autre terme.</p>}
            </div>
            <div className="index-paging">
              <span aria-live="polite">
                {matching.length
                  ? `${pad(current * PAGE_SIZE + 1)}—${pad(current * PAGE_SIZE + visible.length)} / ${pad(matching.length)}`
                  : "AUCUN RÉSULTAT"}
              </span>
              {pageCount > 1 && (
                <nav className="index-pages" aria-label="Pagination des projets">
                  <button type="button" className="index-page-step" disabled={current === 0} onClick={() => goTo(current - 1)} aria-label="Page précédente">←</button>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-current={i === current ? "page" : undefined}
                      aria-label={`Page ${i + 1}`}
                      onClick={() => goTo(i)}
                    >
                      {pad(i + 1)}
                    </button>
                  ))}
                  <button type="button" className="index-page-step" disabled={current === pageCount - 1} onClick={() => goTo(current + 1)} aria-label="Page suivante">→</button>
                </nav>
              )}
            </div>
            <p className="index-footnote">Sélection non exhaustive · D&apos;autres projets viendront enrichir cette collection.</p>
          </div>
          <div className="index-right">
            <div className="index-sticky">
              <div className="index-preview-top micro">
                <span><span className="live-dot" /> À L&apos;APERÇU</span>
                <span>{active ? `${pad(indexOf(active))} / ${pad(PROJECTS.length)}` : ""}</span>
              </div>
              {active && (
                <div
                  className="index-showcase"
                  aria-label={`Découvrir le projet ${active.name}`}
                  onClick={() => onOpen(active.id)}
                >
                  <div className="showcase-backing"><span>OXMAD / STUDIO</span><span>PROJET {pad(indexOf(active))}</span></div>
                  <div className="showcase-art"><Scene key={active.id} project={active} /></div>
                  <div className="showcase-bottom">
                    <div><span className="micro">{active.tag}</span><h3>{active.name}</h3></div>
                    <span className="showcase-arrow" aria-hidden="true">↗</span>
                  </div>
                </div>
              )}
              <div className="index-note"><span>↗</span><span>Survolez un projet pour le découvrir.<br /> Cliquez pour ouvrir sa fiche.</span><span>OX / © {new Date().getFullYear()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

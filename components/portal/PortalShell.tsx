"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Globe, Menu, X } from "lucide-react";
import { BRAND_IMAGES } from "@/lib/media";

const sectionLabels: Record<string, string> = {
  demandes: "Demandes",
  documents: "Devis & factures",
  drive: "Drive",
  "rendez-vous": "Rendez-vous",
  clients: "Clients",
  messages: "Messages",
  comptes: "Comptes",
};

export default function PortalShell({ mode, workspace, userName, userEmail, navigation, accountAction, children }: {
  mode: "admin" | "client";
  workspace: string;
  userName: string;
  userEmail: string;
  navigation: ReactNode;
  accountAction: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const basePath = mode === "admin" ? "/admin" : "/espace-client";
  const areaLabel = mode === "admin" ? "Administration" : "Espace client";
  const section = pathname.slice(basePath.length).split("/")[1];
  const sectionLabel = sectionLabels[section] ?? (mode === "admin" ? "Statistiques" : "Accueil");
  const initials = userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function closeNavigation() {
    dialogRef.current?.close();
  }

  function sidebarContent(mobile = false) {
    return (
      <div className="adm-sidebar-inner">
        <div className="adm-sidebar-brand-row">
          <Link href={basePath} className="adm-sidebar-brand" onClick={mobile ? closeNavigation : undefined}>
            <Image src={BRAND_IMAGES.logoDark} width={164} height={56} alt="Oxmad Digital" />
          </Link>
          {mobile && <button type="button" className="adm-menu-button" onClick={closeNavigation} aria-label="Fermer le menu"><X size={20} aria-hidden="true" /></button>}
        </div>
        <div className="adm-workspace">
          <span className="adm-workspace-label">{areaLabel}</span>
          <strong>{workspace}</strong>
        </div>
        <div className="adm-sidebar-navigation" onClick={mobile ? (event) => {
          if (event.target instanceof Element && event.target.closest("a[href]")) closeNavigation();
        } : undefined}>
          <p className="adm-sidebar-label">{mode === "admin" ? "Pilotage du studio" : "Mon espace"}</p>
          {navigation}
        </div>
        <div className="adm-sidebar-footer">
          <p className="adm-sidebar-signature">Le web, autrement.</p>
          <div className="adm-sidebar-account">
            <span className="adm-user-avatar" aria-hidden="true">{initials}</span>
            <span className="adm-user-details"><strong title={userEmail}>{userName}</strong><small>{mode === "admin" ? "Administrateur" : workspace}</small></span>
          </div>
          <div className="adm-sidebar-actions">{accountAction}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-shell">
      <a href="#portal-content" className="adm-skip-link">Aller au contenu</a>
      <aside className="adm-sidebar" aria-label={areaLabel}>{sidebarContent()}</aside>
      <dialog
        ref={dialogRef}
        id={dialogId}
        className="adm-sidebar-dialog"
        aria-label={`Navigation — ${areaLabel}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeNavigation();
        }}
      >
        {sidebarContent(true)}
      </dialog>
      <div className="adm-panel">
        <header className="adm-topbar">
          <button type="button" className="adm-menu-button adm-menu-toggle" aria-label="Ouvrir le menu" aria-controls={dialogId} aria-expanded={open} onClick={() => { dialogRef.current?.showModal(); setOpen(true); }}>
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="adm-location"><span>{areaLabel}</span><ChevronRight size={14} aria-hidden="true" /><strong>{sectionLabel}</strong></div>
          <Link href="/" className="adm-link adm-site-link" target={mode === "admin" ? "_blank" : undefined} rel={mode === "admin" ? "noreferrer" : undefined}><Globe size={15} aria-hidden="true" /> Voir le site</Link>
        </header>
        <main id="portal-content" className="adm-wrap">{children}</main>
      </div>
    </div>
  );
}

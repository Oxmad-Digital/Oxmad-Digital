import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { OPEN_GRAPH } from "@/lib/site";
import MentionsLegalesContent from "./MentionsLegalesContent";
import "./mentions-legales.css";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales, conditions générales d'utilisation et politique de confidentialité d'Oxmad Digital.",
  alternates: { canonical: "/mentions-legales" },
  openGraph: { ...OPEN_GRAPH, url: "/mentions-legales", title: "Mentions légales — Oxmad Digital" },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <MentionsLegalesContent />
      <div className="container">
        <SiteFooter
          className="ox-legal-footer"
          note={<>© {new Date().getFullYear()} Oxmad Digital</>}
          links={[{ href: "/", label: "Accueil ↗" }]}
        />
      </div>
    </>
  );
}

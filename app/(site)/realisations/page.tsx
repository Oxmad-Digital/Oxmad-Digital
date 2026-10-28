import type { Metadata } from "next";
import { OPEN_GRAPH } from "@/lib/site";
import RealisationsContent from "./RealisationsContent";
import "./realisations.css";

const TITLE = "Réalisations — Sites web et e-commerce à Madagascar";
const DESCRIPTION = "Sites vitrines, catalogues, boutiques e-commerce et applications métier conçus par Oxmad Digital pour des marques de Madagascar : santé, mode, industrie, beauté.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Also the canonical of the ?projet= deep links from the home page.
  alternates: { canonical: "/realisations" },
  openGraph: { ...OPEN_GRAPH, url: "/realisations", title: TITLE, description: DESCRIPTION },
};

export default function RealisationsPage() {
  return <RealisationsContent />;
}

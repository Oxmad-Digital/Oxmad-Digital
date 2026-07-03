import type { Metadata } from "next";
import SiteEnDeveloppementContent from "./SiteEnDeveloppementContent";
import "./site-en-developpement.css";

export const metadata: Metadata = {
  title: "Site en cours de développement – Oxmad Digital",
  description: "Ce projet est actuellement en cours de développement par Oxmad Digital.",
};

export default function SiteEnDeveloppementPage() {
  return <SiteEnDeveloppementContent />;
}

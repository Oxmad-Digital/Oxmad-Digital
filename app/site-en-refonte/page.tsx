import type { Metadata } from "next";
import SiteEnRefonteContent from "./SiteEnRefonteContent";
import "./site-en-refonte.css";

export const metadata: Metadata = {
  title: "Site en cours de refonte – Oxmad Digital",
  description: "Ce site est actuellement en cours de refonte par Oxmad Digital.",
};

export default function SiteEnRefontePage() {
  return <SiteEnRefonteContent />;
}

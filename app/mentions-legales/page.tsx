import type { Metadata } from "next";
import MentionsLegalesContent from "./MentionsLegalesContent";
import "./mentions-legales.css";

export const metadata: Metadata = {
  title: "Mentions légales – Oxmad Digital",
  description: "Mentions légales, conditions générales d'utilisation et politique de confidentialité d'Oxmad Digital.",
};

export default function MentionsLegalesPage() {
  return <MentionsLegalesContent />;
}

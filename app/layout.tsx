import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Oxmad Digital – Agence web Antananarivo",
  description: "Oxmad Digital conçoit des sites vitrines, e-commerce et stratégies SEO modernes et performants pour les entreprises de Madagascar.",
  keywords: "agence web Madagascar, création site internet Antananarivo, e-commerce Madagascar, SEO Madagascar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

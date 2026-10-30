import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import Analytics from "@/components/Analytics";
import { BookCallProvider } from "@/components/BookCall/BookCallContext";
import SiteMotion from "@/components/motion/SiteMotion";
import { ADDRESS, CONTACT_EMAIL, CONTACT_PHONE, OPEN_GRAPH, SITE_URL, SOCIAL_LINKS } from "@/lib/site";

// Runs before first paint: arms the hidden "pre-reveal" states, and the intro on the first
// home visit of the session. If the motion code never boots, everything is shown again.
const MOTION_BOOT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion");try{if(location.pathname==="/"&&!location.hash&&!sessionStorage.getItem("ox-intro"))d.classList.add("intro")}catch(e){}setTimeout(function(){if(!window.__oxMotion)d.classList.remove("motion","intro")},4000);setTimeout(function(){d.classList.remove("intro")},7000)})();`;

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

const DESCRIPTION = "Agence web à Antananarivo : création de sites vitrines, boutiques e-commerce, SEO et développement sur mesure pour les entreprises de Madagascar. Design singulier, sites rapides.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Agence web à Antananarivo — Sites vitrines, e-commerce & sur mesure | Oxmad Digital",
    template: "%s | Oxmad Digital",
  },
  description: DESCRIPTION,
  // Each page sets its own path; this one covers the home page.
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH,
    url: "/",
    title: "Oxmad Digital — Agence web à Antananarivo",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

// Local business card for search engines: must match the footer, the legal notice and the Google Business Profile.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#organisation`,
      name: "Oxmad Digital",
      legalName: "OXMAD DIGITAL SARLU",
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
      image: `${SITE_URL}/og-image.jpg`,
      description: DESCRIPTION,
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
      address: {
        "@type": "PostalAddress",
        streetAddress: ADDRESS.street,
        addressLocality: ADDRESS.locality,
        postalCode: ADDRESS.postalCode,
        addressCountry: ADDRESS.country,
      },
      areaServed: { "@type": "Country", name: "Madagascar" },
      knowsAbout: ["Création de site web", "E-commerce", "SEO", "Développement sur mesure"],
      sameAs: SOCIAL_LINKS.map((link) => link.href),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      url: SITE_URL,
      name: "Oxmad Digital",
      inLanguage: "fr",
      publisher: { "@id": `${SITE_URL}/#organisation` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#11120e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={geist.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
        <BookCallProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteMotion />
          <Analytics />
        </BookCallProvider>
      </body>
    </html>
  );
}
